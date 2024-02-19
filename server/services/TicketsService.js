import { dbContext } from "../db/DbContext";
import { logger } from "../utils/Logger";

class TicketService {
  /**
   ** User creation of ticket
   ** Default status: 'In queue'
   * @param {String} token
   * @param {Object} data ticket
   * @return {Object} Ticket Object
   */
  async createTicket(token, data) {
    try {
      const { subject, description, priority } = data;
      const {
        _id: userId,
        firstName,
        lastName,
      } = await dbContext.Account.findOne({
        accessToken: token,
      });
      const ticketData = {
        creatorId: userId,
        creatorName: `${firstName} ${lastName}`,
        subject: subject,
        description: description,
        priority: priority,
      };
      const ticket = await dbContext.Ticket.create(ticketData);
      return ticket;
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  /**
   ** Admin update ticket status
   * @param {Object} data ticket
   * @return {Object} Updated Ticket
   */
  async updateTicket(data, ticketId, token) {
    try {
      const { status } = data;
      const user = await dbContext.Account.findOne({ accessToken: token });
      const { firstName } = user;
      let update = {
        status: status,
        updatedOn: Date.now(),
      };
      if (status == "Complete") {
        update = { ...update, completedBy: firstName };
      } else {
        update = { ...update, claimedBy: firstName };
      }
      const ticket = await dbContext.Ticket.findByIdAndUpdate(
        ticketId,
        update,
        { returnOriginal: false }
      );
      return ticket;
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  /**
   ** Return array of ticket objects based on user role
   * @param {Object} token accessToken
   * @return {Array} Array of Tickets
   */
  async getTickets(token) {
    try {
      const user = await dbContext.Account.findOne({ accessToken: token });
      const { _id: userId, privileges } = user;
      let tickets;

      if (privileges == "admin") {
        tickets = await dbContext.Ticket.find();
      } else {
        tickets = await dbContext.Ticket.find({ creatorId: userId });
      }

      return tickets;
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  /**
   ** Delete Completed tickets that are older than a week old
   */
  async deleteCompletedTickets() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const today = new Date();

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    const formattedToday = formatDate(today);
    const formattedOneWeekAgo = formatDate(oneWeekAgo);
    try {
      await dbContext.Ticket.deleteMany({
        status: "Completed",
        updatedOn: { $lt: oneWeekAgo },
      });
      logger.log("_".repeat(100));
      logger.log(`DAILY MAINTENANCE ${formattedToday}`);
      logger.log(`DELETED TICKETS FROM ${formattedOneWeekAgo}`);
      logger.log("_".repeat(100));
    } catch (error) {
      logger.error(error);
      return error;
    }
  }
}

export const ticketService = new TicketService();
