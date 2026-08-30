import React, { useState } from 'react';
import { Cpu, Zap, RefreshCw, ShieldCheck, Moon, Database, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { EMBEDDED_ANALOGIES } from '../data/guidesData';

export const AnalogyConverter: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const iconsMap: Record<string, React.ReactNode> = {
    Zap: <Zap className="w-5 h-5 text-amber-400" />,
    RefreshCw: <RefreshCw className="w-5 h-5 text-cyan-400" />,
    ShieldCheck: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    Moon: <Moon className="w-5 h-5 text-purple-400" />,
    Database: <Database className="w-5 h-5 text-blue-400" />
  };

  const codeSnippets = [
    {
      title: '1. 数据接收方式对比 (串口中断 ISR ⇄ 异步流 Stream)',
      mcuCode: `// STM32 HAL 串口接收中断
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart) {
    if (huart->Instance == USART1) {
        // 1. 从寄存器读取 1 字节放入环形缓冲区
        RingBuffer_Write(&rx_buffer, rx_byte);
        
        // 2. 严禁在 ISR 中做复杂协议解析或 delay
        // 3. 重新开启下一次中断
        HAL_UART_Receive_IT(&huart1, &rx_byte, 1);
    }
}`,
      mobileCode: `// Flutter (Dart) 异步消息流监听
_client.updates!.listen((List<MqttReceivedMessage<MqttMessage>> c) {
    final recMess = c[0].payload as MqttPublishMessage;
    final payload = MqttPublishPayload.bytesToStringAsString(recMess.payload.message);
    
    // 1. 底层 Socket 在后台解析好完整数据帧
    // 2. 触发回调，直接调用 setState 更新 UI
    setState(() {
        currentMotorRpm = double.tryParse(payload) ?? 0.0;
    });
});`
    },
    {
      title: '2. 业务主逻辑对比 (while(1) 轮询 ⇄ 事件驱动与响应式状态)',
      mcuCode: `// 嵌入式 FreeRTOS 任务轮询
void TelemetryTask(void *pvParameters) {
    while(1) {
        // 定期读取 ADC 与传感器
        float temp = Read_DHT11_Temperature();
        float volt = Read_Battery_Voltage();
        
        // 组装并发送
        MQTT_Publish("iot/mcu/telemetry", temp, volt);
        
        // 必须主动延时让出 CPU 时间片
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}`,
      mobileCode: `// 移动端声明式定时器与响应式 UI
Timer.periodic(const Duration(seconds: 1), (timer) {
    // 定时触发，无需占用 CPU 死循环
    if (_client?.connectionStatus?.state == MqttConnectionState.connected) {
        _client!.publishMessage(
            'iot/phone/heartbeat',
            MqttQos.atLeastOnce,
            payloadBuilder.payload!,
        );
    }
});
// 界面只需根据变量自动重绘，无需手动写刷新屏幕循环`
    },
    {
      title: '3. 异常保活机制 (硬件看门狗 WDG ⇄ KeepAlive 与指数退避重连)',
      mcuCode: `// STM32 独立看门狗 (IWDG)
void IWDG_Init(void) {
    // 预分频与重装载值，超时时间设为 2000ms
    IWDG_WriteAccessCmd(IWDG_WriteAccess_Enable);
    IWDG_SetPrescaler(IWDG_Prescaler_64);
    IWDG_SetReload(1250);
    IWDG_Enable();
}

// 主循环定时喂狗
void MainLoop(void) {
    IWDG_ReloadCounter(); // 喂狗，若死锁则复位 MCU
}`,
      mobileCode: `// 移动端 MQTT 心跳包与指数退避重连
_client.keepAlivePeriod = 30; // 30秒心跳 (PINGREQ)
_client.autoReconnect = true; // 自动重连

// 自定义指数退避重连算法 (Exponential Backoff)
int retryDelaySec = 1;
void scheduleReconnect() {
    Timer(Duration(seconds: retryDelaySec), () async {
        try {
            await _client.connect();
            retryDelaySec = 1; // 成功后复位退避周期
        } catch (e) {
            retryDelaySec = min(retryDelaySec * 2, 60); // 1s, 2s, 4s, 8s... 最多60s
            scheduleReconnect();
        }
    });
}`
    },
    {
      title: '4. 低功耗与休眠机制 (Stop 模式 ⇄ AppLifecycle 前后台调度)',
      mcuCode: `// STM32 进入低功耗 Stop 模式
void Enter_Stop_Mode(void) {
    // 关闭外设时钟，仅保留外部中断引脚或 RTC
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_PWR, ENABLE);
    PWR_EnterSTOPMode(PWR_Regulator_LowPower, PWR_STOPEntry_WFI);
    
    // 唤醒后必须重新初始化系统时钟 (SYSCLK)
    SystemClock_Config();
}`,
      mobileCode: `// 移动端监听系统生命周期 (锁屏/切后台/切回前台)
class _MyPageState extends State<MyPage> with WidgetsBindingObserver {
    @override
    void didChangeAppLifecycleState(AppLifecycleState state) {
        if (state == AppLifecycleState.resumed) {
            // 从息屏/后台回到前台，立刻探测 TCP 连通性
            if (_client?.connectionStatus?.state != MqttConnectionState.connected) {
                _reconnectMqtt(); // 重新唤醒连接并恢复订阅
            }
        }
    }
}`
    },
    {
      title: '5. 缓存与队列 (Ring Buffer ⇄ 内存消息队列)',
      mcuCode: `// 嵌入式固定大小字节环形缓冲区
#define BUFFER_SIZE 256
typedef struct {
    uint8_t buffer[BUFFER_SIZE];
    uint16_t head;
    uint16_t tail;
} RingBuffer;

void RingBuffer_Write(RingBuffer* rb, uint8_t byte) {
    rb->buffer[rb->head] = byte;
    rb->head = (rb->head + 1) % BUFFER_SIZE;
}`,
      mobileCode: `// 移动端离线消息优先队列 (带上限防爆内存)
final List<MqttPublishCommand> _offlineQueue = [];

void enqueueCommand(String topic, String payload) {
    if (_offlineQueue.length > 100) {
        _offlineQueue.removeAt(0); // FIFO 淘汰最旧消息
    }
    _offlineQueue.add(MqttPublishCommand(topic, payload));
}

void flushQueueOnConnected() {
    while (_offlineQueue.isNotEmpty) {
        final cmd = _offlineQueue.removeAt(0);
        _client.publish(cmd.topic, cmd.payload);
    }
}`
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Introduction Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              嵌入式电控 (MCU) ⇄ 移动端 (Mobile) 核心概念思维映射
            </h2>
            <p className="text-xs text-slate-400">
              用单片机、RTOS 和硬件通信的底层思维，快速秒懂移动端 App 的运行机制与异步模型
            </p>
          </div>
        </div>
      </div>

      {/* Conceptual Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EMBEDDED_ANALOGIES.map((item, idx) => {
          const isSelected = selectedIdx === idx;
          return (
            <div
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-950/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  {iconsMap[item.icon] || <Zap className="w-5 h-5 text-cyan-400" />}
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  对照 #{idx + 1}
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-mono text-amber-400/90 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  <span className="font-bold">MCU: {item.embeddedConcept}</span>
                </div>
                <div className="text-xs font-mono text-cyan-400/90 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                  <span className="font-bold">App: {item.mobileConcept}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                {item.coreRule}
              </p>
            </div>
          );
        })}
      </div>

      {/* Detailed Side-by-Side Code Comparison */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>{codeSnippets[selectedIdx]?.title}</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            点击上方卡片切换对比场景
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* MCU C/C++ Code Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
              <span className="text-xs font-bold font-mono text-amber-400 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>嵌入式 (C / STM32 / FreeRTOS)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">底层硬件与寄存器逻辑</span>
            </div>
            <pre className="text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed flex-1 scrollbar-thin scrollbar-thumb-slate-800">
              <code>{codeSnippets[selectedIdx]?.mcuCode}</code>
            </pre>
          </div>

          {/* Mobile Dart Code Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
              <span className="text-xs font-bold font-mono text-cyan-400 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>移动端 App (Dart / Flutter / TypeScript)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">非阻塞事件驱动与响应式</span>
            </div>
            <pre className="text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed flex-1 scrollbar-thin scrollbar-thumb-slate-800">
              <code>{codeSnippets[selectedIdx]?.mobileCode}</code>
            </pre>
          </div>
        </div>

        {/* Golden Rule Summary for this section */}
        <div className="mt-4 p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/40 flex items-start space-x-3">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-xs font-bold text-cyan-300 font-mono">
              💡 核心架构法则 (Golden Rule):
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {EMBEDDED_ANALOGIES[selectedIdx]?.coreRule}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
