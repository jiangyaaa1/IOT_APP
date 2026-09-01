import React, { useState } from 'react';
import { LiveMqttTester } from './components/LiveMqttTester';

export default function App() {
  const [isBrokerConnected, setIsBrokerConnected] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans selection:bg-blue-500 selection:text-white">
      <LiveMqttTester onConnectionChange={setIsBrokerConnected} />
    </div>
  );
}

