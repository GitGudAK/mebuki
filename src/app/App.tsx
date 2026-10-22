import { useEffect } from "react";
import { getGuide } from "../data/guides";
import { Library } from "./components/Library";
import { GuideDetail } from "./components/GuideDetail";
import { hrefFor, useRoute } from "./router";

export const App = () => {
  const route = useRoute();
  const guide = route.name === "plant" ? getGuide(route.id) : undefined;

  // Lets the guide's stage run full bleed under the status bar.
  useEffect(() => {
    document.documentElement.classList.toggle("route-detail", route.name === "plant");
  }, [route.name]);

  return (
    <div className={`app${route.name === "plant" ? " is-detail" : ""}`}>
      <main className="site-main">
        {route.name === "library" && <Library />}
        {route.name === "plant" && guide && <GuideDetail key={guide.id} guide={guide} />}
        {route.name === "plant" && !guide && (
          <div className="empty-state">
            <p className="empty-emoji" aria-hidden="true">🥀</p>
            <h2>We couldn't find that plant</h2>
            <p>
              There's no guide called <code>{route.id}</code>.
            </p>
            <a className="button" href={hrefFor({ name: "library" })}>
              Back to the library
            </a>
          </div>
        )}
      </main>
    </div>
  );
};
