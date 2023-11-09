import { orderService } from './OrderService';
import { logger } from '../utils/Logger';
import { dbContext } from '../db/DbContext';
const nodemailer = require("nodemailer");
const mongoose = require('mongoose');
const { createTransport } = require('./EmailTransporter')
class EmailService {

    async sendUserCredentials(data, token, pass) {
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

    async sendUpdatedCredentials(data, token, pass) {
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
            <h1> Your Account has been updated </h1>
            <br> <br> <h2> Here is an overview of you general information: </h2> 
            <br> <b> userName: </b> ${data.userName} 
            <br>
            ${pass ? '<b>Password:</b>' : null} ${pass ? pass : null} 
            <br> <b> Team-Lead: </b> ${lead == null ? 'N/A' : lead.firstName + lead.lastName} 
            <br> <b> Group-Lead: </b>  ${group == null ? 'N/A' : group.firstName + group.lastName} 
            <br> <b> Department: </b> ${department.name} 
            <br> <b> Privileges: </b> ${data.privileges} 
            <br> <br>   
            `, // plain text body
            });



        }

    }

    async ticketingSystem(data, token) {
        try {
            const reportedUser = await dbContext.Account.findOne({ accessToken: token })
            const toEmail = 'marketing@inventive-group.com'
            const ccEmail = 'jacobp@inventive-group.com, diegod@inventive-group.com'
            const subject = 'New Gena Ticket'
            if (reportedUser.email) {
                let body = `
               <!DOCTYPE html>
               <html lang="en">
               <head>
                   <meta charset="UTF-8">
                   <meta name="viewport" content="width=device-width, initial-scale=1.0">
                   <style>
                   .red{
                       color: #FF0000;
                   }
                   </style>
               </head>
               <body>
               <div>
               <h2 class="red">Gena Ticket</h2>
               <p>FROM: ${reportedUser.firstName} ${reportedUser.lastName}</p>
               <p>Subject: ${data.subject}</p>
               <p class="red">Urgency: ${data.importance}</p>
               <p>Description: ${data.description}</p>
               </div>
               </body>
               </html>`
                await createTransport(toEmail, subject, body, ccEmail)
                return
            }

        } catch (error) {
            logger.log(error)
        }
    }


    async updateUserAccountEmail(data, pass) {
        try {
            let email;
            if (data.email) {
                email = data.email
            } else {
                let lead = await dbContext.Account.findById(data.groupLeadId)
                email = lead.email
            }
            let subject = `${data.firstName}'s Gena Account has been updated`
            let cc = 'diegod@inventive-group.com'
            let body = `
               <!DOCTYPE html>
               <html lang="en">
               <head>
                   <meta charset="UTF-8">
                   <meta name="viewport" content="width=device-width, initial-scale=1.0">
                   <style>
                   .automation{
                       font-size: 10px;
                   }
                   </style>
               </head>
               <body>
               <div>
               <p>Your Gena Account has been updated, please review the following.</p>
               <br>
               <p><b>Account Name</b>: ${data.firstName} ${data.lastName}</p>
               <p><b>Username:</b> ${data.userName}</p>
               <p><b>Password:</b> ${pass}</p>
               <p><b>Group lead:</b> ${data.groupLead == "" ? 'N/A' : data.groupLead}</p>
               <p><b>Team lead:</b> ${data.teamLead == "" ? 'N/A' : data.teamLead}</p>
               <p><b>Department:</b> ${data.department}</p>
               <p><b>Privileges:</b> ${data.privileges}</p>
               </div>
               <div>
               <p class="automation">This is an automated email sent by gena software <br>
                   If any critical changes need to be made please submit a ticket on Gena.
               </p>
               </div>
               </body>
               </html>`
            await createTransport(email, subject, body, cc)


        } catch (error) {
            logger.log(error)
        }
    }



    async leadApprovalEmail(order) {
        try {
            let groupLeadEmail = ''
            let teamLeadEmail = ''
            const user = await dbContext.Account.findById(order.creatorId)
            const groupLead = await dbContext.Account.findById(user.groupLeadId)
            if (user.teamLeadId != "") {
                const teamLead = await dbContext.Account.findById(user.teamLeadId)
                if (teamLead) {
                    teamLeadEmail = teamLead.email
                }
            }
            if (groupLead) {
                groupLeadEmail = groupLead.email
            }


            // create a transporter
            let transporter = nodemailer.createTransport({
                host: 'smtp-mail.outlook.com',
                port: 587,
                secure: false,
                auth: {
                    user: 'PrintShop@inventive-group.com',
                    pass: process.env.EMAIL_PASS,
                },
                tls: {
                    rejectUnauthorized: false,
                }
            });

            // send email to team lead
            transporter.sendMail({
                from: 'PrintShop@inventive-group.com', // sender address
                to: `${groupLeadEmail}`,
                cc: `${teamLeadEmail}`, // list of receivers
                subject: "GENA New Order Approval Request", // Subject line
                html: `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                   
                    </style>
                </head>
                <body>
               <div>
                <p>
                    ${order.creatorName} is requesting Gena order approval
                </p>
                <p>
                    OrderId: ${order._id}
                </p>
                    <p>
                       Number of Labels: ${order.labels.length}
                    </p>
                <p>
                </p>
               </div>
                </body>
                </html>
                  
            `,
            });

            // error message
        } catch (err) {
            logger.log('Error (catch): ', err);
        }
    }


    ///////////// PICKUP ORDERS //////////////////


    async successFullOrderSubmission(data) {
        try {
            let cc;
            const emails = {
                'engineering': 'engineering@inventive-group.com',
                'accounting': '',
                'administration': 'hr@inventive-group.com',
                'sales': 'sales@inventive-group.com',
                'purchasing': 'purchasing@inventive-group.com',
                'welding': 'welding@inventive-group.com',
                'marketing': 'marketing@inventive-group.com',
                'night-shift': 'printshop@inventive-group.com',
                'shipping': 'shipping@inventive-group.com',
                'production': '',
                'press-brake': 'pressbrake@inventive-group.com',
                'laser': 'laser@inventive-group.com',
                'machine-shop': 'machineshop@inventive-group.com',
                'maintenance': 'maintenance@inventive-group.com',
                'Group Leads': 'printshop@inventive-group.com'
            }
            const user = await dbContext.Account.findOne({ _id: data.creatorId })
            if (user.email) { cc = user.email } else { cc = '' }
            const email = emails[user.department]
            const date = new Date(data.createdOn);
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            let docNums = []
            for (let i = 0; i < data.labels.length; i++) {
                const label = data.labels[i];
                const labelDoc = await dbContext.Label.findOne({ _id: label.labelId })
                docNums.push(`<b>${labelDoc.docNum} </b> QTY(${label.qty})  <br>------------<br><br>`)
            }
            docNums.toString()

            const subject = "NEW SUCCESSFUL GENA ORDER"
            const body = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
            .automation{
                font-size: 10px;
            }
            .green{
                color: #00FF00;
            }
            </style>
        </head>
        <body>
        <div>
        <h3 class="green">SUCCESSFUL Gena ORDER PLACED</h3>
        <p>Order Creator: ${data.creatorName}</p>
        <p>ORDER ID: ${data._id}</p>
        <p>Notes: ${data.notes ? data.note : 'N/A'}  </p>
        <p>Created On: ${month}/${day}/${year}</p>  
        <p>Label Docs Ordered: <br> ${docNums} </p>
        </div>
        
        </body>
        </html>
        `
            await createTransport(email, subject, body, cc)
        } catch (error) {
            logger.log(error)
        }
    }

    async unSuccessFullOrderSubmission(data, token) {
        try {
            let cc;
            const emails = {
                'engineering': 'engineering@inventive-group.com',
                'accounting': '',
                'administration': 'hr@inventive-group.com',
                'sales': 'sales@inventive-group.com',
                'purchasing': 'purchasing@inventive-group.com',
                'welding': 'welding@inventive-group.com',
                'marketing': 'marketing@inventive-group.com',
                'night-shift': 'printshop@inventive-group.com',
                'shipping': 'shipping@inventive-group.com',
                'production': '',
                'press-brake': 'pressbrake@inventive-group.com',
                'laser': 'laser@inventive-group.com',
                'machine-shop': 'machineshop@inventive-group.com',
                'maintenance': 'maintenance@inventive-group.com',
                'Group Leads': 'printshop@inventive-group.com'
            }
            const user = await dbContext.Account.findOne({ accessToken: token })
            const email = emails[user.department]
            if (user.email) { cc = user.email } else { cc = '' }
            let docNums = []
            for (let i = 0; i < data.labels.length; i++) {
                const label = data.labels[i];
                const labelDoc = await dbContext.Label.findOne({ _id: label.labelId })
                docNums.push(`<b>${labelDoc.docNum} </b> QTY(${label.qty})  <br>------------<br><br>`)
            }
            docNums.toString()

            const subject = "ERROR PLACING GENA ORDER"
            let body = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
            .error{
                font-color: #FF0000;
            }
            </style>
        </head>
        <body>
        <h3 class="error">ERROR PLACING GENA ORDER</h3>
        <p>Order Creator: ${user.firstName} ${user.lastName}</p>
        <p>Notes: ${data.notes ? data.note : 'N/A'}  </p>
        <p>Label Docs Ordered: <br> ${docNums} </p>
        </body>
        </html>
        `
            await createTransport(email, subject, body, cc)
        } catch (error) {
            logger.log(error)
        }
    }



    async readyForPickupEmail(order) {
        try {
            let cc;
            const emails = {
                'engineering': 'engineering@inventive-group.com',
                'accounting': '',
                'administration': 'hr@inventive-group.com',
                'sales': 'sales@inventive-group.com',
                'purchasing': 'purchasing@inventive-group.com',
                'welding': 'welding@inventive-group.com',
                'marketing': 'marketing@inventive-group.com',
                'night-shift': 'printshop@inventive-group.com',
                'shipping': 'shipping@inventive-group.com',
                'production': '',
                'press-brake': 'pressbrake@inventive-group.com',
                'laser': 'laser@inventive-group.com',
                'machine-shop': 'machineshop@inventive-group.com',
                'maintenance': 'maintenance@inventive-group.com',
                'Group Leads': 'printshop@inventive-group.com'
            }
            const user = await dbContext.Account.findOne({ accessToken: order.creatorId })
            const email = emails[user.department]
            if (user.email) { cc = user.email } else { cc = '' }
            let docNums = []
            for (let i = 0; i < order.labels.length; i++) {
                const label = order.labels[i];
                const labelDoc = await dbContext.Label.findOne({ _id: label.labelId })
                docNums.push(`<b>${labelDoc.docNum} </b> QTY(${label.qty})  <br>------------<br><br>`)
            }
            docNums.toString()

            const subject = `GENA ORDER READY FOR PICKUP (placed by ${order.creatorName}`
            let body = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
            .pickup{
                font-color: #FFFF00;
            }
            </style>
        </head>
        <body>
        <h3 class="pickup">ORDER IS READY FOR PICKUP</h3>
        <p>Order Creator: ${user.firstName} ${user.lastName}</p>
        <p>ORDER ID: ${order._id}</p>
        <p>Notes: ${order.notes ? order.note : 'N/A'}  </p>
        <p>Label Docs Ordered: <br> ${docNums} </p>
        </body>
        </html>
        `
            await createTransport(email, subject, body, cc)

        } catch (error) {
            logger.log(error)
        }
    }







}



export const emailService = new EmailService()