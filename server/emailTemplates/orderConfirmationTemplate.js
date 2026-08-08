export function orderConfirmationTemplate(order) {
  const itemsHtml = (order.orderItems || []).map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #334155; color: #f8fafc;">${item.name || 'Product'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #334155; color: #94a3b8; text-align: center;">${item.qty}</td>
      <td style="padding: 12px; border-bottom: 1px solid #334155; color: #38bdf8; text-align: right;">₹${item.price}</td>
    </tr>
  `).join('');

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
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background-color: #0f172a; padding: 12px; text-align: left; color: #cbd5e1; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
        .total { text-align: right; font-size: 18px; font-weight: bold; color: #38bdf8; margin-top: 16px; }
        .footer { margin-top: 32px; font-size: 12px; color: #64748b; border-top: 1px solid #334155; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <a href="#" class="logo">⚡ ElectroMart</a>
        <div class="h1">Order Confirmed! 🎉</div>
        <p class="p">Thank you for your order! We've received your order <strong>#${order._id}</strong> and are preparing it for shipment.</p>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total">
          Total Paid: ₹${order.totalPrice}
        </div>

        <p class="p" style="margin-top: 24px;">You can track your order status anytime from your account dashboard.</p>

        <div class="footer">
          &copy; ${new Date().getFullYear()} ElectroMart. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
}
