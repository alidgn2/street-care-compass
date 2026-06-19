import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.patiharita",
  appName: "PatiHarita",
  webDir: "dist",
  // Hot-reload from the Lovable preview while developing on a device.
  // Remove the `server` block before producing a release build.
  server: {
    url: "https://a2462350-187b-415f-9275-1043a5c68592.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  ios: {
    contentInset: "always",
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#FFF8E7",
      showSpinner: false,
    },
  },
};

export default config;
