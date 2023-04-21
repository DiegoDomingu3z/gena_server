import bcrypt from "bcrypt";
import { dbContext } from "../db/DbContext"

class Middleware {



    /**
* EncryptPassword
* Brings in password, encrypts then sends back to accountService
* @param {String}password
    @returns {String} bashP 
*/

    async encryptPassword(password) {
        const bashP = await bcrypt.hash(password, 10)
        return Promise.resolve(bashP)
    }





    /**
* checkIfUserNameExists
* Self explanatory 
* Sends back to accountService for more logic
* @param {String} username
@returns {StatusCode} 
*/
    async checkIfUserNameExists(username) {
        const dataCheck = await dbContext.Account.findOne({ userName: username })
        if (dataCheck) {
            return 401
        } else {
            return 200
        }
    }
}

export const middleware = new Middleware()



