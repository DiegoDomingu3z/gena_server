import { printShopService } from "../services/PrintShopService";
import BaseController from "../utils/BaseController";
import { logger } from "../utils/Logger";

export class PrintShopController extends BaseController {
    constructor() {
        super('api/printshop')
        this.router
            .post('/order/:id/printing', this.createFilesToPrint)
    }


    async createFilesToPrint(req, res, next) {
        try {
            const order = req.params.id
            const token = req.header('Authorization')
            const printedOrder = await printShopService.createFilesToPrint(token, order)

        } catch (error) {
            logger.log(error)
            next(error)
        }
    }
}