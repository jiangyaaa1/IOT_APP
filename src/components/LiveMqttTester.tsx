import React, { useState, useEffect, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { App } from '@capacitor/app';
import {
  Wifi,
  WifiOff,
  Send,
  Plus,
  Trash2,
  Cpu,
  Activity,
  Sliders,
  Terminal,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Layers,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Smartphone,
  CheckCircle2,
  HelpCircle,
  X
} from 'lucide-react';
import { MqttMessage, TelemetryData } from '../types';

interface LiveMqttTesterProps {
  onConnectionChange: (connected: boolean) => void;
}

export const LiveMqttTester: React.FC<LiveMqttTesterProps> = ({ onConnectionChange }) => {
  // MQTT Connection state (固定预置用户配置: 192.168.1.105:1883 & MyMobilePhone)
  const [brokerUrl, setBrokerUrl] = useState(() => {
    return localStorage.getItem('fixed_mqtt_broker_url') || 'ws://192.168.1.105:8083';
  });
  const [clientId, setClientId] = useState(() => {
    return localStorage.getItem('fixed_mqtt_client_id') || 'MyMobilePhone';
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatusText, setConnectionStatusText] = useState('未连接');
  const [httpsDiagnosisNotice, setHttpsDiagnosisNotice] = useState<string | null>(null);

  // Handle Capacitor app state (Foreground/Background)
  // This solves Doze Mode and Network Switch issues when app resumes
  useEffect(() => {
    let isActive = true;
    const initAppListeners = async () => {
      try {
        await App.addListener('appStateChange', ({ isActive: appIsActive }) => {
          if (!isActive) return;
          console.log('[App State] Is Active: ', appIsActive);
          if (appIsActive) {
            // App came to foreground
            addSystemLog('🟡 App 已恢复到前台，检查 MQTT 连接状态...');
            if (clientRef.current && !clientRef.current.connected) {
              addSystemLog('🟡 连接似乎已挂起，触发自动重连...');
              clientRef.current.reconnect();
            }
          } else {
            // App went to background (Doze mode)
            addSystemLog('💤 App 已退到后台，可能会被系统挂起或受省电模式限制...');
          }
        });
      } catch (err) {
        console.warn('App listeners not available (likely running in browser, not Capacitor device)');
      }
    };
    
    initAppListeners();
    
    return () => {
      isActive = false;
      try {
        App.removeAllListeners();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // 持久化保存固定配置
  useEffect(() => {
    localStorage.setItem('fixed_mqtt_broker_url', brokerUrl);
  }, [brokerUrl]);

  useEffect(() => {
    localStorage.setItem('fixed_mqtt_client_id', clientId);
  }, [clientId]);

  // Topics & Message Input
  const [subTopicInput, setSubTopicInput] = useState('iot/device/telemetry');
  const [subQos, setSubQos] = useState<0 | 1 | 2>(1);
  const [subscribedTopics, setSubscribedTopics] = useState<string[]>(['iot/device/telemetry']);

  const [pubTopic, setPubTopic] = useState('iot/device/control');
  const [pubQos, setPubQos] = useState<0 | 1 | 2>(1);
  const [pubRetain, setPubRetain] = useState(false);
  const [pubPayload, setPubPayload] = useState('{"relay": 1, "led": 1, "speed": 1500}');

  // Message Logs
  const [messages, setMessages] = useState<MqttMessage[]>([]);
  const [filterTopic, setFilterTopic] = useState('');
  const [viewMode, setViewMode] = useState<'formatted' | 'hex' | 'json'>('formatted');

  // Virtual Hardware MCU Simulator (ESP32/STM32 simulation)
  const [mcuSimEnabled, setMcuSimEnabled] = useState(true);
  const [mcuTelemetry, setMcuTelemetry] = useState<TelemetryData>({
    voltage: 3.32,
    current: 0.18,
    temperature: 28.4,
    motorRpm: 1500,
    status: 'RUNNING'
  });
  const [relayState, setRelayState] = useState(true);
  const [ledState, setLedState] = useState(true);

  const clientRef = useRef<MqttClient | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Sync connection state to parent
  useEffect(() => {
    onConnectionChange(isConnected);
  }, [isConnected, onConnectionChange]);

  // Auto scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Virtual MCU heartbeat and telemetry generator loop (MCU while(1) simulation)
  useEffect(() => {
    if (!mcuSimEnabled) return;

    const interval = setInterval(() => {
      // Simulate physical sensor noise
      setMcuTelemetry((prev) => {
        const nextTemp = +(28.0 + Math.sin(Date.now() / 3000) * 1.5 + (Math.random() * 0.4 - 0.2)).toFixed(1);
        const nextVolt = +(3.3 + (Math.random() * 0.04 - 0.02)).toFixed(2);
        const nextCurrent = relayState ? +(0.15 + (prev.motorRpm / 3000) * 0.3 + Math.random() * 0.02).toFixed(2) : 0.02;

        const updated: TelemetryData = {
          voltage: nextVolt,
          current: nextCurrent,
          temperature: nextTemp,
          motorRpm: relayState ? prev.motorRpm : 0,
          status: relayState ? 'RUNNING' : 'IDLE'
        };

        // If client is connected and subscribed to telemetry, feed it
        if (clientRef.current?.connected && subscribedTopics.some(t => t === 'iot/device/telemetry' || t.includes('#') || t.includes('+'))) {
          const telemetryPayload = JSON.stringify({
            deviceId: 'ESP32-NODE-01',
            timestamp: Date.now(),
            ...updated,
            gpio: { relay: relayState ? 1 : 0, led: ledState ? 1 : 0 }
          });

          // Add simulated message if not looping through external broker to give instant feedback
          // Or let MQTT broker handle it if we publish it:
          clientRef.current.publish('iot/device/telemetry', telemetryPayload, { qos: 0 });
        }

        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [mcuSimEnabled, relayState, ledState, subscribedTopics]);

  // Connect to MQTT Broker
  const handleConnect = () => {
    if (isConnecting || isConnected) return;

    setHttpsDiagnosisNotice(null);
    setIsConnecting(true);
    setConnectionStatusText('正在建立连接...');

    // 检查是否在 HTTPS 网页中直接尝试连接未加密的 ws:// 或原生 TCP 1883
    const isPageHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isUnencryptedWs = brokerUrl.startsWith('ws://') || brokerUrl.startsWith('mqtt://') || (!brokerUrl.startsWith('wss://') && !brokerUrl.startsWith('ssl://'));

    if (isPageHttps && isUnencryptedWs && (brokerUrl.includes('192.168.') || brokerUrl.includes('127.0.0.1') || brokerUrl.includes('localhost') || brokerUrl.includes('10.') || brokerUrl.includes(':1883'))) {
      // 记录友好提示
      addSystemLog('【网络安全提示】当前页面运行在 HTTPS 加密环境下，浏览器安全机制（Mixed Content）会拦截未加密的 WebSocket (ws://) 连接。');
      addSystemLog('💡 注意：您生成的 Flutter / React Native 手机原生 App 使用操作系统底层 TCP Socket，不受此限制，真机运行可直接连通 192.168.1.105:1883！');
    }

    try {
      // 避免 Client ID 冲突（致命问题）：给基础 Client ID 增加随机后缀以保证全局唯一
      const uniqueClientId = `${clientId}_${Math.random().toString(16).substring(2, 6)}`;
      
      const client = mqtt.connect(brokerUrl, {
        clientId: uniqueClientId,
        clean: true,
        connectTimeout: 10000, // 增加超时时间，适应弱网环境
        reconnectPeriod: 3000, // 开启自动重连 (自动恢复)
        keepalive: 45,         // 心跳间隔 (Keep-Alive): 设置在 30-60s 之间，避免“假死”和频繁断连
      });

      clientRef.current = client;

      client.on('connect', () => {
        setIsConnected(true);
        setIsConnecting(false);
        setHttpsDiagnosisNotice(null);
        setConnectionStatusText('已连接到 Broker');

        // Re-subscribe to existing topics
        subscribedTopics.forEach((topic) => {
          client.subscribe(topic, { qos: subQos });
        });

        addSystemLog(`成功连接至 ${brokerUrl} (客户端ID: ${clientId})`);
      });

      client.on('message', (topic, payloadBuffer, packet) => {
        const payloadStr = payloadBuffer.toString();
        const newMsg: MqttMessage = {
          id: Math.random().toString(36).substring(2, 9),
          topic,
          payload: payloadStr,
          qos: (packet.qos as 0 | 1 | 2) || 0,
          retain: packet.retain || false,
          timestamp: new Date().toLocaleTimeString(),
          direction: 'inbound'
        };

        setMessages((prev) => [...prev.slice(-150), newMsg]);

        // Virtual MCU reactive logic (Like MCU UART Command Parser)
        if (topic === 'iot/device/control') {
          try {
            const parsed = JSON.parse(payloadStr);
            if (parsed.relay !== undefined) setRelayState(Boolean(parsed.relay));
            if (parsed.led !== undefined) setLedState(Boolean(parsed.led));
            if (parsed.speed !== undefined) {
              setMcuTelemetry((prev) => ({ ...prev, motorRpm: Number(parsed.speed) }));
            }
          } catch {
            // Non-JSON command
          }
        }
      });

      client.on('error', (err: any) => {
        const errMsg = err?.message || String(err);
        if (errMsg.includes('insecure WebSocket') || errMsg.includes('HTTPS') || errMsg.includes('SecurityError')) {
          setHttpsDiagnosisNotice('HTTPS_MIXED_CONTENT');
          addSystemLog(`浏览器安全拦截: HTTPS 页面禁止发起非加密 WebSocket 连接 (ws://)。此限制仅存在于网页浏览器，手机原生 App 运行无此限制。`);
        } else {
          addSystemLog(`MQTT 错误: ${errMsg}`);
        }
      });

      client.on('close', () => {
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionStatusText('已断开');
      });

      client.on('offline', () => {
        setIsConnected(false);
        setConnectionStatusText('客户端离线 (正在等待重连)');
      });
    } catch (err: any) {
      setIsConnecting(false);
      const errMsg = err?.message || String(err);
      if (errMsg.includes('insecure WebSocket') || errMsg.includes('HTTPS') || errMsg.includes('SecurityError') || errMsg.includes('Failed to construct')) {
        setHttpsDiagnosisNotice('HTTPS_MIXED_CONTENT');
        addSystemLog(`连接拦截 (浏览器安全策略): HTTPS 网页不允许连接非加密的 ws:// 或原生 TCP 端口。`);
        addSystemLog(`📱 提示: 您的手机原生 Flutter/RN App 走的是底层 TCP 1883 套接字，编译后在真机上连接完全正常！`);
      } else {
        addSystemLog(`连接抛出异常: ${errMsg}`);
      }
    }
  };

  const handleDisconnect = () => {
    if (clientRef.current) {
      clientRef.current.end(true);
      clientRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionStatusText('已断开');
    addSystemLog('用户主动断开 MQTT 连接');
  };

  const handleSubscribe = () => {
    const topic = subTopicInput.trim();
    if (!topic) return;

    if (clientRef.current && isConnected) {
      clientRef.current.subscribe(topic, { qos: subQos }, (err) => {
        if (!err) {
          if (!subscribedTopics.includes(topic)) {
            setSubscribedTopics([...subscribedTopics, topic]);
          }
          addSystemLog(`已订阅主题: ${topic} (QoS ${subQos})`);
        } else {
          addSystemLog(`订阅失败: ${err.message}`);
        }
      });
    } else {
      if (!subscribedTopics.includes(topic)) {
        setSubscribedTopics([...subscribedTopics, topic]);
      }
      addSystemLog(`[离线预设] 已记录订阅主题: ${topic}`);
    }
  };

  const handleUnsubscribe = (topic: string) => {
    if (clientRef.current && isConnected) {
      clientRef.current.unsubscribe(topic, () => {
        setSubscribedTopics(subscribedTopics.filter((t) => t !== topic));
        addSystemLog(`已取消订阅主题: ${topic}`);
      });
    } else {
      setSubscribedTopics(subscribedTopics.filter((t) => t !== topic));
    }
  };

  const handlePublish = () => {
    const topic = pubTopic.trim();
    const payload = pubPayload.trim();
    if (!topic || !payload) return;

    if (clientRef.current && isConnected) {
      clientRef.current.publish(
        topic,
        payload,
        { qos: pubQos, retain: pubRetain },
        (err) => {
          if (!err) {
            const newMsg: MqttMessage = {
              id: Math.random().toString(36).substring(2, 9),
              topic,
              payload,
              qos: pubQos,
              retain: pubRetain,
              timestamp: new Date().toLocaleTimeString(),
              direction: 'outbound'
            };
            setMessages((prev) => [...prev.slice(-150), newMsg]);
          } else {
            addSystemLog(`发布失败: ${err.message}`);
          }
        }
      );
    } else {
      addSystemLog('请先连接 MQTT Broker 再执行发布操作');
    }
  };

  const addSystemLog = (text: string) => {
    const newMsg: MqttMessage = {
      id: Math.random().toString(36).substring(2, 9),
      topic: 'SYSTEM',
      payload: text,
      qos: 0,
      retain: false,
      timestamp: new Date().toLocaleTimeString(),
      direction: 'inbound'
    };
    setMessages((prev) => [...prev.slice(-150), newMsg]);
  };

  const toHex = (str: string) => {
    return Array.from(str)
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
  };

  const filteredMessages = messages.filter((m) =>
    filterTopic ? m.topic.toLowerCase().includes(filterTopic.toLowerCase()) || m.payload.toLowerCase().includes(filterTopic.toLowerCase()) : true
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Overview Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Wifi className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-100">
                移动端 MQTT 真机/虚拟电控联调台
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Live Testbench
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-3xl">
              直接在浏览器中发起真实的 MQTT WSS/TCP 通信（支持公共 EMQX / HiveMQ Broker 或局域网 MQTT），并配有内置的虚拟 ESP32 电控节点，让你无需硬件即可体验手机端数据收发与状态闭环。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            {/* Quick Preset Selectors */}
            <button
              onClick={() => {
                setBrokerUrl('ws://192.168.1.105:8083');
                setClientId('MyMobilePhone');
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 font-medium transition flex items-center space-x-1"
              title="一键切换为 Capacitor 跨平台专用的 WebSocket 端口 (8083)"
            >
              <Smartphone className="w-3 h-3 text-cyan-400" />
              <span>Capacitor 专用 (ws://...:8083)</span>
            </button>
            <button
              onClick={() => {
                setBrokerUrl('mqtt://192.168.1.105:1883');
                setClientId('MyMobilePhone');
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-medium transition flex items-center space-x-1"
              title="原生 TCP 协议 (注意：只能在打包后的原生应用，或者没有 HTTPS 限制的底层运行，浏览器会拦截)"
            >
              <Layers className="w-3 h-3 text-emerald-400" />
              <span>原生 TCP (1883)</span>
            </button>
            <button
              onClick={() => setBrokerUrl('wss://broker.emqx.io:8084/mqtt')}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              EMQX 公共
            </button>
          </div>
        </div>
      </div>

      {/* Main Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Connection & Virtual Hardware Node (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Connection Config */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  1. Broker 连接参数
                </h3>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : isConnecting
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {connectionStatusText}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-300">
                <span className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span>推荐配置: <strong className="font-mono text-cyan-200">ws://192.168.1.105:8083</strong></span>
                </span>
                <span className="font-mono text-slate-400">ClientID: <strong className="text-cyan-200">MyMobilePhone_*</strong></span>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Broker URL:
                </label>
                <input
                  type="text"
                  value={brokerUrl}
                  disabled={isConnected || isConnecting}
                  onChange={(e) => setBrokerUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                  placeholder="ws://192.168.1.105:8083"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Capacitor 跨平台开发务必使用 <code className="text-cyan-400">ws://...:8083</code> WebSocket 端口。
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-slate-400">Client ID (已固定为 MyMobilePhone):</label>
                  <button
                    onClick={() => setClientId('MyMobilePhone')}
                    disabled={isConnected}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center space-x-1 disabled:opacity-50"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>恢复 MyMobilePhone</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={clientId}
                  disabled={isConnected || isConnecting}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                />
              </div>

              <div className="pt-2">
                <button
                  id="mqtt-connect-btn"
                  onClick={isConnected ? handleDisconnect : handleConnect}
                  disabled={isConnecting}
                  className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center space-x-2 transition shadow-lg cursor-pointer ${
                    isConnected
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/30'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-900/30'
                  }`}
                >
                  {isConnected ? (
                    <>
                      <WifiOff className="w-4 h-4" />
                      <span>断开 MQTT 连接</span>
                    </>
                  ) : isConnecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>正在连接...</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-4 h-4" />
                      <span>立即连接 Broker</span>
                    </>
                  )}
                </button>
              </div>

              {/* HTTPS vs Native Socket 深度原理解析卡片 */}
              {httpsDiagnosisNotice && (
                <div className="mt-3 p-3.5 bg-amber-950/40 border border-amber-500/50 rounded-xl space-y-2.5 animate-fadeIn">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>为什么网页端提示连接异常？(核心原因)</span>
                    </div>
                    <button
                      onClick={() => setHttpsDiagnosisNotice(null)}
                      className="text-slate-400 hover:text-slate-200 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-300 space-y-2 leading-relaxed">
                    <div className="p-2 rounded bg-black/40 border border-amber-500/20 text-amber-200">
                      <strong>🔴 网页浏览器安全限制：</strong>
                      当前控制台运行在 <code>HTTPS</code> 加密网页中，浏览器安全机制禁止网页向局域网发起未加密的 <code>ws://</code> 或直接调用底层 TCP 1883 物理端口。
                    </div>

                    <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                      <strong>🟢 手机真机 App (Flutter / React Native) 完全正常：</strong>
                      手机 App 编译后是独立的 Android/iOS 原生程序，调用的是<strong>操作系统底层 TCP Socket</strong>，<strong>不受任何浏览器 HTTPS 限制</strong>！只要手机与 Broker (192.168.1.105) 在同一个 Wi-Fi，即可直接连通。
                    </div>
                  </div>

                  <div className="pt-1 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => {
                        setBrokerUrl('wss://broker.emqx.io:8084/mqtt');
                        setHttpsDiagnosisNotice(null);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition flex items-center justify-center space-x-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>一键切换至公网 WSS 体验网页收发</span>
                    </button>
                    <button
                      onClick={() => {
                        setBrokerUrl('mqtt://192.168.1.105:1883');
                        setClientId('MyMobilePhone');
                        setHttpsDiagnosisNotice(null);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center justify-center"
                    >
                      <span>保留 192.168.1.105 (用于手机真机)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Virtual Hardware MCU (ESP32/STM32) Node */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  虚拟 ESP32 电控硬件节点
                </h3>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <span className="text-xs text-slate-400 font-mono">节点模拟器</span>
                <input
                  type="checkbox"
                  checked={mcuSimEnabled}
                  onChange={(e) => setMcuSimEnabled(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500/30 bg-slate-950"
                />
              </label>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              模拟单片机 (如 STM32/ESP32) 在 <code className="text-emerald-300 font-mono">iot/device/telemetry</code> 主题周期上报电参数，并在 <code className="text-amber-300 font-mono">iot/device/control</code> 接收手机指令。
            </p>

            {/* MCU Dashboard Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-center">
                <div className="text-[10px] text-slate-500 font-mono">供电电压 VCC</div>
                <div className="text-base font-bold font-mono text-cyan-300">{mcuTelemetry.voltage}V</div>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-center">
                <div className="text-[10px] text-slate-500 font-mono">工作电流 I</div>
                <div className="text-base font-bold font-mono text-emerald-300">{mcuTelemetry.current}A</div>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-center">
                <div className="text-[10px] text-slate-500 font-mono">MCU 温度</div>
                <div className="text-base font-bold font-mono text-amber-300">{mcuTelemetry.temperature}°C</div>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-center">
                <div className="text-[10px] text-slate-500 font-mono">PWM 电机转速</div>
                <div className="text-base font-bold font-mono text-purple-300">{mcuTelemetry.motorRpm} RPM</div>
              </div>
            </div>

            {/* Interactive Hardware IO Pins */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-3">
              <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
                <span>GPIO 输出引脚状态 (硬件执行机构):</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${relayState ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  {mcuTelemetry.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRelayState(!relayState)}
                  className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                    relayState
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <span>继电器 (Relay)</span>
                  <span className={`w-3 h-3 rounded-full ${relayState ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
                </button>

                <button
                  onClick={() => setLedState(!ledState)}
                  className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                    ledState
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <span>LED 状态指示灯</span>
                  <span className={`w-3 h-3 rounded-full ${ledState ? 'bg-amber-400 shadow-sm shadow-amber-400 animate-pulse' : 'bg-slate-700'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pub / Sub Operations & Live Logs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 3: Subscribe & Publish Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            {/* Topic Subscription Section */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  2. 订阅主题 (Subscribe)
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={subTopicInput}
                  onChange={(e) => setSubTopicInput(e.target.value)}
                  placeholder="例如: iot/device/telemetry"
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <div className="flex items-center space-x-2">
                  <select
                    value={subQos}
                    onChange={(e) => setSubQos(Number(e.target.value) as 0 | 1 | 2)}
                    className="px-2 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none"
                  >
                    <option value={0}>QoS 0 (最多一次)</option>
                    <option value={1}>QoS 1 (至少一次)</option>
                    <option value={2}>QoS 2 (恰好一次)</option>
                  </select>
                  <button
                    onClick={handleSubscribe}
                    className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>订阅</span>
                  </button>
                </div>
              </div>

              {/* Subscribed Topic Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {subscribedTopics.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-700/40 text-cyan-300 text-xs font-mono"
                  >
                    <span>{t}</span>
                    <button
                      onClick={() => handleUnsubscribe(t)}
                      className="hover:text-rose-400 transition"
                      title="取消订阅"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
              {/* Message Publish Section */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    3. 发布控制指令 (Publish)
                  </h3>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] text-slate-500">电控预设:</span>
                  <button
                    onClick={() => setPubPayload('{"relay": 1, "led": 1, "speed": 2200}')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
                  >
                    开电机
                  </button>
                  <button
                    onClick={() => setPubPayload('{"relay": 0, "led": 0, "speed": 0}')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
                  >
                    关停
                  </button>
                  <button
                    onClick={() => setPubPayload('{"cmd": "GET_STATUS", "ts": ' + Date.now() + '}')}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
                  >
                    查询状态
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={pubTopic}
                      onChange={(e) => setPubTopic(e.target.value)}
                      placeholder="发布目标主题 (例如: iot/device/control)"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={pubQos}
                      onChange={(e) => setPubQos(Number(e.target.value) as 0 | 1 | 2)}
                      className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 focus:outline-none"
                    >
                      <option value={0}>QoS 0</option>
                      <option value={1}>QoS 1</option>
                      <option value={2}>QoS 2</option>
                    </select>
                    <label className="flex items-center space-x-1 text-xs text-slate-400 font-mono whitespace-nowrap cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pubRetain}
                        onChange={(e) => setPubRetain(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 bg-slate-950"
                      />
                      <span>Retain</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={pubPayload}
                    onChange={(e) => setPubPayload(e.target.value)}
                    placeholder='JSON 指令载荷, 如 {"relay": 1}'
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                  <button
                    onClick={handlePublish}
                    className="px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex flex-col items-center justify-center space-y-1 transition cursor-pointer shadow-lg shadow-emerald-950/40"
                  >
                    <Send className="w-4 h-4" />
                    <span>发布</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Terminal Data Stream (Logs & Telemetry Packets) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-[380px]">
            {/* Terminal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-2">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-mono text-slate-300">
                  通信数据监控窗口 (RX/TX Packet Stream)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 font-mono">
                  {filteredMessages.length} 条报文
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {/* View Format Toggle */}
                <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px] font-mono">
                  <button
                    onClick={() => setViewMode('formatted')}
                    className={`px-2 py-0.5 rounded ${viewMode === 'formatted' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
                  >
                    格式化
                  </button>
                  <button
                    onClick={() => setViewMode('hex')}
                    className={`px-2 py-0.5 rounded ${viewMode === 'hex' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
                  >
                    HEX
                  </button>
                </div>

                <button
                  onClick={() => setMessages([])}
                  className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded transition"
                  title="清空日志"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="mb-2">
              <input
                type="text"
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
                placeholder="🔍 按主题或载荷过滤日志..."
                className="w-full px-2.5 py-1 bg-slate-900/60 border border-slate-800/80 rounded text-[11px] font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Scrollable Packet Log List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-xs pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {filteredMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                  <Activity className="w-8 h-8 opacity-40 animate-pulse" />
                  <p className="text-xs">暂无 MQTT 报文数据流</p>
                  <p className="text-[11px] text-slate-600">
                    点击上方“立即连接 Broker”并订阅主题以开始接收数据
                  </p>
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isRx = msg.direction === 'inbound';
                  const isSys = msg.topic === 'SYSTEM';

                  return (
                    <div
                      key={msg.id}
                      className={`p-2 rounded-lg border text-[11px] transition ${
                        isSys
                          ? 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                          : isRx
                          ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-200'
                          : 'bg-cyan-950/20 border-cyan-900/30 text-cyan-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 opacity-80">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-500 text-[10px]">{msg.timestamp}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              isSys
                                ? 'bg-slate-800 text-slate-300'
                                : isRx
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            }`}
                          >
                            {isSys ? 'SYS' : isRx ? 'RX 接收' : 'TX 发送'}
                          </span>
                          <span className="text-slate-400 font-semibold">{msg.topic}</span>
                        </div>
                        {!isSys && (
                          <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                            <span>QoS {msg.qos}</span>
                            {msg.retain && <span className="text-amber-400 font-bold">[Retain]</span>}
                          </div>
                        )}
                      </div>

                      <div className="pl-1 break-all select-all font-mono">
                        {viewMode === 'hex' ? (
                          <span className="text-amber-300/90">{toHex(msg.payload)}</span>
                        ) : (
                          <span>{msg.payload}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
