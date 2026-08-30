import React, { useState } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { LiveMqttTester } from './components/LiveMqttTester';
import { AnalogyConverter } from './components/AnalogyConverter';
import { LifecycleFlow } from './components/LifecycleFlow';
import { CodeExplorer } from './components/CodeExplorer';
import { PitfallsGuide } from './components/PitfallsGuide';
import {
  Radio,
  Cpu,
  Layers,
  Code2,
  AlertTriangle,
  Github,
  CheckCircle2,
  Terminal,
  Zap,
  ArrowUpRight
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('simulator');
  const [isBrokerConnected, setIsBrokerConnected] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isBrokerConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {activeTab === 'simulator' && (
          <LiveMqttTester onConnectionChange={setIsBrokerConnected} />
        )}
        {activeTab === 'analogies' && <AnalogyConverter />}
        {activeTab === 'lifecycle' && <LifecycleFlow />}
        {activeTab === 'code' && <CodeExplorer />}
        {activeTab === 'pitfalls' && <PitfallsGuide />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-cyan-500" />
            <span className="font-semibold text-slate-400">
              IoT MQTT Mobile Studio
            </span>
            <span>—</span>
            <span>专为嵌入式与电控开发者设计的移动端跨平台架构方案</span>
          </div>

          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span className="text-slate-600">MQTT v3.1.1 / v5.0 Compatible</span>
            <span className="text-cyan-500/80">Flutter / Dart & React Native</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
