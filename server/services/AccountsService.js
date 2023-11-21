import { dbContext } from "../db/DbContext";
import { middleware } from "../middleware/middleware";
import { logger } from "../utils/Logger";
import { authTokens } from "./AuthTokens";
import bcrypt from "bcrypt";
import { emailService } from "./EmailService";

class AccountsService {
  /**
* * CREATE ACCOUNT
* ! checks if object contains all fields necessary 
* ! checks to see if a user with that username already exists if it does return 401
* ! sanatizes data to correctly go into database
* ! If it cant create account it will send a 401
* ! else it returns the new document
* @param {Object} data
  @returns {Object} newData
*/

  async createAccount(data) {
    try {
      let lead;
      let groupLead;
      if (
        !data.firstName ||
        !data.lastName ||
        !data.userName ||
        !data.password ||
        !data.privileges ||
        !data.departmentId
      ) {
        return 401;
      }
      const userNameCheck = await middleware.checkIfUserNameExists(
        data.userName
      );
      if (userNameCheck == 401) {
        return "USERNAME EXISTS ALREADY";
      } else if (userNameCheck == 200) {
        const cryptPass = await middleware.encryptPassword(data.password);
        const dept = await dbContext.Department.findById(data.departmentId);
        if (data.teamLeadId == "") {
          lead = { firstName: "", lastName: "" };
        } else {
          lead = await dbContext.Account.findById(data.teamLeadId);
        }
        if (data.groupLeadId == "") {
          groupLead = { firstName: "", lastName: "" };
        } else {
          groupLead = await dbContext.Account.findById(data.groupLeadId);
        }
        const sanitizedData = {
          firstName: data.firstName,
          lastName: data.lastName,
          userName: data.userName,
          password: cryptPass,
          department: dept.name,
          departmentId: data.departmentId,
          privileges: data.privileges,
          groupLead: `${groupLead.firstName} ${groupLead.lastName}`,
          groupLeadId: data.groupLeadId,
          teamLead: `${lead.firstName} ${lead.lastName}`,
          teamLeadId: data.teamLeadId,
          email: data.email,
        };
        const newData = await dbContext.Account.create(sanitizedData);
        if (!newData) {
          return 401;
        } else {
          return newData;
        }
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  /**
   * * LOGIN
   * Finds account associated with account
   * Checks to see if password they sent it the same as password in database
   * if check is true, a new access token is generated for user and put into DB
   * user is then sent back object containing their account information
   * if password is wrong user is sent a 401
   * @param {Object} data
   * @returns {Object} updatedUserDoc
   */
  async login(data) {
    try {
      const password = data.password;
      const user = await dbContext.Account.findOne({ userName: data.userName });
      if (!user) {
        return 404;
      } else {
        const checkPass = await bcrypt.compare(
          password.toString(),
          user.password
        );
        if (checkPass == true) {
          // checking if the password sent is the same as the one in the database
          const newGeneratedToken = await authTokens.authToken();
          const updatedUserDoc = await dbContext.Account.findOneAndUpdate(
            { userName: user.userName },
            { accessToken: newGeneratedToken },
            { returnDocument: true }
          );
          const updatedDoc = await dbContext.Account.findOne({
            accessToken: newGeneratedToken,
          });
          return updatedDoc;
        } else {
          return 401;
        }
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  /**
       * * LOGOUT
       * find users account and removes accessToken
       @returns {StatusCode} 
       */

  async logout(token) {
    try {
      const user = await dbContext.Account.findOneAndUpdate(
        {
          accessToken: token,
        },
        {
          $unset: { accessToken: "" },
        }
      );
      if (user == null) {
        return Promise.resolve(404);
      } else if (user) {
        return Promise.resolve(200);
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }
  /**
   * * REMOVE USER FROM DATABASE
   * ! checks if account id admin
   * ! finds user by ID then deletes the user
   * @returns {StatusCode || Object} accountData
   */

  async removeUser(adminToken, userId) {
    try {
      // checking user token
      const isAdmin = await dbContext.Account.findOne({
        accessToken: adminToken,
      });
      if (isAdmin.privileges == "admin") {
        const data = await dbContext.Account.findByIdAndDelete(userId);
        if (data == null) {
          return Promise.resolve(404);
        } else {
          return data;
        }
      } else if (isAdmin.privileges != "admin") {
        return Promise.resolve(401);
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  /**
   * * GET MY ACCOUNT
   * @param {Token} authToken
   * @returns users account document
   */

  async getMyAccount(token) {
    try {
      // getting account by their access token
      const account = await dbContext.Account.findOne({ accessToken: token });
      if (!account) {
        return Promise.resolve(400);
      } else {
        return Promise.resolve(account);
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  /**
   * * GET Users
   * Brings back all document in accounts collection
   */

  async getUsers() {
    try {
      const users = await dbContext.Account.find();
      return users;
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  /**
   * * Update Account
   * ! Deprecated
   * ? SHOULD?
   * TODO
   * @param {String} token
   * @param {ObjectId} id (accountId)
   * @param {Object} data (information to be updated about the user)
   */

  async updateAccount(token, id, data) {
    try {
      let pass;
      let newDept;
      let teamLead;
      let groupLead;
      const currentUser = await dbContext.Account.findOne({
        accessToken: token,
      });
      if (
        currentUser.privileges != "admin" &&
        currentUser.privileges != "group-lead"
      ) {
        return Promise.resolve(401);
      }
      if (
        currentUser.privileges == "group-lead" &&
        currentUser.departmentId != data.departmentId
      ) {
        return Promise.resolve(401);
      } else {
        const account = await dbContext.Account.findById(id);
        if (data.password != "") {
          pass = await middleware.encryptPassword(data.password);
        } else {
          pass = account.password;
        }
        if (data.departmentId != account.departmentId) {
          newDept = await dbContext.Department.findById(data.departmentId);
        } else {
          newDept = account.department;
        }
        if (data.teamLeadId != account.teamLeadId) {
          teamLead = await dbContext.Account.findById(data.teamLeadId);
        }
        if (data.groupLeadId != account.groupLeadId) {
          groupLead = await dbContext.Account.findById(data.groupLeadId);
        }
        const newData = {
          firstName: data.firstName != "" ? data.firstName : account.firstName,
          lastName: data.lastName != "" ? data.lastName : account.lastName,
          userName: data.userName != "" ? data.userName : account.userName,
          password: pass,
          department: newDept.name,
          departmentId:
            data.departmentId != account.departmentId
              ? data.departmentId
              : account.departmentId,
          privileges:
            data.privileges != "" ? data.privileges : account.privileges,
          groupLead:
            data.groupLeadId != account.groupLeadId
              ? ` ${groupLead.firstName} ${groupLead.lastName}`
              : account.groupLead,
          groupLeadId:
            data.groupLeadId != account.groupLeadId
              ? data.groupLeadId
              : account.groupLeadId,
          teamLead:
            data.teamLeadId != account.teamLeadId
              ? `${teamLead.firstName} ${teamLead.lastName}`
              : account.teamLead,
          teamLeadId:
            data.teamLeadId != account.teamLeadId
              ? teamLead._id
              : account.teamLeadId,
          email: data.email,
          updateAt: new Date(),
        };
        const filter = { _id: id };
        const reVal = { returnOriginal: false };
        const updatedAccount = await dbContext.Account.findByIdAndUpdate(
          filter,
          newData,
          reVal
        );
        const us = await dbContext.Account.findById(id);
        //TODO: UNCOMMENT TO UPDATE USER
        await emailService.updateUserAccountEmail(us, data.password);
        // await emailService.updateUserAccountEmail(us)
        return Promise.resolve(us);
      }
    } catch (error) {
      logger.log(error);
      return error;
    }
  }
}

export const accountsService = new AccountsService();
