import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Smartphone,
  WifiOff,
  BatteryCharging,
  ZapOff,
  ArrowRight,
  Info
} from 'lucide-react';
import { PITFALLS_LIST } from '../data/guidesData';

export const PitfallsGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              移动端特有通信问题与避坑指南 (Mobile IoT Pitfalls)
            </h2>
            <p className="text-xs text-slate-400">
              针对手机息屏休眠 (Doze Mode)、客户端 ID 互踢、局域网安全策略、后台保活等硬件开发者最常踩的坑提供权威解决方案
            </p>
          </div>
        </div>
      </div>

      {/* Main Pitfalls Accordion / Tab Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List of Pitfalls (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          {PITFALLS_LIST.map((item, idx) => {
            const isSelected = activeTab === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col space-y-1.5 ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-500 text-amber-200 shadow-md shadow-amber-950/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono">
                    坑点 #{idx + 1}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-800 text-slate-500'}`}>
                    {idx === 0 ? '最高频' : idx === 1 ? '高隐蔽' : idx === 2 ? '权限阻断' : '多线程'}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-200">
                  {item.title.split(' ')[1] || item.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Detail Explanation & Code Solution (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-amber-300 font-mono">
              {PITFALLS_LIST[activeTab]?.title}
            </h3>
          </div>

          {/* Symptom & Root Cause */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 space-y-1.5">
              <div className="font-bold text-rose-400 font-mono flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>❌ 故障表现 (Symptom):</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {PITFALLS_LIST[activeTab]?.symptom}
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 space-y-1.5">
              <div className="font-bold text-amber-400 font-mono flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>🔍 底层成因 (Root Cause):</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {PITFALLS_LIST[activeTab]?.cause}
              </p>
            </div>
          </div>

          {/* Detailed Solutions Checklist */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>标准应对与实战解决方案 (Actionable Solutions):</span>
            </div>

            <div className="space-y-2">
              {PITFALLS_LIST[activeTab]?.solution.map((sol, sIdx) => (
                <div
                  key={sIdx}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start space-x-3 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-slate-200 leading-relaxed">
                    {sol}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Deep Architectural Insight for Background KeepAlive */}
          {activeTab === 0 && (
            <div className="p-3.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs space-y-2 text-cyan-200">
              <div className="font-bold font-mono flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>移动端后台保活架构最佳实践 (业界标准分级):</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 font-mono text-[11px]">
                <li><b className="text-cyan-300">临时切出 / 短暂锁屏:</b> 依靠 MQTT KeepAlive (30s) + AppLifecycle 唤醒重连机制即可满足 95% 调试需求。</li>
                <li><b className="text-cyan-300">工业手持平板 / 持续监控:</b> Android 开启 Foreground Service (常驻前台通知栏服务) + WAKE_LOCK，保持 CPU 和 WiFi 射频不休眠。</li>
                <li><b className="text-cyan-300">消费级大容量 IoT App (如米家/涂鸦):</b> 锁屏后允许断开 MQTT，后台通过 APNs (苹果推送) 或 FCM/个推 实现告警唤醒。</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
