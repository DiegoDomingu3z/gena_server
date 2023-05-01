import { dbContext } from "../db/DbContext"
import { logger } from "../utils/Logger"
const fs = require('fs');
const util = require('util');
const mkdir = util.promisify(fs.mkdir);
const rename = util.promisify(fs.rename);
class SubCategoryService {

    async createSubCat(token, catId, data) {
        try {
            const user = await dbContext.Account.findOne({ accessToken: token })
            const category = await dbContext.Category.findById(catId)
            if (!category) {
                logger.log("CATEGORY DOES NOT EXIST")
                return 404
            } else {
                if (!user) {
                    return 404
                } else if (user.privileges != 'admin') {
                    return 401
                } else {
                    const path = await mkdir(`${category.path}/${data.name}`, { recursive: true })
                    const bulkPath = await mkdir(`${category.bulkPath}/${data.name}`, { recursive: true })
                    const cat = await dbContext.SubCategory.create({
                        name: data.name,
                        creatorId: user._id,
                        path: `${category.path}`,
                        bulkPath: bulkPath,
                        categoryId: catId
                    })
                    return cat
                }
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


    async updateSubCat(token, id, data) {
        try {
            const user = await dbContext.Account.findOne({ accessToken: token })
            if (!user) {
                return Promise.resolve(403)
            } else {
                const subCat = await dbContext.SubCategory.findById(id)
                if (!subCat) {
                    return Promise.resolve(404)
                } else {

                    data['updatedOn'] = Date.now()
                    const updatedDoc = await dbContext.SubCategory.findByIdAndUpdate(id, data)
                    const doc = await dbContext.SubCategory.findById(id)
                    const updatedLabel = await dbContext.Label.updateMany({ subCategoryId: id }, { $set: { subCategoryName: doc.name } })
                    const category = await dbContext.Category.findById(doc.categoryId)
                    const pathToUpdated = `${doc.path}/${subCat.name}`
                    const pathToUpdatedBulk = `${doc.bulkPath}/${subCat.name}`
                    const newPath = `../../../repos/inventive/gena_2/src/pdflabels/${category.name}/${doc.name}`
                    const newBulkPath = `../../../repos/inventive/gena_2/src/bulk/${category.name}/${doc.name}`
                    await rename(pathToUpdated, newPath)
                    await rename(pathToUpdatedBulk, newBulkPath)
                    return doc
                }
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }

}

export const subCategoryService = new SubCategoryService()