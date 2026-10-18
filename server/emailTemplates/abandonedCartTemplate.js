export function abandonedCartTemplate(user, cart, clientUrl, unsubscribeUrl) {
  const items = cart.items || [];
  const totalAmount = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  const cartUrl = `${clientUrl || "http://localhost:5173"}/cart`;
  const defaultUnsubscribeUrl =
    unsubscribeUrl ||
    `${clientUrl || "http://localhost:5173"}/unsubscribe?token=${user.unsubscribeToken || ""}&type=abandonedCart`;

  const itemsHtml = items
    .map((item) => {
      const prod = item.product || {};
      const img =
        prod.images && prod.images.length > 0 && prod.images[0].url
          ? prod.images[0].url
          : "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200";
      const lineTotal = item.price * item.quantity;

      return `
        <tr>
          <td style="padding: 14px 10px; border-bottom: 1px solid #EFE9DF; width: 64px;">
            <img src="${img}" alt="${prod.name || item.name || "Item"}" width="56" height="56" style="border-radius: 8px; object-fit: cover; border: 1px solid #DED7CC; display: block;" />
          </td>
          <td style="padding: 14px 12px; border-bottom: 1px solid #EFE9DF;">
            <div style="font-weight: 600; font-size: 14px; color: #2C2723; margin-bottom: 4px;">
              ${prod.name || "Furniture Item"}
            </div>
            <div style="font-size: 12px; color: #8C827A;">
              Qty: ${item.quantity} &times; ₹${item.price.toLocaleString("en-IN")}
            </div>
          </td>
          <td style="padding: 14px 10px; border-bottom: 1px solid #EFE9DF; text-align: right; font-weight: 700; color: #2C2723; font-size: 14px;">
            ₹${lineTotal.toLocaleString("en-IN")}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Furniva Cart is Waiting</title>
      <style>
        body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F4EF; color: #2C2723; margin: 0; padding: 24px 12px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; padding: 36px 28px; border: 1px solid #DED7CC; box-shadow: 0 6px 24px rgba(44,39,35,0.06); }
        .logo { font-size: 26px; font-weight: bold; color: #8B5E3C; text-decoration: none; display: inline-block; margin-bottom: 24px; font-family: Georgia, serif; }
        .h1 { font-size: 24px; font-weight: 700; margin-bottom: 14px; color: #2C2723; font-family: Georgia, serif; line-height: 1.3; }
        .p { color: #5E574F; font-size: 15px; line-height: 1.6; margin-bottom: 20px; }
        .cart-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .total-box { background-color: #F7F4EF; border-radius: 12px; padding: 16px 20px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; }
        .btn { display: inline-block; background-color: #8B5E3C; color: #FFFFFF !important; text-decoration: none; padding: 14px 34px; border-radius: 9999px; font-weight: 700; font-size: 15px; margin: 24px 0 16px 0; text-align: center; }
        .btn:hover { background-color: #724C30; }
        .footer { margin-top: 36px; font-size: 12px; color: #8C827A; border-top: 1px solid #EFE9DF; padding-top: 20px; text-align: center; line-height: 1.6; }
        .footer a { color: #8B5E3C; text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <a href="${clientUrl}" class="logo">🛋️ Furniva</a>
        
        <div class="h1">You left handcrafted furniture in your cart!</div>
        
        <p class="p">
          Hello ${user.name || "there"},<br />
          We noticed you added some beautiful pieces to your cart, but haven't finished checking out yet. Your selected items are reserved, but our high-demand artisan pieces sell out quickly.
        </p>

        <table class="cart-table">
          <thead>
            <tr style="border-bottom: 2px solid #EFE9DF;">
              <th colspan="2" style="text-align: left; padding: 8px 10px; font-size: 12px; color: #8C827A; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
              <th style="text-align: right; padding: 8px 10px; font-size: 12px; color: #8C827A; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="background-color: #F7F4EF; border-radius: 12px; padding: 14px 18px; margin: 16px 0;">
          <table style="width: 100%;">
            <tr>
              <td style="font-weight: 600; color: #5E574F; font-size: 14px;">Estimated Cart Subtotal:</td>
              <td style="font-weight: 800; color: #2C2723; font-size: 18px; text-align: right;">₹${totalAmount.toLocaleString("en-IN")}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${cartUrl}" class="btn" style="color: #ffffff;">Complete Your Order &rarr;</a>
          <div style="font-size: 12px; color: #8C827A; margin-top: 8px;">
            Free doorstep delivery & assembly included with your order
          </div>
        </div>

        <p class="p" style="font-size: 13px; color: #8C827A; border-left: 3px solid #8B5E3C; padding-left: 12px; margin-top: 24px;">
          Need assistance or custom dimensions? Reply directly to this email or visit our <a href="${clientUrl}/support" style="color: #8B5E3C; font-weight: 600;">Support Desk</a>.
        </p>

        <div class="footer">
          You are receiving this reminder because you have active items in your Furniva cart.<br />
          If you no longer wish to receive abandoned cart reminders or marketing updates, you can 
          <a href="${defaultUnsubscribeUrl}">unsubscribe here</a>.<br /><br />
          &copy; ${new Date().getFullYear()} Furniva Living. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
}
