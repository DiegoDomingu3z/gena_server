import { dbContext } from "../db/DbContext"
import { logger } from "../utils/Logger"

class DepartmentService {


    async createDepartment(token, data) {
        try {
            const user = await dbContext.Account.findOne({ accessToken: token })
            logger.log(user)
            if (user.privileges != 'admin' && user.privileges != 'printshop') {
                return Promise.resolve(403)
            } else {
                let depData = {
                    name: data.name
                }
                const newDepartment = dbContext.Department.create(depData)
                return Promise.resolve(newDepartment)
            }
        } catch (error) {
            logger.log(error)
            return error
        }
    }

    async getAll() {
        try {
            const departments = await dbContext.Department.find()
            return Promise.resolve(departments)
        } catch (error) {
            logger.log(error)
            return error
        }
    }


}

export const departmentService = new DepartmentService()