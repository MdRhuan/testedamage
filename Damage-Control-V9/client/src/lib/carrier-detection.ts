import { type Carrier, type Produto } from "@shared/schema";

export function detectCarrierFromTracking(trackingNumber: string): Carrier | null {
  const upper = trackingNumber.toUpperCase();
  
  if (upper.startsWith("6129")) return "FedEx";
  if (upper.startsWith("94")) return "USPS";
  if (upper.startsWith("1ZC6J")) return "UPS";
  if (upper.startsWith("1LSC")) return "OnTrac";
  if (upper.startsWith("9261")) return "DHL";
  
  return null;
}

export function getCarrierColor(carrier: Carrier): { bg: string; text: string; border: string } {
  switch (carrier) {
    case "FedEx":
      return {
        bg: "hsla(282, 80%, 45%, 0.1)",
        text: "hsl(282 80% 45%)",
        border: "hsla(282, 80%, 45%, 0.2)"
      };
    case "USPS":
      return {
        bg: "hsla(211, 95%, 45%, 0.1)",
        text: "hsl(211 95% 45%)",
        border: "hsla(211, 95%, 45%, 0.2)"
      };
    case "UPS":
      return {
        bg: "hsla(35, 85%, 35%, 0.1)",
        text: "hsl(35 85% 35%)",
        border: "hsla(35, 85%, 35%, 0.2)"
      };
    case "OnTrac":
      return {
        bg: "hsla(0, 75%, 45%, 0.1)",
        text: "hsl(0 75% 45%)",
        border: "hsla(0, 75%, 45%, 0.2)"
      };
    case "DHL":
      return {
        bg: "hsla(52, 100%, 50%, 0.1)",
        text: "hsl(52 100% 50%)",
        border: "hsla(52, 100%, 50%, 0.2)"
      };
  }
}

export function getProdutoColor(produto: Produto): string {
  switch (produto) {
    case "Longevity":
      return "hsl(0, 90%, 44%)";
    case "Glow":
      return "hsl(1, 45%, 72%)";
    case "Calm":
      return "hsl(227, 41%, 74%)";
    case "Lean Muscle":
      return "hsl(17, 54%, 34%)";
    case "Hydro burn":
      return "hsl(356, 57%, 57%)";
    default:
      return "hsl(var(--primary))";
  }
}
