import { type Ticket } from "@shared/schema";
import { exportToCSV as exportCSV } from "./export-utils";

export function exportToCSV(tickets: Ticket[], filename = "tickets-export.csv") {
  exportCSV(
    tickets,
    filename,
    (ticket) => ({
      "Ticket ID": ticket.ticketId,
      "Order Number": ticket.orderNumber,
      "Produto": ticket.produto,
      "Tracking Number": ticket.trackingNumber,
      "Carrier": ticket.carrier,
      "Damage Types": ticket.damageTypes.join("; "),
      "Date Reported": new Date(ticket.dateReported).toLocaleString(),
      "Ticket URL": ticket.ticketUrl || "",
      "Observations": ticket.observations || "",
      "Notes": ticket.notes || ""
    })
  );
}
