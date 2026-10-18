import mongoose from "mongoose";
import Address from "../models/Address.js";

/**
 * Helper to normalize Indian phone number (extract last 10 digits)
 */
function normalizeIndianPhone(phone) {
  if (!phone) return "";
  const cleaned = phone.toString().replace(/[\s\-+()]/g, "");
  return cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
}

/**
 * @desc    Get all addresses for logged-in user
 * @route   GET /api/addresses
 * @access  Private
 */
export async function getAddresses(req, res, next) {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get single address by ID
 * @route   GET /api/addresses/:id
 * @access  Private
 */
export async function getAddressById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid address ID format");
    }

    const address = await Address.findById(id);

    if (!address) {
      res.status(404);
      throw new Error("Address not found");
    }

    // Ensure user isolation
    if (address.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You do not have permission to access this address");
    }

    res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Create a new address
 * @route   POST /api/addresses
 * @access  Private
 */
export async function createAddress(req, res, next) {
  try {
    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      pincode, // fallback support for pincode
      country = "India",
      addressType = "Home",
      isDefault = false,
    } = req.body;

    const normalizedPostalCode = (postalCode || pincode || "").toString().trim();
    const normalizedPhone = normalizeIndianPhone(phone);

    // Validation checks
    if (!fullName || !fullName.trim()) {
      res.status(400);
      throw new Error("Full name is required");
    }

    if (!normalizedPhone || !/^[6-9]\d{9}$/.test(normalizedPhone)) {
      res.status(400);
      throw new Error("Please provide a valid 10-digit Indian mobile number (e.g., 9876543210)");
    }

    if (!addressLine1 || !addressLine1.trim()) {
      res.status(400);
      throw new Error("Address line 1 is required");
    }

    if (!city || !city.trim()) {
      res.status(400);
      throw new Error("City is required");
    }

    if (!state || !state.trim()) {
      res.status(400);
      throw new Error("State is required");
    }

    if (!normalizedPostalCode || !/^[1-9][0-9]{5}$/.test(normalizedPostalCode)) {
      res.status(400);
      throw new Error("Please provide a valid 6-digit Indian PIN code (e.g., 560001)");
    }

    // Check count of user's existing addresses
    const existingCount = await Address.countDocuments({ user: req.user._id });
    
    // First address is always default; or if explicitly set to default
    const shouldBeDefault = existingCount === 0 || Boolean(isDefault);

    if (shouldBeDefault && existingCount > 0) {
      // Unset previous defaults
      await Address.updateMany(
        { user: req.user._id, isDefault: true },
        { isDefault: false }
      );
    }

    const newAddress = await Address.create({
      user: req.user._id,
      fullName: fullName.trim(),
      phone: normalizedPhone,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2 ? addressLine2.trim() : "",
      city: city.trim(),
      state: state.trim(),
      postalCode: normalizedPostalCode,
      country: country ? country.trim() : "India",
      addressType: ["Home", "Work", "Other"].includes(addressType) ? addressType : "Home",
      isDefault: shouldBeDefault,
    });

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: newAddress,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Update an existing address
 * @route   PUT /api/addresses/:id
 * @access  Private
 */
export async function updateAddress(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid address ID format");
    }

    const address = await Address.findById(id);

    if (!address) {
      res.status(404);
      throw new Error("Address not found");
    }

    // Ensure user isolation
    if (address.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You do not have permission to update this address");
    }

    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      pincode,
      country,
      addressType,
      isDefault,
    } = req.body;

    if (fullName !== undefined) {
      if (!fullName.trim()) {
        res.status(400);
        throw new Error("Full name cannot be empty");
      }
      address.fullName = fullName.trim();
    }

    if (phone !== undefined) {
      const normalizedPhone = normalizeIndianPhone(phone);
      if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
        res.status(400);
        throw new Error("Please provide a valid 10-digit Indian mobile number");
      }
      address.phone = normalizedPhone;
    }

    if (addressLine1 !== undefined) {
      if (!addressLine1.trim()) {
        res.status(400);
        throw new Error("Address line 1 cannot be empty");
      }
      address.addressLine1 = addressLine1.trim();
    }

    if (addressLine2 !== undefined) {
      address.addressLine2 = addressLine2.trim();
    }

    if (city !== undefined) {
      if (!city.trim()) {
        res.status(400);
        throw new Error("City cannot be empty");
      }
      address.city = city.trim();
    }

    if (state !== undefined) {
      if (!state.trim()) {
        res.status(400);
        throw new Error("State cannot be empty");
      }
      address.state = state.trim();
    }

    const postalToUpdate = postalCode !== undefined ? postalCode : pincode;
    if (postalToUpdate !== undefined) {
      const normalizedPostal = postalToUpdate.toString().trim();
      if (!/^[1-9][0-9]{5}$/.test(normalizedPostal)) {
        res.status(400);
        throw new Error("Please provide a valid 6-digit Indian PIN code");
      }
      address.postalCode = normalizedPostal;
    }

    if (country !== undefined && country.trim()) {
      address.country = country.trim();
    }

    if (addressType !== undefined && ["Home", "Work", "Other"].includes(addressType)) {
      address.addressType = addressType;
    }

    if (isDefault !== undefined && isDefault !== address.isDefault) {
      if (isDefault) {
        // Unset other defaults
        await Address.updateMany(
          { user: req.user._id, _id: { $ne: address._id }, isDefault: true },
          { isDefault: false }
        );
        address.isDefault = true;
      } else {
        // If unsetting default, make sure there's another default or allow if user has other addresses
        address.isDefault = false;
      }
    }

    const updatedAddress = await address.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: updatedAddress,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Set an address as default
 * @route   PATCH /api/addresses/:id/default
 * @access  Private
 */
export async function setDefaultAddress(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid address ID format");
    }

    const address = await Address.findById(id);

    if (!address) {
      res.status(404);
      throw new Error("Address not found");
    }

    // Ensure user isolation
    if (address.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You do not have permission to modify this address");
    }

    // Unset all other defaults for this user
    await Address.updateMany(
      { user: req.user._id, _id: { $ne: address._id } },
      { isDefault: false }
    );

    address.isDefault = true;
    const updated = await address.save();

    res.status(200).json({
      success: true,
      message: "Default address updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Delete an address
 * @route   DELETE /api/addresses/:id
 * @access  Private
 */
export async function deleteAddress(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid address ID format");
    }

    const address = await Address.findById(id);

    if (!address) {
      res.status(404);
      throw new Error("Address not found");
    }

    // Ensure user isolation
    if (address.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You do not have permission to delete this address");
    }

    const wasDefault = address.isDefault;

    await Address.findByIdAndDelete(id);

    // If deleted address was default, promote the newest remaining address to default
    if (wasDefault) {
      const nextDefault = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
