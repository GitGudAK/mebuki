import { toggleFavorite, useFavorites } from "../favorites";

type HeartButtonProps = { id: string; name: string; className?: string };

export const HeartButton = ({ id, name, className = "" }: HeartButtonProps) => {
  const saved = useFavorites().includes(id);
  return (
    <button
      type="button"
      className={`heart-button${saved ? " is-saved" : ""} ${className}`.trim()}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from saved plants` : `Save ${name}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(id);
      }}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          d="M12 20.5s-7.5-4.6-7.5-10.1C4.5 7.6 6.6 5.5 9.2 5.5c1.3 0 2.3.6 2.8 1.5.5-.9 1.5-1.5 2.8-1.5 2.6 0 4.7 2.1 4.7 4.9 0 5.5-7.5 10.1-7.5 10.1z"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};
