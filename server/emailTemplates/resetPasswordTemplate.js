export function resetPasswordTemplate(resetUrl) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F7F4EF; color: #2C2723; margin: 0; padding: 24px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; padding: 36px; border: 1px solid #DED7CC; box-shadow: 0 4px 20px rgba(44,39,35,0.06); }
        .logo { font-size: 26px; font-weight: bold; color: #8B5E3C; text-decoration: none; display: inline-block; margin-bottom: 24px; font-family: Georgia, serif; }
        .h1 { font-size: 22px; font-weight: 700; margin-bottom: 16px; color: #2C2723; font-family: Georgia, serif; }
        .p { color: #5E574F; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
        .btn { display: inline-block; background-color: #8B5E3C; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; }
        .footer { margin-top: 32px; font-size: 12px; color: #9E958C; border-top: 1px solid #E8E2D9; padding-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <a href="#" class="logo">🛋️ Furniva</a>
        <div class="h1">Reset Your Password</div>
        <p class="p">You requested a password reset for your Furniva account. Click the button below to set a new password. This link will safely expire in 1 hour.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" class="btn" target="_blank" style="color: #ffffff;">Reset Password</a>
        </div>
        <p class="p">If you did not make this request, please ignore this email or contact support if you have concerns.</p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Furniva. Handcrafted furniture for beautiful homes. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
}
