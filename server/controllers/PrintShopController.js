import BaseController from "../utils/BaseController";
import { logger } from "../utils/Logger";

export class PrintShopController extends BaseController {
    constructor() {
        super('api/printshop')
        this.router
            .post('/order/printing', this.createFilesToPrint)
    }


    async createFilesToPrint(req, res, next) {
        try {

        } catch (error) {
            logger.log(error)
            next(error)
        }
    }
}