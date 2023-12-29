import { filterService } from "../services/FilterService";
import BaseController from "../utils/BaseController";
import { logger } from "../utils/Logger";
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

export class FilterController extends BaseController{
    constructor(){
        super('api/export')
        this.router
        .get('/label-defects', this.filterLabelDefects)
    }


    async filterLabelDefects(req, res, next){
        try {
            const query = req.query
            const data = await filterService.filterLabelDefects(query)
            res.status(200).send(data)
        } catch (error) {
            logger.error(error)
            next(error)
        }
    }


    
    



}