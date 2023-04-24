import { dbContext } from "../db/DbContext"
import { middleware } from "../middleware/middleware"
import { logger } from "../utils/Logger"
import { authTokens } from "./AuthTokens"
import bcrypt from "bcrypt";


class AccountsService {


    /**
* CREATE ACCOUNT
* checks if object contains all fields necessary 
* checks to see if a user with that username already exists if it does return 401
* sanatizes data to correctly go into database
* If it cant create account it will send a 401
* else it returns the new document
* @param {Object} data
  @returns {Object} newData
*/

    async createAccount(data) {
        try {
            if (!data.firstName ||
                !data.lastName ||
                !data.userName ||
                !data.password ||
                !data.department ||
                !data.departmentId ||
                !data.teamLead ||
                !data.groupLead ||
                !data.privileges ||
                !data.companyName) {
                return 401
            }
            const userNameCheck = await middleware.checkIfUserNameExists(data.userName)
            if (userNameCheck == 401) {
                return "USERNAME EXISTS ALREADY"
            } else if (userNameCheck == 200) {
                const cryptPass = await middleware.encryptPassword(data.password)
                const sanitizedData = {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    userName: data.userName,
                    password: cryptPass,
                    department: data.department,
                    departmentId: data.departmentId,
                    privileges: data.privileges,
                    companyName: data.companyName,
                    groupLead: data.groupLead,
                    teamLead: data.teamLead,
                }
                const newData = await dbContext.Account.create(sanitizedData)
                logger.log(newData)
                if (!newData) {
                    return 401
                } else {
                    return newData

                }
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }





    /**
* LOGIN
* Finds account associated with account
* Checks to see if password they sent it the same as password in database
* if check is true, a new access token is generated for user and put into DB
* user is then sent back object containing their account information
* if password is wrong user is sent a 401 
* @param {Object} data
  @returns {Object} updatedUserDoc
*/
    async login(data) {
        try {
            const password = data.password
            const user = await dbContext.Account.findOne({ userName: data.userName })
            if (!user) {
                return 404
            } else {
                const checkPass = await bcrypt.compare(password.toString(), user.password)
                if (checkPass == true) {
                    const newGeneratedToken = await authTokens.authToken()
                    const updatedUserDoc = await dbContext.Account.findOneAndUpdate({ userName: user.userName }, { accessToken: newGeneratedToken }, { returnDocument: true })
                    const updatedDoc = await dbContext.Account.findOne({ accessToken: newGeneratedToken })
                    return updatedDoc
                } else {
                    return 401
                }
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }



    async logout(token) {
        try {
            const user = await dbContext.Account.findOneAndUpdate({
                accessToken: token
            },
                {
                    $unset: { accessToken: '' }
                })
            if (user == null) {
                return Promise.resolve(404)
            } else if (user) {
                return Promise.resolve(200)
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }


    async removeUser(adminToken, userId) {
        try {
            const isAdmin = await dbContext.Account.findOne({ accessToken: adminToken })
            if (isAdmin.privileges == "admin") {
                const data = await dbContext.Account.findByIdAndDelete(userId)
                if (data == null) {
                    return Promise.resolve(404)
                } else {
                    return data
                }
            } else if (isAdmin.privileges != "admin") {
                return Promise.resolve(401)
            }

        } catch (error) {
            logger.error(error)
            return error
        }
    }










}





export const accountsService = new AccountsService()