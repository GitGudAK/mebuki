import { useMemo, useState } from "react";
import { guides } from "../../data/guides";
import type { Difficulty } from "../../types";
import { DIFFICULTIES, DIFFICULTY_LABEL } from "../meta";
import { GuideCard } from "./GuideCard";
import { useFavorites } from "../favorites";

const FEATURED_TAGS = ["beginner", "low light", "pet safe", "edible", "balcony", "windowsill", "hanging"];

export const Library = () => {
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [savedOnly, setSavedOnly] = useState(false);
  const favorites = useFavorites();

  // Tags present in the data, featured ones first, then by frequency.
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of guides) for (const t of g.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.keys()].sort((a, b) => {
      const fa = FEATURED_TAGS.indexOf(a);
      const fb = FEATURED_TAGS.indexOf(b);
      if (fa !== -1 || fb !== -1) return (fa === -1 ? 99 : fa) - (fb === -1 ? 99 : fb);
      return (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guides.filter((g) => {
      if (savedOnly && !favorites.includes(g.id)) return false;
      if (difficulty && g.difficulty !== difficulty) return false;
      if (activeTags.some((t) => !g.tags.includes(t))) return false;
      if (!q) return true;
      const haystack = [g.name, g.scientificName, g.hook, ...g.tags].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [query, activeTags, difficulty, savedOnly, favorites]);

  const toggleTag = (tag: string) =>
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const hasFilters = query !== "" || activeTags.length > 0 || difficulty !== null || savedOnly;
  const clearAll = () => {
    setSavedOnly(false);
    setQuery("");
    setActiveTags([]);
    setDifficulty(null);
  };

  return (
    <section className="library" aria-labelledby="library-title">
      <div className="library-intro">
        <h1 id="library-title">Plant library</h1>
        <p className="muted">
          Pick a plant, press play, and learn its care routine in under a minute.
        </p>
      </div>

      <div className="filters">
        <label className="search">
          <span className="sr-only">Search plants</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="search-icon">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Search by name, Latin name or tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <div className="chip-row" role="group" aria-label="Filter plants">
          <button
            type="button"
            className="chip chip-saved"
            aria-pressed={savedOnly}
            onClick={() => setSavedOnly((v) => !v)}
          >
            ♥ Saved{favorites.length > 0 ? ` (${favorites.length})` : ""}
          </button>
          <span className="chip-divider" aria-hidden="true" />
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              className={`chip chip-difficulty diff-${d}`}
              aria-pressed={difficulty === d}
              onClick={() => setDifficulty((cur) => (cur === d ? null : d))}
            >
              {DIFFICULTY_LABEL[d]}
            </button>
          ))}
          <span className="chip-divider" aria-hidden="true" />
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="chip"
              aria-pressed={activeTags.includes(tag)}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="results-bar">
          <span className="muted" aria-live="polite">
            {filtered.length} of {guides.length} {guides.length === 1 ? "guide" : "guides"}
          </span>
          {hasFilters && (
            <button type="button" className="link-button" onClick={clearAll}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {filtered.length > 0 ? (
        <ul className="guide-grid">
          {filtered.map((g) => (
            <li key={g.id}>
              <GuideCard guide={g} />
            </li>
          ))}
        </ul>
      ) : savedOnly && favorites.length === 0 ? (
        <div className="empty-state">
          <p className="empty-emoji" aria-hidden="true">♡</p>
          <h2>No saved plants yet</h2>
          <p>Tap the heart on any plant to keep it here.</p>
          <button type="button" className="button" onClick={clearAll}>
            Show all plants
          </button>
        </div>
      ) : (
        <div className="empty-state">
          <p className="empty-emoji" aria-hidden="true">🔍</p>
          <h2>No plants match</h2>
          <p>Try fewer filters or a different search.</p>
          <button type="button" className="button" onClick={clearAll}>
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
};
