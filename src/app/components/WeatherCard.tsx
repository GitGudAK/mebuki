import { useEffect, useState } from "react";
import type { PlantGuide } from "../../types";
import { type LocalWeather, adviceFor, loadWeather, weatherOptedIn } from "../weather";

type State = { kind: "idle" } | { kind: "loading" } | { kind: "ready"; weather: LocalWeather } | { kind: "error"; denied: boolean };

/** Care advice for this plant and today's local weather. Opt-in: nothing is asked until the user taps. */
export const WeatherCard = ({ guide }: { guide: PlantGuide }) => {
  const [state, setState] = useState<State>({ kind: "idle" });

  const load = () => {
    setState({ kind: "loading" });
    loadWeather()
      .then((weather) => setState({ kind: "ready", weather }))
      .catch((e: { message?: string; code?: number }) =>
        setState({ kind: "error", denied: e?.code === 1 || /denied|permission/i.test(String(e?.message ?? e)) }),
      );
  };

  useEffect(() => {
    if (weatherOptedIn()) load();
  }, [guide.id]);

  if (!guide.climate) return null;

  return (
    <section className="weather-card" aria-labelledby="weather-title">
      <h2 id="weather-title" className="g-section-title">
        Your weather
      </h2>
      {state.kind === "idle" && (
        <button type="button" className="weather-cta" onClick={load}>
          <span>Get advice for {guide.name} in today's weather</span>
          <small>Uses your approximate location, only for the forecast.</small>
        </button>
      )}
      {state.kind === "loading" && <p className="weather-note">Checking the forecast…</p>}
      {state.kind === "error" && (
        <p className="weather-note">
          {state.denied
            ? "Location is off for Mebuki. Turn on approximate location in Settings to get weather advice."
            : "Couldn't reach the forecast. Try again in a moment."}{" "}
          <button type="button" className="weather-retry" onClick={load}>
            Try again
          </button>
        </p>
      )}
      {state.kind === "ready" && (
        <>
          <p className="weather-now">
            {Math.round(state.weather.temp)}°C now · low {Math.round(state.weather.nextLow)}° · high{" "}
            {Math.round(state.weather.todayHigh)}° · {Math.round(state.weather.humidity)}% humidity
          </p>
          <ul className="weather-advice">
            {adviceFor(guide, state.weather).map((a) => (
              <li key={a.text} className={`weather-${a.tone}`}>
                {a.text}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
};
