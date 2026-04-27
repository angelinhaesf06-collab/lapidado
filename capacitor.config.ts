import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lapidado.vendas',
  appName: 'LAPIDADO',
  webDir: 'out',
  server: {
    url: 'https://lapidado.com.br',
    cleartext: true
  }
};

export default config;
