import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.yourcompany.workflowdashboard',
  appName: 'Workflow Dashboard',
  webDir: 'dist',
  backgroundColor: '#0f1218',
  server: {
    androidScheme: 'https',
  },
}

export default config
