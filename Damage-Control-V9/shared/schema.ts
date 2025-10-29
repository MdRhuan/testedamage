import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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

export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: text("ticket_id").notNull().unique(),
  orderNumber: text("order_number").notNull(),
  trackingNumber: text("tracking_number").notNull(),
  carrier: text("carrier").notNull(),
  service: text("service").notNull(),
  produto: text("produto").notNull(),
  ticketUrl: text("ticket_url"),
  damageTypes: text("damage_types").array().notNull(),
  dateReported: timestamp("date_reported").notNull().defaultNow(),
  observations: text("observations"),
  notes: text("notes"),
});

export const insertTicketSchema = createInsertSchema(tickets, {
  ticketUrl: z.string().url().optional().or(z.literal("")),
  damageTypes: z.array(z.enum(damageTypes)).min(1, "Select at least one damage type"),
  carrier: z.enum(carriers),
  service: z.enum(services),
  produto: z.enum(produtos),
  dateReported: z.coerce.date(),
}).omit({
  id: true,
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackingNumber: text("tracking_number").notNull(),
  orderNumber: text("order_number").notNull(),
  produto: text("produto").notNull(),
  carrier: text("carrier").notNull(),
  dateImported: timestamp("date_imported").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders, {
  carrier: z.enum(carriers),
  produto: z.enum(produtos),
}).omit({
  id: true,
  dateImported: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
