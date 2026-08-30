export interface MqttMessage {
  id: string;
  topic: string;
  payload: string;
  qos: 0 | 1 | 2;
  retain: boolean;
  timestamp: string;
  direction: 'inbound' | 'outbound';
}

export interface BrokerConfig {
  protocol: 'ws' | 'wss' | 'tcp';
  host: string;
  port: number;
  path: string;
  clientId: string;
  username?: string;
  password?: string;
  keepAlive: number;
  cleanSession: boolean;
  reconnectPeriod: number;
}

export interface TelemetryData {
  voltage: number;
  current: number;
  temperature: number;
  motorRpm: number;
  status: 'IDLE' | 'RUNNING' | 'FAULT' | 'ESTOP';
}

export type FrameworkType = 'flutter' | 'react-native' | 'flet';
