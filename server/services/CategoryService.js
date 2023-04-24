import { dbContext } from "../db/DbContext"
import { logger } from "../utils/Logger";
const fs = require('fs');
const util = require('util');
const mkdir = util.promisify(fs.mkdir);
const rename = util.promisify(fs.rename);
class CategoryService {




    async getAll() {
        try {
            const cats = await dbContext.Category.find()
            return cats
        } catch (error) {
            logger.log(error)
            return error
        }
    }


    async createCategory(token, data) {
        try {
            const user = await dbContext.Account.findOne({ accessToken: token })
            if (!user) {
                return 404
            } else if (user.privileges != 'admin') {
                return 401
            } else {
                const exists = await dbContext.Category.findOne({ name: data.name })
                if (exists) {
                    return 403
                } else {
                    const path = await mkdir(`../../../repos/inventive/gena_2/src/pdflabels/${data.name}`, { recursive: true })
                    const cat = await dbContext.Category.create({
                        name: data.name,
                        creatorId: user._id,
                        path: `../../../repos/inventive/gena_2/src/pdflabels/${data.name}`
                    })
                    return cat
                }
            }
        } catch (error) {
            logger.log(error)
            return error
        }
    }


    async updateCategory(token, data, id) {
        try {
            const user = await dbContext.Account.findOne({ accessToken: token })
            if (!user) {
                return 404
            } else if (user.privileges != 'admin') {
                return 401
            } else {
                const cat = await dbContext.Category.findById(id)
                if (!cat) {
                    return 401
                } else {
                    const newPath = `../../../repos/inventive/gena_2/src/pdflabels/${data.name}`
                    await rename(cat.path, newPath)
                    const todayDate = new Date()
                    const updatedDoc = await dbContext.Category.findByIdAndUpdate(id, { path: newPath, updatedOn: todayDate, name: data.name }, { returnOriginal: false })
                    const subCats = await dbContext.SubCategory.updateMany({ categoryId: id }, { path: newPath })
                    return updatedDoc
                }
            }
        } catch (error) {
            logger.log(error)
            return error
        }
    }



}


export const categoryService = new CategoryService()