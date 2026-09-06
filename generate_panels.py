import os

CONTENT = """import React, { useState } from 'react';
import { 
  ChevronLeft, Settings, Power, Plus, Minus, Snowflake, Sun, Droplets, Wind, 
  Thermometer, Activity, Radar, DoorOpen, ShieldCheck, ShieldAlert, 
  Camera, Mic, Map, Play, Pause, SkipBack, SkipForward, Speaker, Zap, Music, 
  Tv, Box, Circle, Clock, Battery, AlertTriangle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Flame, Lock, Bell, Check, Navigation, Sliders, Volume2, Cloud
} from 'lucide-react';

// --- Reusable UI Primitives ---

const Card = ({ children, className = '', style = {} }: any) => (
  <div className={`bg-white rounded-[28px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] ${className}`} style={style}>
    {children}
  </div>
);

const Dial = ({ value, unit, label, color = 'text-blue-500' }: any) => (
  <div className="relative w-56 h-56 mx-auto rounded-full border-[6px] border-gray-50 flex flex-col items-center justify-center shadow-[inset_0_2px_16px_rgba(0,0,0,0.02)]">
    <span className={`text-6xl font-light ${color} tracking-tighter`}>{value}<span className="text-2xl text-gray-400 ml-1 font-normal">{unit}</span></span>
    {label && <span className="text-sm font-medium text-gray-400 mt-2">{label}</span>}
  </div>
);

const Pill = ({ active, icon: Icon, label, onClick, colorClass = 'bg-black text-white', defaultClass = 'bg-gray-50 text-gray-600' }: any) => (
  <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center py-4 rounded-3xl transition-all ${active ? colorClass : defaultClass}`}>
    {Icon && <Icon className="w-6 h-6 mb-1.5" />}
    <span className="text-[13px] font-bold">{label}</span>
  </button>
);

const SegmentedControl = ({ options, active, onChange }: any) => (
  <div className="flex bg-gray-100 rounded-full p-1.5 w-full">
    {options.map((opt: string) => (
      <button 
        key={opt}
        onClick={() => onChange(opt)}
        className={`flex-1 py-2.5 rounded-full text-[13px] font-bold transition-all ${active === opt ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
      >
        {opt}
      </button>
    ))}
  </div>
);

const TrendChart = ({ color = '#3B82F6', fill = 'rgba(59,130,246,0.1)' }) => (
  <svg viewBox="0 0 100 30" className="w-full h-16 mt-4">
    <path d="M0,30 L0,20 Q10,10 20,15 T40,25 T60,10 T80,15 T100,5 L100,30 Z" fill={fill} />
    <path d="M0,20 Q10,10 20,15 T40,25 T60,10 T80,15 T100,5" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// --- Device Control Panel Component ---

export const DeviceControlPanel = ({ device, onBack }: { device: any, onBack: () => void }) => {
  const [power, setPower] = useState(true);
  const [val, setVal] = useState(24);
  const [mode, setMode] = useState('auto');
  
  // Generic header
  const Header = () => (
    <div className="flex items-center justify-between p-6 bg-[#F8FAFC]">
      <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-200 transition">
        <ChevronLeft className="w-6 h-6 text-gray-800" />
      </button>
      <h2 className="text-[17px] font-bold text-gray-900 tracking-wide">{device.name}</h2>
      <button className="p-2 -mr-2 rounded-full hover:bg-gray-200 transition">
        <Settings className="w-5 h-5 text-gray-800" />
      </button>
    </div>
  );

  const renderContent = () => {
    switch(device.type) {
      case 'ac': return (
        <div className="space-y-6">
          <Card className="py-8">
            <Dial value={val} unit="°C" label="当前设置" />
            <div className="flex justify-center space-x-10 mt-8">
               <button onClick={()=>setVal(v=>v-1)} className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center shadow-sm text-gray-600 active:scale-95 transition"><Minus className="w-6 h-6"/></button>
               <button onClick={()=>setVal(v=>v+1)} className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center shadow-sm text-gray-600 active:scale-95 transition"><Plus className="w-6 h-6"/></button>
            </div>
          </Card>
          <div className="grid grid-cols-4 gap-3">
            <Pill active={mode==='cool'} onClick={()=>setMode('cool')} icon={Snowflake} label="制冷" colorClass="bg-blue-500 text-white" />
            <Pill active={mode==='heat'} onClick={()=>setMode('heat')} icon={Sun} label="制热" colorClass="bg-orange-500 text-white" />
            <Pill active={mode==='dry'} onClick={()=>setMode('dry')} icon={Droplets} label="除湿" colorClass="bg-cyan-500 text-white" />
            <Pill active={mode==='fan'} onClick={()=>setMode('fan')} icon={Wind} label="送风" colorClass="bg-gray-800 text-white" />
          </div>
          <Card className="space-y-4">
            <div className="flex justify-between items-center"><span className="text-[14px] font-bold text-gray-800">风速控制</span><span className="text-xs text-blue-500 font-bold">自动</span></div>
            <SegmentedControl options={['自动', '低', '中', '高']} active="自动" onChange={()=>{}} />
          </Card>
          <button onClick={() => setPower(!power)} className={`w-full py-4 rounded-3xl font-bold text-[15px] transition-all flex items-center justify-center ${power ? 'bg-black text-white shadow-xl shadow-black/10' : 'bg-gray-200 text-gray-500'}`}>
            <Power className="w-5 h-5 mr-2" /> {power ? '关闭电源' : '开启电源'}
          </button>
        </div>
      );

      case 'light': return (
        <div className="space-y-6">
          <Card className="flex flex-col items-center py-10">
            <div className="w-56 h-56 rounded-full bg-gradient-to-tr from-orange-300 via-yellow-200 to-blue-200 shadow-inner flex items-center justify-center border-4 border-white shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
               <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-sm">
                 <Sun className={`w-12 h-12 ${power ? 'text-yellow-400' : 'text-gray-300'}`} />
               </div>
            </div>
          </Card>
          <Card className="space-y-4">
            <div className="flex justify-between text-xs font-bold text-gray-500"><Sun className="w-4 h-4"/> <span>75%</span> <Sun className="w-5 h-5"/></div>
            <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-400" defaultValue="75" />
          </Card>
          <div className="grid grid-cols-2 gap-4">
             <Pill active={true} label="阅读模式" defaultClass="bg-orange-50 text-orange-700" colorClass="bg-orange-100 text-orange-800" />
             <Pill active={false} label="电影模式" defaultClass="bg-indigo-50 text-indigo-700" />
             <Pill active={false} label="夜间模式" defaultClass="bg-blue-50 text-blue-700" />
             <Pill active={false} label="专注模式" defaultClass="bg-emerald-50 text-emerald-700" />
          </div>
          <button onClick={() => setPower(!power)} className={`w-full py-4 rounded-3xl font-bold text-[15px] transition-all flex items-center justify-center ${power ? 'bg-yellow-400 text-yellow-900 shadow-xl shadow-yellow-400/20' : 'bg-gray-200 text-gray-500'}`}>
            <Power className="w-5 h-5 mr-2" /> {power ? '关闭灯光' : '开启灯光'}
          </button>
        </div>
      );

      case 'fan': return (
        <div className="space-y-6">
          <Card className="py-10">
            <Dial value={3} unit="档" label="风速" color="text-teal-500" />
          </Card>
          <div className="flex space-x-4">
            <Pill active={power} onClick={()=>setPower(!power)} icon={Power} label={power?"已开启":"已关闭"} colorClass="bg-teal-500 text-white" />
            <Pill active={false} icon={ArrowLeft} label="水平摇头" />
          </div>
          <Card className="space-y-4">
            <div className="flex justify-between items-center"><span className="text-[14px] font-bold text-gray-800">运行模式</span></div>
            <SegmentedControl options={['正常风', '自然风', '睡眠风']} active="自然风" onChange={()=>{}} />
          </Card>
        </div>
      );

      case 'temp_hum': return (
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
          <Card>
            <h3 className="text-sm font-bold text-gray-800 mb-2">24小时趋势</h3>
            <TrendChart color="#f97316" fill="rgba(249,115,22,0.1)" />
          </Card>
        </div>
      );

      case 'illuminance': return (
        <div className="space-y-6">
          <Card className="py-12 flex flex-col items-center">
            <Sun className="w-12 h-12 text-yellow-400 mb-4" />
            <h1 className="text-6xl font-light text-gray-900">350<span className="text-2xl text-gray-400 ml-2">Lux</span></h1>
            <div className="mt-6 px-4 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">光线充足 (明亮)</div>
          </Card>
          <Card>
            <h3 className="text-sm font-bold text-gray-800 mb-2">光照历史</h3>
            <TrendChart color="#eab308" fill="rgba(234,179,8,0.15)" />
          </Card>
        </div>
      );

      case 'air_quality': return (
        <div className="space-y-6">
          <Card className="py-8 flex flex-col items-center bg-gradient-to-b from-green-50 to-white">
            <Dial value={42} unit="" label="AQI 空气质量指数" color="text-green-500" />
            <div className="mt-4 px-6 py-2 bg-green-500 text-white rounded-full text-sm font-bold shadow-md shadow-green-500/20">空气优良</div>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Card><div className="text-gray-400 text-xs font-bold mb-1">PM2.5</div><div className="text-xl font-bold text-gray-800">12 <span className="text-[10px] text-gray-400">μg/m³</span></div></Card>
            <Card><div className="text-gray-400 text-xs font-bold mb-1">CO2</div><div className="text-xl font-bold text-gray-800">450 <span className="text-[10px] text-gray-400">ppm</span></div></Card>
            <Card><div className="text-gray-400 text-xs font-bold mb-1">TVOC</div><div className="text-xl font-bold text-gray-800">0.02 <span className="text-[10px] text-gray-400">mg/m³</span></div></Card>
            <Card><div className="text-gray-400 text-xs font-bold mb-1">HCHO (甲醛)</div><div className="text-xl font-bold text-gray-800">0.01 <span className="text-[10px] text-gray-400">mg/m³</span></div></Card>
          </div>
        </div>
      );

      case 'presence': return (
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
          <Card>
            <h3 className="text-sm font-bold text-gray-800 mb-4">最近活动</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs"><span className="text-gray-800 font-medium">检测到移动</span><span className="text-gray-400">14:22</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-400 font-medium">无人存在</span><span className="text-gray-400">12:05</span></div>
            </div>
          </Card>
        </div>
      );

      case 'door_sensor': return (
        <div className="space-y-6">
          <Card className="py-12 flex flex-col items-center bg-red-50/30">
            <DoorOpen className="w-20 h-20 text-red-500 mb-6" />
            <h2 className="text-3xl font-extrabold text-red-600">已打开</h2>
            <div className="flex items-center space-x-1 mt-4 text-xs font-bold text-gray-400">
              <Battery className="w-4 h-4" /> <span>电池 80%</span>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-bold text-gray-800 mb-4">事件日志</h3>
            <div className="space-y-4">
              <div className="flex items-center text-xs"><span className="w-2 h-2 rounded-full bg-red-500 mr-3"></span><span className="text-gray-800 font-medium flex-1">门被打开</span><span className="text-gray-400">刚刚</span></div>
              <div className="flex items-center text-xs"><span className="w-2 h-2 rounded-full bg-gray-300 mr-3"></span><span className="text-gray-500 font-medium flex-1">门已关闭</span><span className="text-gray-400">08:15 AM</span></div>
            </div>
          </Card>
        </div>
      );

      case 'water_leak': return (
        <div className="space-y-6">
          <Card className="py-12 flex flex-col items-center bg-red-600 text-white shadow-xl shadow-red-600/20">
            <AlertTriangle className="w-20 h-20 text-white mb-6 animate-bounce" />
            <h2 className="text-3xl font-extrabold">检测到泄漏！</h2>
            <p className="mt-2 text-red-100 font-medium">厨房水槽下方</p>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Card className="flex flex-col items-center"><Battery className="w-6 h-6 text-green-500 mb-2"/><span className="text-sm font-bold">100%</span></Card>
            <Card className="flex flex-col items-center"><Check className="w-6 h-6 text-gray-400 mb-2"/><span className="text-sm font-bold text-gray-500">解除警报</span></Card>
          </div>
        </div>
      );

      case 'smoke_gas': return (
        <div className="space-y-6">
          <Card className="py-16 flex flex-col items-center bg-green-50/50">
            <ShieldCheck className="w-24 h-24 text-green-500 mb-6" />
            <h2 className="text-3xl font-extrabold text-green-600">环境安全</h2>
            <p className="mt-2 text-sm text-gray-400 font-bold">未检测到烟雾或燃气</p>
          </Card>
          <div className="flex space-x-4">
            <button className="flex-1 py-4 border-2 border-gray-200 text-gray-700 rounded-full font-bold text-sm hover:bg-gray-50">设备自检</button>
            <button className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-full font-bold text-sm cursor-not-allowed">静音报警</button>
          </div>
        </div>
      );

      case 'switch': return (
        <div className="space-y-4">
          {['主灯', '射灯', '走廊灯'].map((name, i) => (
             <Card key={i} className="flex items-center justify-between p-6 cursor-pointer active:scale-95 transition">
                <div className="flex items-center space-x-4">
                   <div className={`w-3 h-3 rounded-full shadow-sm ${i === 0 ? 'bg-green-400 shadow-green-400/50' : 'bg-gray-200'}`}></div>
                   <span className="font-bold text-[15px] text-gray-800">{name}</span>
                </div>
                <div className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors ${i === 0 ? 'bg-green-500' : 'bg-gray-200'}`}>
                   <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${i === 0 ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
             </Card>
          ))}
        </div>
      );

      case 'light_strip': return (
        <div className="space-y-6">
          <Card>
            <div className="h-16 rounded-2xl w-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 shadow-inner"></div>
            <div className="mt-6 flex items-center space-x-4">
               <Sun className="w-5 h-5 text-gray-400" />
               <input type="range" className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none accent-purple-500" defaultValue="100" />
            </div>
          </Card>
          <div className="grid grid-cols-2 gap-4">
             <Card className="flex items-center space-x-3 bg-purple-50 border border-purple-100"><Activity className="w-5 h-5 text-purple-500"/><span className="font-bold text-xs text-purple-800">呼吸灯</span></Card>
             <Card className="flex items-center space-x-3"><Cloud className="w-5 h-5 text-blue-400"/><span className="font-bold text-xs text-gray-600">彩虹流光</span></Card>
             <Card className="flex items-center space-x-3"><Music className="w-5 h-5 text-pink-400"/><span className="font-bold text-xs text-gray-600">音乐律动</span></Card>
             <Card className="flex items-center space-x-3"><Zap className="w-5 h-5 text-yellow-400"/><span className="font-bold text-xs text-gray-600">频闪模式</span></Card>
          </div>
          <button className="w-full py-4 bg-black text-white rounded-full font-bold shadow-lg shadow-black/10 flex items-center justify-center"><Power className="w-5 h-5 mr-2" /> 关闭灯带</button>
        </div>
      );

      case 'curtain': return (
        <div className="space-y-6">
          <Card className="py-12 flex justify-center">
             <div className="w-32 h-40 border-4 border-gray-200 rounded-lg relative overflow-hidden flex bg-blue-50">
                <div className="w-1/4 h-full bg-gray-300 border-r border-gray-400/30"></div>
                <div className="w-1/4 h-full bg-gray-300 absolute right-0 border-l border-gray-400/30"></div>
             </div>
          </Card>
          <Card className="space-y-4">
            <div className="flex justify-between text-xs font-bold text-gray-500"><span>闭合</span> <span>50%</span> <span>全开</span></div>
            <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none accent-blue-500" defaultValue="50" />
          </Card>
          <div className="flex justify-center space-x-6">
             <button className="w-16 h-16 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.05)] flex items-center justify-center text-gray-800 font-bold text-xs">打开</button>
             <button className="w-16 h-16 rounded-full bg-blue-500 shadow-[0_4px_16px_rgba(59,130,246,0.3)] flex items-center justify-center text-white font-bold text-xs">暂停</button>
             <button className="w-16 h-16 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.05)] flex items-center justify-center text-gray-800 font-bold text-xs">关闭</button>
          </div>
        </div>
      );

      case 'lock': return (
        <div className="space-y-6">
          <Card className="py-12 flex flex-col items-center">
            <Lock className="w-20 h-20 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">门已上锁</h2>
            <p className="text-xs text-gray-400 font-bold mt-2">安全防护中</p>
          </Card>
          <div className="bg-black rounded-full p-2 flex items-center shadow-xl shadow-black/10 relative overflow-hidden h-16">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center z-10 absolute left-2"><ArrowRight className="w-5 h-5 text-black" /></div>
             <span className="w-full text-center text-white font-bold text-sm ml-6 opacity-80">滑动远程解锁</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
             <Card className="flex flex-col items-center py-4"><Clock className="w-6 h-6 text-blue-500 mb-2"/><span className="text-xs font-bold">临时密码</span></Card>
             <Card className="flex flex-col items-center py-4"><List className="w-6 h-6 text-purple-500 mb-2"/><span className="text-xs font-bold">开门记录</span></Card>
          </div>
        </div>
      );

      case 'camera': return (
        <div className="space-y-4">
          <div className="w-full aspect-video bg-gray-900 rounded-3xl relative overflow-hidden shadow-lg">
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
             <div className="absolute top-4 left-4 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="text-white text-[10px] font-bold tracking-wider">LIVE</span>
             </div>
             <div className="absolute bottom-4 left-4 text-white text-xs font-mono opacity-80">2026-09-05 14:30:00</div>
          </div>
          <Card className="py-6 flex justify-center">
             <div className="grid grid-cols-3 gap-2 w-40 h-40">
                <div></div>
                <button className="bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-gray-100"><ArrowUp className="w-6 h-6 text-gray-600"/></button>
                <div></div>
                <button className="bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-gray-100"><ArrowLeft className="w-6 h-6 text-gray-600"/></button>
                <div className="bg-blue-500 rounded-full flex items-center justify-center shadow-inner"><Circle className="w-4 h-4 text-white"/></div>
                <button className="bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-gray-100"><ArrowRight className="w-6 h-6 text-gray-600"/></button>
                <div></div>
                <button className="bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-gray-100"><ArrowDown className="w-6 h-6 text-gray-600"/></button>
                <div></div>
             </div>
          </Card>
          <div className="grid grid-cols-4 gap-3">
             <Pill icon={Camera} label="截图" />
             <Pill icon={Camera} label="录像" />
             <Pill icon={Mic} label="通话" colorClass="bg-blue-500 text-white" active={true} />
             <Pill icon={Volume2} label="声音" />
          </div>
        </div>
      );

      case 'doorbell': return (
        <div className="space-y-6">
          <div className="w-full aspect-[3/4] bg-gray-900 rounded-[32px] relative overflow-hidden shadow-xl">
             <div className="absolute top-6 flex justify-center w-full">
                <span className="bg-black/50 backdrop-blur px-4 py-1.5 rounded-full text-white text-xs font-bold tracking-widest">有人按门铃</span>
             </div>
             <div className="absolute bottom-8 w-full flex justify-center space-x-8 px-8">
                <button className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg"><ArrowDown className="w-6 h-6 text-white rotate-[135deg]"/></button>
                <button className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce"><Mic className="w-6 h-6 text-white"/></button>
             </div>
          </div>
          <Card>
            <h3 className="text-sm font-bold text-gray-800 mb-3">快捷回复</h3>
            <div className="space-y-2">
               <div className="p-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-600">请把快递放在门口，谢谢！</div>
               <div className="p-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-600">马上就来，请稍等。</div>
            </div>
          </Card>
        </div>
      );

      case 'robot_vacuum': return (
        <div className="space-y-6">
          <Card className="h-64 bg-blue-50/50 flex flex-col items-center justify-center relative overflow-hidden">
             <Map className="w-full h-full text-blue-100 absolute inset-0 p-4 opacity-50" />
             <div className="w-10 h-10 bg-black rounded-full border-2 border-white shadow-lg relative z-10 animate-pulse"></div>
          </Card>
          <div className="flex space-x-4">
             <button className="flex-1 py-4 bg-blue-600 text-white rounded-full font-bold text-sm shadow-lg shadow-blue-600/20">开始清扫</button>
             <button className="flex-1 py-4 bg-white text-gray-800 rounded-full font-bold text-sm shadow-[0_4px_16px_rgba(0,0,0,0.05)]">回充</button>
          </div>
          <Card className="grid grid-cols-3 divide-x divide-gray-100">
             <div className="text-center"><div className="text-xs text-gray-400 font-bold mb-1">电量</div><div className="font-bold text-gray-800 text-lg">85%</div></div>
             <div className="text-center"><div className="text-xs text-gray-400 font-bold mb-1">已清扫</div><div className="font-bold text-gray-800 text-lg">40 m²</div></div>
             <div className="text-center"><div className="text-xs text-gray-400 font-bold mb-1">时长</div><div className="font-bold text-gray-800 text-lg">30 m</div></div>
          </Card>
        </div>
      );

      case 'washer_heater': return (
        <div className="space-y-6">
          <Card className="py-10">
            <Dial value={45} unit="分" label="剩余时间" color="text-indigo-500" />
            <div className="text-center mt-4 text-sm font-bold text-indigo-600">正在漂洗...</div>
          </Card>
          <Card className="space-y-4">
             <div className="flex justify-between font-bold text-sm text-gray-800"><span>模式</span><span className="text-indigo-500">混合洗</span></div>
             <SegmentedControl options={['棉麻', '混合洗', '快洗', '羽绒服']} active="混合洗" onChange={()=>{}} />
          </Card>
          <div className="grid grid-cols-2 gap-4">
             <Card className="text-center py-4"><span className="text-xs text-gray-400 font-bold block mb-1">水温</span><span className="font-bold text-lg">40°C</span></Card>
             <Card className="text-center py-4"><span className="text-xs text-gray-400 font-bold block mb-1">转速</span><span className="font-bold text-lg">1200 转</span></Card>
          </div>
          <button className="w-full py-4 bg-indigo-600 text-white rounded-full font-bold shadow-lg shadow-indigo-600/20">暂停</button>
        </div>
      );

      case 'plug': return (
        <div className="space-y-6">
          <Card className="py-16 flex flex-col items-center">
             <button onClick={()=>setPower(!power)} className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${power ? 'bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)]' : 'bg-gray-100 shadow-inner'}`}>
               <Power className={`w-12 h-12 ${power ? 'text-white' : 'text-gray-400'}`} />
             </button>
          </Card>
          <div className="grid grid-cols-2 gap-4">
             <Card className="text-center py-6 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
               <div className="text-xs font-bold text-emerald-600 mb-1">当前功率</div>
               <div className="text-2xl font-bold text-gray-900">15.2 <span className="text-sm font-medium text-gray-500">W</span></div>
             </Card>
             <Card className="text-center py-6">
               <div className="text-xs font-bold text-gray-400 mb-1">今日用电</div>
               <div className="text-2xl font-bold text-gray-900">0.5 <span className="text-sm font-medium text-gray-500">kWh</span></div>
             </Card>
          </div>
          <Card className="py-4">
             <div className="flex justify-between items-center text-sm font-bold text-gray-800">
                <div className="flex items-center"><Clock className="w-5 h-5 mr-3 text-emerald-500" /> 定时关闭</div>
                <div className="bg-gray-100 px-3 py-1 rounded-full text-xs">2 小时后</div>
             </div>
          </Card>
        </div>
      );

      case 'tv_projector': return (
        <div className="space-y-6">
          <Card className="py-8 flex justify-center bg-gray-900 rounded-[40px] shadow-2xl">
             <div className="w-56 h-56 rounded-full bg-gray-800 relative flex items-center justify-center shadow-inner">
                <button className="absolute top-4 w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white"><ArrowUp className="w-5 h-5"/></button>
                <button className="absolute bottom-4 w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white"><ArrowDown className="w-5 h-5"/></button>
                <button className="absolute left-4 w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white"><ArrowLeft className="w-5 h-5"/></button>
                <button className="absolute right-4 w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white"><ArrowRight className="w-5 h-5"/></button>
                <button className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">OK</button>
             </div>
          </Card>
          <div className="grid grid-cols-4 gap-4 px-2">
             <button className="bg-white py-4 rounded-2xl flex flex-col items-center justify-center shadow-sm text-gray-800 font-bold text-xs"><Navigation className="w-5 h-5 mb-1"/>主页</button>
             <button className="bg-white py-4 rounded-2xl flex flex-col items-center justify-center shadow-sm text-gray-800 font-bold text-xs"><ArrowLeft className="w-5 h-5 mb-1"/>返回</button>
             <button className="bg-white py-4 rounded-2xl flex flex-col items-center justify-center shadow-sm text-gray-800 font-bold text-xs"><Minus className="w-5 h-5 mb-1"/>音量-</button>
             <button className="bg-white py-4 rounded-2xl flex flex-col items-center justify-center shadow-sm text-gray-800 font-bold text-xs"><Plus className="w-5 h-5 mb-1"/>音量+</button>
          </div>
          <Card>
             <h3 className="text-xs font-bold text-gray-400 mb-3">快捷应用</h3>
             <div className="flex space-x-3 overflow-x-auto pb-2">
                <div className="w-20 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xs shadow-sm flex-shrink-0">NETFLIX</div>
                <div className="w-20 h-12 bg-black rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">YouTube</div>
                <div className="w-20 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">Prime</div>
             </div>
          </Card>
        </div>
      );

      default: return (
        <div className="flex flex-col items-center justify-center h-64">
           <Sliders className="w-12 h-12 text-gray-300 mb-4" />
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
    </div>
  );
};
"""

with open('src/components/DeviceControlPanel.tsx', 'w') as f:
    f.write(CONTENT)

print("Generated DeviceControlPanel.tsx")
