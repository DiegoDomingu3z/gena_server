import { filterService } from "../services/FilterService";
import BaseController from "../utils/BaseController";
import { logger } from "../utils/Logger";

export class FilterController extends BaseController{
    constructor(){
        super('api/export')
        this.router
        // .get('/accounts', this.filterAccounts)
        // .get('/category', this.filterCategories)
        // .get('/departments', this.filterDepartments)
        // .get('/labels', this.filterLabels)
        .get('/label-defects', this.filterLabelDefects)
        // .get('/materials', this.filterMaterials)
        // .get('/orders', this.filterOrders)
        // .get('/archived-orders', this.filterArchivedOrders)
        // .get('sub-category', this.filterSubCategories)
    }


    // async filterAccounts(req, res, next){
    //     try {
            
    //     } catch (error) {
    //         logger.error(error)
    //     }
    // }


    // async filterCategories(req, res, next){
    //     try {
    //         res.send({value: "THIS IS WORKING"})
    //     } catch (error) {
    //         logger.error(error)
    //     }
    // }


    // async filterDepartments(req, res, next){
    //     try {
            
    //     } catch (error) {
    //         logger.error(error)
    //     }
    // }


    // async filterLabels(req, res, next){
    //     try {
    //         const dataType = req.params.dataType
    //         logger.log(dataType)
    //         res.send({value: "THIS IS WORKING"})
    //     } catch (error) {
    //         logger.error(error)
    //     }
    // }


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


    // async filterMaterials(req, res, next){
    //     try {
            
    //     } catch (error) {
    //         logger.error(error)
    //     }
    // }


    // async filterOrders(req, res, next){
    //     try {
            
    //     } catch (error) {
    //         logger.error(error)
    //     }
    // }


    // async filterArchivedOrders(req, res, next){
    //     try {
            
    //     } catch (error) {
    //         logger.error(error)
    //     }
    // }


    // async filterSubCategories(req, res, next){
    //     try {
            
    //     } catch (error) {
    //         logger.error(error)
    //     }
    // }

}