import { printShopService } from "../services/PrintShopService";
import BaseController from "../utils/BaseController";
import { logger } from "../utils/Logger";

export class PrintShopController extends BaseController {
    constructor() {
        super('api/printshop')
        this.router
            .post('/order/:id/printing', this.createFilesToPrint)
            .post('/order/:id/delivered', this.deliverOrder)
    }


    async createFilesToPrint(req, res, next) {
        try {
            const order = req.params.id
            const token = req.header('Authorization')
            const printedOrder = await printShopService.createFilesToPrint(token, order)
            let statusCode, message;
            switch (printedOrder) {
                case 200:
                    statusCode = 200;
                    message = "ORDER IS NOW PROCESSING";
                    break;
                case 400:
                    statusCode = 400;
                    message = "NO USER FOUND";
                    break;
                case 403:
                    statusCode = 403;
                    message = "FORBIDDEN";
                    break;
                case 404:
                    statusCode = 404;
                    message = "NO ORDER FOUND";
                    break;
                default:
                    statusCode = 500;
                    message = "INTERNAL SERVER ERROR";
                    break;
            }

            res.status(statusCode).send(message);
        } catch (error) {
            logger.log(error)
            next(error)
        }
    }


    async deliverOrder(req, res, next) {
        try {
            const order = req.params.id
            const token = req.header('Authorization')
            const deliveredOrder = await printShopService.deliverOrder(order, token)
            let statusCode, message;
            switch (deliveredOrder) {
                case 400:
                    statusCode = 400;
                    message = "User or Order was not foun";
                    break;
                case 403:
                    statusCode = 403;
                    message = "FORBIDDEN";
                    break;
                case 200:
                    statusCode = 200.
                    message = "MARKED AS DELIVERED"
                    break;
                default:
                    statusCode = 500;
                    message = "INTERNAL SERVER ERROR";
            }
            res.status(statusCode).send(message)
        } catch (error) {
            logger.log(error)
            next(error)
        }
    }
}