// Second part of exercise here:
/** BizTime express application. */

const express = require("express");

const app = express();
const ExpressError = require("./expressError");

app.use(express.json());

const cRoutes = require("./routes/companies");
const iRoutes = require("./routes/invoices");
const indRoutes = require("./routes/industries"); 

app.use("/companies", cRoutes); 
app.use("/invoices", iRoutes);
app.use("/industries", indRoutes); // Add industries routes

/** 404 handler */

app.use(function(req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use(function (err, req, res, next) {
  // the default status is 500 Internal Server Error
  let status = err.status || 500;

  // set the status and alert the user
  return res.status(status).json({
    error: {
      message: err.message,
      status: status,
    },
  });
});

module.exports = app;



// First Part of Exercise here:
// /** BizTime express application. */


// const express = require("express");

// const app = express();
// const ExpressError = require("./expressError")

// app.use(express.json());

// const cRoutes = require("./routes/companies");
// const iRoutes = require("./routes/invoices");

// app.use("/companies", cRoutes); 
// app.use("/invoices", iRoutes); 

// /** 404 handler */

// app.use(function(req, res, next) {
//   const err = new ExpressError("Not Found", 404);
//   return next(err);
// });

// /** general error handler */

// app.use(function (err, req, res, next) {
//   // the default status is 500 Internal Server Error
//   let status = err.status || 500;

//   // set the status and alert the user
//   return res.status(status).json({
//     error: {
//       message: err.message,
//       status: status,
//     },
//   });
// });


// module.exports = app;
