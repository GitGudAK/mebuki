import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gitgudak.sprout",
  appName: "Sprout",
  webDir: "dist",
  backgroundColor: "#0e2519",
  ios: {
    contentInset: "never",
    scheme: "Sprout",
  },
  plugins: {
    // Hidden from src/app/main.tsx as soon as the first screen renders;
    // the duration is only a fallback in case that never happens.
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#0e2519",
      showSpinner: false,
    },
  },
};

export default config;
