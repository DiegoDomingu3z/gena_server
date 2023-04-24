import { dbContext } from "../db/DbContext"
import { logger } from "../utils/Logger"
const fs = require('fs');
const util = require('util');
const mkdir = util.promisify(fs.mkdir);

class SubCategoryService {

    async createSubCat(token, catId, data) {
        try {
            const user = await dbContext.Account.findOne({ accessToken: token })
            const category = await dbContext.Category.findById(catId)
            if (!category) {
                logger.log("CATEGORY DOES NOT EXIST")
                return 404
            }
            if (!user) {
                return 404
            } else if (user.privileges != 'admin') {
                return 401
            } else {
                const path = await mkdir(`${category.path}`, { recursive: true })
                const cat = await dbContext.SubCategory.create({
                    name: data.name,
                    creatorId: user._id,
                    path: `${category.path}/${data.name}`,
                    categoryId: catId
                })
                return cat
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }



    async getAll() {
        try {
            const data = await dbContext.SubCategory.find()
            if (!data) {
                return Promise.resolve(404)
            } else {
                return data
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }


    async getAllInCategory(id) {
        try {
            const subCats = await dbContext.SubCategory.find({ categoryId: id })
            if (!subCats) {
                return Promise.resolve(404)
            } else {
                return subCats
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }



    async getById(id) {
        try {
            const cat = await dbContext.SubCategory.findById(id)
            if (!cat) {
                return Promise.resolve(404)
            } else {
                return cat
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }

}

export const subCategoryService = new SubCategoryService()