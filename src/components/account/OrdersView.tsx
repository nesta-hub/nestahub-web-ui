import { useState } from "react";
import { ArrowLeft, ChevronDown, MapPin, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getMyOrders, formatPrice, MyOrder } from "@/lib/api";

const statusConfig: Record<string, { label: string; className: string }> = {
  order_submitted: { label: "Pending", className: "bg-blue-100 text-blue-700 border-blue-200" },
  payment_made: { label: "Pending", className: "bg-blue-100 text-blue-700 border-blue-200" },
  payment_confirmed: { label: "Processing", className: "bg-amber-100 text-amber-700 border-amber-200" },
  processing: { label: "Processing", className: "bg-amber-100 text-amber-700 border-amber-200" },
  delivered: { label: "Delivered", className: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 border-red-200" },
};

function formatOrderDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface OrdersViewProps {
  onBack: () => void;
}

export function OrdersView({ onBack }: OrdersViewProps) {
  const { session } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => getMyOrders(session?.access_token ?? ""),
    enabled: !!session?.access_token,
  });

  const orders = data?.orders ?? [];

  const toggleExpand = (orderNumber: string) => {
    setExpandedId((prev) => (prev === orderNumber ? null : orderNumber));
  };

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-1 -ml-1 text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">My Orders</h1>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No orders yet</p>
      ) : (
        <div className="divide-y divide-border">
          {orders.map((order: MyOrder) => {
            const isExpanded = expandedId === order.orderNumber;
            const config = statusConfig[order.status] ?? {
              label: order.status,
              className: "bg-secondary text-muted-foreground border-border",
            };

            return (
              <div key={order.orderNumber}>
                <button
                  onClick={() => toggleExpand(order.orderNumber)}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatOrderDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0 ${config.className}`}
                      >
                        {config.label}
                      </Badge>
                      <p className="text-sm font-medium text-foreground mt-1">
                        {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="pb-4 pl-1 animate-fade-in space-y-2">
                    {/* Items */}
                    <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <div>
                            <p className="text-foreground">
                              {item.productBrand} {item.productName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.variant} · Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="text-foreground font-medium">
                            {formatPrice(item.unitPrice)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Delivery info */}
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        {order.deliveryMethod === "pickup" ? (
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        ) : (
                          <Truck className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        )}
                        <div className="text-xs space-y-0.5">
                          <p className="text-foreground font-medium">{order.fullName}</p>
                          {order.deliveryMethod === "pickup" ? (
                            <>
                              <p className="text-muted-foreground">{order.pickupStationName}</p>
                              <p className="text-muted-foreground">{order.pickupStationAddress}</p>
                            </>
                          ) : (
                            <p className="text-muted-foreground">{order.deliveryAddress}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
