import { Package, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type Carrier } from "@shared/schema";
import { getCarrierColor } from "@/lib/carrier-detection";

interface CarrierBadgeProps {
  carrier: Carrier;
  showIcon?: boolean;
}

export function CarrierBadge({ carrier, showIcon = true }: CarrierBadgeProps) {
  const colors = getCarrierColor(carrier);
  
  return (
    <Badge
      className="font-medium"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border
      }}
      data-testid={`badge-carrier-${carrier.toLowerCase()}`}
    >
      {showIcon && <Truck className="w-3 h-3 mr-1" />}
      {carrier}
    </Badge>
  );
}
