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
            .post('/pdf', this.uploadPDF)
    }


    async uploadPDF(req, res, next) {
        try {
            upload.single('File')(req, res, async (err) => {
                if (err) {
                    return next(err);
                }
                else {
                    const {
                        file,
                        body: { name }
                    } = req
                    logger.log(req.file)
                    const fileName = req.file.originalName
                    await pipeline(file.buffer,
                        fs.createWriteStream(`../../../repos/inventive/gena_2/src/pdflabels/TEST10/${fileName}`)
                    )
                    res.send(req.file)
                }
            });
        } catch (error) {
            logger.error(error);
            next();
        }
    }
}