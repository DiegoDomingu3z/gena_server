const nodemailer = require('nodemailer');

class EmailSender {
    createTransport() {
        return Promise.resolve(
            nodemailer.createTransport({
                host: 'smtp-mail.outlook.com',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: 'DiegoD@inventive-group.com',
                    pass: process.env.EMAIL_PASS,
                },
                tls: {
                    rejectUnauthorized: false,
                }
            }))
    }
}

export const emailSender = new EmailSender()