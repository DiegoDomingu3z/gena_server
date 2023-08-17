import { categoryService } from "../services/CategoryService";
import BaseController from "../utils/BaseController";
import { logger } from "../utils/Logger";

export class CategoryController extends BaseController {
    constructor() {
        super('api/category')
        this.router
            .get('/all', this.getAll)
            .get('/:id', this.getById)
            .post('/create', this.createCategory)
            .put('/update/:id', this.updateCategory)
            .delete('/delete/:id', this.removeCategory)
    }


    /** 
      * * GET ALL CATEGORIES
      * ! No user authentication needed
      * @returns {ARRAY} array of category objects
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


    /** 
      * * GET BY ID
      * ! No user authentication needed
      * @param {ObjectId} categoryId 
      * @returns {Object} single category
      */
    async getById(req, res, next) {
        try {
            const id = req.params.id
            const data = await categoryService.getById(id)
            if (data == 400) {
                res.status(400).send("NO CATEGORY FOUND")
            } else {
                res.status(200).send(data)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }

    /** 
      * * Create Category
      * ! User authentication required
      * @param {Object}  dataSent (data for new category) 
      * @param {String} AuthToken
      * @returns {object} New Category
      */

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


    /** 
      * * Update Category
      * ! REQUIRES USER AUTH TOKEN TO RUN API SUCCESSFULLY
      * @param {String} authToken
      * @param {ObjectId} CategoryId
      * @param {Object} newData
      * @returns {Object} Updated Category Document
      */

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

    /** 
      * * DELETE CATEGORY
      * ! REQUIRES USER AUTH TOKEN TO RUN API SUCCESSFULLY
      * ! CASCADE DELETION
      * @param {ObjectId} CategoryId
      * @param {String} authToken
      * @returns {Object} Deleted Category
      */

    async removeCategory(req, res, next) {
        try {
            const token = req.header('Authorization')
            const id = req.params.id
            const deletedCategory = await categoryService.removeCategory(token, id)
            if (deletedCategory == 400) {
                res.status(400).send("NO USER FOUND TO DO THIS ACTION")
            } else if (deletedCategory == 403) {
                res.status(403).send("YOU DO NOT HAVE THE ACCESS TO DO THIS")
            } else {
                res.status(200).send(deletedCategory)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }
}