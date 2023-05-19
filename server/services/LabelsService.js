import { PDFDocument } from "pdf-lib";
import { dbContext } from "../db/DbContext";
import { logger } from "../utils/Logger"
import { PDFTextField } from 'pdf-lib';
import { PDFCheckBox } from 'pdf-lib';
const fs = require('fs');
const filePath = require('path');
const multer = require('multer');
const pdfjs = require('pdfjs-dist');

class LabelsService {




    async findUser(token) {
        const data = await dbContext.Account.findOne({ accessToken: token })
        if (!data) {
            return null
        } else {
            return data
        }
    }


    async createLabel(data, catData, subCatData, creator) {
        try {
            let labelData;
            let fields = [];
            let bulkPath
            if (data.isBulkLabel == true) {
                bulkPath = filePath.join(__dirname, '..', '..', '..', 'gena_2', 'public', 'images', 'bulk')
            }
            if (data.isKanban == true) {
                fields = data.fields
            }

            const pdfPath = filePath.join(__dirname, '..', '..', '..', 'gena_2', 'public', 'images', 'pdflabels');

            labelData = {
                pdfPath: pdfPath,
                pdfBulkPath: bulkPath,
                fields: fields,
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
                isKanban: data.isKanban,
                materialTypeId: data.materialTypeId,
                name: data.name,
                bulkFileName: data.bulkFileName


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
            let path = filePath.join(__dirname, '..', '..', '..', 'gena_2', 'public', 'images', 'pdflabels');
            let bulkPath;
            if (label.isBulkLabel == true) {
                bulkPath = filePath.join(__dirname, '..', '..', '..', 'gena_2', 'public', 'images', 'bulk', `${label.name}`)
                await fs.unlink(bulkPath, (err) => {
                    if (err) {
                        console.error(err);
                        return Promise.resolve(401);
                    }
                    return Promise.resolve(200)
                })
            }
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

    async getLabelsInCats(catId, subCatId) {
        try {
            const data = await dbContext.Label.find({ categoryId: catId, subCategoryId: subCatId })
            return Promise.resolve(data)
        } catch (error) {
            logger.log(error)
            return error
        }
    }

    async searchLabel(data) {
        try {
            const foundData = await dbContext.Label.find({
                $or: [
                    { fileName: { $regex: new RegExp(data, 'i') } },
                    { docNum: { $regex: new RegExp(data, 'i') } },
                    { categoryName: { $regex: new RegExp(data, 'i') } },
                    { subCategoryName: { $regex: new RegExp(data, 'i') } },
                    { name: { $regex: new RegExp(data, 'i') } }
                ]
            });
            return foundData;

        } catch (error) {
            logger.log(error)
            return error
        }
    }

    async getFieldsFromLabel(buffer) {
        try {
            const pdfDoc = await PDFDocument.load(new Uint8Array(buffer));
            const form = pdfDoc.getForm();
            const fieldNames = form.getFields().map(field => field.getName());
            const types = []
            const labelObjects = []
            for (let i = 0; i < fieldNames.length; i++) {
                const field = fieldNames[i];
                try {
                    const checkbox = form.getCheckBox(field);
                    types.push('checkbox')

                } catch (error) {
                    types.push('text')
                }

            }
            for (let i = 0; i < fieldNames.length; i++) {
                const name = fieldNames[i];
                const type = types[i]
                let obj = {
                    name: name,
                    type: type
                }
                labelObjects.push(obj)
            }
            logger.log(labelObjects)
            return labelObjects

        } catch (error) {
            logger.log(error)
            return error
        }
    }



}

export const labelsService = new LabelsService()