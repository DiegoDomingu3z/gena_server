import { orderService } from './OrderService';
import { emailSender } from './EmailTransporter';
import { logger } from '../utils/Logger';
import { dbContext } from '../db/DbContext';
const nodemailer = require("nodemailer");
class EmailService {

    async sendUserCredentials(data, token) {
        try {
            const user = await orderService.checkIfUserExists(token)
            let email;
            let lead = null
            let group = null
            if (user.email == '' || user.email == undefined) {
                email = 'diegod@inventive-group.com'
            } else {
                email = user.email
            }
            if (data.email == '' || data.email == undefined) {
                logger.log("NOT GOING TO SEND EMAIL")
                return
            } else {
                let teamLead = data.teamLead == '' ? 'N/A' : data.teamLead;
                const department = await dbContext.Department.findById(data.departmentId)
                if (data.teamLeadId != undefined && data.teamLeadId != '') {
                    lead = await dbContext.Account.findById(data.teamLeadId)
                }
                if (data.groupLeadId != undefined && data.groupLeadId != '') {
                    group = await dbContext.Account.findById(data.groupLeadId)
                }
                let transporter = nodemailer.createTransport({
                    host: 'smtp-mail.outlook.com',
                    port: 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: 'DiegoD@inventive-group.com',
                        pass: process.env.GENA_ISSUE_PASS,
                    },
                    tls: {
                        rejectUnauthorized: false,
                    }
                });
                await transporter.sendMail({
                    from: `${email}`, // sender address
                    to: `${data.email}`, // list of receivers
                    subject: "New Gena Credentials", // Subject line
                    html: `
                    <h1> You have been added to the Gena Beta Software! </h1>
                    <br> <br> <h2> Here is the information you will need: </h2> 
                    <br> <b> userName: </b> ${data.userName} 
                    <br> <b> password:  </b> ${data.password} 
                    <br> <b> Team-Lead: </b> ${lead == null ? 'N/A' : lead.firstName + lead.lastName} 
                    <br> <b> Group-Lead: </b>  ${group == null ? 'N/A' : group.firstName + group.lastName} 
                    <br> <b> Department: </b> ${department.name} 
                    <br> <b> Privileges: </b> ${data.privileges} 
                    <br> <br>   
                    `, // plain text body
                });




                return
            }

        } catch (error) {
            logger.error(error)
        }

    }








}



export const emailService = new EmailService()