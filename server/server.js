import "dotenv/config";
import { connectDB } from "./config/db.js";
import app from "./app.js";

connectDB();

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});