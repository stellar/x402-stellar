import { Router, type Router as RouterType } from "express";
import { Env, NETWORK_META } from "../config/env.js";
import { logger } from "../utils/logger.js";

const router: RouterType = Router();

const OPEN_METEO_GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

/**
 * WMO Weather interpretation codes → human-readable descriptions.
 * @see https://open-meteo.com/en/docs#weathervariables
 */
const WMO_CODES: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "foggy",
  48: "depositing rime fog",
  51: "light drizzle",
  53: "moderate drizzle",
  55: "dense drizzle",
  56: "light freezing drizzle",
  57: "dense freezing drizzle",
  61: "slight rain",
  63: "moderate rain",
  65: "heavy rain",
  66: "light freezing rain",
  67: "heavy freezing rain",
  71: "slight snowfall",
  73: "moderate snowfall",
  75: "heavy snowfall",
  77: "snow grains",
  80: "slight rain showers",
  81: "moderate rain showers",
  82: "violent rain showers",
  85: "slight snow showers",
  86: "heavy snow showers",
  95: "thunderstorm",
  96: "thunderstorm with slight hail",
  99: "thunderstorm with heavy hail",
};

interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

interface ForecastCurrent {
  temperature_2m: number;
  relative_humidity_2m: number;
  weather_code: number;
  wind_speed_10m: number;
}

async function geocodeCity(city: string): Promise<GeocodingResult | null> {
  const url = `${OPEN_METEO_GEOCODE_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { results?: GeocodingResult[] };
  return data.results?.[0] ?? null;
}

async function fetchForecast(lat: number, lon: number): Promise<ForecastCurrent | null> {
  const url =
    `${OPEN_METEO_FORECAST_URL}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { current?: ForecastCurrent };
  return data.current ?? null;
}

const validSuffixes = Env.networksConfig.map((n) => NETWORK_META[n.network].routeSuffix);

router.get("/weather/:network", async (req, res) => {
  if (!Env.paywallDisabled && !validSuffixes.includes(req.params.network)) {
    res.status(404).json({ error: "Network not found" });
    return;
  }

  const cityParam = (req.query.city as string | undefined)?.trim();
  if (!cityParam) {
    res.status(400).json({ error: "Missing required query parameter: city" });
    return;
  }

  try {
    const location = await geocodeCity(cityParam);
    if (!location) {
      res.status(404).json({ error: `City not found: ${cityParam}` });
      return;
    }

    const current = await fetchForecast(location.latitude, location.longitude);
    if (!current) {
      res.status(502).json({ error: "Failed to fetch forecast from upstream" });
      return;
    }

    res.json({
      city: location.name,
      region: location.admin1 ?? null,
      country: location.country,
      coordinates: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      current: {
        weather: WMO_CODES[current.weather_code] ?? `unknown (code ${current.weather_code})`,
        weather_code: current.weather_code,
        temperature_f: current.temperature_2m,
        humidity_pct: current.relative_humidity_2m,
        wind_speed_mph: current.wind_speed_10m,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err, city: cityParam }, "Weather API upstream error");
    res.status(502).json({ error: "Upstream weather service unavailable" });
  }
});

export { router as apiRouter };
