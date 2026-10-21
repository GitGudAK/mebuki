import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

/** True inside the iOS app shell, where the CLI export panel makes no sense. */
export const isNativeApp = Capacitor.isNativePlatform();

if (isNativeApp) {
  document.documentElement.classList.add("native");

  // Keep the status bar readable against the app's light or dark theme.
  const darkScheme = window.matchMedia("(prefers-color-scheme: dark)");
  const syncStatusBar = () =>
    StatusBar.setStyle({ style: darkScheme.matches ? Style.Dark : Style.Light }).catch(() => {});
  syncStatusBar();
  darkScheme.addEventListener("change", syncStatusBar);
}

/** Fade out the native launch screen once the app has painted its first screen. */
export const hideLaunchScreen = () => {
  if (!isNativeApp) return;
  requestAnimationFrame(() => SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {}));
};
