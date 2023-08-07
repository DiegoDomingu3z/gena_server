import { TRUE } from "sass";
import { dbContext } from "../db/DbContext"
import { logger } from "../utils/Logger";
const fs = require('fs');
const util = require('util');
const mkdir = util.promisify(fs.mkdir);
const rmdir = util.promisify(fs.rm)
const rename = util.promisify(fs.rename);
const filePath = require('path');
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

    async getById(id) {
        try {
            const cat = await dbContext.Category.findById(id)
            if (!cat) {
                return Promise.resolve(400)
            } else {
                return Promise.resolve(cat)
            }
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
            } else if (user.privileges != 'admin' || user.privileges != 'printshop') {
                return 401
            } else {
                const exists = await dbContext.Category.findOne({ name: data.name })
                if (exists) {
                    return 403
                } else {
                    const i = filePath.join(__dirname, '..', '..', '..', 'gena_2', 'public', 'images', 'pdflabels', `${data.name}`)
                    logger.log(i)
                    const path = await mkdir(i, { recursive: true })
                    const b = filePath.join(__dirname, '..', '..', '..', 'gena_2', 'public', 'images', 'bulk', `${data.name}`)
                    const bulkPath = await mkdir(b, { recursive: true })
                    const cat = await dbContext.Category.create({
                        name: data.name,
                        creatorId: user._id,
                        path: i,
                        bulkPath: b
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
            } else if (user.privileges != 'admin' || user.privileges != 'printshop') {
                return 401
            } else {
                const cat = await dbContext.Category.findById(id)
                if (!cat) {
                    return 401
                } else {

                    const newPath = filePath.join(__dirname, '..', '..', '..', 'gena_2', 'public', 'images', 'pdflabels', `${data.name}`)
                    const bulkPath = filePath.join(__dirname, '..', '..', '..', 'gena_2', 'public', 'images', 'bulk', `${data.name}`)
                    await rename(cat.path, newPath)
                    await rename(cat.bulkPath, bulkPath)
                    const todayDate = new Date()
                    const updatedDoc = await dbContext.Category.findByIdAndUpdate(id, { path: newPath, updatedOn: todayDate, name: data.name, bulkPath: bulkPath }, { returnOriginal: false })
                    // updated all labels with the new category name
                    const updatedLabels = await dbContext.Label.updateMany({ categoryId: id }, { $set: { categoryName: data.name } })
                    const subCats = await dbContext.SubCategory.updateMany({ categoryId: id }, { path: newPath, bulkPath: bulkPath })
                    return updatedDoc
                }
            }
        } catch (error) {
            logger.log(error)
            return error
        }
    }


    async removeCategory(token, id) {
        try {
            const user = await dbContext.Account.findOne({ accessToken: token })
            if (!user) {
                return 404
            } else if (user.privileges != 'admin' && user.privileges != 'printshop') {
                return 403
            } else {
                const findCat = await dbContext.Category.findById(id)
                await rmdir(findCat.path, { recursive: true })
                await rmdir(findCat.bulkPath, { recursive: true })
                const cat = await dbContext.Category.findByIdAndDelete(id)
                await dbContext.SubCategory.deleteMany({ categoryId: id })
                await dbContext.Label.deleteMany({ categoryId: id })
                return Promise.resolve(cat)
            }
        } catch (error) {
            logger.log(error)
            return error
        }
    }



}


export const categoryService = new CategoryService()