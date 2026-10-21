// Saved ("favorite") plants. Stored on the device, and on iPhone mirrored into the
// user's own iCloud key-value store so they follow them to their other devices.
// No account and no server: Mebuki never sees this list.

import { useSyncExternalStore } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";

type CloudKVPlugin = {
  get(options: { key: string }): Promise<{ value: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
  addListener(
    event: "change",
    listener: (data: { key: string; value: string | null }) => void,
  ): Promise<{ remove: () => Promise<void> }>;
};

const CloudKV = registerPlugin<CloudKVPlugin>("CloudKV");
const KEY = "mebuki.favorites";

const parse = (raw: string | null | undefined): string[] => {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
};

const readLocal = () => {
  try {
    return parse(localStorage.getItem(KEY));
  } catch {
    return [];
  }
};

const writeLocal = (ids: string[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Private mode or storage full: favorites still work for this session.
  }
};

const cloudAvailable = Capacitor.isPluginAvailable("CloudKV");

let favorites: string[] = readLocal();
const listeners = new Set<() => void>();

const publish = (ids: string[]) => {
  favorites = ids;
  writeLocal(ids);
  listeners.forEach((listener) => listener());
};

if (cloudAvailable) {
  // iCloud wins on launch if it has a list; otherwise seed it from this device.
  CloudKV.get({ key: KEY })
    .then(({ value }) => {
      if (value !== null) publish(parse(value));
      else if (favorites.length) void CloudKV.set({ key: KEY, value: JSON.stringify(favorites) });
    })
    .catch(() => {});
  void CloudKV.addListener("change", ({ key, value }) => {
    if (key === KEY) publish(parse(value));
  });
}

export const toggleFavorite = (id: string) => {
  const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
  publish(next);
  if (cloudAvailable) void CloudKV.set({ key: KEY, value: JSON.stringify(next) }).catch(() => {});
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useFavorites = () => useSyncExternalStore(subscribe, () => favorites, () => favorites);
