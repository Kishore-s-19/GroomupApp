import { SpeedInsights } from '@vercel/speed-insights/react';

/**
 * SpeedInsights Component
 * 
 * Wraps Vercel Speed Insights for seamless integration with React.
 * This component collects Web Vitals metrics and sends them to Vercel
 * for performance monitoring and analysis.
 * 
 * The component is configured to work with both modern and legacy
 * Next.js versions (13.5+).
 */
export default function SpeedInsightsComponent() {
  return <SpeedInsights />;
}
