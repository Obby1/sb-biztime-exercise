// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function() {
    // Clean up the database before each test
    await db.query("DELETE FROM companies");
  
    let result = await db.query(`
      INSERT INTO
        companies (code, name, description) VALUES ('testco', 'TestCompany', 'A company for testing')
        RETURNING code, name, description`);
    testCompany = result.rows[0];
  });

describe("GET /companies", function() {
    test("Gets a list of companies", async function() {
      const response = await request(app).get(`/companies`);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        companies: [ { code: 'testco', name: 'TestCompany', industries: [] } ]
      });
    });
  });
  

describe("GET /companies/:code", function() {
    test("Gets a single company", async function() {
        const response = await request(app).get(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ company: {...testCompany, invoices: [], industries: []} });
      });
    
  test("Responds with 404 if can't find company", async function() {
    const response = await request(app).get(`/companies/nonexistent`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("POST /companies", function() {
  test("Creates a new company", async function() {
    const response = await request(app)
      .post(`/companies`)
      .send({
        code: "newco",
        name: "NewCo",
        description: "A new company"
      });
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      company: {code: "newco", name: "NewCo", description: "A new company"}
    });
  });
});

describe("PUT /companies/:code", function() {
  test("Updates a single company", async function() {
    const response = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send({
        name: "UpdatedCo",
        description: "An updated company"
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      company: {code: testCompany.code, name: "UpdatedCo", description: "An updated company"}
    });
  });

  test("Responds with 404 if can't find company", async function() {
    const response = await request(app).put(`/companies/nonexistent`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("DELETE /companies/:code", function() {
  test("Deletes a single company", async function() {
    const response = await request(app)
      .delete(`/companies/${testCompany.code}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ status: "deleted" });
  });
});

afterEach(async function() {
    // Clean up the database after each test
    await db.query("DELETE FROM companies");
  });

afterAll(async function() {
  // close db connection
  await db.end();
});
