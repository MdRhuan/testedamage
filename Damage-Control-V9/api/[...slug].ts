import express, { type Request, Response } from "express";
import { storage } from "./storage";
import { insertTicketSchema, type InsertTicket, insertOrderSchema, type InsertOrder } from "./schemas";
import { handleError, validateBulkItems } from "./route-helpers";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/api/tickets", async (_req: Request, res: Response) => {
  try {
    const tickets = await storage.getAllTickets();
    res.json(tickets);
  } catch (error) {
    handleError(res, error, "Failed to fetch tickets");
  }
});

app.get("/api/tickets/:id", async (req: Request, res: Response) => {
  try {
    const ticket = await storage.getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    res.json(ticket);
  } catch (error) {
    handleError(res, error, "Failed to fetch ticket");
  }
});

app.post("/api/tickets", async (req: Request, res: Response) => {
  try {
    const validatedData = insertTicketSchema.parse(req.body);
    
    const existingTicket = await storage.getTicketByTicketId(validatedData.ticketId);
    if (existingTicket) {
      return res.status(400).json({ 
        error: `Ticket ID ${validatedData.ticketId} already exists` 
      });
    }

    const ticket = await storage.createTicket(validatedData);
    res.status(201).json(ticket);
  } catch (error) {
    handleError(res, error, "Failed to create ticket");
  }
});

app.post("/api/tickets/bulk", async (req: Request, res: Response) => {
  try {
    const { tickets } = req.body;
    
    if (!Array.isArray(tickets)) {
      return res.status(400).json({ error: "Invalid request: tickets must be an array" });
    }

    const checkDuplicate = async (item: InsertTicket) => {
      const existing = await storage.getTicketByTicketId(item.ticketId);
      return !!existing;
    };

    const { validItems, errors } = await validateBulkItems(
      tickets,
      insertTicketSchema,
      checkDuplicate,
      "Ticket",
      (item) => `ID: ${item.ticketId}`
    );

    if (validItems.length === 0) {
      return res.status(400).json({ 
        error: "No valid tickets to import", 
        errors 
      });
    }

    const createdTickets = await storage.createTickets(validItems);
    
    res.status(201).json({
      imported: createdTickets.length,
      total: tickets.length,
      errors: errors.length > 0 ? errors : undefined,
      tickets: createdTickets,
    });
  } catch (error) {
    handleError(res, error, "Failed to import tickets");
  }
});

app.patch("/api/tickets/:id", async (req: Request, res: Response) => {
  try {
    const updates = insertTicketSchema.partial().parse(req.body);
    const ticket = await storage.updateTicket(req.params.id, updates);
    
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    
    res.json(ticket);
  } catch (error) {
    handleError(res, error, "Failed to update ticket");
  }
});

app.delete("/api/tickets/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await storage.deleteTicket(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    res.status(204).send();
  } catch (error) {
    handleError(res, error, "Failed to delete ticket");
  }
});

app.delete("/api/tickets", async (_req: Request, res: Response) => {
  try {
    const deletedCount = await storage.deleteAllTickets();
    res.json({ deletedCount });
  } catch (error) {
    handleError(res, error, "Failed to delete all tickets");
  }
});

app.get("/api/orders", async (_req: Request, res: Response) => {
  try {
    const orders = await storage.getAllOrders();
    res.json(orders);
  } catch (error) {
    handleError(res, error, "Failed to fetch orders");
  }
});

app.post("/api/orders/bulk", async (req: Request, res: Response) => {
  try {
    const { orders } = req.body;
    
    if (!Array.isArray(orders)) {
      return res.status(400).json({ error: "Invalid request: orders must be an array" });
    }

    const { validItems, errors } = await validateBulkItems(
      orders,
      insertOrderSchema,
      undefined,
      "Order"
    );

    if (validItems.length === 0) {
      return res.status(400).json({ 
        error: "No valid orders to import", 
        errors 
      });
    }

    const createdOrders = await storage.createOrders(validItems);
    
    res.status(201).json({
      imported: createdOrders.length,
      total: orders.length,
      errors: errors.length > 0 ? errors : undefined,
      orders: createdOrders,
    });
  } catch (error) {
    handleError(res, error, "Failed to import orders");
  }
});

app.delete("/api/orders", async (_req: Request, res: Response) => {
  try {
    const deletedCount = await storage.deleteAllOrders();
    res.json({ deletedCount });
  } catch (error) {
    handleError(res, error, "Failed to delete all orders");
  }
});

export default app;
