import { dbContext } from "../db/DbContext";
import { logger } from "../utils/Logger"
const fs = require('fs');
const multer = require('multer');

class LabelsService {




    async findUser(token) {
        const data = await dbContext.Account.findOne({ accessToken: token })
        if (!data) {
            return null
        } else {
            return data._id
        }
    }


    async createLabel(data, catData, subCatData, creator) {
        try {
            let labelData;
            if (data.isBulkLabel == true) {
                labelData = {
                    pdfPath: `../../../repos/inventive/gena_2/src/pdflabels/`,
                    pdfBulkPath: `../../../repos/inventive/gena_2/src/bulk/`,
                    fields: data.fields,
                    maxOrderQty: data.maxOrderQty,
                    isBulkLabel: data.isBulkLabel,
                    unitPack: data.unitPack,
                    docNum: data.docNum,
                    creatorId: creator,
                    categoryName: catData.name,
                    categoryId: catData._id,
                    subCategoryName: subCatData.name,
                    subCategoryId: subCatData._id,
                    fileName: data.fileName,
                    isKanban: data.isKanban
                }
            } else if (data.isBulkLabel == false) {
                labelData = {
                    pdfPath: `../../../repos/inventive/gena_2/src/pdflabels/`,
                    fields: data.fields,
                    maxOrderQty: data.maxOrderQty,
                    isBulkLabel: data.isBulkLabel,
                    unitPack: data.unitPack,
                    docNum: data.docNum,
                    creatorId: creator,
                    categoryName: catData.name,
                    categoryId: catData._id,
                    subCategoryName: subCatData.name,
                    subCategoryId: subCatData._id,
                    fileName: data.fileName,
                    isKanban: data.isKanban

                }
            }
            const newDoc = await dbContext.Label.create(labelData)
            logger.log(newDoc)
            return newDoc
        } catch (error) {
            logger.log(error)
            return error
        }
    }




    async updateFileName(id, fileName) {
        try {
            const updatedLabel = await dbContext.Label.findByIdAndUpdate(id, { fileName: fileName, updateOn: Date.now() })
            return updatedLabel
        } catch (error) {
            logger.log(error)
            return error
        }
    }


    async updateFileData(id, data) {
        try {
            data['updatedOn'] = Date.now()
            const updatedLabel = await dbContext.Label.findByIdAndUpdate(id, data)
            // check if data.categoryName is different
            // check if data.subCategoryName is different
            // if they are delet the old file path and create the new file path
            const newLabel = await dbContext.Label.findById(id)
            return newLabel
        } catch (error) {
            logger.log(error)
            return error
        }
    }


    async removeLabel(id) {
        const label = await dbContext.Label.findById(id)
        if (!label) {
            return Promise.resolve(404)
        } else {
            const path = `${label.pdfPath}/${label.categoryName}/${label.subCategoryName}/${label.fileName}`
            await fs.unlink(path, (err) => {
                if (err) {
                    console.error(err);
                    return Promise.resolve(401);
                }
                return Promise.resolve(200)
            })
            await dbContext.Label.findByIdAndDelete(id)
            return Promise.resolve(200)
        }
    }



}

export const labelsService = new LabelsService()