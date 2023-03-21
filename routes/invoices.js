const express = require("express");
const ExpressError = require("../expressError");
const router = new express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query("SELECT id, comp_code FROM invoices");
    return res.json({ invoices: results.rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const results = await db.query(
      "SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, c.code, c.name, c.description FROM invoices AS i JOIN companies AS c ON i.comp_code = c.code WHERE i.id = $1",
      [id]
    );

    if (results.rows.length === 0) {
      throw new ExpressError("Invoice not found", 404);
    }

    const invoice = results.rows[0];
    return res.json({
      invoice: {
        id: invoice.id,
        amt: invoice.amt,
        paid: invoice.paid,
        add_date: invoice.add_date,
        paid_date: invoice.paid_date,
        company: {
          code: invoice.code,
          name: invoice.name,
          description: invoice.description,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const results = await db.query(
      "INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date",
      [comp_code, amt]
    );
    return res.status(201).json({ invoice: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// // old put route:
// router.put("/:id", async (req, res, next) => {
//   try {
//     const id = req.params.id;
//     const { amt } = req.body;
//     const results = await db.query(
//       "UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date",
//       [amt, id]
//     );

//     if (results.rows.length === 0) {
//       throw new ExpressError("Invoice not found", 404);
//     }

//     return res.json({ invoice: results.rows[0] });
//   } catch (err) {
//     return next(err);
//   }
// });

// // new put route:
router.put("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const { amt, paid } = req.body;

    // Get the current invoice details
    const currentInvoiceResult = await db.query("SELECT * FROM invoices WHERE id=$1", [id]);

    if (currentInvoiceResult.rows.length === 0) {
      throw new ExpressError("Invoice not found", 404);
    }

    const currentInvoice = currentInvoiceResult.rows[0];
    let paidDate;

    // Handle paid_date based on the provided paid status and the current invoice paid status
    if (paid && !currentInvoice.paid) {
      paidDate = new Date(); // If paying an unpaid invoice, set paid_date to today
    } else if (!paid && currentInvoice.paid) {
      paidDate = null; // If un-paying, set paid_date to null
    } else {
      paidDate = currentInvoice.paid_date; // Else, keep the current paid_date
    }

    // Update the invoice with the new values
    const results = await db.query(
      "UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date",
      [amt, paid, paidDate, id]
    );

    return res.json({ invoice: results.rows[0] });
  } catch (err) {
    return next(err);
  }
});


router.delete("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const results = await db.query("DELETE FROM invoices WHERE id=$1 RETURNING id", [id]);

    if (results.rows.length === 0) {
      throw new ExpressError("Invoice not found", 404);
    }

    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
