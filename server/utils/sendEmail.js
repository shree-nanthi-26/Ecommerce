import transporter from "../config/mailer.js";

/**
 * Sends an email using the configured transporter.
 * @param {string} to - Recipient email address.
 * @param {string} subject - Email subject.
 * @param {string} html - HTML body.
 */
export async function sendEmail(to, subject, html) {
  if (process.env.NODE_ENV === "test") {
    return { messageId: "test-mock-id" };
  }

  try {
    const fromAddress =
      process.env.EMAIL_FROM ||
      process.env.SMTP_FROM ||
      "Furniva <no-reply@furniva.com>";

    await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Email sending error:', err);
    throw new Error('Failed to send email');
  }
}
