import { Share } from "@capacitor/share";
import type { PlantGuide } from "../types";
import { isNativeApp } from "./platform";

const SITE_URL = "https://gitgudak.github.io/mebuki";

/** Each plant has a public page with a link preview that opens its guide. */
export const shareUrlFor = (guide: PlantGuide) => `${SITE_URL}/p/${guide.id}.html`;

export type ShareResult = "shared" | "copied" | "cancelled";

/** Opens the system share sheet; on browsers without one, copies the link instead. */
export const sharePlant = async (guide: PlantGuide): Promise<ShareResult> => {
  const url = shareUrlFor(guide);
  const title = `${guide.name} care`;
  const text = `${guide.hook} Free plant care guides from Mebuki.`;
  try {
    if (isNativeApp && (await Share.canShare()).value) {
      await Share.share({ title, text, url, dialogTitle: `Share ${guide.name}` });
      return "shared";
    }
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return "shared";
    }
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "cancelled";
  }
};
