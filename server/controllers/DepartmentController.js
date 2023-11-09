import { departmentService } from "../services/DepartmentService";
import BaseController from "../utils/BaseController";
import { logger } from "../utils/Logger";

export class DepartmentController extends BaseController {
  constructor() {
    super("api/department");
    this.router
      .post("/create", this.createDepartment)
      .get("/all", this.getAllDepartments)
      .get("/:id/users", this.getUsersInDepartment)
      .get("/team-lead", this.getTeamLeads)
      .get("/group-leads", this.getGroupLeads)
      .put("/:id/update", this.updateDepartment)
      .delete("/:id/remove", this.removeDepartment);
  }

  /**
   * * CREATE DEPARTMENT
   * ! REQUIRES AUTH TOKEN
   * @param {String} token
   * @param {Object} Department Data
   * @returns {Object} Department Category
   */

  async createDepartment(req, res, next) {
    try {
      const token = req.header("Authorization");
      const data = req.body;
      const department = await departmentService.createDepartment(token, data);
      if (department == 403) {
        res.status(403).send("FORBIDDEN");
      } else {
        res.status(200).send(department);
      }
    } catch (error) {
      logger.error(error);
      next();
    }
  }

  /**
   * * GET ALL DEPARTMENTS
   * ! NO AUTH TOKEN REQUIRED
   * @returns {Array} All Departments
   */

  async getAllDepartments(req, res, next) {
    try {
      const departments = await departmentService.getAll();
      return res.status(200).send(departments);
    } catch (error) {
      logger.error(error);
      next();
    }
  }

  /**
   * * Get users in single department
   * ! NO AUTH TOKEN REQUIRED
   * @param {ObjectId} departmentId
   * @returns {Array} User documents
   */

  async getUsersInDepartment(req, res, next) {
    try {
      const id = req.params.id;
      const users = await departmentService.getUsersInDepartment(id);
      return res.status(200).send(users);
    } catch (error) {
      logger.error(error);
      next();
    }
  }

  /**
   * * Get All Team Leads
   * ! NO AUTH TOKEN REQUIRED
   * @returns {Array} User documents
   */

  async getTeamLeads(req, res, next) {
    try {
      const leads = await departmentService.getLeads();
      return res.status(200).send(leads);
    } catch (error) {
      logger.error(error);
      next();
    }
  }

  /**
   * * UPDATE DEPARTMENT
   * ! AUTH TOKEN REQUIRED TO RUN API
   * @param {ObjectId} departmentId
   * @param {Object} newData
   * @returns {Object} Updated Department
   */

  async updateDepartment(req, res, next) {
    try {
      const token = req.header("Authorization");
      const name = req.body;
      const id = req.params.id;
      const updatedDept = await departmentService.updateDepartment(
        token,
        name,
        id
      );
      if (updatedDept == 401) {
        res.status(401).send("FORBIDDEN");
      } else {
        res.status(200).send(updatedDept);
      }
    } catch (error) {
      logger.error(error);
      next();
    }
  }

  /**
   * * Delete Department
   * * RELATIONAL DATA DELETION
   * ! AUTH TOKEN REQUIRED TO RUN API
   * ! CASCADE DELETION
   * @param {String} authToken
   * @param {ObjectId} departmentId
   * @returns {Object} deleted department
   */

  async removeDepartment(req, res, next) {
    try {
      const token = req.header("Authorization");
      const id = req.params.id;
      const deleteDept = await departmentService.removeDepartment(token, id);
      if (deleteDept == 401) {
        res.status(401).send("FORBIDDEN");
      } else {
        res.status(200).send(deleteDept);
      }
    } catch (error) {
      logger.error(error);
      next();
    }
  }

  /**
   * * Get All Group Leads
   * ! NO AUTH TOKEN REQUIRED
   * @returns {Array} User documents
   */

  async getGroupLeads(req, res, next) {
    try {
      const leads = await departmentService.getGroupLeads();
      return res.status(200).send(leads);
    } catch (error) {
      logger.error(error);
      next();
    }
  }
}
