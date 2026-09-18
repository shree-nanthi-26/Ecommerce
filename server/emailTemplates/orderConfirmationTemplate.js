export function orderConfirmationTemplate(order) {
  const items = order.items || order.orderItems || [];
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #E8E2D9; color: #2C2723; font-weight: 500;">${item.name || 'Furniture Item'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E8E2D9; color: #736B63; text-align: center;">${item.quantity || item.qty || 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E8E2D9; color: #8B5E3C; font-weight: 600; text-align: right;">₹${(item.price || 0).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const total = order.totalAmount || order.totalPrice || 0;

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
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background-color: #F2EDE4; padding: 12px; text-align: left; color: #4A433D; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
        .total { text-align: right; font-size: 19px; font-weight: bold; color: #8B5E3C; margin-top: 16px; }
        .perks { background-color: #FAF8F5; border: 1px dashed #DED7CC; border-radius: 12px; padding: 16px; margin: 24px 0; font-size: 14px; color: #5E574F; }
        .footer { margin-top: 32px; font-size: 12px; color: #9E958C; border-top: 1px solid #E8E2D9; padding-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <a href="#" class="logo">🛋️ Furniva</a>
        <div class="h1">Your Furniture Order is Confirmed! 🎉</div>
        <p class="p">Thank you for choosing Furniva to elevate your living spaces. We have received your order <strong>#${order._id}</strong> and our master craftsmen are preparing your pieces.</p>
        
        <table>
          <thead>
            <tr>
              <th>Furniture Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total">
          Total Paid: ₹${total.toLocaleString('en-IN')}
        </div>

        <div class="perks">
          ✨ <strong>Included With Your Order:</strong> Free white-glove doorstep delivery, room-of-choice placement, complimentary in-home carpenter assembly, and our 3-year craftsmanship warranty.
        </div>

        <p class="p">You can track delivery milestones anytime directly from your Furniva account dashboard.</p>

        <div class="footer">
          &copy; ${new Date().getFullYear()} Furniva. Handcrafted furniture for beautiful homes. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
}
