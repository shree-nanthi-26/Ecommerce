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
    sku: {
      type: String,
      trim: true,
      default: "",
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
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
    badge: {
      type: String,
      enum: ["NEW", "SALE", null],
      default: null,
    },
    brand: {
      type: String,
    },
    isNewProduct: {
      type: Boolean,
      default: false,
    },
    isBestseller: {
      type: Boolean,
      default: false,
    },
    specs: {
      material: { type: String },
      dimensions: { type: String },
      color: { type: String },
      roomType: { type: String },
      seatingCapacity: { type: String },
      style: { type: String },
      finish: { type: String },
      assemblyRequired: { type: String },
      assemblyTime: { type: String },
      width: { type: String },
      height: { type: String },
      depth: { type: String },
      weight: { type: String },
      cushionMaterial: { type: String },
      careInstructions: { type: String },
      woodType: { type: String },
      upholstery: { type: String },
      warranty: { type: String },
      tvSizeCompatibility: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for query & search performance
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 1 });
productSchema.index({ "specs.material": 1 });
productSchema.index({ "specs.roomType": 1 });
productSchema.index({ "specs.style": 1 });
productSchema.index({ category: 1, rating: -1 });

// Weighted text index across name, category, brand, attributes, and description
productSchema.index(
  {
    name: "text",
    category: "text",
    brand: "text",
    description: "text",
    "specs.material": "text",
    "specs.color": "text",
    "specs.roomType": "text",
    "specs.style": "text",
    "specs.woodType": "text",
  },
  {
    weights: {
      name: 10,
      category: 5,
      brand: 5,
      "specs.material": 4,
      "specs.roomType": 3,
      "specs.style": 2,
      description: 1,
    },
    name: "ProductFullSearchIndex",
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
