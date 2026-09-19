/**
 * V-Cure Capacitor Production Configuration
 * 
 * Architecture:
 * Android APK Wrapper -> V-Cure Nutrition Web Frontend (server.url: https://v-cure-health.vercel.app)
 *                      -> Render NestJS API (NEXT_PUBLIC_API_BASE_URL: https://v-cure.onrender.com/api/v1)
 *                      -> Supabase PostgreSQL + Storage
 */

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vcure.app',
  appName: 'V-Cure',
  webDir: 'out',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://v-cure.vercel.app',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#047857',
      androidSplashResourceName: 'splash',
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#047857'
    }
  }
};

export default config;



