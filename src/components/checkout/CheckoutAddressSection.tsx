/// <reference types="@types/google.maps" />
import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Search, Loader2, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeliverySummaryCard } from "./DeliverySummaryCard";
import { formatPrice } from "@/lib/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyBBrJpwnxEx42A0Ye1-7hP26HIfm-7myf0";

// Nesta Hub dispatch location — Soluyi, Gbagada, Lagos
const NESTA_HUB = { lat: 6.553, lng: 3.384 };

// Lagos State bounding box — addresses outside this are blocked
const LAGOS_BOUNDS = { minLat: 6.38, maxLat: 6.70, minLng: 2.68, maxLng: 3.70 };

// Delivery fees in kobo (matching codebase convention)
const ZONE_FEES = {
  zone1: 100000, // ₦1,000 — ≤1.5 km
  zone2: 150000, // ₦1,500 — 1.5–2.5 km
  zone3: 200000, // ₦2,000 — 2.5–10 km
  zone4: 250000, // ₦2,500 — 10–25 km
  zone5: 300000, // ₦3,000 — 25–70 km
} as const;

/** Haversine straight-line distance in km between two lat/lng points */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

/** Returns the delivery fee in kobo for a given lat/lng, or 'unsupported' */
function getDeliveryFee(lat: number, lng: number): number | "unsupported" {
  // Block addresses outside Lagos State bounding box
  if (
    lat < LAGOS_BOUNDS.minLat ||
    lat > LAGOS_BOUNDS.maxLat ||
    lng < LAGOS_BOUNDS.minLng ||
    lng > LAGOS_BOUNDS.maxLng
  ) {
    return "unsupported";
  }

  const distKm = haversineKm(NESTA_HUB.lat, NESTA_HUB.lng, lat, lng);

  if (distKm <= 1.5) return ZONE_FEES.zone1;
  if (distKm <= 2.5) return ZONE_FEES.zone2;
  if (distKm <= 10)  return ZONE_FEES.zone3;
  if (distKm <= 25)  return ZONE_FEES.zone4;
  if (distKm <= 70)  return ZONE_FEES.zone5;
  return "unsupported";
}

interface CheckoutAddressSectionProps {
  selectedAddress: string | null;
  deliveryFee: number | null;
  onSelectAddress: (address: string, fee: number, lat: number, lng: number) => void;
  onChangeAddress: () => void;
}

/** Returns "Wed, 23 Apr 2026" for tomorrow */
function formatNextDay(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function CheckoutAddressSection({
  selectedAddress,
  deliveryFee,
  onSelectAddress,
  onChangeAddress,
}: CheckoutAddressSectionProps) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-prediction fee resolution: place_id → fee in kobo | 'unsupported' | 'loading'
  const [predictionFees, setPredictionFees] = useState<
    Map<string, number | "unsupported" | "loading">
  >(new Map());

  // Per-prediction coordinates: place_id → { lat, lng }
  const [predictionCoords, setPredictionCoords] = useState<
    Map<string, { lat: number; lng: number }>
  >(new Map());

  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initServices = useCallback(() => {
    if (!window.google?.maps?.places) return;

    try {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      const dummyDiv = document.createElement("div");
      placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv);
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error("Error initializing services:", err);
      setError("Failed to initialize address search");
      setIsLoading(false);
    }
  }, []);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps?.places) {
      initServices();
      return;
    }

    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      const checkGoogle = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkGoogle);
          initServices();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkGoogle);
        if (!window.google?.maps?.places) {
          setError("Failed to load Google Maps");
          setIsLoading(false);
        }
      }, 10000);

      return () => clearInterval(checkGoogle);
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => initServices();
    script.onerror = () => {
      setError("Failed to load Google Maps");
      setIsLoading(false);
    };

    document.head.appendChild(script);
  }, [initServices]);

  // Debounced search for predictions
  useEffect(() => {
    if (!query || query.length < 3 || !autocompleteServiceRef.current) {
      setPredictions([]);
      setPredictionFees(new Map());
      setPredictionCoords(new Map());
      return;
    }

    setIsSearching(true);

    const timer = setTimeout(() => {
      autocompleteServiceRef.current?.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: "ng" },
          types: ["address"],
        },
        (results, status) => {
          setIsSearching(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
            // Mark all as loading
            const initialFees = new Map<string, number | "unsupported" | "loading">();
            results.forEach((p) => initialFees.set(p.place_id, "loading"));
            setPredictionFees(initialFees);
            setPredictionCoords(new Map());
          } else {
            setPredictions([]);
            setPredictionFees(new Map());
            setPredictionCoords(new Map());
          }
        },
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Resolve fees for each prediction by fetching geometry
  useEffect(() => {
    if (!placesServiceRef.current || predictions.length === 0) return;

    predictions.forEach((prediction) => {
      placesServiceRef.current!.getDetails(
        { placeId: prediction.place_id, fields: ["geometry"] },
        (place, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            place?.geometry?.location
          ) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const fee = getDeliveryFee(lat, lng);

            setPredictionFees((prev) => {
              const next = new Map(prev);
              next.set(prediction.place_id, fee);
              return next;
            });
            if (fee !== "unsupported") {
              setPredictionCoords((prev) => {
                const next = new Map(prev);
                next.set(prediction.place_id, { lat, lng });
                return next;
              });
            }
          } else {
            setPredictionFees((prev) => {
              const next = new Map(prev);
              next.set(prediction.place_id, "unsupported");
              return next;
            });
          }
        },
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predictions]);

  const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    const fee = predictionFees.get(prediction.place_id);
    const coords = predictionCoords.get(prediction.place_id);
    // Don't allow selecting unsupported or still-loading addresses
    if (!fee || fee === "unsupported" || fee === "loading" || !coords) return;

    if (!placesServiceRef.current) return;

    setIsSearching(true);

    placesServiceRef.current.getDetails(
      { placeId: prediction.place_id, fields: ["formatted_address"] },
      (place, status) => {
        setIsSearching(false);
        const address =
          status === window.google.maps.places.PlacesServiceStatus.OK && place?.formatted_address
            ? place.formatted_address
            : prediction.description;

        onSelectAddress(address, fee, coords.lat, coords.lng);
        setPredictions([]);
        setPredictionFees(new Map());
        setPredictionCoords(new Map());
        setQuery("");
      },
    );
  };

  // Show summary card if address is selected
  if (selectedAddress) {
    return (
      <div className="space-y-2">
        <h3 className="text-base font-medium text-muted-foreground">Delivery Address</h3>
        <DeliverySummaryCard
          icon={<MapPin className="w-4 h-4 text-primary" />}
          title={selectedAddress}
          onChangeClick={onChangeAddress}
        />
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
          <Truck className="w-3 h-3 shrink-0" />
          Next day delivery · {formatNextDay()}
        </p>
      </div>
    );
  }

  // Show address search
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Enter Delivery Address</h3>

      {error ? (
        <Card className="p-4 border-destructive bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="mt-2">
            Retry
          </Button>
        </Card>
      ) : (
        <>
          {/* Address search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  inputRef.current?.blur();
                }
              }}
              placeholder={isLoading ? "Loading..." : "Start typing your address..."}
              className="pl-10 h-12"
              disabled={isLoading}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              inputMode="search"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            )}
          </div>

          {/* Predictions list */}
          {predictions.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              {predictions.map((prediction) => {
                const fee = predictionFees.get(prediction.place_id);
                const isUnsupported = fee === "unsupported";
                const isResolvingFee = fee === "loading" || fee === undefined;

                return (
                  <button
                    key={prediction.place_id}
                    type="button"
                    className={[
                      "w-full px-4 py-3 flex items-start gap-3 text-left border-b border-border last:border-b-0 transition-colors",
                      isUnsupported
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-muted active:bg-muted/80 cursor-pointer",
                    ].join(" ")}
                    onClick={() => !isUnsupported && !isResolvingFee && handleSelectPrediction(prediction)}
                    disabled={isUnsupported || isResolvingFee}
                  >
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {prediction.structured_formatting.main_text}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {prediction.structured_formatting.secondary_text}
                      </p>
                    </div>
                    <div className="shrink-0 ml-2 flex items-center">
                      {isResolvingFee && (
                        <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                      )}
                      {isUnsupported && (
                        <span className="text-xs text-muted-foreground text-right leading-tight max-w-[90px]">
                          We don't deliver here yet
                        </span>
                      )}
                      {!isResolvingFee && !isUnsupported && typeof fee === "number" && (
                        <span className="text-xs font-medium text-primary">
                          {formatPrice(fee)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {query.length > 0 && query.length < 3 && (
            <p className="text-xs text-muted-foreground text-center">Type at least 3 characters to search</p>
          )}

          {query.length >= 3 && predictions.length === 0 && !isSearching && (
            <p className="text-xs text-muted-foreground text-center">No addresses found. Try a different search.</p>
          )}

          {query.length === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Start typing and select your address from the suggestions
            </p>
          )}
        </>
      )}
    </div>
  );
}
