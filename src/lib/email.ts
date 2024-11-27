import nodemailer from "nodemailer";
import { getFirestore, doc, setDoc } from "firebase/firestore";

interface Config {
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_pass: string;
    smtp_from: string;
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
    const config: Config = {
        smtp_host: process.env.EMAIL_SERVER_HOST || '',
        smtp_port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        smtp_user: process.env.EMAIL_SERVER_USER || '',
        smtp_pass: process.env.EMAIL_SERVER_PASSWORD || '',
        smtp_from: process.env.EMAIL_FROM || '',
    };

    const verificationLink = `http://localhost:3000/verify/${token}`;

    const emailContent = `
        <p>Hi,</p>
        <p>Thank you for signing up! Please click the link below to verify your email address:</p>
        <p><a href="${verificationLink}">Verify Email</a></p>
        <p>If you did not create an account, please ignore this email.</p>
    `;

    const transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port,
        auth: {
            user: config.smtp_user,
            pass: config.smtp_pass,
        },
    });

    const mailOptions = {
        from: config.smtp_from,
        to: email,
        subject: "Email Verification",
        html: emailContent,
    };

    await transporter.sendMail(mailOptions);

    // Store the token in Firestore
    const db = getFirestore();
    await setDoc(doc(db, "verificationTokens", token), { email });
}