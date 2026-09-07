import React, { useState } from 'react';
import { 
  ArrowLeft, Power, Settings, MoreVertical, Plus, Minus,
  Sun, Moon, Volume2, Maximize, Play, Pause, SkipForward, SkipBack,
  Thermometer, Droplets, Fan, Wind, Lock, Cctv, Bell,
  Battery, Clock, Flame, AlignJustify, Radar, Activity,
  Tv, Navigation, ArrowUp, ArrowDown, ArrowRight, Zap, Lightbulb,
  Trash2, AlertCircle, Loader2, CheckCircle2
} from 'lucide-react';
import { MqttMessage } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

// UI Components
const Card = ({ children, className = '', onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div onClick={onClick} className={`bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 ${className}`}>
    {children}
  </div>
);

const Pill = ({ active, onClick, icon: Icon, label, colorClass, defaultClass = 'bg-gray-50 text-gray-700' }: any) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-3 px-2 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 active:scale-95 ${active ? colorClass + ' shadow-md' : defaultClass}`}
  >
    {Icon && <Icon className="w-5 h-5 mb-1.5" />}
    <span className="text-[11px] font-bold tracking-wide">{label}</span>
  </button>
);

const SegmentedControl = ({ options, active, onChange }: any) => (
  <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full">
    {options.map((opt: string) => (
      <button 
        key={opt}
        onClick={() => onChange(opt)}
        className={`flex-1 py-2 text-[13px] font-bold rounded-xl transition-all ${active === opt ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
      >
        {opt}
      </button>
    ))}
  </div>
);

const Dial = ({ value, unit, label, color = 'text-gray-900' }: any) => (
  <div className="flex flex-col items-center">
    <div className="relative w-48 h-48 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="none" stroke="#f3f4f6" strokeWidth="4" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={`${Number(value)===value ? (Number(value)/100)*289 : 200} 289`} className={color} strokeLinecap="round" />
      </svg>
      <div className="text-center">
        <div className={`text-5xl font-light tracking-tighter ${color}`}>{value}</div>
        {unit && <div className="text-sm font-bold text-gray-400 mt-1">{unit}</div>}
      </div>
    </div>
    <div className="mt-4 text-xs font-bold text-gray-400 tracking-widest uppercase">{label}</div>
  </div>
);

const TrendChart = ({ color, fill }: { color: string, fill: string }) => (
  <div className="h-16 w-full mt-2 relative">
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
      <path d="M0,40 L0,25 Q10,15 20,28 T40,20 T60,10 T80,22 T100,5 L100,40 Z" fill={fill} />
      <path d="M0,25 Q10,15 20,28 T40,20 T60,10 T80,22 T100,5" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

export const DeviceControlPanel = ({ device, deviceType, onBack, onCommand, onDelete }: { device?: any, deviceType?: string, onBack: () => void, onCommand?: (topic: string, payload: any) => void, onDelete?: (deviceId: number) => Promise<void> }) => {
  const [uiState, setUiState] = useLocalStorage<Record<string, any>>(`iot_device_ui_${device?.id || 'default'}`, {});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const getState = (key: string, defaultVal: any) => uiState[key] !== undefined ? uiState[key] : defaultVal;
  
  const updateState = (key: string, value: any) => {
    setUiState(prev => ({ ...prev, [key]: value }));
  };

  const sendCommand = (topic: string, payload: any) => {
    console.log(`[MQTT Publish] Topic: ${topic}`, payload);
    if (onCommand) {
      onCommand(topic, payload);
    }
  };

  const Header = () => (
    <div className="sticky top-0 z-10 bg-[#F8FAFC]/80 backdrop-blur-xl px-6 pt-12 pb-4 flex justify-between items-center border-b border-gray-100/50">
      <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-800 shadow-sm border border-gray-100 active:scale-95 transition-transform">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="text-center">
        <h2 className="text-[17px] font-extrabold text-gray-900 tracking-tight">{device?.name || '设备控制'}</h2>
        <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mt-1 inline-block">{device?.room || '未知房间'}</span>
      </div>
      <div className="flex space-x-2">
        {onDelete && device?.id && (
          <button 
            onClick={() => setShowDeleteModal(true)} 
            className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-500 shadow-sm border border-red-100 active:scale-95 transition-transform"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
        <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-800 shadow-sm border border-gray-100 active:scale-95 transition-transform">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    const typeToRender = deviceType || device?.type;
    switch(typeToRender) {
      case 'light': {
        const topic = 'iot/device/control/smart_lighting';
        const power = getState('light_power', true);
        const brightness = getState('light_brightness', 75);
        const scene = getState('light_scene', '阅读');

        return (
          <div className={`space-y-6 transition-all duration-300 ${!power ? 'opacity-60 flex-none' : ''}`}>
            <Card className="py-10">
              <Dial value={brightness} unit="%" label={power ? "当前亮度" : "已关闭"} color="text-yellow-500" />
              <div className={`mt-8 px-4 flex items-center space-x-4 ${!power ? 'pointer-events-none' : ''}`}>
                <Sun className="w-5 h-5 text-yellow-500/50" />
                <input 
                  type="range" min="0" max="100" value={brightness} 
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateState('light_brightness', val);
                  }}
                  onMouseUp={(e) => {
                    sendCommand(topic, { state: 'ON', brightness: Number((e.target as any).value) });
                  }}
                  onTouchEnd={(e) => {
                    sendCommand(topic, { state: 'ON', brightness: Number((e.target as any).value) });
                  }}
                  className="flex-1 h-2 bg-gray-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md active:[&::-webkit-slider-thumb]:scale-110 transition-transform"
                />
                <Sun className="w-6 h-6 text-yellow-500" />
              </div>
            </Card>
            
            <div className={`flex space-x-3 ${!power ? 'pointer-events-none' : ''}`}>
              <Pill active={scene==='阅读'} onClick={()=>{updateState('light_scene', '阅读'); sendCommand(topic, { state: 'ON', scene: 'reading' });}} label="阅读模式" defaultClass="bg-orange-50 text-orange-700" colorClass="bg-orange-500 text-white" />
              <Pill active={scene==='电影'} onClick={()=>{updateState('light_scene', '电影'); sendCommand(topic, { state: 'ON', scene: 'movie' });}} label="电影模式" defaultClass="bg-indigo-50 text-indigo-700" colorClass="bg-indigo-500 text-white" />
              <Pill active={scene==='夜间'} onClick={()=>{updateState('light_scene', '夜间'); sendCommand(topic, { state: 'ON', scene: 'night' });}} label="夜间模式" defaultClass="bg-blue-50 text-blue-700" colorClass="bg-blue-500 text-white" />
            </div>

            <button onClick={() => {
              const newState = !power;
              updateState('light_power', newState);
              sendCommand(topic, { state: newState ? 'ON' : 'OFF' });
            }} className={`w-full py-4 rounded-3xl font-bold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center ${power ? 'bg-yellow-400 text-yellow-900 shadow-xl shadow-yellow-400/20' : 'bg-gray-200 text-gray-600'}`}>
              <Power className="w-5 h-5 mr-2" /> {power ? '关闭灯光' : '开启灯光'}
            </button>
          </div>
        );
      }
      
      case 'temp_hum': {
        const topic = 'iot/device/control/temp_humidity_sensor';
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-col items-center py-8">
                <div className="w-24 h-24 rounded-full border-4 border-orange-100 flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-orange-500">24.5<span className="text-xs">°C</span></span>
                </div>
                <span className="text-xs font-bold text-gray-400">室内温度</span>
              </Card>
              <Card className="flex flex-col items-center py-8">
                <div className="w-24 h-24 rounded-full border-4 border-blue-100 flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-blue-500">45<span className="text-xs">%</span></span>
                </div>
                <span className="text-xs font-bold text-gray-400">室内湿度</span>
              </Card>
            </div>
            <button onClick={() => sendCommand(topic, { command: 'refresh_data' })} className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold active:scale-95 transition-transform text-sm">
              刷新数据
            </button>
            <Card>
              <h3 className="text-sm font-bold text-gray-800 mb-2">24小时趋势</h3>
              <TrendChart color="#f97316" fill="rgba(249,115,22,0.1)" />
            </Card>
          </div>
        );
      }

      case 'illuminance': {
        const topic = 'iot/device/control/illuminance_sensor';
        return (
          <div className="space-y-6">
            <Card className="py-12 flex flex-col items-center">
              <Sun className="w-12 h-12 text-yellow-400 mb-4" />
              <h1 className="text-6xl font-light text-gray-900">350<span className="text-2xl text-gray-400 ml-2">Lux</span></h1>
              <div className="mt-6 px-4 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">光线充足 (明亮)</div>
            </Card>
            <button onClick={() => sendCommand(topic, { command: 'refresh_data' })} className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold active:scale-95 transition-transform text-sm">
              刷新数据
            </button>
          </div>
        );
      }

      case 'air_quality': {
        const topic = 'iot/device/control/air_quality_monitor';
        return (
          <div className="space-y-6">
            <Card className="py-8 flex flex-col items-center bg-gradient-to-b from-green-50 to-white">
              <Dial value={42} unit="" label="AQI 空气质量指数" color="text-green-500" />
              <div className="mt-4 px-6 py-2 bg-green-500 text-white rounded-full text-sm font-bold shadow-md shadow-green-500/20">空气优良</div>
            </Card>
            <button onClick={() => sendCommand(topic, { command: 'refresh_data' })} className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold active:scale-95 transition-transform text-sm">
              刷新数据
            </button>
            <div className="grid grid-cols-2 gap-4">
              <Card><div className="text-gray-400 text-xs font-bold mb-1">PM2.5</div><div className="text-xl font-bold text-gray-800">12 <span className="text-[10px] text-gray-400">μg/m³</span></div></Card>
              <Card><div className="text-gray-400 text-xs font-bold mb-1">CO2</div><div className="text-xl font-bold text-gray-800">450 <span className="text-[10px] text-gray-400">ppm</span></div></Card>
              <Card><div className="text-gray-400 text-xs font-bold mb-1">TVOC</div><div className="text-xl font-bold text-gray-800">0.02 <span className="text-[10px] text-gray-400">mg/m³</span></div></Card>
              <Card><div className="text-gray-400 text-xs font-bold mb-1">HCHO (甲醛)</div><div className="text-xl font-bold text-gray-800">0.01 <span className="text-[10px] text-gray-400">mg/m³</span></div></Card>
            </div>
          </div>
        );
      }

      case 'presence': {
        const topic = 'iot/device/control/presence_sensor';
        return (
          <div className="space-y-6">
            <Card className="py-12 flex flex-col items-center">
               <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-green-200 animate-ping opacity-75"></div>
                  <div className="absolute inset-4 rounded-full border-2 border-green-300 animate-pulse"></div>
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40 z-10">
                    <Radar className="w-8 h-8 text-white" />
                  </div>
               </div>
               <h2 className="text-2xl font-bold text-green-600 mt-6">有人存在</h2>
               <p className="text-sm font-medium text-gray-400 mt-2">距离约 2.5 米</p>
            </Card>
            <button onClick={() => sendCommand(topic, { command: 'clear_history' })} className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold active:scale-95 transition-transform text-sm">
              清除日志
            </button>
          </div>
        );
      }

      case 'door_sensor': {
        const topic = 'iot/device/control/door_window_sensor';
        return (
          <div className="space-y-6">
            <Card className="py-12 flex flex-col items-center bg-red-50/30">
              <Lock className="w-20 h-20 text-red-500 mb-6" />
              <h2 className="text-3xl font-extrabold text-red-600">已打开</h2>
              <div className="flex items-center space-x-1 mt-4 text-xs font-bold text-gray-400">
                <Battery className="w-4 h-4" /> <span>电池 80%</span>
              </div>
            </Card>
            <button onClick={() => sendCommand(topic, { command: 'clear_log' })} className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold active:scale-95 transition-transform text-sm">
              清除日志
            </button>
          </div>
        );
      }

      case 'water_leak': {
        const topic = 'iot/device/control/water_leak_sensor';
        return (
          <div className="space-y-6">
            <Card className="py-12 flex flex-col items-center bg-red-50">
              <Droplets className="w-20 h-20 text-red-500 mb-6 animate-bounce" />
              <h2 className="text-3xl font-extrabold text-red-600">漏水警告</h2>
            </Card>
            <button onClick={() => sendCommand(topic, { alarm_state: 'MUTE' })} className="w-full py-4 bg-red-100 text-red-700 rounded-2xl font-bold active:scale-95 transition-transform text-sm">
              消音静音
            </button>
          </div>
        );
      }

      case 'smoke_gas': {
        const topic = 'iot/device/control/smoke_gas_alarm';
        return (
          <div className="space-y-6">
            <Card className="py-12 flex flex-col items-center bg-emerald-50/50">
              <Flame className="w-20 h-20 text-emerald-500 mb-6" />
              <h2 className="text-3xl font-extrabold text-emerald-600">正常</h2>
            </Card>
            <div className="flex space-x-4">
              <button onClick={() => sendCommand(topic, { command: 'trigger_self_test' })} className="flex-1 py-4 bg-orange-100 text-orange-700 rounded-2xl font-bold active:scale-95 transition-transform text-sm">
                设备自检
              </button>
              <button onClick={() => sendCommand(topic, { alarm_state: 'SILENCE' })} className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold active:scale-95 transition-transform text-sm">
                消音
              </button>
            </div>
          </div>
        );
      }

      case 'switch': {
        const topic = 'iot/device/control/smart_wall_switch';
        const s1 = getState('switch_1', false);
        const s2 = getState('switch_2', false);
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => {
                const newState = !s1;
                updateState('switch_1', newState);
                sendCommand(topic, { switch_1: newState ? 'ON' : 'OFF' });
              }} className={`py-12 rounded-3xl flex flex-col items-center justify-center transition-all ${s1 ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-gray-500 shadow-sm'}`}>
                <Power className="w-10 h-10 mb-2" />
                <span className="font-bold">开关 1</span>
              </button>
              <button onClick={() => {
                const newState = !s2;
                updateState('switch_2', newState);
                sendCommand(topic, { switch_2: newState ? 'ON' : 'OFF' });
              }} className={`py-12 rounded-3xl flex flex-col items-center justify-center transition-all ${s2 ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-gray-500 shadow-sm'}`}>
                <Power className="w-10 h-10 mb-2" />
                <span className="font-bold">开关 2</span>
              </button>
            </div>
            <button onClick={() => {
              updateState('switch_1', true);
              updateState('switch_2', true);
              sendCommand(topic, { switch_1: 'ON', switch_2: 'ON', switch_3: 'ON' });
            }} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold active:scale-95 transition-transform text-sm">
              全部开启
            </button>
            <button onClick={() => {
              updateState('switch_1', false);
              updateState('switch_2', false);
              sendCommand(topic, { switch_1: 'OFF', switch_2: 'OFF', switch_3: 'OFF' });
            }} className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold active:scale-95 transition-transform text-sm">
              全部关闭
            </button>
          </div>
        );
      }

      case 'light_strip': {
        const topic = 'iot/device/control/smart_led_strip';
        const power = getState('strip_power', true);
        const brightness = getState('strip_brightness', 80);
        return (
          <div className={`space-y-6 transition-all duration-300 ${!power ? 'opacity-60 flex-none' : ''}`}>
             <Card className="py-8">
              <div className="h-6 w-full rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500 mb-6 shadow-inner"></div>
              <div className={`px-4 flex items-center space-x-4 ${!power ? 'pointer-events-none' : ''}`}>
                <Sun className="w-5 h-5 text-gray-400" />
                <input 
                  type="range" min="0" max="100" value={brightness} 
                  onChange={(e) => updateState('strip_brightness', Number(e.target.value))}
                  onMouseUp={(e) => sendCommand(topic, { state: 'ON', brightness: Number((e.target as any).value) })}
                  onTouchEnd={(e) => sendCommand(topic, { state: 'ON', brightness: Number((e.target as any).value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                />
                <Sun className="w-6 h-6 text-gray-600" />
              </div>
            </Card>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => sendCommand(topic, { state: 'ON', color: { r: 255, g: 0, b: 255 } })} className="py-4 bg-fuchsia-100 text-fuchsia-700 rounded-2xl font-bold active:scale-95 text-sm">洋红色</button>
              <button onClick={() => sendCommand(topic, { state: 'ON', effect: 'rainbow_breathe' })} className="py-4 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-2xl font-bold active:scale-95 text-sm">彩虹呼吸</button>
            </div>
            <button onClick={() => {
              const newState = !power;
              updateState('strip_power', newState);
              sendCommand(topic, { state: newState ? 'ON' : 'OFF' });
            }} className={`w-full py-4 rounded-3xl font-bold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center ${power ? 'bg-purple-500 text-white shadow-xl' : 'bg-gray-200 text-gray-600'}`}>
              <Power className="w-5 h-5 mr-2" /> {power ? '关闭灯带' : '开启灯带'}
            </button>
          </div>
        );
      }

      case 'curtain': {
        const topic = 'iot/device/control/smart_curtain';
        const position = getState('curtain_pos', 50);
        return (
          <div className="space-y-6">
            <Card className="py-10">
              <Dial value={position} unit="%" label="窗帘开合度" color="text-indigo-500" />
              <div className="mt-8 px-4">
                <input 
                  type="range" min="0" max="100" value={position} 
                  onChange={(e) => updateState('curtain_pos', Number(e.target.value))}
                  onMouseUp={(e) => sendCommand(topic, { position_percent: Number((e.target as any).value) })}
                  onTouchEnd={(e) => sendCommand(topic, { position_percent: Number((e.target as any).value) })}
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                />
              </div>
            </Card>
            <div className="flex space-x-4">
              <button onClick={() => sendCommand(topic, { command: 'OPEN' })} className="flex-1 py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-bold active:scale-95 text-sm">打开</button>
              <button onClick={() => sendCommand(topic, { command: 'PAUSE' })} className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold active:scale-95 text-sm">暂停</button>
              <button onClick={() => sendCommand(topic, { command: 'CLOSE' })} className="flex-1 py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-bold active:scale-95 text-sm">关闭</button>
            </div>
          </div>
        );
      }

      case 'lock': {
        const topic = 'iot/device/control/smart_door_lock';
        return (
          <div className="space-y-6">
            <Card className="py-12 flex flex-col items-center">
              <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mb-6 shadow-xl active:scale-95 cursor-pointer transition-transform"
                   onClick={() => sendCommand(topic, { command: 'UNLOCK', auth_token: 'user_secure_token_abc123' })}>
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">点击远程解锁</h2>
            </Card>
            <button onClick={() => sendCommand(topic, { command: 'CREATE_TEMP_PWD', valid_hours: 24 })} className="w-full py-4 bg-blue-50 text-blue-700 rounded-2xl font-bold active:scale-95 transition-transform text-sm">
              生成 24 小时临时密码
            </button>
          </div>
        );
      }

      case 'camera': {
        const topic = 'iot/device/control/ptz_camera';
        const isRecording = getState('cam_record', false);
        return (
          <div className="space-y-6">
             <Card className="p-2 bg-gray-900 overflow-hidden relative">
               <div className="aspect-video bg-black rounded-2xl flex items-center justify-center relative">
                 <Cctv className="w-12 h-12 text-gray-700" />
                 {isRecording && <div className="absolute top-4 right-4 flex items-center"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div><span className="text-xs text-white">REC</span></div>}
               </div>
             </Card>
             <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 flex flex-col items-center justify-center bg-gray-100 rounded-2xl p-2 relative h-32">
                   <button onClick={()=>sendCommand(topic, {ptz:'UP'})} className="absolute top-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-90"><ArrowUp className="w-4 h-4"/></button>
                   <button onClick={()=>sendCommand(topic, {ptz:'DOWN'})} className="absolute bottom-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-90"><ArrowDown className="w-4 h-4"/></button>
                   <button onClick={()=>sendCommand(topic, {ptz:'LEFT'})} className="absolute left-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-90"><ArrowLeft className="w-4 h-4"/></button>
                   <button onClick={()=>sendCommand(topic, {ptz:'RIGHT'})} className="absolute right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-90"><ArrowRight className="w-4 h-4"/></button>
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-2">
                   <button onClick={()=>sendCommand(topic, {command:'TAKE_SNAPSHOT'})} className="bg-blue-50 text-blue-700 flex flex-col items-center justify-center rounded-2xl font-bold text-xs active:scale-95"><Maximize className="w-6 h-6 mb-1"/>快照</button>
                   <button onClick={()=>{
                      const next = !isRecording;
                      updateState('cam_record', next);
                      sendCommand(topic, {recording_state: next ? 'ON' : 'OFF'});
                   }} className={`${isRecording ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700'} flex flex-col items-center justify-center rounded-2xl font-bold text-xs active:scale-95 transition-colors`}><Play className="w-6 h-6 mb-1"/>录像</button>
                   <button onClick={()=>sendCommand(topic, {two_way_audio:'ON'})} className="bg-emerald-50 text-emerald-700 flex flex-col items-center justify-center rounded-2xl font-bold text-xs active:scale-95"><Volume2 className="w-6 h-6 mb-1"/>双向通话</button>
                   <button onClick={()=>sendCommand(topic, {speaker_mute:'ON'})} className="bg-gray-100 text-gray-700 flex flex-col items-center justify-center rounded-2xl font-bold text-xs active:scale-95"><Volume2 className="w-6 h-6 mb-1"/>静音</button>
                </div>
             </div>
          </div>
        );
      }

      case 'doorbell': {
        const topic = 'iot/device/control/smart_video_doorbell';
        return (
          <div className="space-y-6">
            <Card className="aspect-square bg-gray-900 rounded-[32px] flex items-center justify-center relative overflow-hidden">
               <Bell className="w-20 h-20 text-gray-700" />
               <div className="absolute top-6 text-white/50 text-sm font-bold">有人按门铃</div>
            </Card>
            <div className="flex space-x-6">
              <button onClick={()=>sendCommand(topic, {call_state:'ANSWER'})} className="flex-1 py-6 bg-green-500 text-white rounded-[28px] font-bold shadow-xl shadow-green-500/30 active:scale-95 transition-transform text-lg">接听</button>
              <button onClick={()=>sendCommand(topic, {call_state:'HANGUP'})} className="flex-1 py-6 bg-red-500 text-white rounded-[28px] font-bold shadow-xl shadow-red-500/30 active:scale-95 transition-transform text-lg">挂断</button>
            </div>
            <button onClick={()=>sendCommand(topic, {play_message_id:'leave_at_door'})} className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold active:scale-95 transition-transform text-sm">
              快速回复："放门口"
            </button>
          </div>
        );
      }

      case 'robot_vacuum': {
        const topic = 'iot/device/control/robot_vacuum';
        const status = getState('robot_status', 'idle');
        const suction = getState('robot_suction', 'standard');
        const water = getState('robot_water', 'medium');
        
        return (
          <div className="space-y-6">
            <Card className="py-12 flex flex-col items-center">
               <div className="relative w-40 h-40">
                  <div className={`absolute inset-0 border-[6px] rounded-full transition-colors duration-1000 ${status === 'cleaning' ? 'border-blue-500 animate-[spin_4s_linear_infinite] border-t-transparent' : 'border-gray-200'}`}></div>
                  <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                    <Radar className={`w-8 h-8 mb-1 ${status === 'cleaning' ? 'text-blue-500' : 'text-gray-300'}`} />
                    <span className="text-xs font-bold text-gray-400">{status === 'cleaning' ? '清扫中' : status === 'returning' ? '回充中' : '待机'}</span>
                  </div>
               </div>
            </Card>
            
            <div className="flex space-x-4">
              <button onClick={()=>{
                updateState('robot_status', 'cleaning');
                sendCommand(topic, {command:'START_CLEANING'});
              }} className="flex-1 py-4 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-transform text-sm">全屋清扫</button>
              <button onClick={()=>{
                updateState('robot_status', 'returning');
                sendCommand(topic, {command:'RETURN_TO_DOCK'});
              }} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform text-sm">回充</button>
            </div>

            <Card className="space-y-6">
               <div>
                 <div className="text-xs font-bold text-gray-400 mb-3">吸力控制</div>
                 <SegmentedControl options={['静音', '标准', '强力']} active={suction === 'standard' ? '标准' : suction === 'strong' ? '强力' : '静音'} onChange={(v:string)=>{
                   const val = v === '标准' ? 'standard' : v === '强力' ? 'strong' : 'quiet';
                   updateState('robot_suction', val);
                   sendCommand(topic, {suction_level: val});
                 }} />
               </div>
               <div>
                 <div className="text-xs font-bold text-gray-400 mb-3">出水量</div>
                 <SegmentedControl options={['低', '中', '高']} active={water === 'medium' ? '中' : water === 'high' ? '高' : '低'} onChange={(v:string)=>{
                   const val = v === '中' ? 'medium' : v === '高' ? 'high' : 'low';
                   updateState('robot_water', val);
                   sendCommand(topic, {water_level: val});
                 }} />
               </div>
            </Card>
          </div>
        );
      }

      case 'fresh_air': {
        const topic = 'iot/device/control/fresh_air_system';
        const power = getState('air_power', true);
        const speed = getState('air_speed', 'auto');
        const heat = getState('air_heat', false);
        return (
          <div className={`space-y-6 transition-all duration-300 ${!power ? 'opacity-60 flex-none' : ''}`}>
            <Card className="py-8">
              <Dial value={18} unit="μg/m³" label="室内 PM2.5" color="text-green-500" />
            </Card>
            <Card className={`space-y-4 ${!power ? 'pointer-events-none' : ''}`}>
               <div className="text-xs font-bold text-gray-400 mb-2">风速控制</div>
               <SegmentedControl options={['自动', '1档', '2档', '3档']} active={speed === 'auto' ? '自动' : speed} onChange={(v:string)=>{
                 updateState('air_speed', v);
                 sendCommand(topic, {state: 'ON', speed: v === '自动' ? 'auto' : v.replace('档', '')});
               }} />
            </Card>
            <div className="flex space-x-4">
               <button onClick={()=>{
                 const next = !heat;
                 updateState('air_heat', next);
                 sendCommand(topic, {state: 'ON', aux_heating: next ? 'ON' : 'OFF'});
               }} className={`flex-1 py-4 rounded-2xl font-bold active:scale-95 transition-transform text-sm ${heat ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>电辅热 {heat?'开':'关'}</button>
               <button onClick={()=>sendCommand(topic, {command:'reset_filter_life'})} className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold active:scale-95 transition-transform text-sm">重置滤芯</button>
            </div>
            <button onClick={() => {
              const newState = !power;
              updateState('air_power', newState);
              sendCommand(topic, { state: newState ? 'ON' : 'OFF' });
            }} className={`w-full py-4 rounded-3xl font-bold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center ${power ? 'bg-green-500 text-white shadow-xl shadow-green-500/20' : 'bg-gray-200 text-gray-600'}`}>
              <Power className="w-5 h-5 mr-2" /> {power ? '关闭新风' : '开启新风'}
            </button>
          </div>
        );
      }

      case 'air_treatment': {
        const topic = 'iot/device/control/air_treatment';
        const power = getState('treat_power', true);
        const mode = getState('treat_mode', 'auto');
        const humidity = getState('treat_hum', 55);
        return (
          <div className={`space-y-6 transition-all duration-300 ${!power ? 'opacity-60 flex-none' : ''}`}>
            <Card className="py-10">
              <Dial value={humidity} unit="%" label="目标湿度" color="text-blue-500" />
              <div className={`mt-8 px-4 flex items-center space-x-4 ${!power ? 'pointer-events-none' : ''}`}>
                <input 
                  type="range" min="30" max="80" value={humidity} 
                  onChange={(e) => updateState('treat_hum', Number(e.target.value))}
                  onMouseUp={(e) => sendCommand(topic, { state: 'ON', target_humidity: Number((e.target as any).value) })}
                  onTouchEnd={(e) => sendCommand(topic, { state: 'ON', target_humidity: Number((e.target as any).value) })}
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                />
              </div>
            </Card>
            <div className={`grid grid-cols-3 gap-2 ${!power ? 'pointer-events-none' : ''}`}>
               <button onClick={()=>{updateState('treat_mode','auto'); sendCommand(topic, {state:'ON', mode:'auto'})}} className={`py-3 text-xs font-bold rounded-xl ${mode==='auto'?'bg-blue-50 text-blue-700':'bg-gray-100 text-gray-500'}`}>自动</button>
               <button onClick={()=>{updateState('treat_mode','sleep'); sendCommand(topic, {state:'ON', mode:'sleep'})}} className={`py-3 text-xs font-bold rounded-xl ${mode==='sleep'?'bg-blue-50 text-blue-700':'bg-gray-100 text-gray-500'}`}>睡眠</button>
               <button onClick={()=>{updateState('treat_mode','manual'); sendCommand(topic, {state:'ON', mode:'manual'})}} className={`py-3 text-xs font-bold rounded-xl ${mode==='manual'?'bg-blue-50 text-blue-700':'bg-gray-100 text-gray-500'}`}>手动</button>
            </div>
            <div className="flex space-x-4">
              <button onClick={()=>sendCommand(topic, {child_lock:'ON', screen_display:'OFF'})} className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold active:scale-95 text-sm">童锁/息屏</button>
              <button onClick={()=>sendCommand(topic, {state:'ON', mist_level:'high'})} className="flex-1 py-4 bg-blue-100 text-blue-700 rounded-2xl font-bold active:scale-95 text-sm">大雾量</button>
            </div>
            <button onClick={() => {
              const newState = !power;
              updateState('treat_power', newState);
              sendCommand(topic, { state: newState ? 'ON' : 'OFF' });
            }} className={`w-full py-4 rounded-3xl font-bold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center ${power ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/20' : 'bg-gray-200 text-gray-600'}`}>
              <Power className="w-5 h-5 mr-2" /> {power ? '关闭加湿器' : '开启加湿器'}
            </button>
          </div>
        );
      }

      case 'wall_panel': {
        const topic = 'iot/device/control/wall_panel';
        const bright = getState('panel_bright', 60);
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <Card className="flex flex-col items-center justify-center py-10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg active:scale-95 cursor-pointer transition-transform"
                     onClick={() => sendCommand(topic, {trigger_scene: 'leave_home'})}>
                 <ArrowLeft className="w-10 h-10 mb-4" />
                 <span className="font-bold">离家模式</span>
               </Card>
               <Card className="flex flex-col items-center justify-center py-10 bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-lg active:scale-95 cursor-pointer transition-transform"
                     onClick={() => sendCommand(topic, {trigger_scene: 'arrive_home'})}>
                 <ArrowRight className="w-10 h-10 mb-4" />
                 <span className="font-bold">回家模式</span>
               </Card>
            </div>
            <Card className="py-6">
              <div className="text-xs font-bold text-gray-400 mb-4">屏幕亮度</div>
              <div className="flex items-center space-x-4">
                <Sun className="w-5 h-5 text-gray-400" />
                <input 
                  type="range" min="0" max="100" value={bright} 
                  onChange={(e) => updateState('panel_bright', Number(e.target.value))}
                  onMouseUp={(e) => sendCommand(topic, { brightness: Number((e.target as any).value) })}
                  onTouchEnd={(e) => sendCommand(topic, { brightness: Number((e.target as any).value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                />
              </div>
            </Card>
          </div>
        );
      }

      case 'smart_speaker': {
        const topic = 'iot/device/control/smart_speaker';
        const playing = getState('spk_play', false);
        const volume = getState('spk_vol', 45);
        return (
          <div className="space-y-6">
            <Card className="py-12 flex flex-col items-center relative overflow-hidden">
               <div className={`absolute -inset-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-2xl rounded-full transition-opacity duration-1000 ${playing ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>
               <div className="relative z-10 w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Volume2 className={`w-10 h-10 ${playing ? 'text-indigo-600' : 'text-gray-400'}`} />
               </div>
               <h2 className="text-xl font-bold text-gray-900 mb-1">{playing ? '正在播放音乐...' : '已停止'}</h2>
            </Card>
            <div className="grid grid-cols-3 gap-2">
               <button onClick={()=>sendCommand(topic, {playback:'PREV'})} className="py-4 bg-gray-100 text-gray-700 rounded-2xl flex items-center justify-center active:scale-95"><SkipBack className="w-5 h-5"/></button>
               <button onClick={()=>{
                 const next = !playing;
                 updateState('spk_play', next);
                 sendCommand(topic, {playback: next ? 'PLAY' : 'PAUSE'});
               }} className="py-4 bg-indigo-500 text-white rounded-2xl flex items-center justify-center active:scale-95 shadow-lg">
                 {playing ? <Pause className="w-6 h-6"/> : <Play className="w-6 h-6"/>}
               </button>
               <button onClick={()=>sendCommand(topic, {playback:'NEXT'})} className="py-4 bg-gray-100 text-gray-700 rounded-2xl flex items-center justify-center active:scale-95"><SkipForward className="w-5 h-5"/></button>
            </div>
            <Card>
              <div className="flex items-center space-x-4">
                <Volume2 className="w-5 h-5 text-gray-400" />
                <input 
                  type="range" min="0" max="100" value={volume} 
                  onChange={(e) => updateState('spk_vol', Number(e.target.value))}
                  onMouseUp={(e) => sendCommand(topic, { volume: Number((e.target as any).value) })}
                  onTouchEnd={(e) => sendCommand(topic, { volume: Number((e.target as any).value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                />
              </div>
            </Card>
            <button onClick={()=>sendCommand(topic, {mic_state:'MUTE'})} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold active:scale-95 transition-transform text-sm">
              麦克风静音 (防窃听)
            </button>
          </div>
        );
      }

      case 'plug': {
        const topic = 'iot/device/control/smart_plug';
        const power = getState('plug_power', true);
        return (
          <div className="space-y-6">
            <Card className="py-16 flex flex-col items-center">
               <button onClick={()=>{
                 const next = !power;
                 updateState('plug_power', next);
                 sendCommand(topic, {state: next ? 'ON' : 'OFF'});
               }} className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${power ? 'bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)]' : 'bg-gray-100 shadow-inner'}`}>
                 <Power className={`w-12 h-12 ${power ? 'text-white' : 'text-gray-400'}`} />
               </button>
            </Card>
            <div className={`grid grid-cols-2 gap-4 ${!power ? 'opacity-60' : ''}`}>
               <Card className="text-center py-6 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
                 <div className="text-xs font-bold text-emerald-600 mb-1">当前功率</div>
                 <div className="text-2xl font-bold text-gray-900">{power ? '15.2' : '0.0'} <span className="text-sm font-medium text-gray-500">W</span></div>
               </Card>
               <Card className="text-center py-6">
                 <div className="text-xs font-bold text-gray-400 mb-1">今日用电</div>
                 <div className="text-2xl font-bold text-gray-900">0.5 <span className="text-sm font-medium text-gray-500">kWh</span></div>
               </Card>
            </div>
            <Card className="py-4 active:scale-95 cursor-pointer transition-transform" onClick={()=>sendCommand(topic, {set_timer_minutes: 120})}>
               <div className="flex justify-between items-center text-sm font-bold text-gray-800">
                  <div className="flex items-center"><Clock className="w-5 h-5 mr-3 text-emerald-500" /> 定时关闭</div>
                  <div className="bg-gray-100 px-3 py-1 rounded-full text-xs hover:bg-gray-200">2 小时后</div>
               </div>
            </Card>
          </div>
        );
      }

      case 'smart_breaker': {
        const topic = 'iot/device/control/smart_breaker';
        const s1 = getState('brk_1', true);
        const s2 = getState('brk_2', true);
        return (
          <div className="space-y-6">
            <Card className="py-4 space-y-4">
              <div className="flex justify-between items-center">
                 <span className="font-bold text-sm text-gray-800">厨房插座</span>
                 <button onClick={()=>{
                   const next = !s1;
                   updateState('brk_1', next);
                   sendCommand(topic, {circuit_id: 'kitchen_outlets', state: next ? 'ON' : 'OFF'});
                 }} className={`w-14 h-8 rounded-full transition-colors relative ${s1 ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                   <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${s1 ? 'translate-x-7' : 'translate-x-1'}`}></div>
                 </button>
              </div>
              <div className="w-full h-px bg-gray-100"></div>
              <div className="flex justify-between items-center">
                 <span className="font-bold text-sm text-gray-800">主卧照明</span>
                 <button onClick={()=>{
                   const next = !s2;
                   updateState('brk_2', next);
                   sendCommand(topic, {circuit_id: 'master_light', state: next ? 'ON' : 'OFF'});
                 }} className={`w-14 h-8 rounded-full transition-colors relative ${s2 ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                   <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${s2 ? 'translate-x-7' : 'translate-x-1'}`}></div>
                 </button>
              </div>
            </Card>
            <button onClick={() => sendCommand(topic, { command: 'acknowledge_alert' })} className="w-full py-4 bg-orange-100 text-orange-700 rounded-2xl font-bold active:scale-95 transition-transform text-sm">
              清除安全警报
            </button>
          </div>
        );
      }

      case 'whole_home_audio': {
        const topic = 'iot/device/control/whole_home_audio';
        const p1 = getState('wh_p1', true);
        const v1 = getState('wh_v1', 30);
        return (
          <div className="space-y-6">
            <Card className="py-6 space-y-6">
               <div className="flex justify-between items-center">
                 <span className="font-bold text-lg text-gray-900">客厅区域</span>
                 <button onClick={()=>{
                   const next = !p1;
                   updateState('wh_p1', next);
                   sendCommand(topic, {zone_id: 'living_room', state: next ? 'ON' : 'OFF', volume: v1});
                 }} className={`w-12 h-12 rounded-full flex items-center justify-center ${p1 ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                   <Power className="w-5 h-5"/>
                 </button>
               </div>
               <div className={`space-y-4 ${!p1 ? 'opacity-50 pointer-events-none' : ''}`}>
                 <div className="flex items-center space-x-4">
                  <Volume2 className="w-5 h-5 text-gray-400" />
                  <input 
                    type="range" min="0" max="100" value={v1} 
                    onChange={(e) => updateState('wh_v1', Number(e.target.value))}
                    onMouseUp={(e) => sendCommand(topic, {zone_id: 'living_room', volume: Number((e.target as any).value)})}
                    onTouchEnd={(e) => sendCommand(topic, {zone_id: 'living_room', volume: Number((e.target as any).value)})}
                    className="flex-1 h-2 bg-gray-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                  />
                 </div>
                 <SegmentedControl options={['蓝牙', 'Spotify', '本地']} active="Spotify" onChange={(v:string)=>{
                   const src = v === '蓝牙' ? 'bluetooth' : v === '本地' ? 'local' : 'spotify';
                   sendCommand(topic, {zone_id: 'living_room', input_source: src});
                 }} />
               </div>
            </Card>
            <button onClick={() => sendCommand(topic, { command: 'sync_all_zones', master_zone: 'living_room' })} className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-bold active:scale-95 transition-transform text-sm shadow-lg shadow-indigo-500/30">
              同步所有房间
            </button>
          </div>
        );
      }

      case 'tv_projector': {
        const topic = 'iot/device/control/smart_tv';
        return (
          <div className="space-y-6">
            <Card className="py-8 flex justify-center bg-gray-900 rounded-[40px] shadow-2xl">
               <div className="w-56 h-56 rounded-full bg-gray-800 relative flex items-center justify-center shadow-inner">
                  <button onClick={()=>sendCommand(topic, {key_press:'UP'})} className="absolute top-4 w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white active:scale-90 transition-all"><ArrowUp className="w-5 h-5"/></button>
                  <button onClick={()=>sendCommand(topic, {key_press:'DOWN'})} className="absolute bottom-4 w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white active:scale-90 transition-all"><ArrowDown className="w-5 h-5"/></button>
                  <button onClick={()=>sendCommand(topic, {key_press:'LEFT'})} className="absolute left-4 w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white active:scale-90 transition-all"><ArrowLeft className="w-5 h-5"/></button>
                  <button onClick={()=>sendCommand(topic, {key_press:'RIGHT'})} className="absolute right-4 w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white active:scale-90 transition-all"><ArrowRight className="w-5 h-5"/></button>
                  <button onClick={()=>sendCommand(topic, {key_press:'ENTER'})} className="w-20 h-20 bg-gray-600 hover:bg-gray-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg active:scale-90 transition-all">OK</button>
               </div>
            </Card>
            <div className="grid grid-cols-4 gap-4 px-2">
               <button onClick={()=>sendCommand(topic, {key_press:'HOME'})} className="bg-white py-4 rounded-2xl flex flex-col items-center justify-center shadow-sm text-gray-800 font-bold text-xs active:scale-90 transition-transform border border-gray-100"><Navigation className="w-5 h-5 mb-1"/>主页</button>
               <button onClick={()=>sendCommand(topic, {key_press:'BACK'})} className="bg-white py-4 rounded-2xl flex flex-col items-center justify-center shadow-sm text-gray-800 font-bold text-xs active:scale-90 transition-transform border border-gray-100"><ArrowLeft className="w-5 h-5 mb-1"/>返回</button>
               <button onClick={()=>sendCommand(topic, {key_press:'VOL_DOWN'})} className="bg-white py-4 rounded-2xl flex flex-col items-center justify-center shadow-sm text-gray-800 font-bold text-xs active:scale-90 transition-transform border border-gray-100"><Minus className="w-5 h-5 mb-1"/>音量-</button>
               <button onClick={()=>sendCommand(topic, {key_press:'VOL_UP'})} className="bg-white py-4 rounded-2xl flex flex-col items-center justify-center shadow-sm text-gray-800 font-bold text-xs active:scale-90 transition-transform border border-gray-100"><Plus className="w-5 h-5 mb-1"/>音量+</button>
            </div>
            <div className="flex space-x-4">
               <button onClick={()=>sendCommand(topic, {launch_app:'netflix'})} className="flex-1 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-md active:scale-95 transition-transform">NETFLIX</button>
               <button onClick={()=>sendCommand(topic, {input_source:'HDMI_1'})} className="flex-1 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-md active:scale-95 transition-transform">HDMI 1</button>
            </div>
          </div>
        );
      }

      case 'refrigerator': {
        const topic = 'iot/device/control/smart_refrigerator';
        const ft = getState('ref_ft', 4);
        const fzt = getState('ref_fzt', -18);
        return (
          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <Card className="py-8 text-center space-y-4">
                  <span className="text-xs font-bold text-gray-400">冷藏室</span>
                  <div className="text-4xl font-light text-blue-500">{ft}°C</div>
                  <div className="flex justify-center space-x-3">
                     <button onClick={()=>{updateState('ref_ft', ft-1); sendCommand(topic, {fridge_temp_celsius: ft-1})}} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center active:scale-90">-</button>
                     <button onClick={()=>{updateState('ref_ft', ft+1); sendCommand(topic, {fridge_temp_celsius: ft+1})}} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center active:scale-90">+</button>
                  </div>
                </Card>
                <Card className="py-8 text-center space-y-4">
                  <span className="text-xs font-bold text-gray-400">冷冻室</span>
                  <div className="text-4xl font-light text-blue-800">{fzt}°C</div>
                  <div className="flex justify-center space-x-3">
                     <button onClick={()=>{updateState('ref_fzt', fzt-1); sendCommand(topic, {freezer_temp_celsius: fzt-1})}} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center active:scale-90">-</button>
                     <button onClick={()=>{updateState('ref_fzt', fzt+1); sendCommand(topic, {freezer_temp_celsius: fzt+1})}} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center active:scale-90">+</button>
                  </div>
                </Card>
             </div>
             <button onClick={()=>sendCommand(topic, {mode: 'rapid_freeze'})} className="w-full py-4 bg-blue-50 text-blue-700 rounded-2xl font-bold active:scale-95 transition-transform text-sm">
                速冷速冻模式
             </button>
          </div>
        );
      }

      case 'washer_heater': {
        const topic = 'iot/device/control/washer_heater';
        const running = getState('washer_running', false);
        const mode = getState('washer_mode', '混合洗');
        return (
          <div className="space-y-6">
            <Card className="py-10">
              <Dial value={running ? 45 : '--'} unit="分" label={running ? "剩余时间" : "待机中"} color="text-indigo-500" />
              <div className="text-center mt-4 text-sm font-bold text-indigo-600">{running ? '正在洗涤...' : '已暂停'}</div>
            </Card>
            <Card className="space-y-4">
               <div className="flex justify-between font-bold text-sm text-gray-800"><span>洗涤程序</span><span className="text-indigo-500">{mode}</span></div>
               <SegmentedControl options={['棉麻', '混合洗', '快洗']} active={mode} onChange={(v:string)=>{
                 updateState('washer_mode', v);
                 const prog = v === '棉麻' ? 'cotton' : v === '混合洗' ? 'mixed' : 'quick_wash';
                 sendCommand(topic, {state: 'ON', program: prog});
               }} />
            </Card>
            <div className="grid grid-cols-2 gap-4">
               <Card className="text-center py-4 cursor-pointer active:scale-95 transition-transform" onClick={()=>sendCommand(topic, {water_temp: 40, spin_speed: 1000})}>
                 <span className="text-xs text-gray-400 font-bold block mb-1">设置水温</span>
                 <span className="font-bold text-lg">40°C</span>
               </Card>
               <Card className="text-center py-4 cursor-pointer active:scale-95 transition-transform" onClick={()=>sendCommand(topic, {schedule_heat_time: '06:30'})}>
                 <span className="text-xs text-gray-400 font-bold block mb-1">预约加热</span>
                 <span className="font-bold text-lg">06:30</span>
               </Card>
            </div>
            <button onClick={()=>{
              const next = !running;
              updateState('washer_running', next);
              sendCommand(topic, {state: next ? 'ON' : 'OFF'});
            }} className={`w-full py-4 rounded-3xl font-bold shadow-lg active:scale-[0.98] transition-all ${running ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-black text-white shadow-black/20'}`}>{running ? '暂停' : '开始'}</button>
          </div>
        );
      }

      case 'fan': {
        const topic = 'iot/device/control/smart_fan';
        const power = getState('fan_power', true);
        const osc = getState('fan_osc', false);
        const mode = getState('fan_mode', '自然风');
        const speed = getState('fan_speed', 3);
        
        return (
          <div className={`space-y-6 transition-all duration-300 ${!power ? 'opacity-60 flex-none' : ''}`}>
            <Card className="py-10">
              <Dial value={speed} unit="档" label={power ? "当前风速" : "已关闭"} color="text-teal-500" />
              <div className={`flex justify-center space-x-6 mt-6 ${!power ? 'pointer-events-none' : ''}`}>
                 <button onClick={()=>{
                   const val = Math.max(1, speed-1);
                   updateState('fan_speed', val);
                   sendCommand(topic, {state: 'ON', speed: val});
                 }} className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 active:scale-90 transition-transform"><Minus className="w-5 h-5"/></button>
                 <button onClick={()=>{
                   const val = Math.min(4, speed+1);
                   updateState('fan_speed', val);
                   sendCommand(topic, {state: 'ON', speed: val});
                 }} className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 active:scale-90 transition-transform"><Plus className="w-5 h-5"/></button>
              </div>
            </Card>
            <div className="flex space-x-4">
              <Pill active={osc} onClick={()=>{
                const next = !osc;
                updateState('fan_osc', next);
                sendCommand(topic, {state: 'ON', oscillation_horizontal: next ? 'ON' : 'OFF'});
              }} icon={Wind} label="水平摇头" colorClass="bg-teal-400 text-white" />
              <Pill active={false} onClick={()=>{
                sendCommand(topic, {state: 'ON', direction_reverse: 'ON'});
              }} icon={Zap} label="风向反转" colorClass="bg-teal-400 text-white" />
            </div>
            <Card className={`space-y-4 ${!power ? 'pointer-events-none' : ''}`}>
              <div className="flex justify-between items-center"><span className="text-[14px] font-bold text-gray-800">运行模式</span></div>
              <SegmentedControl options={['正常', '自然风', '睡眠']} active={mode} onChange={(v:string)=>{
                updateState('fan_mode', v);
                const m = v === '正常' ? 'normal' : v === '自然风' ? 'natural_wind' : 'sleep';
                sendCommand(topic, {state: 'ON', mode: m});
              }} />
            </Card>
            <button onClick={() => {
              const newState = !power;
              updateState('fan_power', newState);
              sendCommand(topic, { state: newState ? 'ON' : 'OFF' });
            }} className={`w-full py-4 rounded-3xl font-bold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center ${power ? 'bg-teal-500 text-white shadow-xl shadow-teal-500/20' : 'bg-gray-200 text-gray-600'}`}>
              <Power className="w-5 h-5 mr-2" /> {power ? '关闭风扇' : '开启风扇'}
            </button>
          </div>
        );
      }

      case 'ac': {
        const topic = 'iot/device/control/air_conditioner';
        const power = getState('ac_power', true);
        const temp = getState('ac_temp', 24);
        const mode = getState('ac_mode', '制冷');
        const speed = getState('ac_speed', '自动');

        return (
          <div className={`space-y-6 transition-all duration-300 ${!power ? 'opacity-60 flex-none' : ''}`}>
            <Card className="py-10">
              <Dial value={temp} unit="°C" label={power ? "目标温度" : "已关闭"} color="text-blue-500" />
              <div className={`flex justify-center space-x-6 mt-6 ${!power ? 'pointer-events-none' : ''}`}>
                 <button onClick={()=>{
                   const val = Math.max(16, temp-1);
                   updateState('ac_temp', val);
                   sendCommand(topic, {state: 'ON', temperature: val});
                 }} className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 active:scale-90 transition-transform"><Minus className="w-5 h-5"/></button>
                 <button onClick={()=>{
                   const val = Math.min(30, temp+1);
                   updateState('ac_temp', val);
                   sendCommand(topic, {state: 'ON', temperature: val});
                 }} className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 active:scale-90 transition-transform"><Plus className="w-5 h-5"/></button>
              </div>
            </Card>
            <div className={`flex space-x-3 ${!power ? 'pointer-events-none' : ''}`}>
              <Pill active={mode==='制冷'} onClick={()=>{updateState('ac_mode', '制冷'); sendCommand(topic, {state:'ON', mode:'cool'})}} icon={Droplets} label="制冷" colorClass="bg-blue-500 text-white" />
              <Pill active={mode==='制热'} onClick={()=>{updateState('ac_mode', '制热'); sendCommand(topic, {state:'ON', mode:'heat'})}} icon={Sun} label="制热" colorClass="bg-orange-500 text-white" />
              <Pill active={mode==='除湿'} onClick={()=>{updateState('ac_mode', '除湿'); sendCommand(topic, {state:'ON', mode:'dry'})}} icon={Thermometer} label="除湿" colorClass="bg-cyan-500 text-white" />
              <Pill active={mode==='送风'} onClick={()=>{updateState('ac_mode', '送风'); sendCommand(topic, {state:'ON', mode:'fan_only'})}} icon={Fan} label="送风" colorClass="bg-gray-800 text-white" />
            </div>
            <Card className={`space-y-4 ${!power ? 'pointer-events-none' : ''}`}>
              <div className="flex justify-between items-center"><span className="text-[14px] font-bold text-gray-800">风速控制</span></div>
              <SegmentedControl options={['自动', '低风', '中风', '高风']} active={speed} onChange={(v:string)=>{
                updateState('ac_speed', v);
                const spd = v === '自动' ? 'auto' : v === '低风' ? 'low' : v === '中风' ? 'medium' : 'high';
                sendCommand(topic, {state:'ON', fan_speed: spd});
              }} />
            </Card>
            <button onClick={() => {
              const newState = !power;
              updateState('ac_power', newState);
              sendCommand(topic, { state: newState ? 'ON' : 'OFF' });
            }} className={`w-full py-4 rounded-3xl font-bold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center ${power ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/20' : 'bg-gray-200 text-gray-600'}`}>
              <Power className="w-5 h-5 mr-2" /> {power ? '关闭空调' : '开启空调'}
            </button>
          </div>
        );
      }

      default: return (
        <div className="flex flex-col items-center justify-center h-64">
           <Activity className="w-12 h-12 text-gray-300 mb-4" />
           <p className="text-gray-500 font-medium text-sm">此设备的专属控制面板已就绪</p>
           <p className="text-gray-400 text-xs mt-1">标准指令集可用</p>
        </div>
      );
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#F8FAFC] text-gray-900 flex flex-col w-full h-full">
      <Header />
      <div className="flex-1 overflow-y-auto px-6 pb-12 pt-2 scrollbar-hide">
         {renderContent()}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !isDeleting && setShowDeleteModal(false)}></div>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-500 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">确认删除设备</h3>
            <p className="text-sm text-gray-500 text-center mb-6">确定要删除该设备吗？此操作无法撤销。</p>
            
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-medium rounded-xl text-center">
                {deleteError}
              </div>
            )}

            <div className="flex space-x-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl active:scale-95 transition-all disabled:opacity-50"
              >
                取消
              </button>
              <button 
                onClick={async () => {
                  setIsDeleting(true);
                  setDeleteError('');
                  try {
                    if (onDelete && device?.id) {
                      await onDelete(device.id);
                      setDeleteSuccess(true);
                      setTimeout(() => {
                        setShowDeleteModal(false);
                        onBack();
                      }, 1500);
                    }
                  } catch (err: any) {
                    setDeleteError(err.message || '删除失败，请重试');
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-2xl active:scale-95 transition-all flex items-center justify-center disabled:opacity-70 shadow-lg shadow-red-500/20"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : '确定删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {deleteSuccess && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[110] bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-in slide-in-from-top-4 fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-sm font-bold">删除成功</span>
        </div>
      )}
    </div>
  );
};
