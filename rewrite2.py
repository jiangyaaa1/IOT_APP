import re

with open('src/components/LiveMqttTester.tsx', 'r') as f:
    content = f.read()

# Let's replace the devices initialization
old_devices = r"const \[devices, setDevices\] = useState<\{id: number, name: string, type: string\}\[\]>\(\[\]\);"
new_devices = """const [devices, setDevices] = useState<{id: number, name: string, type: string}[]>([
    { id: 1, name: '海尔空调', type: 'ac' },
    { id: 2, name: '美的空调', type: 'ac' },
    { id: 3, name: '格力空调', type: 'ac' },
    { id: 4, name: '美的风扇', type: 'fan' },
    { id: 5, name: '卧室的格力空调', type: 'ac' },
    { id: 6, name: '卧室的TCL空调', type: 'ac' },
  ]);"""

content = re.sub(old_devices, new_devices, content)

# Replace the return block
# Find the start of `return (`
match = re.search(r'  return \(\n    <div className="min-h-screen bg-\[#F4F5F7\]', content)
if not match:
    print("Could not find return statement")
    exit(1)

pre_return = content[:match.start()]

new_return = """  return (
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
            <h1 className="text-4xl font-normal tracking-tight text-black">万能遥控</h1>
            <p className="text-[13px] font-medium text-gray-400 mt-3">红外遥控器</p>
          </div>
        </div>

        {/* Device Grid */}
        <div className="px-6 mt-6 grid grid-cols-2 gap-4">
          {devices.map(device => (
            <div 
              key={device.id}
              className="bg-white rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] aspect-[4/3] flex flex-col justify-between items-start"
            >
              <div className="w-10 h-10 flex items-center justify-center text-gray-700">
                {device.type === 'ac' ? (
                  <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9">
                    <rect x="2" y="8" width="20" height="7" rx="1.5" fill="#E2E8F0" />
                    <rect x="2" y="14" width="20" height="1" fill="#475569" />
                    <circle cx="18" cy="11.5" r="0.8" fill="#1E293B" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
                    <circle cx="12" cy="12" r="10" stroke="#E2E8F0" strokeWidth="2" fill="#F8FAFC" />
                    <path d="M12 12C12 8 10 6 12 4C14 6 12 8 12 12Z" fill="#CBD5E1" />
                    <path d="M12 12C16 12 18 10 20 12C18 14 16 12 12 12Z" fill="#CBD5E1" />
                    <path d="M12 12C12 16 14 18 12 20C10 18 12 16 12 12Z" fill="#CBD5E1" />
                    <path d="M12 12C8 12 6 14 4 12C6 10 8 12 12 12Z" fill="#CBD5E1" />
                    <circle cx="12" cy="12" r="2" fill="#94A3B8" />
                  </svg>
                )}
              </div>
              <div className="mt-auto">
                <h3 className="text-[14px] font-medium text-black leading-tight">
                  {device.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
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
                  className="w-24 px-3 bg-gray-50 border-transparent rounded-2xl text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ac">空调</option>
                  <option value="fan">风扇</option>
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
"""

content = pre_return + new_return

with open('src/components/LiveMqttTester.tsx', 'w') as f:
    f.write(content)

print("Rewrite 2 complete.")
