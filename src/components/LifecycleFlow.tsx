import React, { useState } from 'react';
import {
  Radio,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Play,
  Layers,
  Heart
} from 'lucide-react';
import { QOS_EXPLANATIONS } from '../data/guidesData';

export const LifecycleFlow: React.FC = () => {
  const [selectedQos, setSelectedQos] = useState<number>(1);
  const [simStep, setSimStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const lifecycleStages = [
    {
      step: 1,
      title: '1. 参数初始化与 TCP 握手 (Socket Handshake)',
      desc: '手机向 Broker 服务器 (如 192.168.1.100:1883) 建立基础 TCP 连接。',
      analogy: '相当于硬件物理连接插上网线，或 ESP32 连接 WiFi 获取到 IP。',
      tag: 'Socket Init'
    },
    {
      step: 2,
      title: '2. 发送 CONNECT 报文 (身份与遗嘱协商)',
      desc: '携带 ClientID、CleanSession (是否清空历史会话)、KeepAlive 心跳时长 (通常30s)、遗嘱消息 (LWT)。',
      analogy: '类似于单片机向主机发送握手头帧：包含设备唯一MAC地址和离线报警预设。',
      tag: 'MQTT CONNECT'
    },
    {
      step: 3,
      title: '3. 接收 CONNACK 报文 (连接确认与鉴权)',
      desc: 'Broker 返回 Return Code (0x00 代表连接成功；0x02 标识符拒绝；0x04 用户名密码错误等)。',
      analogy: '类似于主机应答 ACK 帧，确认允许入网。',
      tag: 'CONNACK (RC=0)'
    },
    {
      step: 4,
      title: '4. 主题订阅与发布 (SUBSCRIBE / PUBLISH)',
      desc: 'App 订阅传感器主题，向电控指令主题发布 JSON 控制帧。',
      analogy: '单片机开启对应通道中断，并向控制总线发控制包。',
      tag: 'Data Exchange'
    },
    {
      step: 5,
      title: '5. 心跳维持 (PINGREQ ⇄ PINGRESP)',
      desc: '在 KeepAlive 周期内无业务数据时，App 自动发出 PINGREQ 探测保活，Broker 必须在规定时间内回复 PINGRESP。',
      analogy: '类似于单片机定时器“喂狗”，超时不回则判定网络死亡。',
      tag: 'Heartbeat Ping'
    },
    {
      step: 6,
      title: '6. 异常断线与指数退避重连 (Exponential Backoff)',
      desc: '当网络掉线或心跳超时，进入重连队列，重试间隔依次为 1s -> 2s -> 4s -> 8s ... 最大 60s，并在重连后自动恢复订阅。',
      analogy: '类似于单片机在通信总线异常时，启动复位并重新走握手流程。',
      tag: 'Auto Reconnect'
    }
  ];

  const currentQosInfo = QOS_EXPLANATIONS.find((q) => q.level === selectedQos)!;

  const runPacketSim = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimStep(0);

    const maxSteps = currentQosInfo.handshake.length;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setSimStep(step);
      if (step >= maxSteps) {
        clearInterval(timer);
        setTimeout(() => setIsSimulating(false), 800);
      }
    }, 900);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Overview Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              移动端 MQTT 客户端生命周期与报文时序设计
            </h2>
            <p className="text-xs text-slate-400">
              从连接建立、身份握手、心跳维持到断线指数退避重连的完整状态机
            </p>
          </div>
        </div>
      </div>

      {/* Lifecycle Flow Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>客户端标准生命周期 6 大核心阶段</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lifecycleStages.map((stage) => (
            <div
              key={stage.step}
              className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {stage.tag}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    阶段 {stage.step}/6
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-100 leading-snug">
                  {stage.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {stage.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60">
                <div className="text-[11px] text-amber-300/90 font-mono flex items-start space-x-1.5">
                  <span className="text-amber-400 font-bold shrink-0">⚡ MCU 对比:</span>
                  <span>{stage.analogy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QoS Deep Dive and Packet Handshake Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>QoS 服务质量等级选择指南 (QoS 0 vs 1 vs 2)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              根据电控场景权衡网络开销与可靠性，选择最佳 QoS 级别
            </p>
          </div>

          {/* QoS Toggle Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            {[0, 1, 2].map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setSelectedQos(lvl);
                  setSimStep(0);
                  setIsSimulating(false);
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition cursor-pointer ${
                  selectedQos === lvl
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                QoS {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Selected QoS Info Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-cyan-300 font-mono">
                  {currentQosInfo.name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {currentQosInfo.tag}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <div className="text-slate-500 text-[10px]">网络通信开销</div>
                  <div className="text-slate-200 font-bold">{currentQosInfo.networkCost}</div>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <div className="text-slate-500 text-[10px]">可靠性评估</div>
                  <div className="text-slate-200 font-bold">{currentQosInfo.reliability}</div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-amber-950/20 border border-amber-800/30 text-xs text-amber-300/90 leading-relaxed font-mono">
                <span className="font-bold">电控类比: </span>
                {currentQosInfo.mcuAnalogy}
              </div>

              <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-800/30 text-xs text-emerald-300/90 leading-relaxed">
                <span className="font-bold">推荐应用场景: </span>
                {currentQosInfo.bestFor}
              </div>
            </div>
          </div>

          {/* Interactive Packet Handshake Flow */}
          <div className="lg:col-span-6 space-y-3">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold font-mono text-slate-300">
                  底层报文握手交互时序 (Packet Exchange)
                </span>
                <button
                  onClick={runPacketSim}
                  disabled={isSimulating}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-mono font-bold flex items-center space-x-1 transition disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>{isSimulating ? '握手中...' : '模拟握手报文'}</span>
                </button>
              </div>

              <div className="space-y-2 font-mono text-xs flex-1 flex flex-col justify-center">
                {currentQosInfo.handshake.map((pkt, idx) => {
                  const isDelivered = simStep > idx;
                  const isCurrent = simStep === idx + 1 && isSimulating;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border transition-all ${
                        isCurrent
                          ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-900/30 animate-pulse'
                          : isDelivered
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-900 border-slate-800/80 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{pkt}</span>
                        {isDelivered && (
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-500 font-mono mt-3">
                💡 工业物联网结论：手机控制硬件建议默认选择 <b className="text-cyan-400">QoS 1</b>，并在电控固件端依据消息序列号做幂等性校验。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
