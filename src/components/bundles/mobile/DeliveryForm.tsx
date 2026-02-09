import { useState } from "react";
import { type DeliveryInfo, type PickupStation } from "@/data/bundleData";
import { DeliveryMethodSelector } from "./DeliveryMethodSelector";
import { PickupStationSelector } from "./PickupStationSelector";
import { AddressView } from "./AddressView";

type DeliveryStep = 'method' | 'pickup' | 'address';

interface DeliveryFormProps {
  onSubmit: (info: DeliveryInfo) => void;
  onBack: () => void;
}

export function DeliveryForm({ onSubmit, onBack }: DeliveryFormProps) {
  const [step, setStep] = useState<DeliveryStep>('method');

  const handleSelectPickup = () => {
    setStep('pickup');
  };

  const handleSelectAddress = () => {
    setStep('address');
  };

  const handlePickupStationSelect = (station: PickupStation) => {
    const deliveryInfo: DeliveryInfo = {
      deliveryMethod: 'pickup',
      pickupStationId: station.id,
      pickupStationName: station.name,
      pickupStationAddress: station.address,
      pickupStationDay: station.dayOfWeek,
      pickupStationHours: station.hours,
      pickupStationPhone: station.phoneNumber,
    };
    onSubmit(deliveryInfo);
  };

  const handleAddressSubmit = (fullName: string, phoneNumber: string, address: string) => {
    const deliveryInfo: DeliveryInfo = {
      deliveryMethod: 'address',
      fullName,
      phoneNumber,
      deliveryAddress: address,
    };
    onSubmit(deliveryInfo);
  };

  const handleBackToMethod = () => {
    setStep('method');
  };

  switch (step) {
    case 'method':
      return (
        <DeliveryMethodSelector
          onSelectPickup={handleSelectPickup}
          onSelectAddress={handleSelectAddress}
          onBack={onBack}
        />
      );
    
    case 'pickup':
      return (
        <PickupStationSelector
          onSelect={handlePickupStationSelect}
          onBack={handleBackToMethod}
        />
      );
    
    case 'address':
      return (
        <AddressView
          onSubmit={handleAddressSubmit}
          onBack={handleBackToMethod}
        />
      );
    
    default:
      return null;
  }
}
