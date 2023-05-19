import { dbContext } from '../db/DbContext';
import { logger } from '../utils/Logger';

var rp = require('request-promise');
class InternalUserAutomation {


    async getCompanyRoster(pageNumber) {
        try {
            const perPage = 100;
            const URL = `https://internalweb/wp-json/wp/v2/users?per_page=${perPage}&page=${pageNumber}`;
            var options = {
                method: 'GET',
                uri: URL,
                rejectUnauthorized: false
            };

            const users = await rp(options, function (err, res) {
                if (err) {
                    logger.log(err);
                    return;
                } else {
                    logger.log(res);
                    return res.body;
                }
            });
            return JSON.parse(users);
        } catch (error) {
            logger.log(error);
            return error;
        }
    }

    async gatherDepartments() {
        try {
            let departments = [];
            let pageNumber = 1;
            let users;
            do {
                users = await this.getCompanyRoster(pageNumber);
                for (let i = 0; i < users.length; i++) {
                    const user = users[i];
                    const department = user.employee_department;
                    if (departments.includes(department)) {
                        continue;
                    } else {
                        departments.push(department);
                    }
                }
                pageNumber++;
            } while (users.length > 0);

            const updateOperations = departments.map((name) => {
                return {
                    updateOne: {
                        filter: { name: name },
                        update: { $set: { name } },
                        upsert: true
                    }
                };
            });

            const updatedDepts = await dbContext.Department.bulkWrite(updateOperations);
            return updatedDepts;
        } catch (error) {
            logger.log(error);
            return error;
        }
    }






    async gatherEmployees() {
        try {
            let pageNumber = 1
            let employees;
            let employeeArr = []
            do {
                employees = await this.getCompanyRoster()
                for (let i = 0; i < employees.length; i++) {
                    const employee = employees[i];
                    const sanatizedData = {
                        firstName: employee.firstName,
                        lastName: employee.lastName,
                        userName: `${employee.firstName}_${employee.lastName}`,
                        privileges: employee.employee_position == 'ITD Vice President' || employee.employee_position == "President" || employee.employee_position == "President" ? "Group Lead" : employee.employee.position,
                        password: 'asdf',

                    }

                }
            } while (employees.length > 0)
        } catch (error) {

        }
    }
















}


export const internalUserAutomation = new InternalUserAutomation()