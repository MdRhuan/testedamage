import { useMemo } from "react";
import type { Ticket, Order, Carrier, DamageType, Produto } from "@shared/schema";

/**
 * Aggregates tickets by carrier with efficient memoization
 */
export function useTicketsByCarrier(
  tickets: Ticket[],
  carriers: readonly Carrier[],
  getCarrierColor: (carrier: Carrier) => { text: string }
) {
  return useMemo(() => {
    return carriers.map(carrier => ({
      name: carrier,
      value: tickets.filter(t => t.carrier === carrier).length,
      color: getCarrierColor(carrier).text
    }));
  }, [tickets, carriers, getCarrierColor]);
}

/**
 * Aggregates tickets by damage type
 */
export function useTicketsByDamage(tickets: Ticket[], damageTypes: readonly DamageType[]) {
  return useMemo(() => {
    return damageTypes.map(damage => ({
      name: damage,
      value: tickets.filter(t => t.damageTypes.includes(damage)).length
    }));
  }, [tickets, damageTypes]);
}

/**
 * Aggregates items by produto with filtering of zero values
 */
export function useItemsByProduto<T extends { produto: string }>(
  items: T[],
  produtos: readonly Produto[]
) {
  return useMemo(() => {
    return produtos
      .map(produto => ({
        name: produto,
        value: items.filter(i => i.produto === produto).length
      }))
      .filter(p => p.value > 0);
  }, [items, produtos]);
}

/**
 * Aggregates tickets by date
 */
export function useTicketsByDate(tickets: Ticket[], lastNDays: number = 30) {
  return useMemo(() => {
    return tickets
      .reduce((acc, ticket) => {
        const date = new Date(ticket.dateReported).toLocaleDateString();
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ date, count: 1 });
        }
        return acc;
      }, [] as { date: string; count: number }[])
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-lastNDays);
  }, [tickets, lastNDays]);
}

/**
 * Aggregates orders by carrier
 */
export function useOrdersByCarrier(
  orders: Order[],
  carriers: readonly Carrier[],
  getCarrierColor: (carrier: Carrier) => { text: string }
) {
  return useMemo(() => {
    return carriers.map(carrier => ({
      name: carrier,
      value: orders.filter(o => o.carrier === carrier).length,
      color: getCarrierColor(carrier).text
    }));
  }, [orders, carriers, getCarrierColor]);
}

/**
 * Finds the top item by value from aggregated data
 */
export function findTopItem<T extends { name: string; value: number }>(
  items: T[],
  defaultValue: { name: string; value: number } = { name: "-", value: 0 }
): { name: string; value: number } {
  return items.reduce((max, item) => 
    item.value > max.value ? item : max,
    defaultValue
  );
}
