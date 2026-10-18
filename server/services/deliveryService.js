/**
 * Pincode & Delivery Logistics Service
 * Designed to easily connect to 3rd-party logistics APIs (Shiprocket, Delhivery, BlueDart)
 */

const ZONE_CONFIG = {
  1: { region: "North (Delhi NCR / Punjab / Haryana)", minDays: 2, maxDays: 4, expressEligible: true, codAvailable: true },
  2: { region: "North (UP / Uttarakhand)", minDays: 3, maxDays: 5, expressEligible: true, codAvailable: true },
  3: { region: "West (Rajasthan / Gujarat)", minDays: 3, maxDays: 5, expressEligible: true, codAvailable: true },
  4: { region: "West & Central (Maharashtra / Mumbai / Pune / MP)", minDays: 2, maxDays: 4, expressEligible: true, codAvailable: true },
  5: { region: "South (Karnataka / Bangalore / Hyderabad / AP / Telangana)", minDays: 2, maxDays: 3, expressEligible: true, codAvailable: true },
  6: { region: "South (Tamil Nadu / Chennai / Kerala)", minDays: 2, maxDays: 4, expressEligible: true, codAvailable: true },
  7: { region: "East & North-East (WB / Kolkata / Odisha / Assam)", minDays: 4, maxDays: 6, expressEligible: false, codAvailable: true },
  8: { region: "East (Bihar / Jharkhand)", minDays: 4, maxDays: 6, expressEligible: false, codAvailable: true },
  9: { region: "Army Postal Service (APS)", minDays: 5, maxDays: 8, expressEligible: false, codAvailable: false },
};

/**
 * Validate Indian Postal Code format
 * Must be 6 digits, cannot start with 0
 */
export function isValidPincode(pincode) {
  if (!pincode) return false;
  const cleaned = String(pincode).trim();
  return /^[1-9][0-9]{5}$/.test(cleaned);
}

/**
 * Calculate delivery estimates and serviceability for a given pincode
 */
export function checkDeliveryAvailability(pincode, orderSubtotal = 0) {
  const cleaned = String(pincode || "").trim();

  if (!isValidPincode(cleaned)) {
    return {
      success: false,
      serviceable: false,
      message: "Please enter a valid 6-digit Indian postal code (e.g. 560001, 110001, 400001).",
    };
  }

  const prefixDigit = Number(cleaned.charAt(0));
  const zone = ZONE_CONFIG[prefixDigit] || {
    region: "Standard Delivery Zone",
    minDays: 4,
    maxDays: 7,
    expressEligible: false,
    codAvailable: true,
  };

  const now = new Date();

  // Add min and max business days (skipping Sundays for accurate estimates)
  const minDate = addBusinessDays(now, zone.minDays);
  const maxDate = addBusinessDays(now, zone.maxDays);

  const formattedMin = minDate.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const formattedMax = maxDate.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const isFreeDelivery = Number(orderSubtotal) >= 999;
  const standardFee = isFreeDelivery ? 0 : 99;

  return {
    success: true,
    serviceable: true,
    pincode: cleaned,
    region: zone.region,
    estimatedDeliveryRange: `${formattedMin} – ${formattedMax}`,
    estimatedDaysText: `${zone.minDays} to ${zone.maxDays} Business Days`,
    minDeliveryDate: minDate,
    maxDeliveryDate: maxDate,
    isFreeDelivery,
    deliveryFee: standardFee,
    freeDeliveryThreshold: 999,
    expressAvailable: zone.expressEligible,
    codAvailable: zone.codAvailable,
    assemblyIncluded: true,
    courierPartner: "Furniva White-Glove Specialized Logistics",
  };
}

function addBusinessDays(startDate, daysToAdd) {
  const date = new Date(startDate);
  let added = 0;
  while (added < daysToAdd) {
    date.setDate(date.getDate() + 1);
    // 0 is Sunday
    if (date.getDay() !== 0) {
      added++;
    }
  }
  return date;
}
