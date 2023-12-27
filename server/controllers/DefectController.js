import { defectService } from "../services/DefectService";
import BaseController from "../utils/BaseController";
import { logger } from "../utils/Logger";




export class DefectController extends BaseController{
    constructor(){
        super('api/sn-labels')
        this.router
        .get('', this.getSerialLabels)
        .post('/defect', this.submitDefect)
    }



    async getSerialLabels(req, res, next){
        try {
            const data = await defectService.getSerialLabels()
            res.status(200).send(data)
        } catch (error) {
            logger.error(error)
            next()
        }
    }

    async submitDefect(req, res, next){
        try {
            const token = req.header("Authorization")
            const data = req.body
            const response = await defectService.defectSubmission(token, data)
            if (response == 403) {
                res.status(403).send("UNAUTHORIZED")
            } else {
                res.status(200).send(response)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }
}