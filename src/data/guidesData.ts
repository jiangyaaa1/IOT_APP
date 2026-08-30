export interface AnalogyItem {
  embeddedConcept: string;
  mobileConcept: string;
  icon: string;
  embeddedDesc: string;
  mobileDesc: string;
  coreRule: string;
}

export const EMBEDDED_ANALOGIES: AnalogyItem[] = [
  {
    embeddedConcept: '串口中断 (UART ISR / Rx Interrupt)',
    mobileConcept: '异步事件回调 (Async Callback / Stream)',
    icon: 'Zap',
    embeddedDesc: '单片机在接收寄存器满 (RXNE) 时触发硬中断，在 ISR 中快速将字节存入 RingBuffer，不能在中断中做耗时操作。',
    mobileDesc: '移动端采用非阻塞事件循环 (Event Loop)，MQTT 库在底层 Socket 接收到底层数据帧后，触发 `onMessage` 回调函数。',
    coreRule: '绝不要在回调中做耗时计算或同步IO，需要更新界面时必须切回 UI 主线程 (如 Flutter 的 setState / React 的 setState)。'
  },
  {
    embeddedConcept: '主循环轮询 (while(1) / FreeRTOS 任务)',
    mobileConcept: '事件循环与状态驱动 (Event Loop & State-Driven UI)',
    icon: 'RefreshCw',
    embeddedDesc: '嵌入式通常用 `while(1)` 轮询各个状态机，或在 RTOS 任务中 `vTaskDelay` 定期读取传感器并发送。',
    mobileDesc: '移动端 UI 界面是声明式的，由数据状态 (State) 驱动渲染。没有 busy-loop，所有动作都是由定时器 (Timer) 或用户点击、网络事件触发。',
    coreRule: '移动端严禁写 `while(true) sleep()` 阻塞主线程，否则会直接导致屏幕卡死甚至触发 ANR (Application Not Responding) 崩溃。'
  },
  {
    embeddedConcept: '看门狗 (Hardware / Task Watchdog)',
    mobileConcept: 'MQTT KeepAlive 心跳 与 定时巡检 (PingReq / Pong)',
    icon: 'ShieldCheck',
    embeddedDesc: '单片机通过独立看门狗 (IWDG) 防止程序跑飞，必须在指定周期内“喂狗”，超时则复位硬件。',
    mobileDesc: '手机端在指定 KeepAlive 周期内（如 30s/60s），由 MQTT 客户端自动发出 `PINGREQ` 包，若 Broker 未返回 `PINGRESP` 则认为连接断开，触发重连逻辑。',
    coreRule: '移动网络容易丢包与静默假死，KeepAlive 建议设为 30~60 秒，并配合 Exponential Backoff (指数退避重连)。'
  },
  {
    embeddedConcept: '低功耗休眠 (Stop / Standby / DeepSleep)',
    mobileConcept: '系统休眠机制 (Android Doze Mode / iOS Background Freeze)',
    icon: 'Moon',
    embeddedDesc: 'MCU 在无工作时进入 Stop 模式关闭外设时钟降低电流（μA级），由外部 EXTI 或 RTC 闹钟唤醒。',
    mobileDesc: '手机息屏 10~30 秒后，OS 会将 App 挂起 (Freeze)，切断 Socket TCP 连接或禁止后台网络访问，导致 MQTT 静默断开。',
    coreRule: '若需持续收发控制指令，Android 必须使用【前台服务 (Foreground Service)】；iOS 必须依赖【APNs 远程推送】或在应用回到前台 (AppLifecycle Resume) 时立即主动重连。'
  },
  {
    embeddedConcept: '环形缓冲区 (Ring Buffer FIFO)',
    mobileConcept: '离线消息队列 (Offline Message Queue)',
    icon: 'Database',
    embeddedDesc: '硬件串口通信中，用环形队列暂存尚未解析的二进制数据包，防止串口溢出覆盖。',
    mobileDesc: '当手机断网或正在重连时，上层 App 调用的 `publish` 消息可放入内存队列，待重连成功后按序自动重发。',
    coreRule: '移动端断网是常态，必须建立离线重发机制并限制队列最大容量，防止内存溢出。'
  }
];

export interface QosExplanation {
  level: number;
  name: string;
  tag: string;
  networkCost: string;
  reliability: string;
  mcuAnalogy: string;
  bestFor: string;
  handshake: string[];
}

export const QOS_EXPLANATIONS: QosExplanation[] = [
  {
    level: 0,
    name: 'At most once (最多一次)',
    tag: 'Fire and Forget (发完即忘)',
    networkCost: '极低 (1个数据包)',
    reliability: '可能丢包，不重传',
    mcuAnalogy: '相当于单片机裸发串口广播或 UDP 报文，只发一次，不管对端有没有收到。',
    bestFor: '高频传感器遥测数据（如 100ms 刷新一次的电机转速、温度），丢一包不影响大局。',
    handshake: ['Publisher ─── PUBLISH ───> Broker (无回执)']
  },
  {
    level: 1,
    name: 'At least once (至少一次)',
    tag: 'Guaranteed Delivery (带回执确认)',
    networkCost: '中等 (2个数据包)',
    reliability: '保证到达，但弱网重试时可能收到重复消息',
    mcuAnalogy: '相当于带 ACK 回执的 UART 通信，发完等 ACK，超时没等到就重发。',
    bestFor: '控制指令（如继电器开关、参数设置、故障告警）。需在电控端做幂等性（防重复执行）处理。',
    handshake: [
      'Publisher ─── PUBLISH (PacketID=101) ───> Broker',
      'Publisher <─── PUBACK (PacketID=101) ──── Broker'
    ]
  },
  {
    level: 2,
    name: 'Exactly once (恰好一次)',
    tag: 'Strict Delivery (严格四次握手)',
    networkCost: '最高 (4个完整握手包)',
    reliability: '保证且仅到达一次，绝不重复',
    mcuAnalogy: '相当于工业级 Modbus 双向锁定事务。由于开销大且高延迟，在移动端和单片机上应谨慎使用。',
    bestFor: '充值计费、设备固件升级校验、关键状态迁移等对重复极其敏感的场景。',
    handshake: [
      'Publisher ─── PUBLISH (QoS 2) ───> Broker',
      'Publisher <─── PUBREC (Received) ── Broker',
      'Publisher ─── PUBREL (Release) ──> Broker',
      'Publisher <─── PUBCOMP (Complete) < Broker'
    ]
  }
];

export const PITFALLS_LIST = [
  {
    title: '1. 手机锁屏/息屏后 TCP 假死断连',
    symptom: '手机屏幕一关，电控板发出的 MQTT 数据 App 就收不到了；亮屏后显示仍连接，但点发布就报错。',
    cause: 'iOS 和 Android 的系统电池优化策略会在锁屏后强行挂起应用，切断 Socket 连接，且不触发标准的 TCP FIN 挥手。',
    solution: [
      '监听 App 生命周期：当 App 从 Background 切回 Foreground (`didChangeAppLifecycleState` / `AppState`) 时，主动检测连接状态并触发重连。',
      'Android 端启用 Foreground Service（前台常驻通知栏服务）并申请电池优化白名单（`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`）。',
      'iOS 端如果需要熄屏接收控制通知，必须通过后端转发 APNs 苹果推送服务。'
    ]
  },
  {
    title: '2. 客户端 ID 冲突引发“无限互踢”死循环',
    symptom: '手机 App 刚连上 2 秒就被 Broker 断开，不断重连不断掉线，Broker 日志中出现大量的 ClientID Reconnect / Dropped。',
    cause: '代码中硬编码了固定的 `clientId = "MyPhoneApp"`。当多个手机打开 App，或者同一个手机热重载启动了两个客户端实例时，Broker 依据 MQTT 规范会把旧连接踢下线。',
    solution: [
      '动态生成 Client ID：采用 `device_uuid_timestamp` 或随机后缀，如 `Phone_${Platform}_${RandomID}`。',
      '若必须使用固定 ClientID 实现离线消息拉取，确保同一时刻同一账号仅有一处登录。'
    ]
  },
  {
    title: '3. 局域网明文通信与 WiFi 权限阻断',
    symptom: '在电脑端用 MQTTX 可以连上树莓派/ESP32 自建的 MQTT Broker（如 192.168.1.100:1883），但在手机 App 上提示 Socket Exception / Connection Refused。',
    cause: '现代 Android 和 iOS 默认强制 HTTPS/WSS/TLS，禁止非安全明文网络（Cleartext Traffic）访问；且 iOS 访问局域网需要开启本地网络权限。',
    solution: [
      'Android 在 `AndroidManifest.xml` 的 `<application>` 标签中添加 `android:usesCleartextTraffic="true"`。',
      'iOS 在 `Info.plist` 中配置 `NSAppTransportSecurity` 允许任意加载，并添加 `NSLocalNetworkUsageDescription` 说明权限用途。'
    ]
  },
  {
    title: '4. 主线程 UI 刷新与多线程安全 (Cross-Thread Exception)',
    symptom: '收到 MQTT 消息时在回调函数里直接操作 UI 控件，导致应用抛出 “Only the original thread that created a view hierarchy can touch its views” 或界面丢帧卡顿。',
    cause: '部分底层的 Socket 接收库是在 Background Worker 线程中触发消息回调，直接更新 UI 违反了移动端的单 UI 线程渲染原则。',
    solution: [
      '在 Flutter 中，使用 `setState()` 或 StreamBuilder，或者通过 `WidgetsBinding.instance.addPostFrameCallback` 确保在 UI 帧渲染周期更新。',
      '在 React Native / Vue / Flet 中，保证在 React State 变更通道中派发，禁止直接修改 DOM/Native 引用。'
    ]
  }
];
