import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getPickupStations, type PickupStation } from "@/lib/api";
import { DeliverySummaryCard } from "./DeliverySummaryCard";

interface CheckoutPickupSectionProps {
  selectedStation: PickupStation | null;
  onSelectStation: (station: PickupStation) => void;
  onChangeStation: () => void;
}

export function CheckoutPickupSection({
  selectedStation,
  onSelectStation,
  onChangeStation,
}: CheckoutPickupSectionProps) {
  const { data: pickupStations = [], isLoading } = useQuery({
    queryKey: ['pickup-stations'],
    queryFn: getPickupStations,
  });
  // Show summary card if station is selected
  if (selectedStation) {
    return (
      <div className="space-y-2">
      <h3 className="text-base font-medium text-muted-foreground">
        Pickup Location
      </h3>
        <DeliverySummaryCard
          icon={<MapPin className="w-4 h-4 text-primary" />}
          title={selectedStation.name}
          subtitle={`${selectedStation.dayOfWeek}, ${selectedStation.hours}`}
          details={selectedStation.address}
          onChangeClick={onChangeStation}
        />
      </div>
    );
  }

  // Show station list
  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium text-muted-foreground">
        Select Pickup Station
      </h3>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading pickup stations...
        </div>
      ) : (
        <div className="space-y-2">
          {pickupStations.map((station) => (
            <Card
              key={station.id}
              className="p-3 cursor-pointer hover:border-primary transition-colors active:scale-[0.99]"
              onClick={() => onSelectStation(station)}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{station.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {station.address}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {station.dayOfWeek}, {station.hours}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
