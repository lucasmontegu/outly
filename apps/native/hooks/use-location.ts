import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";

export type LocationCoords = {
  lat: number;
  lng: number;
};

export type LocationState = {
  location: LocationCoords | null;
  address: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useLocation(): LocationState {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setError("Location permission denied");
        setIsLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setLocation(coords);

      // Reverse geocode to get address
      try {
        const [geocode] = await Location.reverseGeocodeAsync({
          latitude: coords.lat,
          longitude: coords.lng,
        });

        if (geocode) {
          const addressParts = [
            geocode.district,
            geocode.subregion,
            geocode.city,
          ].filter(Boolean);
          setAddress(addressParts[0] || geocode.name || "Unknown location");
        }
      } catch {
        // Geocoding failed, use coordinates as fallback
        setAddress(`${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get location");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return {
    location,
    address,
    isLoading,
    error,
    refresh: fetchLocation,
  };
}
