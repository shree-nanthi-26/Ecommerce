import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      validate: {
        validator: function (v) {
          // Indian mobile number: 10 digits starting with 6, 7, 8, or 9
          return /^[6-9]\d{9}$/.test(v.replace(/[\s\-+]/g, "").slice(-10));
        },
        message: "Please enter a valid 10-digit Indian mobile number",
      },
    },
    addressLine1: {
      type: String,
      required: [true, "Address Line 1 is required"],
      trim: true,
      maxlength: [200, "Address line cannot exceed 200 characters"],
    },
    addressLine2: {
      type: String,
      trim: true,
      default: "",
      maxlength: [200, "Address line 2 cannot exceed 200 characters"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: [100, "City cannot exceed 100 characters"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      maxlength: [100, "State cannot exceed 100 characters"],
    },
    postalCode: {
      type: String,
      required: [true, "Postal code is required"],
      trim: true,
      validate: {
        validator: function (v) {
          // Indian postal PIN code: 6 digits, first digit non-zero (1-9)
          return /^[1-9][0-9]{5}$/.test(v.trim());
        },
        message: "Please enter a valid 6-digit Indian PIN code",
      },
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      default: "India",
    },
    addressType: {
      type: String,
      enum: {
        values: ["Home", "Work", "Other"],
        message: "Address type must be Home, Work, or Other",
      },
      default: "Home",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
addressSchema.index({ user: 1, isDefault: -1, createdAt: -1 });

const Address = mongoose.model("Address", addressSchema);
export default Address;
