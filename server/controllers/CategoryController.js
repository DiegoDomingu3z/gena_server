import { categoryService } from "../services/CategoryService";
import BaseController from "../utils/BaseController";
import { logger } from "../utils/Logger";

export class CategoryController extends BaseController {
    constructor() {
        super('api/category')
        this.router
            .get('/all', this.getAll)
            .post('/create', this.createCategory)
            .put('/update/:id', this.updateCategory)
    }


    /**
           * GetALl
           * find users account and removes accessToken
           @returns {StatusCode} accountData
           */
    async getAll(req, res, next) {
        try {
            const data = await categoryService.getAll()
            if (!data) {
                res.status(404).send("NO DATA FOUND")
            } else {
                res.status(200).send(data)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }

    async createCategory(req, res, next) {
        try {
            const userToken = req.header("Authorization")
            const dataSent = req.body
            const data = await categoryService.createCategory(userToken, dataSent)
            if (data == 404) {
                res.status(404).send("NO USER WAS FOUND TO DO THIS ACTION")
            } else if (data == 401) {
                res.status(401).send("YOU DON'T HAVE PERMISSION TO DO THIS ACTION")
            } else if (data == 403) {
                res.status(403).send("CATEGORY WITH THAT NAME ALREADY EXISTS")
            } else {
                res.status(200).send(data)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }

    async updateCategory(req, res, next) {
        try {
            const userToken = req.header("Authorization")
            const dataSent = req.body
            const catId = req.params.id
            const updatedData = await categoryService.updateCategory(userToken, dataSent, catId)
            if (updatedData == 404) {
                res.status(404).send("NO USER WAS FOUND TO DO THIS ACTION")
            } else if (updatedData == 401) {
                res.status(401).send("YOU DON'T HAVE PERMISSION TO DO THIS ACTION")
            } else {
                res.status(200).send(updatedData)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }
}