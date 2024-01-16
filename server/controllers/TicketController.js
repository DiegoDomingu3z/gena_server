import BaseController from "../utils/BaseController";
import { logger } from "../utils/Logger";
import { ticketService } from "../services/TicketsService";

export class TicketController extends BaseController {
  constructor() {
    super("/api/ticket");
    this.router
      .post("/create", this.createTicket)
      .put("/update/:id", this.updateTicket)
      .get("/tickets", this.getTickets);
  }

  async createTicket(req, res) {
    try {
      const data = req.body;
      const token = req.header("Authorization");
      const ticket = await ticketService.createTicket(token, data);
      // await emailService.ticketingSystem(data, token);
      res.send(ticket);
    } catch (error) {
      logger.log(error);
    }
  }
  async updateTicket(req, res) {
    try {
      const data = req.body;
      const ticketId = req.params.id;
      const token = req.header("Authorization");
      const ticketUpdate = await ticketService.updateTicket(
        data,
        ticketId,
        token
      );
      res.send(ticketUpdate);
    } catch (error) {
      logger.log(error);
    }
  }
  async getTickets(req, res) {
    try {
      const token = req.header("Authorization");
      const tickets = await ticketService.getTickets(token);
      res.send(tickets);
    } catch (error) {
      logger.error(error);
    }
  }
}
