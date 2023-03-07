//--------------------------------- index.js -----------------------------------
// This file contains the methods that handle the behavior of the main
// application page (MediaTrends.html).
// It makes AJAX fetch calls to the API to satisfy different user interactions
// with the MediaTrends application
// -----------------------------------------------------------------------------

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

module.exports = router;