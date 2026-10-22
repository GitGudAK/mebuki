import { useMemo, useState } from "react";
import { guides } from "../../data/guides";
import { useFavorites } from "../favorites";
import { DIFFICULTY_LABEL } from "../meta";
import { GuideCard } from "./GuideCard";

type View = "all" | "saved" | "pet-safe";

const VIEWS: { id: View; label: string }[] = [
  { id: "all", label: "All" },
  { id: "saved", label: "Saved" },
  { id: "pet-safe", label: "Pet safe" },
];

export const Library = () => {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("all");
  const favorites = useFavorites();

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guides.filter((g) => {
      if (view === "saved" && !favorites.includes(g.id)) return false;
      if (view === "pet-safe" && !g.tags.includes("pet safe")) return false;
      if (!q) return true;
      // Search covers everything the old filters did: names, tags and difficulty.
      const haystack = [g.name, g.scientificName, g.hook, DIFFICULTY_LABEL[g.difficulty], ...g.tags]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, view, favorites]);

  return (
    <section className="home" aria-labelledby="home-title">
      <header className="home-top">
        <h1 id="home-title">Mebuki</h1>
      </header>

      <label className="home-search">
        <span className="sr-only">Search plants</span>
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Search plants"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <div className="segmented" role="group" aria-label="Show">
        {VIEWS.map((v) => (
          <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => setView(v.id)}>
            {v.label}
          </button>
        ))}
      </div>

      {shown.length > 0 ? (
        <ul className="tiles">
          {shown.map((g) => (
            <li key={g.id}>
              <GuideCard guide={g} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="home-empty">
          {view === "saved" && !query
            ? "Nothing saved yet. Tap the heart on any plant to keep it here."
            : "No plants match. Try another word."}
        </p>
      )}

      <p className="home-footer">
        Open source. Every tip cites its source.{" "}
        <a href="https://github.com/GitGudAK/mebuki" target="_blank" rel="noopener noreferrer">
          Add a plant on GitHub
        </a>
      </p>
    </section>
  );
};
