import request from "supertest";
import app from "../app.js";

describe("SEO Endpoints", () => {
  it("should serve robots.txt with disallow directives for private paths", async () => {
    const res = await request(app).get("/robots.txt");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.text).toContain("User-agent: *");
    expect(res.text).toContain("Disallow: /admin");
    expect(res.text).toContain("Disallow: /cart");
    expect(res.text).toContain("Disallow: /checkout");
    expect(res.text).toContain("Disallow: /profile");
    expect(res.text).toContain("Sitemap:");
  });

  it("should serve sitemap.xml with XML format", async () => {
    const res = await request(app).get("/sitemap.xml");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/xml");
    expect(res.text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(res.text).toContain("<urlset");
    expect(res.text).toContain("<loc>");
  });
});
