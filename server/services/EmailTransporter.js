const nodemailer = require('nodemailer');


async function createTransport(to, subject, body, cc) {
    const transporter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'Printshop@inventive-group.com',
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        }
    })
    await transporter.sendMail({
        from: 'printshop@inventive-group.com', // sender address
        to: to,
        cc: cc, // list of receivers
        subject: subject, // Subject line
        html: body, // plain text body
    });
}



module.exports.createTransport = createTransport