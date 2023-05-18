import { subCategoryService } from "../services/SubCategoryService";
import BaseController from "../utils/BaseController";
import { logger } from "../utils/Logger";

export class SubCategoryController extends BaseController {
    constructor() {
        super('api/subcategory')
        this.router
            .post('/create/:catId', this.createSubCat)
            .get('/all', this.getAll)
            .get('/incat/:id', this.getAllInCategory)
            .get('/:id', this.getById)
            .put('/update/:id', this.updateSubCat)
            .delete('/remove/:id', this.removeSubCategory)
    }


    async createSubCat(req, res, next) {
        try {
            const userToken = req.header("Authorization")
            const catId = req.params.catId
            const info = req.body
            const data = await subCategoryService.createSubCat(userToken, catId, info)
            if (data == 404) {
                res.status(404).send("NO USER WAS FOUND TO DO THIS ACTION")
            } else if (data == 401) {
                res.status(401).send("YOU DON'T HAVE PERMISSION TO DO THIS ACTION")
            } else {
                res.status(200).send(data)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }


    async getAll(req, res, next) {
        try {
            const data = await subCategoryService.getAll()
            if (!data) {
                res.status(404).send("DATA NOT FOUND")
            } else {
                res.status(200).send(data)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }


    async getAllInCategory(req, res, next) {
        try {
            const catId = req.params.id
            const data = await subCategoryService.getAllInCategory(catId)
            if (data == 404) {
                res.status(404).send("CATEGORY WAS NOT FOUND OR DATA DOES NOT EXIST")
            } else {
                res.status(200).send(data)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }


    async getById(req, res, next) {
        try {
            const subCatId = req.params.id
            const data = await subCategoryService.getById(subCatId)
            if (data == 404) {
                res.status(404).send("SUBCATEGORY NOT FOUND")
            } else {
                res.status(200).send(data)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }


    async updateSubCat(req, res, next) {
        try {
            const token = req.header('Authorization')
            const subCatId = req.params.id
            const newData = req.body
            const data = await subCategoryService.updateSubCat(token, subCatId, newData)
            if (data == 400) {
                res.status(400).send("SUBCATEGORY NOT FOUND")
            } else if (data == 401) {
                res.status(401).send("YOU DON'T HAVE PERMISSION TO DO THIS ACTION")
            } else {
                res.status(200).send(data)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }

    async removeSubCategory(req, res, next) {
        try {
            const token = req.header('Authorization')
            const id = req.params.id
            const data = await subCategoryService.removeSubCategory(id, token)
            if (data == 403) {
                res.status(403).send("NO USER FOUND OR YOU DON'T HAVE ACCESS TO DO THIS")
            } else {
                res.status(200).send(data)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }


}