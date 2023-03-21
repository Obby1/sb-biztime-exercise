const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");

router.get('/', async (req, res, next) => {
  try {
    const compResults = await db.query("SELECT code, name FROM companies");
    const companies = compResults.rows;

    // Get industries for each company
    const companiesWithIndustries = await Promise.all(companies.map(async (company) => {
      const indResults = await db.query("SELECT i.code, i.industry FROM industries AS i JOIN company_industries AS ci ON i.code = ci.industry_code WHERE ci.comp_code = $1", [company.code]);
      company.industries = indResults.rows;
      return company;
    }));

    return res.json({ companies: companiesWithIndustries });
  } catch (e) {
    return next(e);
  }
});

// Third part of exercise here:
// Replace the existing '/:code' route in companies.js with this updated route

router.get('/:code', async (req, res, next) => {
  try {
    const code = req.params.code.toLowerCase();
    const compResults = await db.query("SELECT code, name, description FROM companies WHERE code = $1", [code]);

    if (compResults.rows.length === 0) {
      throw new ExpressError(`Can't find company with code of ${code}`, 404);
    }

    const indResults = await db.query("SELECT i.code, i.industry FROM industries AS i JOIN company_industries AS ci ON i.code = ci.industry_code WHERE ci.comp_code = $1", [code]);
    const invResults = await db.query("SELECT id FROM invoices WHERE comp_code = $1", [code]);
    const company = compResults.rows[0];
    company.industries = indResults.rows;
    company.invoices = invResults.rows.map(row => row.id);

    return res.json({ company });
  } catch (e) {
    return next(e);
  }
});



// // Second part of exercise here:
// router.get('/:code', async (req, res, next) => {
//     try {
//       const code = req.params.code.toLowerCase();
//       const compResults = await db.query("SELECT code, name, description FROM companies WHERE code = $1", [code]);
      
//       if (compResults.rows.length === 0) {
//         throw new ExpressError(`Can't find company with code of ${code}`, 404);
//       }
  
//       const invResults = await db.query("SELECT id FROM invoices WHERE comp_code = $1", [code]);
//       const company = compResults.rows[0];
//       company.invoices = invResults.rows.map(row => row.id);
  
//       return res.json({ company });
//     } catch (e) {
//       return next(e);
//     }
//   });

// First Part of Exercise Route here:
// router.post('/', async (req, res, next) => {
//   try {
//     const { code, name, description } = req.body;
//     const results = await db.query("INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description", [code, name, description]);
//     return res.status(201).json({ company: results.rows[0] });
//   } catch (e) {
//     return next(e);
//   }
// });

// Further Study: Slugify Company Names (make it URL friendly - lowercase, no special chars)
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;

    // Generate the company code using slugify
    const code = slugify(name, {
      lower: true,
      strict: true
    });

    const results = await db.query("INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description", [code, name, description]);
    return res.status(201).json({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.put('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const results = await db.query("UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description", [name, description, code]);
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't update company with code of ${code}`, 404);
    }
    return res.json({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query("DELETE FROM companies WHERE code = $1", [code]);
    return res.json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
