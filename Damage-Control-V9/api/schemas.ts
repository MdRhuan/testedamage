import { z } from "zod";

export const carriers = ["FedEx", "USPS", "UPS", "OnTrac", "DHL"] as const;
export type Carrier = typeof carriers[number];

export const produtos = [
  "Longevity",
  "Glow",
  "Calm",
  "Lean Muscle",
  "Hydro burn",
  "NMN Cell Renew Tonic",
  "Immunity Tonic",
  "Relief Tonic",
  "Calm Tonic",
  "Radiance Tonic"
] as const;
export type Produto = typeof produtos[number];

export const services = [
  "FedEx 2 Day (by end of the day in two days)",
  "FedEx 2 Day A.M (by 9 AM in two days)",
  "FedEx Express Saver",
  "FedEx Ground Home Delivery",
  "FedEx Priority Overnight (by 12:00 PM next day)",
  "FedEx Standard Overnight (by end of the day next day)",
  "ShipMonk Economy",
  "ShipMonk Standard",
  "ShipMonk 2 Day",
  "UPS Ground",
  "UPS 3 Day Select",
  "UPS 2nd Day Air (by end of the day in two days)",
  "UPS Next Day Air Saver (by end of the day next day)",
  "USPS Priority Mail Express",
  "USPS Ground Advantage",
  "UPS Next Day Air (by 10:30 AM next day)"
] as const;
export type Service = typeof services[number];

export const damageTypes = [
  "Quebrado",
  "Manchado",
  "Amassado",
  "Faltando Produto",
  "Embalagem danificada",
  "Carrier Damage"
] as const;
export type DamageType = typeof damageTypes[number];

export const insertTicketSchema = z.object({
  ticketId: z.string(),
  orderNumber: z.string(),
  trackingNumber: z.string(),
  carrier: z.enum(carriers),
  service: z.enum(services),
  produto: z.enum(produtos),
  ticketUrl: z.string().url().optional().or(z.literal("")),
  damageTypes: z.array(z.enum(damageTypes)).min(1, "Select at least one damage type"),
  dateReported: z.coerce.date(),
  observations: z.string().optional(),
  notes: z.string().optional(),
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;

export const insertOrderSchema = z.object({
  trackingNumber: z.string(),
  orderNumber: z.string(),
  produto: z.enum(produtos),
  carrier: z.enum(carriers),
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
