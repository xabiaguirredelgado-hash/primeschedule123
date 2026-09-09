// Configuración global de la aplicación
const config = {
  appName: 'PrimeScheduler',
  apiBase: process.env.NEXT_PUBLIC_API_BASE || '/api',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
};

export default config;


