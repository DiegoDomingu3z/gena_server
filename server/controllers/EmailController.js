import { emailService } from "../services/EmailService";
import BaseController from "../utils/BaseController";
import { logger } from "../utils/Logger";

export class EmailController extends BaseController {
    constructor() {
        super('api/email/')
        this.router
            .post('/new-user', this.sendUserCredentials)
            .post('/ticket', this.ticketingSystem)
    }

    async sendUserCredentials(req, res, next) {
        try {
            const data = req.body
            const token = req.header("Authorization")
            const email = await emailService.sendUserCredentials(data, token)
            return res.status(200).send("EMAIL SENT")
        } catch (error) {
            logger.log(error)
            next(error)
        }
    }


    async ticketingSystem(req, res, next) {
        try {
            const data = req.body
            const token = req.header('Authorization')
            await emailService.ticketingSystem(data, token)
            return res.status(200).send("EMAIL SENT")
        } catch (error) {
            logger.log(error)
            next(error)
        }
    }
}