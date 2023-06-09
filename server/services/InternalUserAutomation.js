import { dbContext } from '../db/DbContext';
import { middleware } from '../middleware/middleware';
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
            let leads;
            let leadNumber = 1
            let l
            let lN = 1
            let employeeArr = []
            // let newEmployees = 0
            do {
                employees = await this.getCompanyRoster(pageNumber)
                try {
                    do {
                        leads = await this.getCompanyRoster(leadNumber)
                        const groupLeads = leads.filter(e => e.employee_position === 'Group Lead' || e.employee_position === 'IWS Group Lead' || e.employee_position === 'ITD Vice President' || e.employee_position === 'President')

                        for (let i = 0; i < groupLeads.length; i++) {
                            let priv;
                            const lead = groupLeads[i];
                            let passNum = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
                            const dept = await dbContext.Department.findOne({ name: lead.employee_department })
                            let password = await middleware.encryptPassword(`${lead.firstName}_${lead.lastName}${passNum}`)
                            if (lead.employee_position == 'Group Lead' || lead.employee_position == 'IWS Group Lead'
                                || lead.employee_position === 'ITD Vice President' || lead.employee_position === 'President') {
                                priv = 'group-lead'
                            } else if (lead.employee_position == 'Team Lead' || lead.employee_position == "IWS Team Lead") {
                                priv = 'team-lead'
                            } else if (lead.employee_position == 'Team Member') {
                                priv = 'team-member'
                            }
                            const sanatizedData = {
                                firstName: lead.firstName,
                                lastName: lead.lastName,
                                userName: `${lead.firstName}_${lead.lastName}`,
                                privileges: lead.employee_position == 'ITD Vice President' || lead.employee_position == "President" || lead.employee_position == "President" ? "group-lead" : priv,
                                password: password,
                                department: lead.employee_department,
                                departmentId: dept._id,
                                teamLead: '',
                                teamLeadId: '',
                                groupLead: '',
                                groupLeadId: '',
                                email: lead.employee_email
                            }
                            const filter = { userName: `${lead.firstName}_${lead.lastName}` };
                            const update = { $set: sanatizedData };
                            const newUser = await dbContext.Account.updateOne(filter, update, { upsert: true })
                            if (newUser.upsertedCount === 1) {
                                // EMAIL USER WITH NEW CREDENTIALS
                            } else if (newUser.matchedCount === 1) {
                                // An existing user was updated
                                //  EMAIL USERS THAT HIS ACCOUNT WAS UPDATED  
                            }
                        }
                        leadNumber++
                    } while (leads.length > 0)
                } catch (error) {
                    logger.log(error)
                }


                try {
                    do {
                        l = await this.getCompanyRoster(leadNumber)
                        const teamLeads = l.filter(e => e.employee_position === 'Team Lead' || e.employee_position === 'IWS Team Lead')

                        for (let i = 0; i < teamLeads.length; i++) {
                            let priv;
                            const lead = teamLeads[i];
                            let passNum = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
                            const dept = await dbContext.Department.findOne({ name: lead.employee_department })
                            const words = lead.employee_lead.split(" ");
                            const leadName = words[words.length - 1];
                            const groupLead = await dbContext.Account.findOne({ lastName: leadName, privileges: 'group-lead' })
                            let password = await middleware.encryptPassword(`${lead.firstName}_${lead.lastName}${passNum}`)
                            if (lead.employee_position == 'Group Lead' || lead.employee_position == 'IWS Group Lead'
                                || lead.employee_position === 'ITD Vice President' || lead.employee_position === 'President') {
                                priv = 'group-lead'
                            } else if (lead.employee_position == 'Team Lead' || lead.employee_position == "IWS Team Lead") {
                                priv = 'team-lead'
                            } else if (lead.employee_position == 'Team Member') {
                                priv = 'team-member'
                            }
                            const sanatizedData = {
                                firstName: lead.firstName,
                                lastName: lead.lastName,
                                userName: `${lead.firstName}_${lead.lastName}`,
                                privileges: lead.employee_position == 'ITD Vice President' || lead.employee_position == "President" || lead.employee_position == "President" ? "group-lead" : priv,
                                password: password,
                                department: lead.employee_department,
                                departmentId: dept._id,
                                teamLead: '',
                                teamLeadId: '',
                                groupLead: groupLead || groupLead.firstName != lead.firstName ? `${groupLead.firstName} ${groupLead.lastName}` : '',
                                groupLeadId: groupLead ? groupLead._id : '',
                                email: lead.email_email
                            }
                            const filter = { userName: `${lead.firstName}_${lead.lastName}` };
                            const update = { $set: sanatizedData };
                            const newUser = await dbContext.Account.updateOne(filter, update, { upsert: true })
                            if (newUser.upsertedCount === 1) {
                                // EMAIL USER WITH NEW CREDENTIALS
                            } else if (newUser.matchedCount === 1) {
                                // An existing user was updated
                                //  EMAIL USERS THAT HIS ACCOUNT WAS UPDATED  
                            }
                        }
                        lN++
                    } while (l.length > 0)

                } catch (error) {
                    logger.log(error)
                    return error
                }





                let teamMembers = employees.filter(e => e.employee_position !== 'Team Lead' || e.employee_position !== 'IWS Team Lead' || e.employee_position === 'Group Lead' || e.employee_position === 'IWS Group Lead' || e.employee_position === 'ITD Vice President' || e.employee_position === 'President')
                for (let i = 0; i < teamMembers.length; i++) {
                    let priv
                    const employee = teamMembers[i];
                    let passNum = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
                    const dept = await dbContext.Department.findOne({ name: employee.employee_department })
                    // if (employee.employee_department == "shop-iws") {
                    //     logger.log(employee)
                    // }
                    const words = employee.employee_lead.split(" ");
                    const leadName = words[words.length - 1];
                    const groupLead = await dbContext.Account.findOne({ lastName: leadName, privileges: 'group-lead' })
                    const teamLead = await dbContext.Account.findOne({ department: employee.employee_department, privileges: 'team-lead' })
                    let password = await middleware.encryptPassword(`${employee.firstName}_${employee.lastName}${passNum}`)
                    if (employee.employee_position == 'Group Lead') {
                        priv = 'group-lead'
                    } else if (employee.employee_position == 'Team Lead') {
                        priv = 'team-lead'
                    } else if (employee.employee_position == 'Team Member') {
                        priv = 'team-member'
                    }
                    if (employee.firstName == "Diego") {
                        logger.log("DIEGO'S PASSWORD: ", passNum)
                        console.log("Diego", passNum)
                    }
                    const sanatizedData = {
                        firstName: employee.firstName,
                        lastName: employee.lastName,
                        userName: `${employee.firstName}_${employee.lastName}`,
                        privileges: employee.employee_position == 'ITD Vice President' || employee.employee_position == "President" || employee.employee_position == "President" ? "group-lead" : priv,
                        password: password,
                        department: employee.employee_department,
                        departmentId: dept._id,
                        teamLead: teamLead ? `${teamLead.firstName} ${teamLead.lastName}` : '',
                        teamLeadId: teamLead ? teamLead._id : '',
                        groupLead: groupLead ? `${groupLead.firstName} ${groupLead.lastName}` : '',
                        groupLeadId: groupLead ? groupLead._id : '',
                        email: employee.employee_email
                    }
                    const filter = { userName: `${employee.firstName}_${employee.lastName}` };
                    const update = { $set: sanatizedData };
                    const newUser = await dbContext.Account.updateOne(filter, update, { upsert: true })
                    if (newUser.upsertedCount === 1) {
                        // EMAIL USER WITH NEW CREDENTIALS
                    } else if (newUser.matchedCount === 1) {
                        // An existing user was updated
                        //  EMAIL USERS THAT HIS ACCOUNT WAS UPDATED  
                    }

                }
                pageNumber++;
            } while (employees.length > 0)
        } catch (error) {
            logger.log(error)
            return error
        }
    }
















}


export const internalUserAutomation = new InternalUserAutomation()