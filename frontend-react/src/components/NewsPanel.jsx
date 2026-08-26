import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";

function formatNewsTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = new Date() - date;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function NewsPanel({ auth, setAuth, onAuthExpired }) {
  const [items, setItems] = useState([]);
  const [source, setSource] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNews() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/news", undefined, auth, setAuth, onAuthExpired);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || data.error || "Could not load news.");
        setItems([]);
        return;
      }
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err.message === "Authentication required" ? "" : "Network error. Could not load news.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sources = useMemo(
    () => [...new Set(items.map(item => item.source).filter(Boolean))].sort(),
    [items]
  );
  const visibleItems = source === "all" ? items : items.filter(item => item.source === source);

  return (
    <section className="card card-news" aria-labelledby="newsHeading">
      <div className="card-title-row">
        <h2 className="card-title" id="newsHeading">
          Latest news
        </h2>
        <button type="button" className="icon-btn" title="Refresh" aria-label="Refresh news" onClick={loadNews}>
          ↻
        </button>
      </div>
      {sources.length ? (
        <div className="news-filter-bar">
          <span className="news-filter-label muted">Source</span>
          <div className="news-filter-chips">
            <button type="button" className={source === "all" ? "chip is-active" : "chip"} onClick={() => setSource("all")}>
              All
            </button>
            {sources.map(src => (
              <button
                type="button"
                key={src}
                className={source === src ? "chip is-active" : "chip"}
                onClick={() => setSource(src)}
              >
                {src}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <ul className="news-list">
        {loading ? <li className="news-loading">Loading...</li> : null}
        {error ? <li className="news-error">{error}</li> : null}
        {!loading && !error && !visibleItems.length ? <li className="news-loading">No headlines found.</li> : null}
        {visibleItems.map(item => (
          <li className="news-item" key={`${item.url}-${item.title}`}>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <div className="news-item-main">
                <span className="news-item-title">{item.title}</span>
                <div className="news-item-meta">
                  <span className="news-source">{item.source || "News"}</span>
                  {item.published ? <span>{formatNewsTime(item.published)}</span> : null}
                </div>
              </div>
              <span className="news-external" aria-hidden="true">
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default NewsPanel;
