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
            let leadNumber = 1
            const today = new Date();
            let groupLeadsCounter;
            const allAccounts = await dbContext.Account.find()
            const emails = allAccounts.map(a => a.email)
            do {
                employees = await this.getCompanyRoster(pageNumber)
                try {
                    do {
                        groupLeadsCounter = await this.getCompanyRoster(leadNumber)
                        var groupLeads = groupLeadsCounter.filter(e => e.employee_position == 'Group Lead' || e.employee_position == 'ITD Vice President')
                        const currentGroupLeads = await dbContext.Account.find({ privileges: 'group-lead' })
                        const currentGLEmails = currentGroupLeads.map(g => g.email)
                        const internalWebGL = groupLeads.map(g => g.employee_email)
                        for (let i = 0; i < groupLeads.length; i++) {
                            const GL = groupLeads[i];
                            const dept = await dbContext.Department.findOne({ name: GL.employee_department })
                            if (GL.firstName == '') {
                                continue
                            } else if (!currentGLEmails.includes(GL.employee_email) && !emails.includes(GL.employee_email)) {
                                // MAKES SURE GENA DB DOES NOT INCLUDE THAT USER ALREADY
                                const year = today.getFullYear();
                                let password = await middleware.encryptPassword(`${GL.lastName}${year}`)
                                const data = {
                                    firstName: GL.firstName,
                                    lastName: GL.lastName,
                                    userName: `${GL.lastName}`,
                                    privileges: 'group-lead',
                                    password: password,
                                    department: GL.employee_department,
                                    departmentId: dept._id,
                                    teamLead: '',
                                    teamLeadId: '',
                                    groupLead: '',
                                    groupLeadId: '',
                                    email: GL.employee_email
                                }
                                const createdEmployee = await dbContext.Account.create(data)
                                // TODO ADD EMAIL TO NOTIFY USER ABOUT ACCOUNT CREATION
                            } else if (!currentGLEmails.includes(GL.employee_email) && emails.includes(GL.employee_email)) {
                                // IF THE USER IS NOT PART OF THE INTERNAL WEBS GROUP LEAD ARR BUT WAS ALREADY AN EMPLOYEE UPDATE THEIR INFO
                                const filter = { email: GL.employee_email }
                                const update = { privileges: 'group-lead' }
                                const updatedEmployee = await dbContext.Account.updateOne(filter, update)
                                // TODO ADD EMAIL TO NOTIFY USER ABOUT THE PROMOTION
                            }

                        }
                        leadNumber++
                    } while (groupLeadsCounter.length > 0);
                    pageNumber++
                } catch (error) {
                    logger.log(error)
                }
            } while (employees.length > 0)
            await this.teamLeads()
        } catch (error) {
            logger.log(error)
            return error
        }





    }
    async teamLeads() {
        try {
            let pageNumber = 1
            let teamLeadsCounter;
            let leadNumber = 1
            let groupLead
            let employees
            const today = new Date();
            const allAccounts = await dbContext.Account.find()
            const emails = allAccounts.map(a => a.email)
            do {
                employees = await this.getCompanyRoster(pageNumber)
                try {
                    do {
                        teamLeadsCounter = await this.getCompanyRoster(leadNumber)
                        var teamLeads = teamLeadsCounter.filter(e => e.employee_position == 'Team Lead')
                        const currentTeamLeads = await dbContext.Account.find({ privileges: 'group-lead' })
                        const currentTLEmails = currentTeamLeads.map(g => g.email)
                        for (let i = 0; i < teamLeads.length; i++) {
                            const TL = teamLeads[i];
                            const dept = await dbContext.Department.findOne({ name: TL.employee_department })
                            groupLead = await dbContext.Account.findOne({ department: dept.name, privileges: 'group-lead' })
                            if (dept.name == 'night-shift') {
                                groupLead = await dbContext.Account.findOne({ email: 'ClayP@inventive-group.com' })
                            } else if (dept.name == 'sales') {
                                groupLead = await dbContext.Account.findOne({ email: 'BenC@inventive-group.com' })
                            }
                            if (TL.firstName == '') {
                                continue
                            } else if (!currentTLEmails.includes(TL.employee_email) && !emails.includes(TL.employee_email)) {
                                const year = today.getFullYear();
                                let password = await middleware.encryptPassword(`${TL.lastName}${year}`)
                                const data = {
                                    firstName: TL.firstName,
                                    lastName: TL.lastName,
                                    userName: `${TL.lastName}`,
                                    privileges: 'team-lead',
                                    password: password,
                                    department: dept.name,
                                    departmentId: dept._id,
                                    teamLead: '',
                                    teamLeadId: '',
                                    groupLead: groupLead ? `${groupLead.firstName} ${groupLead.lastName}` : '',
                                    groupLeadId: groupLead ? groupLead._id : '',
                                    email: TL.employee_email
                                }
                                const createdEmployee = await dbContext.Account.create(data)
                                // TODO SET UP EMAIL TO NOTIFY ABOUT ACCOUNT CREATION AND UPDATED CREDENTIALS
                            } else if (!currentTLEmails.includes(TL.employee_email) && emails.includes(TL.employee_email)) {
                                const filter = { email: TL.employee_email }
                                const update = { privileges: 'team-lead' }
                                const updatedEmployee = await dbContext.Account.updateOne(filter, update)
                                // TODO SET UP EMAIL INTEGRATION TO NOTIFY USER ABOUT ACCOUNT BEING UPDATED
                            }


                        }











                        leadNumber++
                    } while (teamLeadsCounter.length > 0);
                } catch (error) {
                    logger.log(error)
                    return error
                }
                pageNumber++
            } while (employees.length > 0);
            await this.teamMembers()
        } catch (error) {
            logger.log(error)
            return error
        }
    }




    async teamMembers() {
        let employees;
        let pageNumber = 1
        let teamMembersCounter;
        let leadNumber = 1
        let groupLead;
        const today = new Date();
        let teamLead;
        let privilege;
        try {
            do {
                try {
                    employees = await this.getCompanyRoster(pageNumber)
                    do {
                        teamMembersCounter = await this.getCompanyRoster(leadNumber)
                        var teamMembers = teamMembersCounter.filter(e => e.employee_position == 'Team Member')
                        for (let i = 0; i < teamMembers.length; i++) {
                            const TM = teamMembers[i];
                            const dept = await dbContext.Department.findOne({ name: TM.employee_department })
                            groupLead = await dbContext.Account.findOne({ department: dept.name, privileges: 'group-lead' })
                            const teamLeader = await dbContext.Account.findOne({ department: dept.name, privileges: 'team-lead' })
                            if (dept.name == 'night-shift') {
                                groupLead = await dbContext.Account.findOne({ email: 'ClayP@inventive-group.com' })
                            } else if (dept.name == 'sales') { groupLead = await dbContext.Account.findOne({ email: 'BenC@inventive-group.com' }) }
                            if (TM.firstName == '') {
                                continue
                            } else {
                                const userExists = await dbContext.Account.findOne({ firstName: TM.firstName, lastName: TM.lastName })
                                if (TM.firstName == 'Diego') {
                                    privilege = 'admin'
                                } else { privilege = 'team-member' }
                                if (!userExists) {
                                    const year = today.getFullYear();
                                    let password = await middleware.encryptPassword(`${TM.lastName}${year}`)
                                    const data = {
                                        firstName: TM.firstName,
                                        lastName: TM.lastName,
                                        userName: `${TM.firstName}${TM.lastName}`,
                                        privileges: privilege,
                                        password: password,
                                        department: dept.name,
                                        departmentId: dept._id,
                                        teamLead: teamLeader ? `${teamLeader.firstName} ${teamLeader.lastName}` : '',
                                        teamLeadId: teamLeader ? teamLeader._id : '',
                                        groupLead: groupLead ? `${groupLead.firstName} ${groupLead.lastName}` : '',
                                        groupLeadId: groupLead ? groupLead._id : '',
                                        email: TM.employee_email ? TM.employee_email : ''
                                    }
                                    const createdTeamMember = await dbContext.Account.create(data)
                                    // TODO CREATE EMAIL TO NOTIFY USER ABOUT ACCOUNT CREATION AND CREDENTIALS
                                    // 
                                } else if (userExists) {
                                    const filter = { _id: userExists._id }
                                    const update = {
                                        privileges: privilege,
                                        department: dept.name,
                                        departmentId: dept._id,
                                        teamLead: teamLeader ? `${teamLeader.firstName} ${teamLeader.lastName}` : '',
                                        teamLeadId: teamLeader ? teamLeader._id : '',
                                        groupLead: groupLead ? `${groupLead.firstName} ${groupLead.lastName}` : '',
                                        groupLeadId: groupLead ? groupLead._id : '',
                                    }
                                    const updatedUser = await dbContext.Account.updateOne(filter, update)
                                    // TODO CREATE EMAIL TO NOTIFY USER ABOUT UPDATED DATA
                                }
                            }

                        }
                        leadNumber++
                    } while (teamMembersCounter.length > 0);
                } catch (error) {
                    logger.log(error)
                    throw error
                }
                pageNumber++
            } while (employees.length > 0);
        } catch (error) {
            logger.log(error)
            return error
        }
    }










}


export const internalUserAutomation = new InternalUserAutomation()