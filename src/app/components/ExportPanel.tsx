import { useEffect, useRef, useState } from "react";
import { renderCommand } from "../meta";

export const ExportPanel = ({ id }: { id: string }) => {
  const command = renderCommand(id);
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <section className="export-panel" aria-labelledby="export-title">
      <h2 id="export-title" className="section-title">
        Export video
      </h2>
      <p className="muted">
        Render this guide as a 1080×1920 MP4, ready for Reels, Shorts or TikTok. Run from the
        project root:
      </p>
      <div className="command">
        <code>{command}</code>
        <button type="button" className="copy-button" onClick={copy}>
          {status === "copied" ? "Copied ✓" : status === "failed" ? "Copy failed" : "Copy"}
        </button>
      </div>
      <p className="muted small">
        Or render every guide at once with <code>npm run render:all</code>.
      </p>
    </section>
  );
};
