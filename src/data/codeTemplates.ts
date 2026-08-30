export interface CodeFile {
  filename: string;
  language: string;
  description: string;
  code: string;
}

export interface FrameworkCodeTemplate {
  id: string;
  name: string;
  badge: string;
  recommendationReason: string;
  bestFitFor: string;
  libraryName: string;
  files: CodeFile[];
}

export const CODE_TEMPLATES: FrameworkCodeTemplate[] = [
  {
    id: 'flutter',
    name: 'Flutter (Dart) - ⭐️ 强烈推荐首选',
    badge: 'IoT 行业工业级标杆',
    recommendationReason:
      'Dart 语法与 C++/Java 高度亲和，强类型安全；拥有官方级高性能直接原生 TCP 套接字支持（可直接连 1883 端口，无需中转 WebSocket）；一套代码编译为原生 ARM 机器码，性能和硬件控制能力最强。',
    bestFitFor: '嵌入式/电控开发者从零上手跨平台 App、工业物联网、智能硬件调试器、手持遥控端',
    libraryName: 'mqtt_client (v10.5.0+)',
    files: [
      {
        filename: 'pubspec.yaml',
        language: 'yaml',
        description: '项目依赖配置文件',
        code: `name: iot_mqtt_controller
description: "A production-ready MQTT mobile application for IoT and embedded systems."
publish_to: "none"
version: 1.0.0+1

environment:
  sdk: ">=3.0.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter
  # 官方推荐的高性能 MQTT 客户端（支持 TCP 1883 和 WSS 8084）
  mqtt_client: ^10.5.0
  # 辅助日期格式化
  intl: ^0.19.0
  cupertino_icons: ^1.0.8

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
`
      },
      {
        filename: 'android/app/src/main/AndroidManifest.xml',
        language: 'xml',
        description: 'Android 权限配置清单 (开启网络与局域网明文连接)',
        code: `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.iot_mqtt_controller">

    <!-- 1. 基础网络通信权限 (必需) -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <!-- 2. 获取当前网络连接状态 (用于监测 WiFi 是否断开) -->
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    
    <!-- 3. (可选) 屏幕常亮或前台保活权限，防止电控长连接休眠 -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />

    <!-- 关键配置：android:usesCleartextTraffic="true" 允许连接局域网 1883 端口非 TLS 明文 TCP -->
    <application
        android:label="IoT MQTT Controller"
        android:name="\${applicationName}"
        android:icon="@mipmap/ic_launcher"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
`
      },
      {
        filename: 'ios/Runner/Info.plist',
        language: 'xml',
        description: 'iOS 网络与局域网 ATS 权限配置',
        code: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>IoT MQTT Controller</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleVersion</key>
    <string>$(FLUTTER_BUILD_NUMBER)</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>

    <!-- 1. 允许局域网非加密 MQTT 连接 (ATS 配置) -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>

    <!-- 2. iOS 14+ 局域网访问权限说明 (连接 ESP32/树莓派局域网 Broker 必需) -->
    <key>NSLocalNetworkUsageDescription</key>
    <string>本应用需要访问本地局域网以连接智能硬件 MQTT 服务器进行数据通信</string>

</dict>
</plist>
`
      },
      {
        filename: 'lib/main.dart',
        language: 'dart',
        description: '完整、可直接运行的 MQTT 手机端核心应用代码 (已预置 192.168.1.105:1883 与 MyMobilePhone)',
        code: `import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:mqtt_client/mqtt_client.dart';
import 'package:mqtt_client/mqtt_server_client.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'IoT MQTT 控制台',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blueGrey),
        useMaterial3: true,
      ),
      home: const MqttControllerPage(),
    );
  }
}

// 消息记录模型
class MqttLog {
  final DateTime time;
  final String topic;
  final String payload;
  final bool isReceived;

  MqttLog({
    required this.time,
    required this.topic,
    required this.payload,
    required this.isReceived,
  });
}

class MqttControllerPage extends StatefulWidget {
  const MqttControllerPage({super.key});

  @override
  State<MqttControllerPage> createState() => _MqttControllerPageState();
}

class _MqttControllerPageState extends State<MqttControllerPage>
    with WidgetsBindingObserver {
  // ---------------------------
  // 1. 已固定配置参数 (192.168.1.105:1883 & MyMobilePhone)
  // ---------------------------
  final TextEditingController _serverController =
      TextEditingController(text: '192.168.1.105'); // 固定局域网 Broker IP
  final TextEditingController _portController =
      TextEditingController(text: '1883'); // 固定端口
  final TextEditingController _clientIdController =
      TextEditingController(text: 'MyMobilePhone'); // 固定客户端 ID

  final TextEditingController _subTopicController =
      TextEditingController(text: 'iot/esp32/telemetry');
  final TextEditingController _pubTopicController =
      TextEditingController(text: 'iot/esp32/cmd');
  final TextEditingController _pubMsgController =
      TextEditingController(text: '{"led":1,"relay":1}');

  // MQTT 客户端实例
  MqttServerClient? _client;

  // 连接状态标志
  MqttConnectionState _connectionState = MqttConnectionState.disconnected;
  bool _isConnecting = false;

  // 消息日志缓冲区 (类似于串口调试助手的接收区)
  final List<MqttLog> _logs = [];
  final ScrollController _scrollController = ScrollController();

  // 订阅主题集合
  final Set<String> _subscribedTopics = {};

  @override
  void initState() {
    super.initState();
    // 监听应用生命周期（用于处理前后台切换与唤醒重连）
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _disconnectMqtt();
    _serverController.dispose();
    _portController.dispose();
    _clientIdController.dispose();
    _subTopicController.dispose();
    _pubTopicController.dispose();
    _pubMsgController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  // -------------------------------------------------------------
  // 2. 避坑重点：生命周期监听（类似单片机从 LowPower 唤醒后重新校准）
  // -------------------------------------------------------------
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // 手机从息屏或后台回到前台，检查 TCP 连接是否已被系统掐断
      if (_client != null &&
          _client!.connectionStatus!.state != MqttConnectionState.connected) {
        _addLog("系统", "检测到应用回到前台，正在检查并自动重连...", false);
        _connectMqtt();
      }
    }
  }

  // -------------------------------------------------------------
  // 3. 通信核心：初始化与连接
  // -------------------------------------------------------------
  Future<void> _connectMqtt() async {
    if (_isConnecting) return;

    final server = _serverController.text.trim();
    final port = int.tryParse(_portController.text.trim()) ?? 1883;
    final fixedClientId = _clientIdController.text.trim().isEmpty 
        ? 'MyMobilePhone' 
        : _clientIdController.text.trim();

    if (server.isEmpty) {
      _showSnackBar("请输入服务器 IP 或域名");
      return;
    }

    setState(() {
      _isConnecting = true;
    });

    // 使用固定的 ClientID: MyMobilePhone
    _client = MqttServerClient.withPort(server, fixedClientId, port);
    _client!.logging(on: false); // 是否开启底层协议抓包日志

    // 心跳周期配置 (KeepAlive): 类似于单片机喂狗周期，设为 30 秒
    _client!.keepAlivePeriod = 30;
    // 自动重连机制
    _client!.autoReconnect = true;

    // 连接断开/成功的回调绑定 (类似于中断服务函数入口)
    _client!.onDisconnected = _onDisconnected;
    _client!.onConnected = _onConnected;
    _client!.onAutoReconnected = () {
      _addLog("系统", "MQTT 自动重连成功!", true);
      setState(() {
        _connectionState = MqttConnectionState.connected;
      });
      // 重新恢复订阅
      for (var topic in _subscribedTopics) {
        _client!.subscribe(topic, MqttQos.atLeastOnce);
      }
    };

    // 配置连接报文选项
    final connMessage = MqttConnectMessage()
        .withClientIdentifier(fixedClientId)
        .startClean() // Clean Session: true 表示清空历史会话
        .withWillTopic('iot/phone/status') // 遗嘱消息 (LWT)
        .withWillMessage('{"online":false,"client":"MyMobilePhone"}')
        .withWillQos(MqttQos.atLeastOnce);
    _client!.connectionMessage = connMessage;

    try {
      _addLog("系统", "正在连接到 \$server:\$port (ClientID: \$fixedClientId)...", false);
      await _client!.connect();
    } on NoConnectionException catch (e) {
      _addLog("错误", "连接异常: \$e", false);
      _disconnectMqtt();
    } on SocketException catch (e) {
      _addLog("错误", "Socket 网络异常 (请检查 WiFi 或 IP 是否为 192.168.1.105): \$e", false);
      _disconnectMqtt();
    } catch (e) {
      _addLog("错误", "未知连接错误: \$e", false);
      _disconnectMqtt();
    } finally {
      if (mounted) {
        setState(() {
          _isConnecting = false;
          _connectionState = _client?.connectionStatus?.state ??
              MqttConnectionState.disconnected;
        });
      }
    }
  }

  // -------------------------------------------------------------
  // 4. 连接成功回调与消息流监听 (类似于配置好串口中断使能)
  // -------------------------------------------------------------
  void _onConnected() {
    _addLog("系统", "成功连接到 MQTT 服务器: 192.168.1.105:1883", true);
    setState(() {
      _connectionState = MqttConnectionState.connected;
    });

    // 监听接收消息的 Stream (数据流类似于单片机环形缓冲区的弹出通道)
    _client!.updates!.listen((List<MqttReceivedMessage<MqttMessage>> c) {
      final recMess = c[0].payload as MqttPublishMessage;
      final payloadStr = MqttPublishPayload.bytesToStringAsString(
          recMess.payload.message);
      final topic = c[0].topic;

      // 在 UI 线程中更新接收日志 (避免多线程异常)
      setState(() {
        _addLog(topic, payloadStr, true);
      });
    });
  }

  void _onDisconnected() {
    _addLog("系统", "MQTT 连接已断开", false);
    setState(() {
      _connectionState = MqttConnectionState.disconnected;
    });
  }

  void _disconnectMqtt() {
    if (_client != null) {
      _client!.disconnect();
      _client = null;
    }
    setState(() {
      _connectionState = MqttConnectionState.disconnected;
      _isConnecting = false;
      _subscribedTopics.clear();
    });
  }

  // -------------------------------------------------------------
  // 5. 订阅主题 (Subscribe)
  // -------------------------------------------------------------
  void _subscribeTopic() {
    if (_client?.connectionStatus?.state != MqttConnectionState.connected) {
      _showSnackBar("请先连接 MQTT 服务器");
      return;
    }

    final topic = _subTopicController.text.trim();
    if (topic.isEmpty) return;

    // QoS 1: 至少一次到达，最适合工业电控指令与状态同步
    _client!.subscribe(topic, MqttQos.atLeastOnce);
    setState(() {
      _subscribedTopics.add(topic);
      _addLog("系统", "已订阅主题: \$topic (QoS 1)", true);
    });
  }

  // 取消订阅
  void _unsubscribeTopic(String topic) {
    if (_client?.connectionStatus?.state == MqttConnectionState.connected) {
      _client!.unsubscribe(topic);
    }
    setState(() {
      _subscribedTopics.remove(topic);
      _addLog("系统", "已取消订阅: \$topic", false);
    });
  }

  // -------------------------------------------------------------
  // 6. 发布消息 (Publish)
  // -------------------------------------------------------------
  void _publishMessage() {
    if (_client?.connectionStatus?.state != MqttConnectionState.connected) {
      _showSnackBar("请先连接 MQTT 服务器");
      return;
    }

    final topic = _pubTopicController.text.trim();
    final message = _pubMsgController.text.trim();

    if (topic.isEmpty || message.isEmpty) {
      _showSnackBar("主题和内容不能为空");
      return;
    }

    final builder = MqttClientPayloadBuilder();
    builder.addString(message);

    // 将字节包发布到指定主题 (QoS 1，无保留)
    _client!.publishMessage(
      topic,
      MqttQos.atLeastOnce,
      builder.payload!,
      retain: false,
    );

    setState(() {
      _addLog(topic, message, false);
    });
  }

  // 辅助日志记录器
  void _addLog(String topic, String payload, bool isReceived) {
    _logs.add(MqttLog(
      time: DateTime.now(),
      topic: topic,
      payload: payload,
      isReceived: isReceived,
    ));
    // 限制最大日志量为 200 条，防止内存膨胀
    if (_logs.length > 200) {
      _logs.removeAt(0);
    }
    // 自动滚到底部
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _showSnackBar(String text) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
  }

  // -------------------------------------------------------------
  // 7. UI 构建 (声明式组件树)
  // -------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    final isConnected =
        _connectionState == MqttConnectionState.connected;

    return Scaffold(
      appBar: AppBar(
        title: const Text('IoT MQTT 移动端实战控制台'),
        backgroundColor: Colors.blueGrey.shade800,
        foregroundColor: Colors.white,
        actions: [
          // 状态小指示灯
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: isConnected ? Colors.green.shade700 : Colors.red.shade700,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(
                  isConnected ? Icons.check_circle : Icons.cancel,
                  size: 14,
                  color: Colors.white,
                ),
                const SizedBox(width: 4),
                Text(
                  isConnected ? '已连接' : '未连接',
                  style: const TextStyle(fontSize: 12, color: Colors.white),
                ),
              ],
            ),
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 卡片 1：服务器连接配置 (已固定 192.168.1.105 与 MyMobilePhone)
            _buildSectionCard(
              title: '1. 服务器配置 (固定 IP: 192.168.1.105:1883)',
              icon: Icons.router,
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: TextField(
                          controller: _serverController,
                          decoration: const InputDecoration(
                            labelText: 'Broker IP (已固定)',
                            hintText: '192.168.1.105',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          enabled: !isConnected && !_isConnecting,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        flex: 1,
                        child: TextField(
                          controller: _portController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: '端口',
                            hintText: '1883',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          enabled: !isConnected && !_isConnecting,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _clientIdController,
                    decoration: const InputDecoration(
                      labelText: 'Client ID (固定标识)',
                      hintText: 'MyMobilePhone',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    enabled: !isConnected && !_isConnecting,
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: ElevatedButton.icon(
                      onPressed: _isConnecting
                          ? null
                          : (isConnected ? _disconnectMqtt : _connectMqtt),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isConnected
                            ? Colors.red.shade600
                            : Colors.blueGrey.shade800,
                        foregroundColor: Colors.white,
                      ),
                      icon: _isConnecting
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white),
                            )
                          : Icon(isConnected ? Icons.link_off : Icons.link),
                      label: Text(
                        _isConnecting
                            ? '正在连接 192.168.1.105:1883 ...'
                            : (isConnected ? '断开 MQTT 连接' : '连接至 192.168.1.105:1883 (MyMobilePhone)'),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  )
                ],
              ),
            ),

            const SizedBox(height: 12),

            // 卡片 2：主题订阅 (Subscribe)
            _buildSectionCard(
              title: '2. 订阅主题 (Subscribe)',
              icon: Icons.mark_email_read,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _subTopicController,
                          decoration: const InputDecoration(
                            labelText: '订阅主题 (Topic)',
                            hintText: '例如 iot/esp32/telemetry',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: isConnected ? _subscribeTopic : null,
                        child: const Text('订阅 (QoS 1)'),
                      ),
                    ],
                  ),
                  if (_subscribedTopics.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      children: _subscribedTopics
                          .map(
                            (t) => Chip(
                              label: Text(t,
                                  style: const TextStyle(fontSize: 12)),
                              deleteIcon: const Icon(Icons.close, size: 14),
                              onDeleted: () => _unsubscribeTopic(t),
                            ),
                          )
                          .toList(),
                    )
                  ]
                ],
              ),
            ),

            const SizedBox(height: 12),

            // 卡片 3：消息发布 (Publish)
            _buildSectionCard(
              title: '3. 发布控制指令 (Publish)',
              icon: Icons.send,
              child: Column(
                children: [
                  TextField(
                    controller: _pubTopicController,
                    decoration: const InputDecoration(
                      labelText: '目标主题 (Publish Topic)',
                      hintText: '例如 iot/esp32/cmd',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _pubMsgController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: '消息载荷 (JSON Payload / 文本)',
                      hintText: '{"relay": 1, "speed": 1200}',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      OutlinedButton.icon(
                        onPressed: () {
                          _pubMsgController.text =
                              '{"cmd":"GET_STATUS","ts":\${DateTime.now().millisecondsSinceEpoch}}';
                        },
                        icon: const Icon(Icons.code, size: 16),
                        label: const Text('快捷指令'),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        onPressed: isConnected ? _publishMessage : null,
                        icon: const Icon(Icons.send, size: 16),
                        label: const Text('立即发布'),
                      ),
                    ],
                  )
                ],
              ),
            ),

            const SizedBox(height: 12),

            // 卡片 4：通信数据监测窗口 (类似于串口助手接收区)
            _buildSectionCard(
              title: '4. 实时通信数据流 (Logs & Telemetry)',
              icon: Icons.terminal,
              trailing: IconButton(
                icon: const Icon(Icons.delete_sweep, size: 20),
                tooltip: '清空日志',
                onPressed: () => setState(() => _logs.clear()),
              ),
              child: Container(
                height: 220,
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: _logs.isEmpty
                    ? const Center(
                        child: Text(
                          '暂无通信报文 (请先连接并订阅主题)',
                          style: TextStyle(color: Colors.white54, fontSize: 12),
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        itemCount: _logs.length,
                        itemBuilder: (context, index) {
                          final log = _logs[index];
                          final timeStr =
                              "\${log.time.hour.toString().padLeft(2, '0')}:\${log.time.minute.toString().padLeft(2, '0')}:\${log.time.second.toString().padLeft(2, '0')}";

                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 2),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "[\$timeStr] ",
                                  style: const TextStyle(
                                      color: Colors.grey,
                                      fontSize: 11,
                                      fontFamily: 'monospace'),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 4, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: log.isReceived
                                        ? Colors.green.shade900
                                        : Colors.blue.shade900,
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                  child: Text(
                                    log.isReceived ? 'RX 接收' : 'TX 发送',
                                    style: TextStyle(
                                      color: log.isReceived
                                          ? Colors.greenAccent
                                          : Colors.lightBlueAccent,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    "[\${log.topic}] \${log.payload}",
                                    style: TextStyle(
                                      color: log.isReceived
                                          ? Colors.greenAccent.shade100
                                          : Colors.white,
                                      fontSize: 12,
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required Widget child,
    Widget? trailing,
  }) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 20, color: Colors.blueGrey.shade700),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                        fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                ),
                if (trailing != null) trailing,
              ],
            ),
            const Divider(height: 16),
            child,
          ],
        ),
      ),
    );
  }
}
`
      }
    ]
  },
  {
    id: 'react-native',
    name: 'React Native (TypeScript) - 备选方案',
    badge: 'Web / 前端生态开发者友好',
    recommendationReason:
      '利用庞大的 JavaScript/TypeScript 生态与丰富成熟的 UI 组件库。如果未来有前端人员协作或已掌握 Node.js/Web 开发，可考虑 React Native。',
    bestFitFor: '有前端或 Node.js 背景的团队，需要结合现有 Web 物联网面板复用逻辑',
    libraryName: 'sp-react-native-mqtt 或 paho-mqtt',
    files: [
      {
        filename: 'package.json',
        language: 'json',
        description: 'React Native 依赖清单',
        code: `{
  "name": "iot-mqtt-rn",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.4",
    "sp-react-native-mqtt": "^0.5.2",
    "react-native-uuid": "^2.0.2"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.0.4"
  }
}
`
      },
      {
        filename: 'App.tsx',
        language: 'typescript',
        description: 'React Native 核心 MQTT 连接与 UI 示例 (已预置 192.168.1.105:1883 与 MyMobilePhone)',
        code: `import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  AppState,
} from 'react-native';
import MQTT from 'sp-react-native-mqtt';

interface LogItem {
  id: string;
  time: string;
  topic: string;
  payload: string;
  type: 'rx' | 'tx' | 'sys';
}

export default function App() {
  // 固定 Broker IP 与端口、Client ID
  const [host, setHost] = useState('192.168.1.105');
  const [port, setPort] = useState('1883');
  const [clientId, setClientId] = useState('MyMobilePhone');
  const [subTopic, setSubTopic] = useState('iot/mcu/telemetry');
  const [pubTopic, setPubTopic] = useState('iot/mcu/cmd');
  const [pubPayload, setPubPayload] = useState('{"relay": 1}');
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([]);

  const clientRef = useRef<any>(null);

  const addLog = (topic: string, payload: string, type: 'rx' | 'tx' | 'sys') => {
    const time = new Date().toTimeString().split(' ')[0];
    setLogs((prev) => [
      ...prev.slice(-100), // 限制最近 100 条
      { id: Math.random().toString(), time, topic, payload, type },
    ]);
  };

  const connectMqtt = () => {
    const fixedClientId = clientId || 'MyMobilePhone';

    MQTT.createClient({
      uri: \`mqtt://\${host}:\${port}\`,
      clientId: fixedClientId,
      keepalive: 30,
      clean: true,
      auth: false,
    })
      .then((client) => {
        clientRef.current = client;

        // 绑定事件回调 (类似于单片机中断绑定)
        client.on('closed', () => {
          setIsConnected(false);
          addLog('SYSTEM', '连接已断开', 'sys');
        });

        client.on('error', (msg: string) => {
          addLog('ERROR', '错误: ' + msg, 'sys');
        });

        client.on('message', (msg: { topic: string; data: string }) => {
          // 收到订阅的消息
          addLog(msg.topic, msg.data, 'rx');
        });

        client.on('connect', () => {
          setIsConnected(true);
          addLog('SYSTEM', \`已成功连接到 \${host}:\${port} (ClientID: \${fixedClientId})\`, 'sys');
        });

        // 触发连接
        client.connect();
      })
      .catch((err) => {
        addLog('ERROR', '初始化异常: ' + err, 'sys');
      });
  };

  const disconnectMqtt = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setIsConnected(false);
  };

  const subscribeTopic = () => {
    if (!clientRef.current || !isConnected) return;
    clientRef.current.subscribe(subTopic, 1); // QoS 1
    addLog('SYSTEM', \`已订阅主题: \${subTopic}\`, 'sys');
  };

  const publishMessage = () => {
    if (!clientRef.current || !isConnected) return;
    clientRef.current.publish(pubTopic, pubPayload, 1, false);
    addLog(pubTopic, pubPayload, 'tx');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>IoT MQTT 控制面板 (React Native)</Text>
      
      {/* 服务器配置 */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>1. MQTT Broker 配置 (固定: 192.168.1.105:1883)</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 3 }]}
            value={host}
            onChangeText={setHost}
            placeholder="Broker IP"
            editable={!isConnected}
          />
          <TextInput
            style={[styles.input, { flex: 1, marginLeft: 8 }]}
            value={port}
            onChangeText={setPort}
            placeholder="端口"
            keyboardType="numeric"
            editable={!isConnected}
          />
        </View>
        <View style={[styles.row, { marginTop: 8 }]}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={clientId}
            onChangeText={setClientId}
            placeholder="Client ID (MyMobilePhone)"
            editable={!isConnected}
          />
        </View>
        <TouchableOpacity
          style={[styles.btn, isConnected ? styles.btnDanger : styles.btnPrimary]}
          onPress={isConnected ? disconnectMqtt : connectMqtt}
        >
          <Text style={styles.btnText}>{isConnected ? '断开连接' : '连接服务器 (192.168.1.105:1883)'}</Text>
        </TouchableOpacity>
      </View>

      {/* 订阅与发布 */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>2. 订阅与发布</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 3 }]}
            value={subTopic}
            onChangeText={setSubTopic}
            placeholder="订阅主题"
          />
          <TouchableOpacity style={[styles.btn, styles.btnSub, { marginLeft: 8 }]} onPress={subscribeTopic}>
            <Text style={styles.btnText}>订阅</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.row, { marginTop: 8 }]}>
          <TextInput
            style={[styles.input, { flex: 3 }]}
            value={pubPayload}
            onChangeText={setPubPayload}
            placeholder="指令载荷 JSON"
          />
          <TouchableOpacity style={[styles.btn, styles.btnPub, { marginLeft: 8 }]} onPress={publishMessage}>
            <Text style={styles.btnText}>发布</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 日志窗口 */}
      <View style={[styles.card, { flex: 1 }]}>
        <Text style={styles.cardHeader}>3. 通信日志 (RX/TX)</Text>
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Text style={[styles.logText, item.type === 'rx' ? styles.logRx : item.type === 'tx' ? styles.logTx : styles.logSys]}>
              [{item.time}] [{item.type.toUpperCase()}] [{item.topic}] {item.payload}
            </Text>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', marginBottom: 10, textAlign: 'center' },
  card: { backgroundColor: '#1e293b', borderRadius: 8, padding: 12, marginBottom: 10 },
  cardHeader: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: { backgroundColor: '#334155', color: '#fff', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13 },
  btn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: '#2563eb', marginTop: 8 },
  btnDanger: { backgroundColor: '#dc2626', marginTop: 8 },
  btnSub: { backgroundColor: '#059669' },
  btnPub: { backgroundColor: '#d97706' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  logText: { fontSize: 11, fontFamily: 'monospace', marginVertical: 1 },
  logRx: { color: '#4ade80' },
  logTx: { color: '#38bdf8' },
  logSys: { color: '#94a3b8' },
});
`
      }
    ]
  },
  {
    id: 'flet',
    name: 'Python Flet - 极速原型开发',
    badge: '纯 Python 语法极简上手',
    recommendationReason:
      '如果完全不想学 Dart/JS，Flet 可以让你用纯 Python 语法编写类似 Flutter 的手机 App，并直接复用熟悉的 `paho-mqtt` 库。适合内部工具、实验台验证与概念验证 (PoC)。',
    bestFitFor: '嵌入式工程师快速搭建测试 Demo、单人快速联调验证硬件电控逻辑',
    libraryName: 'paho-mqtt + flet',
    files: [
      {
        filename: 'requirements.txt',
        language: 'text',
        description: 'Python 依赖文件',
        code: `flet>=0.21.0
paho-mqtt>=1.6.1
`
      },
      {
        filename: 'main.py',
        language: 'python',
        description: '基于 Python 的完整 MQTT 跨平台 App 代码 (预置 192.168.1.105:1883 与 MyMobilePhone)',
        code: `import flet as ft
import paho.mqtt.client as mqtt
import time
import json

def main(page: ft.Page):
    page.title = "IoT MQTT Python 控制台 (Flet)"
    page.theme_mode = ft.ThemeMode.DARK
    page.scroll = ft.ScrollMode.ADAPTIVE

    # MQTT Client 全局引用
    mqtt_client = None

    # UI 控件定义 (已固定 192.168.1.105:1883 与 MyMobilePhone)
    txt_host = ft.TextField(label="Broker IP", value="192.168.1.105", expand=3)
    txt_port = ft.TextField(label="端口", value="1883", expand=1)
    txt_client_id = ft.TextField(label="Client ID", value="MyMobilePhone", expand=2)
    txt_sub_topic = ft.TextField(label="订阅主题", value="iot/esp32/telemetry", expand=3)
    txt_pub_topic = ft.TextField(label="发布主题", value="iot/esp32/cmd", expand=2)
    txt_pub_payload = ft.TextField(label="指令载荷", value='{"led":1,"motor_rpm":1500}', expand=3)
    
    # 状态指示与日志列表
    lbl_status = ft.Text("状态: 未连接", color=ft.colors.RED_400, weight=ft.FontWeight.BOLD)
    log_column = ft.ListView(expand=True, spacing=4, auto_scroll=True, height=240)

    def add_log(topic, payload, log_type="RX"):
        cur_time = time.strftime("%H:%M:%S")
        color = ft.colors.GREEN_400 if log_type == "RX" else (ft.colors.BLUE_400 if log_type == "TX" else ft.colors.GREY_400)
        log_column.controls.append(
            ft.Text(f"[{cur_time}] [{log_type}] [{topic}] {payload}", color=color, size=12, font_family="monospace")
        )
        page.update()

    # -----------------------------------------------
    # MQTT 回调函数 (C++/Python 开发者最熟悉的 Paho-MQTT 回调)
    # -----------------------------------------------
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            lbl_status.value = "状态: 已连接"
            lbl_status.color = ft.colors.GREEN_400
            btn_connect.text = "断开连接"
            btn_connect.bgcolor = ft.colors.RED_700
            add_log("SYSTEM", f"成功连接到 MQTT Broker 192.168.1.105:1883 (rc=0)", "SYS")
        else:
            add_log("ERROR", f"连接失败，错误代码 rc={rc}", "SYS")
        page.update()

    def on_message(client, userdata, msg):
        payload_str = msg.payload.decode('utf-8', errors='ignore')
        # 接收到消息，回调更新 UI
        add_log(msg.topic, payload_str, "RX")

    def on_disconnect(client, userdata, rc):
        lbl_status.value = "状态: 已断开"
        lbl_status.color = ft.colors.RED_400
        btn_connect.text = "连接 Broker (192.168.1.105)"
        btn_connect.bgcolor = ft.colors.BLUE_700
        add_log("SYSTEM", "MQTT 连接已断开", "SYS")
        page.update()

    # 按钮点击事件处理
    def toggle_connection(e):
        nonlocal mqtt_client
        if mqtt_client and mqtt_client.is_connected():
            mqtt_client.loop_stop()
            mqtt_client.disconnect()
            mqtt_client = None
            return

        client_id = txt_client_id.value.strip() or "MyMobilePhone"
        mqtt_client = mqtt.Client(client_id=client_id, clean_session=True)
        mqtt_client.on_connect = on_connect
        mqtt_client.on_message = on_message
        mqtt_client.on_disconnect = on_disconnect

        try:
            host = txt_host.value.strip()
            port = int(txt_port.value.strip())
            add_log("SYSTEM", f"正在尝试连接 {host}:{port} (ID: {client_id}) ...", "SYS")
            mqtt_client.connect_async(host, port, keepalive=30)
            # 开启后台网络循环线程 (非阻塞)
            mqtt_client.loop_start()
        except Exception as ex:
            add_log("ERROR", f"连接异常: {ex}", "SYS")

    def subscribe_topic(e):
        if mqtt_client and mqtt_client.is_connected():
            topic = txt_sub_topic.value.strip()
            mqtt_client.subscribe(topic, qos=1)
            add_log("SYSTEM", f"已订阅: {topic} (QoS 1)", "SYS")
        else:
            add_log("WARN", "请先连接 MQTT Broker", "SYS")

    def publish_cmd(e):
        if mqtt_client and mqtt_client.is_connected():
            topic = txt_pub_topic.value.strip()
            payload = txt_pub_payload.value.strip()
            mqtt_client.publish(topic, payload, qos=1)
            add_log(topic, payload, "TX")
        else:
            add_log("WARN", "请先连接 MQTT Broker", "SYS")

    btn_connect = ft.ElevatedButton("连接 192.168.1.105:1883", on_click=toggle_connection, bgcolor=ft.colors.BLUE_700, color=ft.colors.WHITE)

    # 组装页面布局
    page.add(
        ft.Row([ft.Icon(ft.icons.SETTINGS_INPUT_ANTENNA), ft.Text("IoT MQTT Python 控制端", size=20, weight="bold"), lbl_status], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
        ft.Divider(),
        ft.Card(
            content=ft.Container(
                content=ft.Column([
                    ft.Text("1. 网络与 Broker 设置 (已固定配置)", weight="bold"),
                    ft.Row([txt_host, txt_port]),
                    txt_client_id,
                    btn_connect
                ]),
                padding=12
            )
        ),
        ft.Card(
            content=ft.Container(
                content=ft.Column([
                    ft.Text("2. 订阅与控制发布", weight="bold"),
                    ft.Row([txt_sub_topic, ft.ElevatedButton("订阅 (QoS 1)", on_click=subscribe_topic)]),
                    ft.Row([txt_pub_topic, txt_pub_payload, ft.ElevatedButton("发布指令", on_click=publish_cmd, bgcolor=ft.colors.ORANGE_700, color=ft.colors.WHITE)])
                ]),
                padding=12
            )
        ),
        ft.Card(
            content=ft.Container(
                content=ft.Column([
                    ft.Row([ft.Text("3. 数据通信监控 (RX/TX 报文)", weight="bold"), ft.IconButton(ft.icons.CLEAR_ALL, on_click=lambda _: log_column.controls.clear() or page.update())], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                    ft.Container(content=log_column, bgcolor=ft.colors.BLACK87, border_radius=6, padding=8)
                ]),
                padding=12
            )
        )
    )

if __name__ == "__main__":
    ft.app(target=main)
`
      }
    ]
  }
];
