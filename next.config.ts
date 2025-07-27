import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Enable instrumentation hook for Sentry
  experimental: {
    instrumentationHook: true,
  },
  
  // Suppress source map uploading logs during build
  productionBrowserSourceMaps: false,
};

// Wrap the config with Sentry
export default withSentryConfig(
  nextConfig,
  {
    // Sentry options
    silent: true, // Suppresses all Sentry logs during build
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    // Upload options
    widenClientFileUpload: true, // Upload a larger set of source maps
    transpileClientSDK: true, // Transpile SDK to be compatible with IE11
    tunnelRoute: "/monitoring", // Route to tunnel Sentry requests through
    hideSourceMaps: true, // Hide source maps from generated client bundles
    disableLogger: true, // Automatically tree-shake Sentry logger statements
  }
);
