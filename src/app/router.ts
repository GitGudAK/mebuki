import { useEffect, useState } from "react";

export type Route = { name: "library" } | { name: "plant"; id: string };

export const parseHash = (hash: string): Route => {
  const path = hash.replace(/^#/, "");
  const match = path.match(/^\/plant\/([^/?#]+)/);
  if (match) return { name: "plant", id: decodeURIComponent(match[1]) };
  return { name: "library" };
};

export const hrefFor = (route: Route): string =>
  route.name === "plant" ? `#/plant/${encodeURIComponent(route.id)}` : "#/";

export const useRoute = (): Route => {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
};
