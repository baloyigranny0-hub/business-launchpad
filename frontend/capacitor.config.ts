/// <reference types="@capacitor/cli" />
import { CapacitorConfig } from "@capacitor/cli";

// IMPORTANT: For native builds, set CAPACITOR_SERVER_URL to your deployed Foundry
// backend (e.g. https://your-foundry.example.com). When unset, the app runs as a
// pure web view bundled with the local build (no live server).
const remote = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: "app.foundry.command",
  appName: "Foundry",
  webDir: "build",
  bundledWebRuntime: false,
  ios: {
    contentInset: "always",
  },
  android: {
    allowMixedContent: false,
  },
  ...(remote && { server: { url: remote, cleartext: false } }),
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#0A0F1A",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0A0F1A",
    },
  },
};

export default config;
