import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const emailHost = process.env.EMAIL_HOST || process.env.SMTP_HOST || "localhost";
const emailPort = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587);
const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: emailPort === 465, // true for 465, false for other ports
  auth: emailUser && emailPass ? {
    user: emailUser,
    pass: emailPass,
  } : undefined,
});

export default transporter;
