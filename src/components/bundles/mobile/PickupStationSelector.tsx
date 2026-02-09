import { MapPin, Calendar, Clock, Phone, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { pickupStations, type PickupStation } from "@/data/bundleData";
import { useState } from "react";
import { FloatingBackButton } from "./FloatingBackButton";

interface PickupStationSelectorProps {
  onSelect: (station: PickupStation) => void;
  onBack: () => void;
}

export function PickupStationSelector({ onSelect, onBack }: PickupStationSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedStation = pickupStations.find(s => s.id === selectedId);

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b shrink-0">
        <FloatingBackButton onClick={onBack} />
        <div>
          <h1 className="font-semibold text-lg">Select Pickup Station</h1>
          <p className="text-sm text-muted-foreground">Choose a convenient location for pickup</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {pickupStations.map((station) => {
          const isSelected = selectedId === station.id;
          return (
            <Card
              key={station.id}
              className={`p-4 cursor-pointer transition-all ${
                isSelected 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedId(station.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-base">{station.name}</h3>
                  
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{station.address}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{station.dayOfWeek}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{station.hours}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{station.phoneNumber}</span>
                  </div>
                  
                  <div className="pt-1">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      ✓ FREE pickup
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-background shrink-0 space-y-2">
        <Button
          variant="shop"
          className="w-full h-12 text-base font-semibold"
          disabled={!selectedStation}
          onClick={() => selectedStation && onSelect(selectedStation)}
        >
          Proceed to Payment
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={onBack}
        >
          Back
        </Button>
      </div>
    </>
  );
}
