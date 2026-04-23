import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.lapidado.app',
  appName: 'LAPIDADO',
  webDir: 'out',
  server: {
    url: 'https://lapidado.com.br',
    cleartext: true
  }
};

export default config;
