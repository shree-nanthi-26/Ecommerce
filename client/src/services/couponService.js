import axiosInstance from "../api/axiosInstance";

export async function validateCoupon(code, itemsTotal) {
  const response = await axiosInstance.post("/coupons/validate", {
    code,
    itemsTotal,
  });
  return response.data;
}

export async function getPublicCoupons() {
  const response = await axiosInstance.get("/coupons/public");
  return response.data;
}

export async function getAdminCoupons() {
  const response = await axiosInstance.get("/admin/coupons");
  return response.data;
}

export async function createCoupon(couponData) {
  const response = await axiosInstance.post("/admin/coupons", couponData);
  return response.data;
}

export async function updateCoupon(id, couponData) {
  const response = await axiosInstance.put(`/admin/coupons/${id}`, couponData);
  return response.data;
}

export async function deleteCoupon(id) {
  const response = await axiosInstance.delete(`/admin/coupons/${id}`);
  return response.data;
}
