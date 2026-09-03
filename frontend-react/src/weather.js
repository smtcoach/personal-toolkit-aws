const WEATHER_STORAGE_KEY = "clouddesk_weatherCity";

export const DEFAULT_WEATHER_CITY = {
  lat: 45.4215,
  lon: -75.6972,
  label: "Ottawa, Ontario, Canada",
  countryCode: "CA"
};

export function getSavedWeatherCity() {
  try {
    const raw = localStorage.getItem(WEATHER_STORAGE_KEY);
    if (!raw) return null;
    const city = JSON.parse(raw);
    if (typeof city?.lat !== "number" || typeof city?.lon !== "number" || !city.label) return null;
    return city;
  } catch {
    return null;
  }
}

export function saveWeatherCity(city) {
  localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(city));
}

export function decodeWmo(code) {
  if (code == null || Number.isNaN(Number(code))) return { icon: "☁", text: "Current conditions" };
  const c = Number(code);
  if (c === 0) return { icon: "☀", text: "Clear" };
  if (c === 1) return { icon: "◐", text: "Mostly clear" };
  if (c === 2) return { icon: "⛅", text: "Partly cloudy" };
  if (c === 3) return { icon: "☁", text: "Overcast" };
  if (c >= 45 && c <= 48) return { icon: "≋", text: "Fog" };
  if (c >= 51 && c <= 57) return { icon: "⌇", text: "Drizzle" };
  if (c >= 61 && c <= 67) return { icon: "☂", text: "Rain" };
  if (c >= 71 && c <= 77) return { icon: "❄", text: "Snow" };
  if (c >= 80 && c <= 82) return { icon: "☂", text: "Showers" };
  if (c >= 85 && c <= 86) return { icon: "❄", text: "Snow showers" };
  if (c >= 95 && c <= 99) return { icon: "⚡", text: "Thunderstorm" };
  return { icon: "☁", text: "Current conditions" };
}

export function formatForecastDayLabel(dateStr, index) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  const date = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

export function formatGeocodeResult(result) {
  return [result.name, result.admin1, result.country].filter(Boolean).join(", ");
}

export async function searchCities(query) {
  const q = query.trim();
  if (!q) return [];
  const lang = /[\u3400-\u9FFF\u3040-\u30FF]/.test(q) ? "zh" : "en";
  const params = new URLSearchParams({
    name: q,
    count: "10",
    language: lang,
    format: "json"
  });
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if (!res.ok) throw new Error("City search failed");
  const data = await res.json();
  return Array.isArray(data.results) ? data.results : [];
}

export async function fetchOpenMeteo(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "weather_code",
      "wind_speed_10m"
    ].join(","),
    daily: ["weather_code", "temperature_2m_max", "temperature_2m_min"].join(","),
    forecast_days: "5",
    wind_speed_unit: "kmh",
    timezone: "auto"
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error("Weather API error");
  return res.json();
}

export function getGeoPosition(ms) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not available"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: "Your location" });
      },
      err => {
        reject(err);
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: ms }
    );
  });
}

export async function reverseGeocodeLocation(lat, lon) {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(lat),
    lon: String(lon),
    zoom: "10",
    addressdetails: "1"
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error("Reverse geocoding failed");
  const data = await res.json();
  const addr = data?.address || {};
  const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
  const label = [city, addr.state, addr.country].filter(Boolean).join(", ");
  return {
    label: label || "Current location",
    countryCode: (addr.country_code || "").toUpperCase()
  };
}
