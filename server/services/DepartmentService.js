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

    async getUsersInDepartment(id) {
        try {
            const users = await dbContext.Account.find({ departmentId: id })
            return Promise.resolve(users)
        } catch (error) {
            logger.log(error)
            return error
        }
    }

    async getLeads() {
        try {
            const leads = await dbContext.Account.find({ privileges: 'team-lead' })
            return Promise.resolve(leads)
        } catch (error) {
            logger.log(error)
            return error
        }
    }

    async updateDepartment(token, data, id) {
        try {
            const user = await dbContext.Account.findOne({ accessToken: token })
            if (user.privileges != 'admin') {
                return Promise.resolve(401)
            } else {
                const oldDept = await dbContext.Department.findById(id)
                // 
                const filter = { _id: id }
                const update = { $set: { name: data.name } }
                const options = { returnOriginal: false }
                // filter to update all users with new dept name
                const userFilter = { department: oldDept.name };
                const userUpdate = { $set: { department: data.name } };
                const userOptions = { multi: true };
                const users = await dbContext.Account.updateMany(userFilter, userUpdate, userOptions)
                const dept = await dbContext.Department.findOneAndUpdate(filter, update, options)
                return dept
            }
        } catch (error) {
            logger.log(error)
            return error
        }
    }


    async removeDepartment(token, id) {
        try {
            const user = await dbContext.Account.findOne({ accessToken: token })
            if (user.privileges != 'admin') {
                return Promise.resolve(401)
            } else {
                const filter = { departmentId: id }
                const allAccountsRemoved = await dbContext.Account.deleteMany(filter)
                const removedDept = await dbContext.Department.findByIdAndDelete(id)
                return removedDept
            }
        } catch (error) {
            logger.log(error)
            return error
        }
    }

    async getGroupLeads() {
        try {
            const leads = await dbContext.Account.find({ privileges: 'group-lead' })
            return leads
        } catch (error) {
            logger.log(error)
            return error
        }
    }


}

export const departmentService = new DepartmentService()