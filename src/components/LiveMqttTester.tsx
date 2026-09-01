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
  X,
  PlusCircle,
  User,
  Snowflake,
  Fan,
  Lightbulb, Thermometer, Sun, Wind, Radar, DoorClosed, Droplets, Flame, ToggleRight, 
  AlignJustify, Lock, Cctv, Bell, Bot, Monitor, Speaker, Plug, Zap, Music, Tv, Box, CircleDot, Cpu
} from 'lucide-react';
import { MqttMessage, TelemetryData } from '../types';

interface LiveMqttTesterProps {
  onConnectionChange: (connected: boolean) => void;
}

export const LiveMqttTester: React.FC<LiveMqttTesterProps> = ({ onConnectionChange }) => {
  type ViewState = 'home' | 'broker' | 'config' | 'logs';
  const [activeView, setActiveView] = useState<ViewState>('home');

    const renderDeviceIcon = (type: string) => {
    switch(type) {
      case 'ac': return (
        <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9">
          <rect x="2" y="8" width="20" height="7" rx="1.5" fill="#E2E8F0" />
          <rect x="2" y="14" width="20" height="1" fill="#475569" />
          <circle cx="18" cy="11.5" r="0.8" fill="#1E293B" />
        </svg>
      );
      case 'fan': return (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
          <circle cx="12" cy="12" r="10" stroke="#E2E8F0" strokeWidth="2" fill="#F8FAFC" />
          <path d="M12 12C12 8 10 6 12 4C14 6 12 8 12 12Z" fill="#CBD5E1" />
          <path d="M12 12C16 12 18 10 20 12C18 14 16 12 12 12Z" fill="#CBD5E1" />
          <path d="M12 12C12 16 14 18 12 20C10 18 12 16 12 12Z" fill="#CBD5E1" />
          <path d="M12 12C8 12 6 14 4 12C6 10 8 12 12 12Z" fill="#CBD5E1" />
          <circle cx="12" cy="12" r="2" fill="#94A3B8" />
        </svg>
      );
      case 'light': return <Lightbulb className="w-8 h-8 text-amber-400 stroke-[1.5]" />;
      case 'temp_hum': return <Thermometer className="w-8 h-8 text-rose-400 stroke-[1.5]" />;
      case 'illuminance': return <Sun className="w-8 h-8 text-orange-400 stroke-[1.5]" />;
      case 'air_quality': return <Wind className="w-8 h-8 text-teal-400 stroke-[1.5]" />;
      case 'presence': return <Radar className="w-8 h-8 text-indigo-400 stroke-[1.5]" />;
      case 'door_sensor': return <DoorClosed className="w-8 h-8 text-orange-700 stroke-[1.5]" />;
      case 'water_leak': return <Droplets className="w-8 h-8 text-blue-400 stroke-[1.5]" />;
      case 'smoke_gas': return <Flame className="w-8 h-8 text-red-500 stroke-[1.5]" />;
      case 'switch': return <ToggleRight className="w-8 h-8 text-emerald-400 stroke-[1.5]" />;
      case 'light_strip': return <Sparkles className="w-8 h-8 text-fuchsia-400 stroke-[1.5]" />;
      case 'curtain': return <AlignJustify className="w-8 h-8 text-gray-400 stroke-[1.5]" />;
      case 'lock': return <Lock className="w-8 h-8 text-slate-600 stroke-[1.5]" />;
      case 'camera': return <Cctv className="w-8 h-8 text-gray-700 stroke-[1.5]" />;
      case 'doorbell': return <Bell className="w-8 h-8 text-yellow-500 stroke-[1.5]" />;
      case 'robot_vacuum': return <Bot className="w-8 h-8 text-slate-500 stroke-[1.5]" />;
      case 'fresh_air': return <Wind className="w-8 h-8 text-sky-400 stroke-[1.5]" />;
      case 'purifier': return <Droplets className="w-8 h-8 text-cyan-400 stroke-[1.5]" />;
      case 'panel': return <Monitor className="w-8 h-8 text-gray-800 stroke-[1.5]" />;
      case 'speaker': return <Speaker className="w-8 h-8 text-gray-800 stroke-[1.5]" />;
      case 'plug': return <Plug className="w-8 h-8 text-emerald-500 stroke-[1.5]" />;
      case 'breaker': return <Zap className="w-8 h-8 text-yellow-500 stroke-[1.5]" />;
      case 'audio': return <Music className="w-8 h-8 text-violet-500 stroke-[1.5]" />;
      case 'tv_projector': return <Tv className="w-8 h-8 text-slate-800 stroke-[1.5]" />;
      case 'fridge': return <Box className="w-8 h-8 text-gray-300 stroke-[1.5]" />;
      case 'washer_heater': return <CircleDot className="w-8 h-8 text-blue-300 stroke-[1.5]" />;
      default: return <Cpu className="w-8 h-8 text-gray-400 stroke-[1.5]" />;
    }
  };

const [devices, setDevices] = useState<{id: number, name: string, type: string}[]>([]);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState('ac');
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

  // Removed Auto scroll logs to prevent unwanted jumping
  // useEffect(() => {
  //   logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);

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
      let finalBrokerUrl = brokerUrl.trim();

      // 协议自动纠错：拦截浏览器/WebView中使用 mqtt:// 或 tcp:// 并访问 1883 端口的行为
      // 因为浏览器环境下的 mqtt.js 实际上发出的是 WebSocket 握手请求，打在 1883 纯 TCP 端口上会导致 "First packet not CONNECT" 协议报错
      if ((finalBrokerUrl.startsWith('mqtt://') || finalBrokerUrl.startsWith('tcp://')) && finalBrokerUrl.includes(':1883')) {
        const correctedUrl = finalBrokerUrl.replace('mqtt://', 'ws://').replace('tcp://', 'ws://').replace(':1883', ':8083');
        addSystemLog(`⚠️ 【协议拦截】检测到您尝试在 Web/Capacitor 环境中使用原生 TCP 协议连接 1883 端口。`);
        addSystemLog(`💡 【自动纠错】浏览器内核不支持直接发起原生 TCP 连接，已自动为您转换为 WebSocket 协议连接: ${correctedUrl}`);
        finalBrokerUrl = correctedUrl;
        setBrokerUrl(correctedUrl);
      }

      const client = mqtt.connect(finalBrokerUrl, {
        clientId: clientId,
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
    <div className="min-h-screen bg-[#F7F7F9] text-gray-900 pb-12 relative overflow-hidden font-sans">
      {/* --- Home View (Device Grid) --- */}
      <div className={`transition-opacity duration-300 ${activeView === 'home' ? 'opacity-100 relative z-10' : 'opacity-0 pointer-events-none absolute inset-0'}`}>
        {/* Header */}
        <div className="pt-16 px-6 pb-2">
          <div className="flex justify-end items-center space-x-6">
            <button onClick={() => setActiveView('config')} className="text-gray-800 hover:text-black transition">
              <PlusCircle className="w-6 h-6 stroke-[1.5]" />
            </button>
            <button onClick={() => setActiveView('broker')} className="text-gray-800 hover:text-black transition">
              <User className="w-6 h-6 stroke-[1.5]" />
            </button>
          </div>
          
          <div className="mt-10">
            <h1 className="text-4xl font-normal tracking-tight text-black">JHH_IOT</h1>
            <p className="text-[13px] font-medium text-gray-400 mt-3">智能家居</p>
          </div>
        </div>

        {/* Device Grid / Empty State */}
        {devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-32 px-6 text-center">
            <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mb-5 border border-gray-50">
              <PlusCircle className="w-8 h-8 text-gray-300 stroke-[1.5]" />
            </div>
            <h2 className="text-[17px] font-bold text-black mb-2">暂无设备</h2>
            <p className="text-[13px] text-gray-400 font-medium max-w-[200px] leading-relaxed">
              点击右上角的 "+" 按钮<br/>开始添加你的智能设备
            </p>
          </div>
        ) : (
          <div className="px-6 mt-6 grid grid-cols-2 gap-4">
            {devices.map(device => (
            <div 
              key={device.id}
              className="bg-white rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] aspect-[4/3] flex flex-col justify-between items-start"
            >
              <div className="w-10 h-10 flex items-center justify-center text-gray-700">
                {renderDeviceIcon(device.type)}
              </div>
              <div className="mt-auto">
                <h3 className="text-[14px] font-medium text-black leading-tight">
                  {device.name}
                </h3>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* --- Modals for Other Views (Redesigned to Light Theme) --- */}
      {/* Broker View Modal */}
      <div className={`fixed inset-0 z-50 bg-white text-gray-900 transition-transform duration-500 ${activeView === 'broker' ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex flex-col h-full bg-[#F7F7F9]">
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-black">Broker 连接参数</h2>
            <button onClick={() => setActiveView('home')} className="p-2 bg-gray-50 rounded-full text-gray-500 hover:text-black">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-6">
            
            <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 text-[11px] text-blue-600">
                <span className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  <span>推荐配置: <strong className="font-mono text-blue-700">ws://192.168.1.105:8083</strong></span>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-1">
                  Broker URL:
                </label>
                <input
                  type="text"
                  value={brokerUrl}
                  disabled={isConnected || isConnecting}
                  onChange={(e) => setBrokerUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-2xl text-[13px] font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  placeholder="ws://192.168.1.105:8083"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label className="text-xs font-semibold text-gray-500">
                    Client ID:
                  </label>
                  <button
                    onClick={() => setClientId('MyMobilePhone')}
                    className="text-[10px] text-blue-500 hover:text-blue-700 flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>恢复</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={clientId}
                  disabled={isConnected || isConnecting}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-2xl text-[13px] font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={isConnected ? handleDisconnect : handleConnect}
                  disabled={isConnecting}
                  className={`w-full py-3.5 rounded-full font-bold text-sm transition-all shadow-md flex items-center justify-center space-x-2 ${
                    isConnected
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                      : isConnecting
                      ? 'bg-blue-300 text-white cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800 shadow-black/10'
                  }`}
                >
                  {isConnected ? (
                    <>
                      <WifiOff className="w-4 h-4" />
                      <span>断开连接</span>
                    </>
                  ) : isConnecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>连接中...</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-4 h-4" />
                      <span>连接 Broker</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Config View Modal (Publish & Subscribe) */}
      <div className={`fixed inset-0 z-50 bg-white text-gray-900 transition-transform duration-500 ${activeView === 'config' ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex flex-col h-full bg-[#F7F7F9]">
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-black">添加设备 / 测试控制</h2>
            <button onClick={() => setActiveView('home')} className="p-2 bg-gray-50 rounded-full text-gray-500 hover:text-black">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-6">
            
            {/* Add Device Section */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
              <h4 className="text-[13px] font-bold text-gray-800 flex items-center space-x-1">
                <PlusCircle className="w-4 h-4 text-blue-500" />
                <span>添加新设备</span>
              </h4>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={newDeviceName}
                  onChange={e => setNewDeviceName(e.target.value)}
                  placeholder="设备名称 (如: 客厅空调)"
                  className="flex-1 px-4 py-3 bg-gray-50 border-transparent rounded-2xl text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select 
                  value={newDeviceType} 
                  onChange={e => setNewDeviceType(e.target.value)}
                  className="w-[140px] px-3 bg-gray-50 border-transparent rounded-2xl text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ac">空调</option>
                  <option value="fan">风扇</option>
                  <option value="light">智能照明</option>
                  <option value="temp_hum">温湿度计</option>
                  <option value="illuminance">光照亮度传感器</option>
                  <option value="air_quality">空气质量</option>
                  <option value="presence">人体存在传感器</option>
                  <option value="door_sensor">门窗磁传感器</option>
                  <option value="water_leak">水浸传感器</option>
                  <option value="smoke_gas">烟雾/可燃气体</option>
                  <option value="switch">智能墙壁开关</option>
                  <option value="light_strip">智能灯带</option>
                  <option value="curtain">智能窗帘电机</option>
                  <option value="lock">智能门锁</option>
                  <option value="camera">云台监控摄像头</option>
                  <option value="doorbell">可视猫眼门铃</option>
                  <option value="robot_vacuum">扫地/拖地机器人</option>
                  <option value="fresh_air">智能新风机</option>
                  <option value="purifier">加湿/空气净化器</option>
                  <option value="panel">智能中控屏</option>
                  <option value="speaker">智能音箱</option>
                  <option value="plug">智能插座</option>
                  <option value="breaker">智能断路器</option>
                  <option value="audio">全屋背景音乐</option>
                  <option value="tv_projector">智能电视/投影仪</option>
                  <option value="fridge">智能冰箱</option>
                  <option value="washer_heater">洗衣机/热水器</option>
                </select>
              </div>
              <button 
                onClick={() => {
                  if (!newDeviceName.trim()) return;
                  setDevices(prev => [...prev, { id: Date.now(), name: newDeviceName, type: newDeviceType }]);
                  setNewDeviceName('');
                  setActiveView('home');
                }}
                className="w-full py-3.5 bg-black text-white rounded-full text-sm font-bold transition shadow-md shadow-black/10"
              >
                保存并添加设备
              </button>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-bold text-gray-800 flex items-center space-x-1">
                    <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                    <span>订阅主题</span>
                  </h4>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={subTopicInput}
                    onChange={(e) => setSubTopicInput(e.target.value)}
                    placeholder="例如: iot/device/telemetry"
                    className="flex-1 px-4 py-3 bg-gray-50 border-transparent rounded-2xl text-[13px] font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleSubscribe}
                    disabled={!isConnected}
                    className="px-5 py-3 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-bold transition disabled:opacity-50"
                  >
                    订阅
                  </button>
                </div>
                {subscribedTopics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {subscribedTopics.map((t) => (
                      <span key={t} className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-50 text-[11px] text-emerald-700 font-mono">
                        {t}
                        <button onClick={() => handleUnsubscribe(t)} className="ml-1.5 hover:text-emerald-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-100 w-full" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-bold text-gray-800 flex items-center space-x-1">
                    <ArrowUpRight className="w-4 h-4 text-blue-500" />
                    <span>发布控制指令</span>
                  </h4>
                  <button 
                    onClick={() => setActiveView('logs')}
                    className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full flex items-center space-x-1"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>查看日志</span>
                  </button>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={pubTopic}
                    onChange={(e) => setPubTopic(e.target.value)}
                    placeholder="目标主题"
                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-2xl text-[13px] font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button
                    onClick={() => {
                      const payload = JSON.stringify({ cmd: "LED_ON", relay: 1, speed: 1500 });
                      if (clientRef.current?.connected) {
                        clientRef.current.publish(pubTopic, payload, { qos: pubQos, retain: pubRetain });
                        addSystemLog(`📤 [手动发送] ${pubTopic} -> ${payload}`);
                      }
                    }}
                    disabled={!isConnected}
                    className="py-3 bg-blue-50 text-blue-700 rounded-2xl text-xs font-bold transition flex justify-center disabled:opacity-50"
                  >
                    发送 ON
                  </button>
                  <button
                    onClick={() => {
                      const payload = JSON.stringify({ cmd: "LED_OFF", relay: 0, speed: 0 });
                      if (clientRef.current?.connected) {
                        clientRef.current.publish(pubTopic, payload, { qos: pubQos, retain: pubRetain });
                        addSystemLog(`📤 [手动发送] ${pubTopic} -> ${payload}`);
                      }
                    }}
                    disabled={!isConnected}
                    className="py-3 bg-gray-100 text-gray-700 rounded-2xl text-xs font-bold transition flex justify-center disabled:opacity-50"
                  >
                    发送 OFF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logs View Modal */}
      <div className={`fixed inset-0 z-50 bg-white text-gray-900 transition-transform duration-500 ${activeView === 'logs' ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex flex-col h-full bg-[#F7F7F9]">
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-black">通信日志</h2>
            <button onClick={() => setActiveView('config')} className="p-2 bg-gray-50 rounded-full text-gray-500 hover:text-black">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            <div className="bg-white rounded-3xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    <span className="text-gray-900 font-bold">{messages.length}</span> 条报文
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setMessages([])}
                    className="p-1.5 text-gray-400 hover:text-rose-500 bg-gray-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[11px]">
                {filteredMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                    <Activity className="w-8 h-8 opacity-40 animate-pulse" />
                    <p className="text-xs">暂无日志</p>
                  </div>
                ) : (
                  filteredMessages.map((msg) => {
                    const isRx = msg.direction === 'inbound';
                    const isSys = msg.topic === 'SYSTEM';

                    return (
                      <div key={msg.id} className={`p-3 rounded-xl border ${
                        isSys ? 'bg-gray-50 border-gray-100 text-gray-500' : 
                        isRx ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 
                        'bg-blue-50 border-blue-100 text-blue-800'
                      }`}>
                        <div className="flex justify-between mb-1 opacity-70 text-[10px]">
                          <span>{msg.timestamp}</span>
                          <span className="font-bold">{isSys ? 'SYS' : isRx ? 'RX' : 'TX'} - {msg.topic}</span>
                        </div>
                        <div className="break-all">{msg.payload}</div>
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
    </div>
  );
};
