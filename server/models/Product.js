import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    oldPrice: {
      type: Number,
    },
    description: {
      type: String,
    },
    images: {
      type: [
        {
          url: { type: String },
          publicId: { type: String },
        }
      ],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      default: 0,
    },
    badge: {
      type: String,
      enum: ["NEW", "SALE", null],
      default: null,
    },
    brand: {
      type: String,
    },
    specs: {
      ram: { type: String },
      storage: { type: String },
      screenSize: { type: String },
      processor: { type: String },
      os: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
