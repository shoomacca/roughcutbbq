"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export default function CapacitorBootstrap() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Initialize Capacitor plugins dynamically on the client
    const initCapacitor = async () => {
      // 1. Status Bar styling
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#1a1a1a" });
      } catch (err) {
        console.error("Failed to set status bar", err);
      }

      // 2. Hardware back button handling
      try {
        const { App } = await import("@capacitor/app");
        await App.addListener("backButton", (data) => {
          if (data.canGoBack) {
            window.history.back();
          } else {
            App.exitApp();
          }
        });
      } catch (err) {
        console.error("Failed to add back button listener", err);
      }

      // 3. Hide Splash Screen on app start after some delay to ensure page is loaded
      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        setTimeout(async () => {
          await SplashScreen.hide();
        }, 800);
      } catch (err) {
        console.error("Failed to hide splash screen", err);
      }
    };

    initCapacitor();
  }, []);

  return null;
}
