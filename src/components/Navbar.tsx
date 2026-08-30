import React from 'react';
import { Radio, Cpu, BookOpen, Code2, AlertTriangle, PlayCircle } from 'lucide-react';

export type TabType = 'simulator' | 'analogies' | 'lifecycle' | 'code' | 'pitfalls';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, isConnected }) => {
  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'simulator',
      label: '真机/虚拟 MCU 联调台',
      icon: <PlayCircle className="w-4 h-4" />,
      badge: isConnected ? '已连通' : '就绪'
    },
    {
      id: 'analogies',
      label: '嵌入式 ⇄ 移动端 思维映射',
      icon: <Cpu className="w-4 h-4" />
    },
    {
      id: 'lifecycle',
      label: '生命周期与报文时序',
      icon: <Radio className="w-4 h-4" />
    },
    {
      id: 'code',
      label: '实战可运行工程代码',
      icon: <Code2 className="w-4 h-4" />,
      badge: 'Flutter推荐'
    },
    {
      id: 'pitfalls',
      label: '移动端避坑与后台保活',
      icon: <AlertTriangle className="w-4 h-4" />
    }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  IoT MQTT Mobile Studio
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono hidden sm:inline-block">
                  Embedded-to-Mobile
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans hidden md:block">
                专为 C++/Python 电控与嵌入式开发者打造的移动端通信实战工作台
              </p>
            </div>
          </div>

          {/* Connection quick pill */}
          <div className="hidden lg:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300 font-medium">
              {isConnected ? 'MQTT Broker 已连接' : 'MQTT 客户端待命'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none py-1 border-t border-slate-800/80">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-btn-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
