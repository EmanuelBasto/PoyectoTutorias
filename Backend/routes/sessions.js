const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// GET /api/sessions?email=...
router.get('/', auth, (req, res) => {
  // responde vacío por ahora
  return res.json({ ok: true, sessions: [] });
});

module.exports = router;

