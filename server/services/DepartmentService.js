import { dbContext } from "../db/DbContext";
import { logger } from "../utils/Logger";

class DepartmentService {
  /**
   * * Create Department
   * * RELATIONAL DATA DELETION
   * ! ONLY RUNS FOR PRINTSHOP & ADMIN USERS
   * @param {String} token
   * @param {Object} data
   * @returns {Object} created department
   */
  async createDepartment(token, data) {
    try {
      const user = await dbContext.Account.findOne({ accessToken: token });
      if (user.privileges != "admin" && user.privileges != "printshop") {
        return Promise.resolve(403);
      } else {
        let depData = {
          name: data.name,
        };
        const newDepartment = dbContext.Department.create(depData);
        return Promise.resolve(newDepartment);
      }
    } catch (error) {
      logger.log(error);
      return error;
    }
  }

  /**
   * * GET ALL DEPARTMENTS
   * @returns {Array} all departments
   */

  async getAll() {
    try {
      const departments = await dbContext.Department.find();
      return Promise.resolve(departments);
    } catch (error) {
      logger.log(error);
      return error;
    }
  }

  /**
   * * GET USERS IN DEPARTMENT
   * @param {ObjectId} id
   * @returns {Array} All users in specified department
   */

  async getUsersInDepartment(id) {
    try {
      const users = await dbContext.Account.find({ departmentId: id });
      return Promise.resolve(users);
    } catch (error) {
      logger.log(error);
      return error;
    }
  }

  /**
   * * Get Team Leads
   * @returns {Array} Team Lead Users
   */

  async getLeads() {
    try {
      const leads = await dbContext.Account.find({ privileges: "team-lead" });
      return Promise.resolve(leads);
    } catch (error) {
      logger.log(error);
      return error;
    }
  }

  /**
   * * Updated Department
   * * WILL UPDATE RELATIONAL DATA (accounts)
   * ! ONLY RUNS FOR ADMIN USERS
   * @param {String} token
   * @param {Object} data
   * @param {ObjectId} id
   * @returns {Object} Updated department
   */
  async updateDepartment(token, data, id) {
    try {
      const user = await dbContext.Account.findOne({ accessToken: token });
      if (user.privileges != "admin") {
        return Promise.resolve(401);
      } else {
        const oldDept = await dbContext.Department.findById(id);
        const filter = { _id: id };
        const update = { $set: { name: data.name } };
        const options = { returnOriginal: false };
        // filter to update all users with new dept name
        const userFilter = { department: oldDept.name };
        const userUpdate = { $set: { department: data.name } };
        const userOptions = { multi: true };
        const users = await dbContext.Account.updateMany(
          userFilter,
          userUpdate,
          userOptions
        );
        const dept = await dbContext.Department.findOneAndUpdate(
          filter,
          update,
          options
        );
        return dept;
      }
    } catch (error) {
      logger.log(error);
      return error;
    }
  }

  /**
   * * Remove Department
   * * RELATIONAL DATA DELETION (accounts)
   * ! ONLY RUNS FOR ADMIN USERS
   * @param {String} token
   * @param {ObjectId} id
   * @returns {Object} removed department
   */

  async removeDepartment(token, id) {
    try {
      const user = await dbContext.Account.findOne({ accessToken: token });
      if (user.privileges != "admin") {
        return Promise.resolve(401);
      } else {
        const filter = { departmentId: id };
        const allAccountsRemoved = await dbContext.Account.deleteMany(filter);
        const removedDept = await dbContext.Department.findByIdAndDelete(id);
        return removedDept;
      }
    } catch (error) {
      logger.log(error);
      return error;
    }
  }

  /**
   * * Get All Group Leads
   * @returns {Array} All Group Leads
   */
  async getGroupLeads() {
    try {
      const leads = await dbContext.Account.find({ privileges: "group-lead" });
      return leads;
    } catch (error) {
      logger.log(error);
      return error;
    }
  }
}

export const departmentService = new DepartmentService();
