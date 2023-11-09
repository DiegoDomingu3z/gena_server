import { accountsService } from "../services/AccountsService";
import { internalUserAutomation } from "../services/InternalUserAutomation";
import BaseController from "../utils/BaseController";
import { logger } from "../utils/Logger";

export class AccountsController extends BaseController {
  constructor() {
    super("/api/account");
    this.router
      .post("/create", this.createAccount)
      .post("/login", this.login)
      .put("/logout", this.logout)
      .delete("/delete-user/:id", this.deleteUser)
      .get("", this.getMyAccount)
      .get("/all", this.getUsers)
      .get("/automation", this.userAutomation)
      .put("/:id/update", this.updateAccount);
  }

  /**
* *CREATE ACCOUNT
* Collects all data from body that user sent
*  accountData is sent to accountService to handle logic
* Handles all status to be sent back
* @param {Object} req.body
 @returns {Object} createdDate
*/

  async createAccount(req, res, next) {
    try {
      const accountData = req.body;
      const createdData = await accountsService.createAccount(accountData);
      if (createdData == 401) {
        res.status(401).send("ACCOUNT DATA DOES NOT CONTAIN ALL FIELDS");
      } else if (createdData == "USERNAME EXISTS ALREADY") {
        res.status(401).send("USERNAME EXISTS ALREADY");
      } else {
        res.status(200).send(createdData);
      }
    } catch (error) {
      logger.error(error);
      next();
    }
  }

  /**
* * LOGIN
* Collects all data from body that user sent
* loginDATA is sent to accountService to handle logic
* Handles all status to be sent back
* @param {Object} req.body
@returns {Object} accountData
*/

  async login(req, res, next) {
    try {
      const loginData = req.body;
      const accountData = await accountsService.login(loginData);
      if (accountData == 404) {
        res.status(404).send("ACCOUNT DOES NOT EXISTS");
      } else if (accountData == 401) {
        res.status(401).send("INCORRECT Password");
      } else {
        res.status(200).send(accountData);
      }
    } catch (error) {
      logger.error(error);
      next();
    }
  }

  /**
* *LOGOUT
* Gets token from header and send to service
@returns {StatusCode} accountData
*/
  async logout(req, res, next) {
    try {
      const token = req.header("Authorization");
      const status = await accountsService.logout(token);
      if (status == 404) {
        res.status(404).send("UNABLE TO LOGOUT");
      } else if (status == 200) {
        res.status(200).send("SUCCESSFUL LOGOUT");
      }
    } catch (error) {
      logger.error(error);
      next(error);
    }
  }

  /**
   * * LOGOUT
   * Gets token from header and send to service
   * Gets id of user to be delete from params
   @returns {StatusCode} accountData
   */
  async deleteUser(req, res, next) {
    try {
      const isAdmin = req.header("Authorization");
      const user = req.params.id;
      const data = await accountsService.removeUser(isAdmin, user);
      if (data == 401) {
        res.status(401).send("YOU DON'T HAVE PERMISSION TO DO THIS ACTION");
      } else if (data == 404) {
        res.status(404).send("USER TO DELETE NOT FOUND");
      } else {
        res.status(200).send(data);
      }
    } catch (error) {
      logger.error(error);
      next(error);
    }
  }

  /**
   * * GET MY ACCOUNT
   * @param {String} authToken
   * @returns {Object} Account
   */
  async getMyAccount(req, res, next) {
    try {
      const token = req.header("Authorization");
      const user = await accountsService.getMyAccount(token);
      if (user == 400) {
        res.status(400).send("NO ACCOUNT FOUND");
      } else {
        res.status(200).send(user);
      }
    } catch (error) {
      logger.error(error);
      next(error);
    }
  }

  /**
   * * GET USERS
   * @returns {Array} bring documents of all Accounts Schema
   */
  async getUsers(req, res, next) {
    try {
      const users = await accountsService.getUsers();
      res.status(200).send(users);
    } catch (error) {
      logger.error(error);
      next(error);
    }
  }

  /**
   * * INTERNAL WEB DEPARTMENT/USER AUTOMATION
   * ! API COULD BE BROKEN KEEP TESTING TO VERIFY
   * ? SHOULD WE SET THIS API ON A CRON JOB FOR AUTOMATION?
   */

  async userAutomation(req, res, next) {
    try {
      const depts = await internalUserAutomation.gatherDepartments();
      const users = await internalUserAutomation.gatherEmployees();
      res.status(200).send(users);
    } catch (error) {
      logger.error(error);
      next(error);
    }
  }

  /**
   * * UPDATE ACCOUNT
   * @param {STRING} authToken
   * @param {ObjectId} accountsId
   * @returns UPDATED ACCOUNT
   */

  async updateAccount(req, res, next) {
    try {
      const token = req.header("Authorization");
      const account = req.params.id;
      const data = req.body;
      const updatedData = await accountsService.updateAccount(
        token,
        account,
        data
      );
      if (updatedData == 401) {
        res.status(401).send("FORBIDDEN");
      } else {
        res.status(200).send(updatedData);
      }
    } catch (error) {
      logger.error(error);
      next(error);
    }
  }
}
