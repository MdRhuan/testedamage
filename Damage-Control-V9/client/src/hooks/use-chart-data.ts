import { useMemo } from "react";
import type { Ticket, Carrier, DamageType, Produto } from "@shared/schema";

interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

/**
 * Hook for generating chart-ready data from tickets
 */
export function useTicketChartData(
  tickets: Ticket[],
  carriers: readonly Carrier[],
  damageTypes: readonly DamageType[],
  produtos: readonly Produto[],
  getCarrierColor: (carrier: Carrier) => { text: string }
) {
  const ticketsByCarrier = useMemo(() => {
    return carriers.map(carrier => ({
      name: carrier,
      value: tickets.filter(t => t.carrier === carrier).length,
      color: getCarrierColor(carrier).text
    }));
  }, [tickets, carriers, getCarrierColor]);

  const ticketsByDamage = useMemo(() => {
    return damageTypes.map(damage => ({
      name: damage,
      value: tickets.filter(t => t.damageTypes.includes(damage)).length
    }));
  }, [tickets, damageTypes]);

  const ticketsByProduto = useMemo(() => {
    return produtos
      .map(produto => ({
        name: produto,
        value: tickets.filter(t => t.produto === produto).length
      }))
      .filter(p => p.value > 0);
  }, [tickets, produtos]);

  const ticketsByDate = useMemo(() => {
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
      .slice(-30);
  }, [tickets]);

  return {
    ticketsByCarrier,
    ticketsByDamage,
    ticketsByProduto,
    ticketsByDate
  };
}
