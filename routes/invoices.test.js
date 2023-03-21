// connect to the right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testInvoice;

beforeEach(async function() {
    // Clean up the database before each test
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM companies");

    // Add a test company and test invoice
    let companyResult = await db.query(`
        INSERT INTO companies (code, name, description) 
        VALUES ('testco', 'TestCompany', 'A company for testing')
        RETURNING code, name, description
    `);

    let invoiceResult = await db.query(`
        INSERT INTO invoices (comp_code, amt) 
        VALUES ('testco', 100)
        RETURNING id, comp_code, amt, paid, add_date, paid_date
    `);

    testInvoice = invoiceResult.rows[0];
});

describe("GET /invoices", function() {
    test("Gets a list of invoices", async function() {
        const response = await request(app).get(`/invoices`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            invoices: [
                {
                    id: testInvoice.id,
                    comp_code: testInvoice.comp_code
                }
            ]
        });
    });
});

describe("GET /invoices/:id", function() {
    test("Gets a single invoice", async function() {
        const response = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            invoice: {
                id: testInvoice.id,
                amt: testInvoice.amt,
                paid: testInvoice.paid,
                add_date: testInvoice.add_date.toISOString(),
                paid_date: testInvoice.paid_date,
                company: {
                    code: "testco",
                    name: "TestCompany",
                    description: "A company for testing",
                },
            },
        });
    });

    test("Responds with 404 if can't find invoice", async function() {
        const response = await request(app).get(`/invoices/9999`);
        expect(response.statusCode).toEqual(404);
    });
});

describe("POST /invoices", function() {
    test("Creates a new invoice", async function() {
        const response = await request(app)
            .post(`/invoices`)
            .send({
                comp_code: "testco",
                amt: 200,
            });
        expect(response.statusCode).toEqual(201);
        expect(response.body.invoice).toMatchObject({
            id: expect.any(Number),
            comp_code: "testco",
            amt: 200,
            paid: false,
            add_date: expect.any(String),
            paid_date: null,
        });
    });
});

// // Old Put Invoices Test below (before marking paid or unpaid)
// describe("PUT /invoices/:id", function() {
//     test("Updates a single invoice", async function() {
//         const response = await request(app)
//             .put(`/invoices/${testInvoice.id}`)
//             .send({
//                 amt: 300,
//             });
//         expect(response.statusCode).toEqual(200);
//         expect(response.body.invoice).toMatchObject({
//             id: testInvoice.id,
//             comp_code: "testco",
//             amt: 300,
//             paid: false,
//             add_date: expect.any(String),
//             paid_date: null,
//         });
//     });

//     test("Responds with 404 if can't find invoice", async function() {
//         const response = await request(app).put(`/invoices/9999`).send({ amt: 300 });
//         expect(response.statusCode).toEqual(404);
//     });
// });

// New Put Invoices Test:
describe("PUT /invoices/:id", function() {
    test("Updates a single invoice, including payment status and paid_date", async function() {
        const response = await request(app)
            .put(`/invoices/${testInvoice.id}`)
            .send({
                amt: 300,
                paid: true,
            });
        expect(response.statusCode).toEqual(200);
        expect(response.body.invoice).toMatchObject({
            id: testInvoice.id,
            comp_code: "testco",
            amt: 300,
            paid: true,
            add_date: expect.any(String),
            paid_date: expect.any(String),
        });
    });

    test("Un-pays a paid invoice and sets paid_date to null", async function() {
        const response = await request(app)
            .put(`/invoices/${testInvoice.id}`)
            .send({
                amt: 300,
                paid: false,
            });
        expect(response.statusCode).toEqual(200);
        expect(response.body.invoice).toMatchObject({
            id: testInvoice.id,
            comp_code: "testco",
            amt: 300,
            paid: false,
            add_date: expect.any(String),
            paid_date: null,
        });
    });

    test("Responds with 404 if can't find invoice", async function() {
        const response = await request(app).put(`/invoices/9999`).send({ amt: 300, paid: true });
        expect(response.statusCode).toEqual(404);
    });
});


describe("DELETE /invoices/:id", function() {
    test("Deletes a single invoice", async function() {
        const response = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ status: "deleted" });
    });

    test("Responds with 404 if can't find invoice", async function() {
        const response = await request(app).delete(`/invoices/9999`);
        expect(response.statusCode).toEqual(404);
    });
});



afterEach(async function() {
    // Clean up the database after each test
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM companies");
});

afterAll(async function() {
    // close db connection
    await db.end();
});
