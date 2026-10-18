export function wishlistPriceDropTemplate(user, product, oldPrice, newPrice) {
  const savings = oldPrice - newPrice;
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
        .p { color: #5E574F; font-size: 15px; line-height: 1.6; margin-bottom: 20px; }
        .alert-box { background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
        .price-badge { font-size: 24px; font-weight: 800; color: #059669; }
        .old-price { text-decoration: line-through; color: #9CA3AF; font-size: 16px; margin-right: 8px; }
        .btn { display: inline-block; background-color: #8B5E3C; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 600; font-size: 15px; margin-top: 20px; }
        .footer { margin-top: 32px; font-size: 12px; color: #9E958C; border-top: 1px solid #E8E2D9; padding-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <a href="#" class="logo">🛋️ Furniva</a>
        <div class="h1">Price Drop Alert! 🎉</div>
        <p class="p">Hi ${user.name || "Customer"}, good news! An item on your wishlist is now available at a discounted price.</p>
        
        <div class="alert-box">
          <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #1F2937;">${product.name}</h3>
          <div>
            <span class="old-price">₹${oldPrice.toLocaleString("en-IN")}</span>
            <span class="price-badge">₹${newPrice.toLocaleString("en-IN")}</span>
          </div>
          <p style="margin: 8px 0 0 0; color: #059669; font-weight: 700; font-size: 14px;">
            You save ₹${savings.toLocaleString("en-IN")}!
          </p>
        </div>

        <p class="p">Grab it before stocks run out!</p>

        <div style="text-align: center;">
          <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/products/${product._id}" class="btn">View & Add to Cart</a>
        </div>

        <div class="footer">
          You received this email because you opted in to price drop alerts for this product.<br />
          &copy; ${new Date().getFullYear()} Furniva. Handcrafted furniture for beautiful homes.
        </div>
      </div>
    </body>
    </html>
  `;
}

export function wishlistRestockTemplate(user, product) {
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
        .p { color: #5E574F; font-size: 15px; line-height: 1.6; margin-bottom: 20px; }
        .alert-box { background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
        .stock-badge { font-size: 20px; font-weight: 800; color: #2563EB; }
        .btn { display: inline-block; background-color: #8B5E3C; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 600; font-size: 15px; margin-top: 20px; }
        .footer { margin-top: 32px; font-size: 12px; color: #9E958C; border-top: 1px solid #E8E2D9; padding-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <a href="#" class="logo">🛋️ Furniva</a>
        <div class="h1">Back In Stock! 📦</div>
        <p class="p">Hi ${user.name || "Customer"}, an item on your wishlist is back in stock and ready to order.</p>
        
        <div class="alert-box">
          <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #1F2937;">${product.name}</h3>
          <div class="stock-badge">Now In Stock (${product.stock} units available)</div>
          <p style="margin: 8px 0 0 0; color: #1E40AF; font-weight: 600; font-size: 15px;">
            Price: ₹${product.price?.toLocaleString("en-IN")}
          </p>
        </div>

        <p class="p">Demand is high, so order soon to secure your piece.</p>

        <div style="text-align: center;">
          <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/products/${product._id}" class="btn">Order Now</a>
        </div>

        <div class="footer">
          You received this email because you opted in to restock alerts for this product.<br />
          &copy; ${new Date().getFullYear()} Furniva. Handcrafted furniture for beautiful homes.
        </div>
      </div>
    </body>
    </html>
  `;
}
