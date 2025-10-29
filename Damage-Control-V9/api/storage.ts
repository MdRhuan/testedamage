import { randomUUID } from "crypto";

export interface Ticket {
  id: string;
  ticketId: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  service: string;
  produto: string;
  ticketUrl: string | null;
  damageTypes: string[];
  dateReported: Date;
  observations: string | null;
  notes: string | null;
}

export interface InsertTicket {
  ticketId: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  service: string;
  produto: string;
  ticketUrl?: string | null;
  damageTypes: string[];
  dateReported: Date;
  observations?: string | null;
  notes?: string | null;
}

export interface Order {
  id: string;
  trackingNumber: string;
  orderNumber: string;
  produto: string;
  carrier: string;
  dateImported: Date;
}

export interface InsertOrder {
  trackingNumber: string;
  orderNumber: string;
  produto: string;
  carrier: string;
}

export interface IStorage {
  getAllTickets(): Promise<Ticket[]>;
  getTicketById(id: string): Promise<Ticket | undefined>;
  getTicketByTicketId(ticketId: string): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  createTickets(tickets: InsertTicket[]): Promise<Ticket[]>;
  updateTicket(id: string, ticket: Partial<InsertTicket>): Promise<Ticket | undefined>;
  deleteTicket(id: string): Promise<boolean>;
  deleteAllTickets(): Promise<number>;
  
  getAllOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  createOrders(orders: InsertOrder[]): Promise<Order[]>;
  deleteAllOrders(): Promise<number>;
}

class MemStorage implements IStorage {
  private tickets: Map<string, Ticket>;
  private ticketsByTicketId: Map<string, Ticket>;
  private orders: Map<string, Order>;

  constructor() {
    this.tickets = new Map();
    this.ticketsByTicketId = new Map();
    this.orders = new Map();
    this.seedData();
  }

  private seedData() {
    const sampleTickets: InsertTicket[] = [
      {
        ticketId: "TICKET-001",
        orderNumber: "ORD-12345",
        trackingNumber: "6129-ABC-DEF",
        carrier: "FedEx",
        service: "FedEx 2 Day (by end of the day in two days)",
        produto: "Longevity",
        ticketUrl: "https://example.com/ticket/001",
        damageTypes: ["Quebrado", "Embalagem danificada"],
        dateReported: new Date("2025-10-20T10:30:00"),
        observations: "Caixa chegou visivelmente danificada com produto quebrado",
        notes: "Cliente reportou imediatamente",
      },
      {
        ticketId: "TICKET-002",
        orderNumber: "ORD-12346",
        trackingNumber: "94-XYZ-123",
        carrier: "USPS",
        service: "USPS Priority Mail Express",
        produto: "Glow",
        ticketUrl: "https://example.com/ticket/002",
        damageTypes: ["Manchado"],
        dateReported: new Date("2025-10-19T14:15:00"),
        observations: "Produto com manchas de água",
        notes: "Possível exposição à chuva durante transporte",
      },
      {
        ticketId: "TICKET-003",
        orderNumber: "ORD-12347",
        trackingNumber: "1ZC6J-456-789",
        carrier: "UPS",
        service: "UPS Ground",
        produto: "Calm",
        ticketUrl: "https://example.com/ticket/003",
        damageTypes: ["Amassado"],
        dateReported: new Date("2025-10-18T09:45:00"),
        observations: "Embalagem amassada em um dos cantos",
        notes: "Produto interno sem danos",
      },
      {
        ticketId: "TICKET-004",
        orderNumber: "ORD-12348",
        trackingNumber: "1LSC-ABC-XYZ",
        carrier: "OnTrac",
        service: "ShipMonk Economy",
        produto: "Lean Muscle",
        ticketUrl: "https://example.com/ticket/004",
        damageTypes: ["Faltando Produto"],
        dateReported: new Date("2025-10-17T16:20:00"),
        observations: "Peça acessória faltando na embalagem",
        notes: "Cliente solicitou envio da peça separadamente",
      },
      {
        ticketId: "TICKET-005",
        orderNumber: "ORD-12349",
        trackingNumber: "9261-DEF-456",
        carrier: "DHL",
        service: "ShipMonk Standard",
        produto: "Hydro burn",
        ticketUrl: "https://example.com/ticket/005",
        damageTypes: ["Quebrado", "Manchado"],
        dateReported: new Date("2025-10-16T11:00:00"),
        observations: "Produto quebrado e com manchas",
        notes: "Reembolso total processado",
      },
    ];

    sampleTickets.forEach(ticket => {
      const id = randomUUID();
      const fullTicket: Ticket = { 
        ...ticket, 
        id,
        ticketUrl: ticket.ticketUrl || null,
        observations: ticket.observations || null,
        notes: ticket.notes || null
      };
      this.tickets.set(id, fullTicket);
      this.ticketsByTicketId.set(fullTicket.ticketId, fullTicket);
    });
  }

  async getAllTickets(): Promise<Ticket[]> {
    return Array.from(this.tickets.values());
  }

  async getTicketById(id: string): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async getTicketByTicketId(ticketId: string): Promise<Ticket | undefined> {
    return this.ticketsByTicketId.get(ticketId);
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    if (this.ticketsByTicketId.has(insertTicket.ticketId)) {
      throw new Error(`Ticket with ID ${insertTicket.ticketId} already exists`);
    }

    const id = randomUUID();
    const ticket: Ticket = { 
      ...insertTicket, 
      id,
      ticketUrl: insertTicket.ticketUrl || null,
      observations: insertTicket.observations || null,
      notes: insertTicket.notes || null
    };
    
    try {
      this.tickets.set(id, ticket);
      this.ticketsByTicketId.set(ticket.ticketId, ticket);
    } catch (error) {
      this.tickets.delete(id);
      this.ticketsByTicketId.delete(ticket.ticketId);
      throw error;
    }
    
    return ticket;
  }

  async createTickets(insertTickets: InsertTicket[]): Promise<Ticket[]> {
    const created: Ticket[] = [];
    
    for (const insertTicket of insertTickets) {
      const id = randomUUID();
      const ticket: Ticket = { 
        ...insertTicket, 
        id,
        ticketUrl: insertTicket.ticketUrl || null,
        observations: insertTicket.observations || null,
        notes: insertTicket.notes || null
      };
      
      try {
        this.tickets.set(id, ticket);
        this.ticketsByTicketId.set(ticket.ticketId, ticket);
        created.push(ticket);
      } catch (error) {
        for (const rollbackTicket of created) {
          this.tickets.delete(rollbackTicket.id);
          this.ticketsByTicketId.delete(rollbackTicket.ticketId);
        }
        throw error;
      }
    }
    
    return created;
  }

  async updateTicket(id: string, updates: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;

    const oldTicketId = ticket.ticketId;
    const updatedTicket: Ticket = { ...ticket, ...updates };
    
    try {
      if (oldTicketId !== updatedTicket.ticketId) {
        if (this.ticketsByTicketId.has(updatedTicket.ticketId)) {
          throw new Error(`Ticket ID ${updatedTicket.ticketId} already exists`);
        }
        this.ticketsByTicketId.delete(oldTicketId);
      }
      
      this.tickets.set(id, updatedTicket);
      this.ticketsByTicketId.set(updatedTicket.ticketId, updatedTicket);
    } catch (error) {
      this.tickets.set(id, ticket);
      this.ticketsByTicketId.set(oldTicketId, ticket);
      throw error;
    }
    
    return updatedTicket;
  }

  async deleteTicket(id: string): Promise<boolean> {
    const ticket = this.tickets.get(id);
    if (ticket) {
      this.ticketsByTicketId.delete(ticket.ticketId);
    }
    return this.tickets.delete(id);
  }

  async deleteAllTickets(): Promise<number> {
    const count = this.tickets.size;
    this.tickets.clear();
    this.ticketsByTicketId.clear();
    return count;
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      ...insertOrder,
      id,
      dateImported: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async createOrders(insertOrders: InsertOrder[]): Promise<Order[]> {
    return insertOrders.map(insertOrder => {
      const id = randomUUID();
      const order: Order = {
        ...insertOrder,
        id,
        dateImported: new Date(),
      };
      this.orders.set(id, order);
      return order;
    });
  }

  async deleteAllOrders(): Promise<number> {
    const count = this.orders.size;
    this.orders.clear();
    return count;
  }
}

export const storage = new MemStorage();
