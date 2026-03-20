import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',   // what you entered earlier
  appName: 'hockeyapp',       // what you entered earlier
  webDir: 'public',           // placeholder for now
  server: {
    url: 'http://localhost:3000',
    cleartext: true
  }
};

export default config;
