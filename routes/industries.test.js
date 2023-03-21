// connect to the right DB --- set before loading db.js
process.env.NODE_ENV = "test";


const request = require("supertest");
const app = require("../app");
const db = require("../db");

// Setup and teardown functions for the tests
beforeAll(async () => {
  // Create test data
  await db.query("INSERT INTO industries (code, industry) VALUES ('test', 'Test Industry')");
  await db.query("INSERT INTO companies (code, name, description) VALUES ('testcomp', 'Test Company', 'Test Description')");
  await db.query("INSERT INTO company_industries (comp_code, industry_code) VALUES ('testcomp', 'test')");
});

afterAll(async () => {
  // Clean up test data
  await db.query("DELETE FROM company_industries WHERE comp_code = 'testcomp' AND industry_code = 'test'");
  await db.query("DELETE FROM companies WHERE code = 'testcomp'");
  await db.query("DELETE FROM industries WHERE code = 'test'");

  // Close the database connection
  db.end();
});

// Test for GET /industries which should list all industries
describe("GET /industries", () => {
  test("Get all industries with associated company codes", async () => {
    const response = await request(app).get("/industries");
    expect(response.statusCode).toBe(200);
    expect(response.body.industries).toHaveLength(5);
  
    expect(response.body.industries).toContainEqual({
      code: "acct",
      industry: "Accounting",
      companies: []
    });
  
    expect(response.body.industries).toContainEqual({
      code: "fin",
      industry: "Finance",
      companies: []
    });
  
    expect(response.body.industries).toContainEqual({
      code: "manu",
      industry: "Manufacturing",
      companies: []
    });
  
    expect(response.body.industries).toContainEqual({
      code: "tech",
      industry: "Technology",
      companies: []
    });
  
    expect(response.body.industries).toContainEqual({
      code: "test",
      industry: "Test Industry",
      companies: ["testcomp"]
    });
  });
});


describe("GET /industries/:code", () => {
  test("Get companies with the given industry code", async () => {
    const response = await request(app).get("/industries/test");
    expect(response.statusCode).toBe(200);
    expect(response.body.companies).toHaveLength(1);
    expect(response.body.companies[0]).toEqual({
      code: "testcomp",
      name: "Test Company"
    });
  });
});


describe("POST /industries", () => {
  test("Create a new industry", async () => {
    const response = await request(app)
      .post("/industries")
      .send({ code: "test2", industry: "Test Industry 2" });
    expect(response.statusCode).toBe(201);
    expect(response.body.industry).toEqual({
      code: "test2",
      industry: "Test Industry 2"
    });

    // Clean up created test data
    await db.query("DELETE FROM industries WHERE code = 'test2'");
  });
});


describe("POST /industries/:code/companies", () => {
  test("Associate an industry with a company", async () => {
    await db.query("INSERT INTO companies (code, name, description) VALUES ('testcomp2', 'Test Company 2', 'Test Description')");
    const response = await request(app)
      .post("/industries/test/companies")
      .send({ comp_code: "testcomp2" });
    expect(response.statusCode).toBe(201);
    expect(response.body.company_industry).toEqual({
      comp_code: "testcomp2",
      industry_code: "test"
    });

        // Clean up created test data
        await db.query("DELETE FROM company_industries WHERE comp_code = 'testcomp2' AND industry_code = 'test'");
        await db.query("DELETE FROM companies WHERE code = 'testcomp2'");
      });
    });
    

describe("DELETE /industries/:code", () => {
    test("Delete an industry", async () => {
    await db.query("INSERT INTO industries (code, industry) VALUES ('test3', 'Test Industry 3')");
    const response = await request(app).delete("/industries/test3");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: "deleted" });

    // Verify the industry is deleted
    const checkResponse = await request(app).get("/industries/test3");
    expect(checkResponse.statusCode).toBe(404);
    });
});


describe("DELETE /industries/:code/companies/:comp_code", () => {
    test("Delete company-industry association", async () => {
    await db.query("INSERT INTO companies (code, name, description) VALUES ('testcomp3', 'Test Company 3', 'Test Description')");
    await db.query("INSERT INTO company_industries (comp_code, industry_code) VALUES ('testcomp3', 'test')");

    const response = await request(app).delete("/industries/test/companies/testcomp3");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: "deleted" });

    // Clean up created test data
    await db.query("DELETE FROM companies WHERE code = 'testcomp3'");
    });
});
    