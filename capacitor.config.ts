import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.mqttapp',
  appName: 'MqttApp',
  webDir: 'dist',
  server: {
    // 允许从 WebView 发起非加密的 http:// 和 ws:// 网络请求
    cleartext: true,
    // 强制使用 http 协议，避免 Android WebView 的 https 混合内容拦截
    androidScheme: 'http',
    // 明确允许访问局域网 IP
    allowNavigation: [
      '192.168.1.105',
      '*.local'
    ]
  },
  android: {
    // 允许在混合内容模式下加载
    allowMixedContent: true
  }
};

export default config;
