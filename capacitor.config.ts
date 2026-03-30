import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.josephslaughter.rinkratsapp',
  appName: 'Rink Rats',
  webDir: 'public',
  server: {
    url: process.env.CAP_SERVER_URL || 'https://rinkratsapp-josephslaughter808s-projects.vercel.app',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
  },
  backgroundColor: '#07111f',
};

export default config;
