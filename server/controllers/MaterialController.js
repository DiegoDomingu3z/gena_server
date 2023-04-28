import { dbContext } from "../db/DbContext";
import { materialService } from "../services/MaterialService";
import BaseController from "../utils/BaseController";
import { logger } from "../utils/Logger";

export class MaterialController extends BaseController {
    constructor() {
        super('api/materials')
        this.router
            .post('/create', this.createMaterial)
    }


    async createMaterial(req, res, next) {
        try {
            const token = req.header("Authorization")
            const user = await dbContext.Account.findOne({ accessToken: token })
            if (user.privileges != 'admin' && user.privileges != 'printshop') {
                res.status(401).send("FORBIDDEN")
            } else {
                const data = req.body
                const newMaterial = await materialService.createMaterial(data, user._id)
                res.status(200).send(newMaterial)
            }
        } catch (error) {
            logger.log(error)
            next(error)
        }
    }
}