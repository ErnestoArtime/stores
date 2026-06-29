import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cu.stores.marketplace',
  appName: 'Stores Cuba',
  webDir: 'dist/apps/storefront/browser',
  server: {
    androidScheme: 'https'
  }
};

export default config;
