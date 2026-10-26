import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import type { PlantGuide } from "../types";

/** The forecast the advice is built from: today, tonight and tomorrow. */
export type LocalWeather = {
  /** Temperature now, °C. */
  temp: number;
  /** Relative humidity now, %. */
  humidity: number;
  todayHigh: number;
  /** Lowest temperature over the next two nights. */
  nextLow: number;
  /** Rain expected today, mm. */
  rainToday: number;
  fetchedAt: number;
};

const OPT_IN = "mebuki.weather";
const CACHE = "mebuki.weather.cache";
const MAX_AGE = 60 * 60 * 1000;

export const weatherOptedIn = () => {
  try {
    return localStorage.getItem(OPT_IN) === "1";
  } catch {
    return false;
  }
};

/**
 * Approximate position only: iOS gives the app a reduced-accuracy location, and we round it
 * to one decimal place (about 10 km) before it leaves the phone.
 */
const approximatePosition = async (): Promise<[number, number]> => {
  if (Capacitor.isNativePlatform()) {
    const status = await Geolocation.requestPermissions({ permissions: ["coarseLocation"] });
    if (status.coarseLocation !== "granted" && status.location !== "granted") throw new Error("denied");
    const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: MAX_AGE });
    return [p.coords.latitude, p.coords.longitude];
  }
  const p = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 15000, maximumAge: MAX_AGE }),
  );
  return [p.coords.latitude, p.coords.longitude];
};

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Asks for approximate location (the first time) and returns the local forecast from Open-Meteo. */
export const loadWeather = async (): Promise<LocalWeather> => {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE) ?? "null") as LocalWeather | null;
    if (cached && Date.now() - cached.fetchedAt < MAX_AGE) return cached;
  } catch {
    /* no cache */
  }
  const [lat, lon] = (await approximatePosition()).map(round1);
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    "&current=temperature_2m,relative_humidity_2m" +
    "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=3&timezone=auto";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`weather ${res.status}`);
  const data = await res.json();
  const weather: LocalWeather = {
    temp: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    todayHigh: data.daily.temperature_2m_max[0],
    nextLow: Math.min(data.daily.temperature_2m_min[1], data.daily.temperature_2m_min[2] ?? Infinity),
    rainToday: data.daily.precipitation_sum[0] ?? 0,
    fetchedAt: Date.now(),
  };
  try {
    localStorage.setItem(OPT_IN, "1");
    localStorage.setItem(CACHE, JSON.stringify(weather));
  } catch {
    /* private mode */
  }
  return weather;
};

export type Advice = { tone: "warn" | "tip" | "ok"; text: string };

const t = (n: number) => `${Math.round(n)}°C`;

/** Turns today's forecast and the plant's climate limits into a few plain instructions. */
export const adviceFor = (guide: PlantGuide, w: LocalWeather): Advice[] => {
  const c = guide.climate;
  if (!c) return [];
  const [idealLo, idealHi] = c.idealTempC;
  const name = guide.name;
  const out: Advice[] = [];
  const canGoOut = c.outdoors !== "never";

  if (canGoOut && w.nextLow < c.minTempC + 2) {
    out.push({ tone: "warn", text: `Bring it inside tonight. It drops to ${t(w.nextLow)}, and ${name} is damaged below ${t(c.minTempC)}.` });
  } else if (!canGoOut && w.nextLow < 5 && c.minTempC >= 10) {
    out.push({ tone: "warn", text: `Cold night outside (${t(w.nextLow)}). Move it off the window ledge and away from drafts.` });
  }

  if (w.todayHigh >= c.maxTempC) {
    out.push({ tone: "warn", text: `Heat today (${t(w.todayHigh)}). Keep it out of direct afternoon sun and check the soil daily.` });
  } else if (w.todayHigh > idealHi && c.humidity !== "low") {
    out.push({ tone: "tip", text: `Warmer than it likes (${t(w.todayHigh)}). Check the soil a day or two sooner than usual.` });
  }

  if (c.humidity === "high" && w.humidity < 40) {
    out.push({ tone: "tip", text: `Dry air (${Math.round(w.humidity)}%). Group it with other plants or stand it on a tray of wet pebbles.` });
  } else if (c.humidity === "low" && w.humidity > 75) {
    out.push({ tone: "tip", text: `Humid spell (${Math.round(w.humidity)}%). Water less and keep air moving around it.` });
  }

  if (canGoOut && w.rainToday >= 5 && w.nextLow >= c.minTempC + 2) {
    out.push({ tone: "tip", text: `${Math.round(w.rainToday)} mm of rain today. If it's on a balcony, skip watering.` });
  }

  if (canGoOut && !out.some((a) => a.tone === "warn") && w.nextLow >= idealLo && w.todayHigh <= idealHi + 3) {
    out.push({ tone: "ok", text: `Warm enough for a balcony or open window: ${t(w.nextLow)}–${t(w.todayHigh)}.` });
  }

  if (!out.length) {
    out.push({ tone: "ok", text: `Today's weather suits it: ${t(w.nextLow)}–${t(w.todayHigh)}, ${Math.round(w.humidity)}% humidity.` });
  }
  return out;
};
