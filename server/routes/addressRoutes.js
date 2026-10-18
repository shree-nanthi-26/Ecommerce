import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} from "../controllers/addressController.js";

const router = express.Router();

// All address routes are protected (require user login)
router.use(protect);

router.route("/")
  .get(getAddresses)
  .post(createAddress);

router.route("/:id")
  .get(getAddressById)
  .put(updateAddress)
  .delete(deleteAddress);

router.patch("/:id/default", setDefaultAddress);

export default router;
