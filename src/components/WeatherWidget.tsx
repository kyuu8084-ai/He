import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Loader2 } from 'lucide-react';

interface WeatherData {
  temperature: number;
  code: number;
}

export function WeatherWidget({ className = '', language = 'en' }: { className?: string, language?: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (!navigator.geolocation) {
      if (mounted) {
        setError('Geolocation not supported');
        setLoading(false);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&current=temperature_2m,weather_code`);
          if (!res.ok) throw new Error('Failed to fetch weather');
          const data = await res.json();
          if (mounted) {
            setWeather({
              temperature: Math.round(data.current.temperature_2m),
              code: data.current.weather_code
            });
            setLoading(false);
          }
        } catch (err) {
          if (mounted) {
            setError('Weather unavailable');
            setLoading(false);
          }
        }
      },
      (err) => {
        if (mounted) {
          setError('Location denied');
          setLoading(false);
        }
      },
      { timeout: 10000 }
    );

    return () => {
      mounted = false;
    };
  }, []);

  if (error || !weather) {
    return null;
  }

  // WMO Weather interpretation codes
  // 0: Clear sky
  // 1, 2, 3: Mainly clear, partly cloudy, and overcast
  // 45, 48: Fog
  // 51, 53, 55: Drizzle
  // 56, 57: Freezing Drizzle
  // 61, 63, 65: Rain
  // 66, 67: Freezing Rain
  // 71, 73, 75: Snow fall
  // 77: Snow grains
  // 80, 81, 82: Rain showers
  // 85, 86: Snow showers
  // 95: Thunderstorm
  // 96, 99: Thunderstorm with hail

  let WeatherIcon = Sun;
  let label = language === 'vi' ? 'Trời Quang' : 'Clear';
  
  if (weather.code >= 1 && weather.code <= 3) {
    WeatherIcon = Cloud;
    label = language === 'vi' ? 'Nhiều Mây' : 'Cloudy';
  } else if (weather.code === 45 || weather.code === 48) {
    WeatherIcon = Cloud;
    label = language === 'vi' ? 'Sương Mù' : 'Fog';
  } else if ((weather.code >= 51 && weather.code <= 67) || (weather.code >= 80 && weather.code <= 82)) {
    WeatherIcon = CloudRain;
    label = language === 'vi' ? 'Mưa' : 'Rain';
  } else if ((weather.code >= 71 && weather.code <= 77) || weather.code === 85 || weather.code === 86) {
    WeatherIcon = CloudSnow;
    label = language === 'vi' ? 'Tuyết' : 'Snow';
  } else if (weather.code >= 95) {
    WeatherIcon = CloudLightning;
    label = language === 'vi' ? 'Bão' : 'Storm';
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 backdrop-blur-md ${className}`}>
      <WeatherIcon size={14} className="opacity-80" />
      <span className="text-xs font-bold uppercase tracking-wider">{weather.temperature}°C</span>
    </div>
  );
}
