export function orderStatusUpdateTemplate(order, newStatus) {
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
        .status-badge { display: inline-block; background-color: #0369a1; color: #e0f2fe; padding: 8px 16px; border-radius: 9999px; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; margin: 16px 0; }
        .footer { margin-top: 32px; font-size: 12px; color: #64748b; border-top: 1px solid #334155; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <a href="#" class="logo">⚡ ElectroMart</a>
        <div class="h1">Order Status Update 📦</div>
        <p class="p">Your order <strong>#${order._id}</strong> status has been updated:</p>
        
        <div style="text-align: center;">
          <div class="status-badge">${newStatus}</div>
        </div>

        <p class="p">Log in to ElectroMart to view full details and track your delivery.</p>

        <div class="footer">
          &copy; ${new Date().getFullYear()} ElectroMart. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
}
