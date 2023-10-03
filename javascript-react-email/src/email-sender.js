//<gen>react-email-send-email
import { render } from '@react-email/render';
import { Email } from './react-email';
import nodemailer from 'nodemailer';

export async function sendEmail(code, mail, server) {
    const transporter = nodemailer.createTransport({
        host: server.host,
        port: server.port,
        secure: false,
        auth: {
            user: server.user,
            pass: server.pass,
        },
    });

    const emailHtml = render(Email({ code }));

    const options = {
        from: mail.sender,
        to: mail.to,
        subject: mail.subject,
        html: emailHtml,
    };

    await transporter.sendMail(options);
}

//</gen>