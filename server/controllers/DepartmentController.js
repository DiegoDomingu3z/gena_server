import { departmentService } from "../services/DepartmentService";
import BaseController from "../utils/BaseController";
import { logger } from "../utils/Logger";

export class DepartmentController extends BaseController {
    constructor() {
        super('api/department')
        this.router
            .post('/create', this.createDepartment)
            .get('/all', this.getAllDepartments)
            .get('/users', this.getUsersInDepartment)
            .get('/team-lead', this.getTeamLeads)
    }


    async createDepartment(req, res, next) {
        try {
            const token = req.header('Authorization')
            const data = req.body
            const department = await departmentService.createDepartment(token, data)
            if (department == 403) {
                res.status(403).send("FORBIDDEN")
            } else {
                res.status(200).send(department)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }

    async getAllDepartments(req, res, next) {
        try {
            const departments = await departmentService.getAll()
            return res.status(200).send(departments)
        } catch (error) {
            logger.error(error)
            next()
        }
    }


    async getUsersInDepartment(req, res, next) {
        try {
            const users = await departmentService.getUsersInDepartment()
            return res.status(200).send(users)
        } catch (error) {
            logger.error(error)
            next()
        }
    }

    async getTeamLeads(req, res, next) {
        try {
            const leads = await departmentService.getLeads()
            return res.status(200).send(leads)
        } catch (error) {
            logger.error(error)
            next()
        }
    }
}