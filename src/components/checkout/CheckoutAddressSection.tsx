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
  /** The chosen address and its exact coordinates. What delivery costs there is the server's answer, not ours. */
  onSelectAddress: (address: string, lat: number, lng: number) => void;
  onChangeAddress: () => void;
}

/**
 * Pick a delivery address with Google's address search. It returns the address and its
 * coordinates and nothing else: no price and no "do we deliver here". Both are the server's
 * decision, made from these coordinates once the address is chosen (see
 * DeliveryOptionsSection), so there is no fee table or area rule in the browser to drift.
 * Details are looked up once, for the suggestion actually picked.
 */
export function CheckoutAddressSection({
  selectedAddress,
  onSelectAddress,
  onChangeAddress,
}: CheckoutAddressSectionProps) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  // Already loaded (another screen opened Maps first) means ready from the first render.
  const [ready, setReady] = useState<boolean>(() => !!window.google?.maps?.places);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const isLoading = !ready && !error;

  const servicesRef = useRef<{
    autocomplete: google.maps.places.AutocompleteService;
    places: google.maps.places.PlacesService;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Google's two services, made once, the first time they are needed. */
  const getServices = useCallback(() => {
    if (!servicesRef.current && window.google?.maps?.places) {
      servicesRef.current = {
        autocomplete: new window.google.maps.places.AutocompleteService(),
        places: new window.google.maps.places.PlacesService(document.createElement("div")),
      };
    }
    return servicesRef.current;
  }, []);

  // Load the Google Maps script (state is only set from its callbacks, never in this body)
  useEffect(() => {
    if (ready) return;

    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      const checkGoogle = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkGoogle);
          setReady(true);
        }
      }, 100);
      const giveUp = setTimeout(() => {
        clearInterval(checkGoogle);
        if (!window.google?.maps?.places) setError("Failed to load Google Maps");
      }, 10000);
      return () => {
        clearInterval(checkGoogle);
        clearTimeout(giveUp);
      };
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setReady(true);
    script.onerror = () => setError("Failed to load Google Maps");
    document.head.appendChild(script);
  }, [ready]);

  // Debounced search for predictions
  useEffect(() => {
    if (!ready || query.length < 3) return;
    const services = getServices();
    if (!services) return;

    const timer = setTimeout(() => {
      services.autocomplete.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: "ng" },
        },
        (results, status) => {
          setIsSearching(false);
          setPredictions(status === window.google.maps.places.PlacesServiceStatus.OK && results ? results : []);
        },
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [query, ready, getServices]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.length >= 3) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
      setPredictions([]);
    }
  };

  const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    const services = getServices();
    if (!services) return;
    setIsSearching(true);
    setPickError(null);

    services.places.getDetails(
      { placeId: prediction.place_id, fields: ["name", "formatted_address", "geometry"] },
      (place, status) => {
        setIsSearching(false);
        const loc = place?.geometry?.location;
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !loc) {
          setPickError("We couldn't read that address. Please try another suggestion.");
          return;
        }
        const formatted = place.formatted_address ?? prediction.description;
        const address =
          place.name && !formatted.includes(place.name) ? `${place.name}, ${formatted}` : formatted;

        onSelectAddress(address, loc.lat(), loc.lng());
        setPredictions([]);
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
              onChange={(e) => handleQueryChange(e.target.value)}
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
                  className="w-full px-4 py-3 flex items-start gap-3 text-left border-b border-border last:border-b-0 transition-colors hover:bg-muted active:bg-muted/80 cursor-pointer"
                  onClick={() => handleSelectPrediction(prediction)}
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
                </button>
              ))}
            </div>
          )}

          {pickError && <p className="text-xs text-destructive text-center">{pickError}</p>}

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
