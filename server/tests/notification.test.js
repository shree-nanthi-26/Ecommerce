import request from "supertest";
import app from "../app.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import generateToken from "../utils/generateToken.js";

describe("In-App Notification Center API", () => {
  let customerUser;
  let customerToken;

  beforeAll(async () => {
    customerUser = await User.create({
      name: "Notif Customer",
      email: "notif_cust@example.com",
      password: "password123",
      role: "customer",
    });
    customerToken = generateToken(customerUser._id);
  });

  afterAll(async () => {
    await User.deleteMany({ email: "notif_cust@example.com" });
    await Notification.deleteMany({ user: customerUser._id });
  });

  beforeEach(async () => {
    await Notification.deleteMany({ user: customerUser._id });
  });

  it("should seed 9 demo notifications for all notification types", async () => {
    const res = await request(app)
      .post("/api/notifications/demo-seed")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(9);
    expect(res.body.unreadCount).toBeGreaterThan(0);

    const listRes = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.notifications.length).toBe(9);

    const types = listRes.body.notifications.map((n) => n.type);
    expect(types).toContain("order_placed");
    expect(types).toContain("order_confirmed");
    expect(types).toContain("order_shipped");
    expect(types).toContain("out_for_delivery");
    expect(types).toContain("delivered");
    expect(types).toContain("return_update");
    expect(types).toContain("price_drop");
    expect(types).toContain("back_in_stock");
    expect(types).toContain("new_deals");
  });

  it("should filter notifications by unread and categories", async () => {
    await request(app)
      .post("/api/notifications/demo-seed")
      .set("Authorization", `Bearer ${customerToken}`);

    const unreadRes = await request(app)
      .get("/api/notifications?filter=unread")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(unreadRes.status).toBe(200);
    expect(unreadRes.body.notifications.every((n) => !n.isRead)).toBe(true);

    const ordersRes = await request(app)
      .get("/api/notifications?filter=orders")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(ordersRes.status).toBe(200);
    expect(ordersRes.body.notifications.length).toBe(5);
  });

  it("should mark a single notification as read", async () => {
    const createRes = await request(app)
      .post("/api/notifications")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        type: "order_placed",
        title: "Test Notification",
        message: "This is a test notification message",
      });

    const notifId = createRes.body.notification._id;

    const readRes = await request(app)
      .put(`/api/notifications/${notifId}/read`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(readRes.status).toBe(200);
    expect(readRes.body.notification.isRead).toBe(true);
    expect(readRes.body.notification.readAt).toBeDefined();
  });

  it("should mark all notifications as read", async () => {
    await request(app)
      .post("/api/notifications/demo-seed")
      .set("Authorization", `Bearer ${customerToken}`);

    const markAllRes = await request(app)
      .put("/api/notifications/read-all")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(markAllRes.status).toBe(200);
    expect(markAllRes.body.unreadCount).toBe(0);

    const unreadRes = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(unreadRes.body.unreadCount).toBe(0);
  });

  it("should delete a notification and clear all notifications", async () => {
    const notif = await Notification.create({
      user: customerUser._id,
      type: "new_deals",
      title: "Deals Alert",
      message: "Save 20%",
    });

    const deleteRes = await request(app)
      .delete(`/api/notifications/${notif._id}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    const check = await Notification.findById(notif._id);
    expect(check).toBeNull();

    // Test clear all
    await request(app)
      .post("/api/notifications/demo-seed")
      .set("Authorization", `Bearer ${customerToken}`);

    const clearRes = await request(app)
      .delete("/api/notifications")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(clearRes.status).toBe(200);
    expect(clearRes.body.deletedCount).toBe(9);
  });
});
