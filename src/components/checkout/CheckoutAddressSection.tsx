/// <reference types="@types/google.maps" />
import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeliverySummaryCard } from "./DeliverySummaryCard";

const GOOGLE_MAPS_API_KEY = "AIzaSyBBrJpwnxEx42A0Ye1-7hP26HIfm-7myf0";

interface CheckoutAddressSectionProps {
  selectedAddress: string | null;
  onSelectAddress: (address: string) => void;
  onChangeAddress: () => void;
}

export function CheckoutAddressSection({
  selectedAddress,
  onSelectAddress,
  onChangeAddress,
}: CheckoutAddressSectionProps) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          } else {
            setPredictions([]);
          }
        },
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) return;

    setIsSearching(true);

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["formatted_address"],
      },
      (place, status) => {
        setIsSearching(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.formatted_address) {
          onSelectAddress(place.formatted_address);
          setPredictions([]);
          setQuery("");
        } else {
          onSelectAddress(prediction.description);
          setPredictions([]);
          setQuery("");
        }
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
              {predictions.map((prediction) => (
                <button
                  key={prediction.place_id}
                  type="button"
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-muted active:bg-muted/80 text-left border-b border-border last:border-b-0 transition-colors"
                  onClick={() => handleSelectPrediction(prediction)}
                >
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {prediction.structured_formatting.main_text}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {prediction.structured_formatting.secondary_text}
                    </p>
                  </div>
                </button>
              ))}
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
