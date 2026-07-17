import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../api";
import { getMovieRegionFromWeatherCity } from "../weather";

function MoviesPanel({ auth, setAuth, onAuthExpired, locationVersion }) {
  const [tab, setTab] = useState("now");
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const cache = useRef(new Map());

  async function loadMovies(nextTab = tab, nextPage = page, force = false) {
    setLoading(true);
    setError("");
    try {
      const region = getMovieRegionFromWeatherCity();
      const cacheKey = `${region}:${nextTab}:${nextPage}`;
      if (!force && cache.current.has(cacheKey)) {
        setPayload(cache.current.get(cacheKey));
        return;
      }
      const params = new URLSearchParams({
        region,
        category: nextTab,
        page: String(nextPage)
      });
      const res = await apiFetch(`/movies?${params}`, undefined, auth, setAuth, onAuthExpired);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || data.error || "Could not load movies.");
        setPayload(null);
        return;
      }
      const nextPayload = {
        region: data.region || region,
        category: data.category || nextTab,
        page: Number(data.page || nextPage),
        totalPages: Number(data.totalPages || 1),
        totalResults: Number(data.totalResults || 0),
        items: Array.isArray(data.items) ? data.items : []
      };
      cache.current.set(cacheKey, nextPayload);
      setPayload(nextPayload);
    } catch (err) {
      setError(err.message === "Authentication required" ? "" : "Network error. Could not load movies.");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
    loadMovies(tab, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, locationVersion]);

  function changePage(nextPage) {
    setPage(nextPage);
    loadMovies(tab, nextPage);
  }

  const items = payload?.items || [];
  const totalPages = Math.max(1, payload?.totalPages || 1);

  return (
    <section className="card card-movies" aria-label="Local movies">
      <div className="card-title-row">
        <h2 className="card-title">Local movies</h2>
        <button type="button" className="icon-btn" title="Refresh" aria-label="Refresh movie list" onClick={() => loadMovies(tab, page, true)}>
          ↻
        </button>
      </div>
      <p className="muted card-sub">Now playing and coming soon · TMDB</p>
      <div className="movies-toolbar">
        <p className="movies-region" aria-live="polite">
          {(payload?.region || getMovieRegionFromWeatherCity()) === "CA" ? "Canada" : payload?.region || getMovieRegionFromWeatherCity()}
        </p>
        <div className="movies-tabs" role="tablist" aria-label="Movie category">
          <button
            type="button"
            className={tab === "now" ? "chip is-active" : "chip"}
            role="tab"
            aria-selected={tab === "now"}
            onClick={() => setTab("now")}
          >
            Now playing
          </button>
          <button
            type="button"
            className={tab === "upcoming" ? "chip is-active" : "chip"}
            role="tab"
            aria-selected={tab === "upcoming"}
            onClick={() => setTab("upcoming")}
          >
            Coming soon
          </button>
        </div>
      </div>
      <div className="movies-list" role="tabpanel">
        {loading ? <p className="movies-panel-note muted">Loading movies...</p> : null}
        {error ? <p className="movies-panel-error">{error}</p> : null}
        {!loading && !error && !items.length ? <p className="movies-panel-note muted">No movies found for this region right now.</p> : null}
        {items.map(movie => (
          <a className="movie-card" href={movie.tmdbUrl || "#"} target="_blank" rel="noopener noreferrer" key={`${movie.tmdbUrl}-${movie.title}`}>
            {movie.posterUrl ? (
              <img className="movie-poster" src={movie.posterUrl} alt="" loading="lazy" />
            ) : (
              <div className="movie-poster movie-poster-fallback" aria-hidden="true">
                🎬
              </div>
            )}
            <div className="movie-info">
              <h3 className="movie-title">{movie.title || "Untitled"}</h3>
              <div className="movie-meta muted">
                {movie.releaseDate ? <span>{movie.releaseDate}</span> : null}
                {movie.rating != null ? <span>★ {movie.rating}</span> : null}
              </div>
              <p className="movie-overview">{movie.overview || "No synopsis available."}</p>
            </div>
          </a>
        ))}
      </div>
      <div className="movies-pagination" aria-label="Movie pagination">
        <button type="button" className="btn-secondary" disabled={loading || page <= 1} onClick={() => changePage(Math.max(1, page - 1))}>
          Previous
        </button>
        <span className="movies-page-label muted">
          Page {page} of {totalPages}
        </span>
        <button type="button" className="btn-secondary" disabled={loading || page >= totalPages} onClick={() => changePage(page + 1)}>
          Next
        </button>
      </div>
      <p className="card-footnote muted">
        Movie data and images via{" "}
        <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">
          TMDB
        </a>
      </p>
    </section>
  );
}

export default MoviesPanel;
