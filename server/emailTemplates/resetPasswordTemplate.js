export function resetPasswordTemplate(resetUrl) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155; }
        .logo { font-size: 24px; font-weight: bold; color: #38bdf8; text-decoration: none; display: inline-block; margin-bottom: 24px; }
        .h1 { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #ffffff; }
        .p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; }
        .footer { margin-top: 32px; font-size: 12px; color: #64748b; border-top: 1px solid #334155; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <a href="#" class="logo">⚡ ElectroMart</a>
        <div class="h1">Reset Your Password</div>
        <p class="p">You requested a password reset for your ElectroMart account. Click the button below to set a new password. This link will expire in 1 hour.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
        </div>
        <p class="p">If you did not request this, please ignore this email or contact support if you have concerns.</p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ElectroMart. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
}
