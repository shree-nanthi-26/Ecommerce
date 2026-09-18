export function orderStatusUpdateTemplate(order, newStatus) {
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
        .status-badge { display: inline-block; background-color: #8B5E3C; color: #FFFFFF; padding: 10px 24px; border-radius: 9999px; font-weight: 600; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; margin: 16px 0; }
        .footer { margin-top: 32px; font-size: 12px; color: #9E958C; border-top: 1px solid #E8E2D9; padding-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <a href="#" class="logo">🛋️ Furniva</a>
        <div class="h1">Furniture Delivery Update 📦</div>
        <p class="p">The status for your furniture order <strong>#${order._id}</strong> has been updated:</p>
        
        <div style="text-align: center;">
          <div class="status-badge">${newStatus}</div>
        </div>

        <p class="p">Our white-glove transport team ensures careful handling throughout transit. Log in to your Furniva account to track live milestones.</p>

        <div class="footer">
          &copy; ${new Date().getFullYear()} Furniva. Handcrafted furniture for beautiful homes. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
}
