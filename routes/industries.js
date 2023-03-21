const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

// Route to list all industries with associated company codes
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`
      SELECT i.code, i.industry, ci.comp_code
      FROM industries AS i
      LEFT JOIN company_industries AS ci ON i.code = ci.industry_code
      ORDER BY i.code
    `);

    const industries = {};
    results.rows.forEach(row => {
      if (!industries[row.code]) {
        industries[row.code] = {
          code: row.code,
          industry: row.industry,
          companies: []
        };
      }
      if (row.comp_code) {
        industries[row.code].companies.push(row.comp_code);
      }
    });

    return res.json({ industries: Object.values(industries) });
  } catch (e) {
    return next(e);
  }
});


// Route to get all companies with the given industry code
router.get("/:code", async (req, res, next) => {
    try {
      const { code } = req.params;
      const results = await db.query(`
        SELECT c.code, c.name
        FROM companies AS c
        JOIN company_industries AS ci ON c.code = ci.comp_code
        WHERE ci.industry_code = $1
      `, [code]);
  
      if (results.rows.length === 0) {
        throw new ExpressError(`Can't find companies with industry code of ${code}`, 404);
      }
  
      const companies = results.rows;
      return res.json({ companies });
    } catch (e) {
      return next(e);
    }
  });
  

// Route to create a new industry
router.post("/", async (req, res, next) => {
  try {
    const { code, industry } = req.body;
    const results = await db.query("INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry", [code, industry]);
    return res.status(201).json({ industry: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// Route to associate an industry with a company
    // ex: post to /industries/cod/companies with {	"code": "cod", 	"comp_code": "apple"} 
    // will associate apple with coding industry
router.post("/:code/companies", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { comp_code } = req.body;

    const results = await db.query("INSERT INTO company_industries (comp_code, industry_code) VALUES ($1, $2) RETURNING comp_code, industry_code", [comp_code, code]);
    return res.status(201).json({ company_industry: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// Route to delete an industry
router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    await db.query("DELETE FROM company_industries WHERE industry_code = $1", [code]);
    const results = await db.query("DELETE FROM industries WHERE code = $1", [code]);
    if (results.rowCount === 0) {
      throw new ExpressError(`Can't find industry with code of ${code}`, 404);
    }
    return res.json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});

// Route to delete company_industry association 
router.delete("/:code/companies/:comp_code", async (req, res, next) => {
  try {
    const { code, comp_code } = req.params;
    const results = await db.query("DELETE FROM company_industries WHERE comp_code = $1 AND industry_code = $2", [comp_code, code]);
    if (results.rowCount === 0) {
      throw new ExpressError(`Can't find company-industry relation with industry_code ${code} and comp_code ${comp_code}`, 404);
    }
    return res.json({ status: "deleted" });
    } catch (e) {
        return next(e);
    }
});

module.exports = router;