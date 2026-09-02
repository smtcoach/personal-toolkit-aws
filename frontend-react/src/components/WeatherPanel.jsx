import { useEffect, useState } from "react";
import {
  DEFAULT_WEATHER_CITY,
  decodeWmo,
  fetchOpenMeteo,
  formatForecastDayLabel,
  formatGeocodeResult,
  getGeoPosition,
  getSavedWeatherCity,
  reverseGeocodeLocation,
  saveWeatherCity,
  searchCities
} from "../weather";

function WeatherPanel() {
  const [city, setCity] = useState(() => getSavedWeatherCity() || DEFAULT_WEATHER_CITY);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  async function loadWeather(nextCity = city) {
    setLoading(true);
    setError("");
    try {
      const data = await fetchOpenMeteo(nextCity.lat, nextCity.lon);
      setWeather(data);
    } catch (err) {
      setError(err.message || "Could not load weather.");
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWeather(city);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch(event) {
    event.preventDefault();
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setSearching(true);
    setError("");
    try {
      setResults(await searchCities(q));
    } catch {
      setError("Search failed. Check your connection.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function chooseCity(result) {
    const nextCity = {
      lat: result.latitude,
      lon: result.longitude,
      label: formatGeocodeResult(result),
      countryCode: (result.country_code || "").toUpperCase()
    };
    saveWeatherCity(nextCity);
    setCity(nextCity);
    setQuery("");
    setResults([]);
    await loadWeather(nextCity);
  }

  async function useLocation() {
    setLoading(true);
    setError("");
    try {
      const pos = await getGeoPosition(12000);
      let place = { label: "Current location", countryCode: "" };
      try {
        place = await reverseGeocodeLocation(pos.lat, pos.lon);
      } catch {
        /* use generic location label */
      }
      const nextCity = { ...pos, label: place.label, countryCode: place.countryCode };
      saveWeatherCity(nextCity);
      setCity(nextCity);
      await loadWeather(nextCity);
    } catch {
      setError("Could not get location. Search for a city instead.");
    } finally {
      setLoading(false);
    }
  }

  const current = weather?.current;
  const decoded = decodeWmo(current?.weather_code);
  const daily = weather?.daily;
  const cityName = city.label.split(",")[0];

  return (
    <section className={error ? "card card-weather is-error" : "card card-weather"} aria-label="Weather">
      <h2 className="card-title">{cityName}</h2>
      <form className="weather-search" onSubmit={runSearch}>
        <input
          type="text"
          className="input-field"
          placeholder="Search city (e.g. London, Tokyo)"
          autoComplete="off"
          aria-label="Search city"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <button type="submit" className="btn-secondary" disabled={searching}>
          Search
        </button>
      </form>
      <button type="button" className="link-btn" onClick={useLocation}>
        Use my location
      </button>
      {results.length ? (
        <ul className="weather-city-results is-open" role="listbox" aria-label="City search results">
          {results.map(result => (
            <li key={`${result.id}-${result.latitude}-${result.longitude}`}>
              <button type="button" role="option" onClick={() => chooseCity(result)}>
                {formatGeocodeResult(result)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="weather-widget-main">
        <div className="weather-icon-wrap" aria-hidden="true">
          {decoded.icon}
        </div>
        <div className="weather-temp-block">
          <div className="weather-temp-line">
            <span className="weather-temp">
              {loading || current?.temperature_2m == null ? "--" : Math.round(current.temperature_2m * 10) / 10}
            </span>
            <span className="weather-unit">°C</span>
          </div>
          <p className="weather-status">{loading ? "Loading..." : error || decoded.text}</p>
        </div>
        <button type="button" className="icon-btn" title="Refresh" aria-label="Refresh weather" onClick={() => loadWeather(city)}>
          ↻
        </button>
      </div>

      <div className="weather-metrics">
        {current?.relative_humidity_2m != null ? <span>Humidity {current.relative_humidity_2m}%</span> : null}
        {current?.wind_speed_10m != null ? <span>Wind {Math.round(current.wind_speed_10m)} km/h</span> : null}
      </div>
      <div className="weather-forecast" aria-label="5-day forecast">
        {daily?.time?.slice(0, 5).map((dateStr, index) => {
          const day = decodeWmo(daily.weather_code?.[index]);
          const high = daily.temperature_2m_max?.[index];
          const low = daily.temperature_2m_min?.[index];
          return (
            <div className="weather-forecast-day" key={dateStr}>
              <div className="weather-forecast-label">{formatForecastDayLabel(dateStr, index)}</div>
              <div className="weather-forecast-icon" aria-hidden="true">
                {day.icon}
              </div>
              <div className="weather-forecast-temps">
                <span className="weather-forecast-hi">{high == null ? "--" : `${Math.round(high)}°`}</span>
                <span className="weather-forecast-lo muted">{low == null ? "--" : `${Math.round(low)}°`}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="weather-footer muted">
        <span>{city.label}</span>
        <span>
          {current?.time
            ? `Updated ${new Date(current.time).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit"
              })}`
            : ""}
        </span>
      </div>
      <p className="card-footnote muted">
        Location & forecast via{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
          Open-Meteo
        </a>
      </p>
    </section>
  );
}

export default WeatherPanel;
