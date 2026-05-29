/// <reference types="@types/google.maps" />
import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FloatingBackButton } from "./FloatingBackButton";

interface AddressViewProps {
  onSubmit: (fullName: string, phoneNumber: string, address: string) => void;
  onBack: () => void;
}

const GOOGLE_MAPS_API_KEY = "AIzaSyBBrJpwnxEx42A0Ye1-7hP26HIfm-7myf0";

export function AddressView({ onSubmit, onBack }: AddressViewProps) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Contact form state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isContactValid = fullName.trim().length >= 2 && phoneNumber.trim().length >= 10;
  const canProceed = selectedAddress && isContactValid;

  const initServices = useCallback(() => {
    if (!window.google?.maps?.places) return;

    try {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      const dummyDiv = document.createElement('div');
      placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv);
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error initializing services:', err);
      setError('Failed to initialize address search');
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
          setError('Failed to load Google Maps');
          setIsLoading(false);
        }
      }, 10000);
      
      return () => clearInterval(checkGoogle);
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => initServices();
    script.onerror = () => {
      setError('Failed to load Google Maps');
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
          componentRestrictions: { country: 'ng' },
        },
        (results, status) => {
          setIsSearching(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
        }
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
        fields: ['name', 'formatted_address']
      },
      (place, status) => {
        setIsSearching(false);
        const formatted =
          status === window.google.maps.places.PlacesServiceStatus.OK && place?.formatted_address
            ? place.formatted_address
            : prediction.description;
        const address =
          place?.name && !formatted.includes(place.name)
            ? `${place.name}, ${formatted}`
            : formatted;
        setSelectedAddress(address);
        setPredictions([]);
        setQuery("");
    );
  };

  const handleChangeAddress = () => {
    setSelectedAddress(null);
    setQuery("");
    setPredictions([]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleProceed = () => {
    if (canProceed && selectedAddress) {
      onSubmit(fullName.trim(), phoneNumber.trim(), selectedAddress);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b shrink-0">
        <FloatingBackButton onClick={onBack} />
        <div>
          <h1 className="font-semibold text-lg">Delivery Details</h1>
          <p className="text-sm text-muted-foreground">
            {selectedAddress ? "Enter your contact info" : "Enter your address"}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {error ? (
          <Card className="p-4 border-destructive bg-destructive/10">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="mt-2">
              Retry
            </Button>
          </Card>
        ) : selectedAddress ? (
          <>
            {/* Address summary card */}
            <Card className="p-3 bg-muted/50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">Delivering to</p>
                  <p className="text-sm font-medium">{selectedAddress}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs h-7"
                  onClick={handleChangeAddress}
                >
                  Change
                </Button>
              </div>
            </Card>

            {/* Contact form */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="h-12"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08012345678"
                  className="h-12"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Address search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
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
              <p className="text-xs text-muted-foreground text-center">
                Type at least 3 characters to search
              </p>
            )}

            {query.length >= 3 && predictions.length === 0 && !isSearching && (
              <p className="text-xs text-muted-foreground text-center">
                No addresses found. Try a different search.
              </p>
            )}

            {query.length === 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Start typing and select your address from the suggestions
              </p>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-background shrink-0">
        <Button
          variant="shop"
          className="w-full h-12 text-base font-semibold"
          disabled={!canProceed}
          onClick={handleProceed}
        >
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
}
