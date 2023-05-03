import { dbContext } from "../db/DbContext";
import { labelsService } from "../services/labelsService";
import BaseController from "../utils/BaseController";
import { logger } from "../utils/Logger";
import multer from 'multer';
const { promisify } = require('util');
const pipeline = promisify(require("stream").pipeline)
const fs = require('fs');
const upload = multer();

export class LabelsController extends BaseController {
    constructor() {
        super('api/upload')
        this.router
            // ///////////////// MAKE THESE CALL BOTH IN FRONT END
            .post('/pdf/cat/:catId/subCat/:subCatId', this.uploadPDF)
            .post('/label/cat/:catId/subCat/:subCatId', this.createLabel)
            .put('/update-label-file/:id', this.updateFile)
            .put('/update-label-db/:id', this.updateFileData)
            .delete('/label/delete/:id', this.removeLabel)
            .get('/get/category/:categoryId/subCategory/:subCatId', this.getLabelsInCats)
    }


    async uploadPDF(req, res, next) {
        try {
            const catId = req.params.catId
            const subCatId = req.params.subCatId
            const catData = await dbContext.Category.findById(catId)
            const subCatData = await dbContext.SubCategory.findById(subCatId)
            const token = req.header("Authorization")
            const creator = await labelsService.findUser(token)
            if (creator == null) {
                res.status(404).send("USER IS NOT FOUND TO DO THIS ACTION")
            } else if (creator.privileges != 'admin' && creator.privileges != 'printshop') {
                logger.log("NO PERMISSION")
                res.status(403).send("YOU DO NOT HAVE PERMISSION TO DO THIS")
            } else {
                if (!catData || !subCatData) {
                    res.status(404).send("CATEGORY OR SUBCATEGORY DOES NOT EXISTS")
                } else {
                    const catName = catData.name
                    const subCatName = subCatData.name
                    upload.array('pdf', 2)(req, res, async (err) => {
                        logger.log(req.files, "THESE ARE THE FILES")
                        if (err) {
                            return next(err);
                        } else {
                            const files = req.files;
                            let path;
                            for (let i = 0; i < files.length; i++) {
                                const fileToPrint = files[i];
                                const fileName = await fileToPrint.originalname;
                                if (i == 0) {
                                    path = `../../../repos/inventive/gena_2/src/pdflabels/${catName}/${subCatName}/${fileName}`
                                } else {
                                    path = `../../../repos/inventive/gena_2/src/bulk/${catName}/${subCatName}/${fileName}`
                                }
                                const pdfBuffer = Buffer.from(fileToPrint.buffer);
                                await fs.promises.writeFile(path, pdfBuffer)
                                logger.log("FILE MADE")
                            }

                            res.status(200).send("PDF CREATED")
                        }
                    });
                }
            }
        } catch (error) {
            logger.error(error);
            next();
        }
    }



    async createLabel(req, res, next) {
        try {
            const token = req.header("Authorization")
            const data = req.body
            const creator = await labelsService.findUser(token)
            if (creator == null) {
                res.status(403).send("USER IS NOT FOUND TO DO THIS ACTION")
            } else {
                const catId = req.params.catId
                const subCatId = req.params.subCatId
                const catData = await dbContext.Category.findById(catId)
                const subCatData = await dbContext.SubCategory.findById(subCatId)
                if (!catData || !subCatData) {
                    res.status(404).send("CATEGORY OR SUBCATEGORY DOES NOT EXISTS")
                } else {
                    const newDoc = await labelsService.createLabel(data, catData, subCatData, creator)
                    logger.log("PDF IN DATABASE")
                    res.status(200).send(newDoc)
                }

            }
        } catch (error) {
            logger.error(error);
            next();
        }
    }





    async updateFile(req, res, next) {
        try {
            const token = req.header('Authorization')
            const user = await dbContext.Account.findOne({ accessToken: token })
            if (!user) {
                res.status(404).send("USER IS NOT FOUND TO DO THIS ACTION")
            }
            else if (user.privileges != 'admin' || user.privileges != 'printshop') {
                res.status(403).send("YOU DO NOT HAVE PERMISSION TO DO THIS")
            } else {
                const labelId = req.param.id
                const label = await dbContext.Label.findById(labelId)
                if (!label) {
                    res.status(404).send({ ERROR: "LABEL DOES NOT EXISTS" })
                } else {
                    const oldFilePath = `${label.path}/${label.categoryName}/${label.subCategoryName}/${label.fileName}`
                    await fs.unlink(oldFilePath, (err) => {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        logger.log('File deleted successfully');
                    })
                    upload.single('pdf')(req, res, async (err) => {
                        if (err) {
                            return next(err);
                        } else {
                            const fileName = await req.file.originalname;
                            logger.log(fileName)
                            const pdfBuffer = Buffer.from(req.file.buffer);;
                            const path = `../../../repos/inventive/gena_2/src/pdflabels/${catName}/${subCatName}/${fileName}`
                            await fs.promises.writeFile(path, pdfBuffer)
                            logger.log("FILE MADE")
                            const newLabel = await labelsService.updateFileName(labelId, fileName)
                            res.status(200).send("PDF CREATED")
                        }
                    });
                }
            }
        } catch (error) {
            logger.error(error);
            next();
        }
    }


    async updateFileData(req, res, next) {
        try {
            const token = req.header('Authorization')
            const user = await dbContext.Account.findOne({ accessToken: token })
            if (!user) {
                res.status(404).send("USER IS NOT FOUND TO DO THIS ACTION")
            } else {
                const labelId = req.params.id
                const data = req.body
                const updatedDoc = await labelsService.updateFileData(labelId, data)
                if (updatedDoc == 404) {
                    res.status(404).send("Label Not Found")
                } else {
                    res.status(200).send(updatedDoc)
                }
            }
        } catch (error) {
            logger.error(error);
            next();
        }
    }


    async removeLabel(req, res, next) {
        try {
            const labelId = req.params.id
            const token = req.header('Authorization')
            const user = await dbContext.Account.findOne({ accessToken: token })
            if (!user) {
                res.status(404).send("USER IS NOT FOUND TO DO THIS ACTION")
            }
            else if (user.privileges != 'admin' || user.privileges != 'printshop') {
                res.status(403).send("YOU DO NOT HAVE PERMISSION TO DO THIS")
            } else {
                const data = await labelsService.removeLabel(labelId)
                if (data == 404) {
                    res.status(404).send("Label Not Found")
                } else if (data == 401) {
                    res.status(401).send("Could not delete file")
                } else {
                    res.status(200).send("DELETE LABEL")
                }
            }
        } catch (error) {
            logger.error(error);
            next();
        }
    }

    async getLabelsInCats(req, res, next) {
        try {
            const catId = req.params.categoryId
            const subCatId = req.params.subCatId
            const data = await labelsService.getLabelsInCats(catId, subCatId)
            res.status(200).send(data)
        } catch (error) {
            logger.error(error);
            next();
        }
    }
}