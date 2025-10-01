// routes/perfil.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

/**
 * Perfil del usuario autenticado (JWT)
 * GET /api/perfil/me
 */
router.get('/me', authMiddleware, async (req, res) => {
  const id = req.user.id;
  try {
    const r = await db.query(
      `SELECT u.id, u.matricula, u.email, u.nombre, u.apellido, r.nombre AS role, u.telefono, u.foto_url
       FROM users u
       LEFT JOIN roles r ON u.rol_id = r.id
       WHERE u.id=$1 LIMIT 1`,
      [id]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'No encontrado' });
    }

    res.json({
      ok: true,
      profile: {
        id: r.rows[0].id,
        firstName: r.rows[0].nombre,
        lastName: r.rows[0].apellido,
        email: r.rows[0].email,
        studentId: r.rows[0].matricula,
        role: r.rows[0].role,
        telefono: r.rows[0].telefono,
        fotoUrl: r.rows[0].foto_url
      }
    });
  } catch (err) {
    console.error('[perfil/me]', err);
    res.status(500).json({ ok: false, message: 'Error servidor' });
  }
});

/**
 * Perfil por email (plan B, menos seguro porque no requiere JWT)
 * GET /api/perfil/profile?email=...
 */
router.get('/profile', async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ ok: false, message: 'Falta email' });
  }

  try {
    const r = await db.query(
      `SELECT u.id, u.matricula, u.email, u.nombre, u.apellido, r.nombre AS role, u.telefono, u.foto_url
       FROM users u
       LEFT JOIN roles r ON u.rol_id = r.id
       WHERE u.email=$1 LIMIT 1`,
      [email]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }

    res.json({
      ok: true,
      profile: {
        id: r.rows[0].id,
        firstName: r.rows[0].nombre,
        lastName: r.rows[0].apellido,
        email: r.rows[0].email,
        studentId: r.rows[0].matricula,
        role: r.rows[0].role,
        telefono: r.rows[0].telefono,
        fotoUrl: r.rows[0].foto_url
      }
    });
  } catch (err) {
    console.error('[perfil/profile]', err);
    res.status(500).json({ ok: false, message: 'Error servidor' });
  }
});

module.exports = router;


