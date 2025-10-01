// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');

const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  if (!token) return res.status(401).json({ ok:false, message: 'Falta token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecreto');
    req.user = payload; // { id, email, rol, iat, exp }
    next();
  } catch (e) {
    return res.status(401).json({ ok:false, message: 'Token inválido o expirado' });
  }
}



// Seguridad y correo
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// SMTP (usa un proveedor en prod: SendGrid/Mailgun/SES)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // true si usas 465
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

// URL pública del frontend
const FRONTEND_BASE = process.env.FRONTEND_BASE || 'http://localhost:3000';

/** Helper: prefijo por rol */
function getPrefixFromRoleName(rolName) {
  if (!rolName) return 'U';
  const r = rolName.toLowerCase();
  if (r.includes('alum')) return 'A';
  if (r.includes('tutor')) return 'T';
  if (r.includes('admin')) return 'X';
  return 'U';
}

/** GET /api/users/next-matricula?role=alumno */
router.get('/users/next-matricula', async (req, res, next) => {
  const roleQuery = (req.query.role || '').toString();
  if (!roleQuery) return res.status(400).json({ ok: false, message: 'Se requiere role en query' });

  const prefix = getPrefixFromRoleName(roleQuery);

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const q = `
      SELECT matricula
      FROM users
      WHERE matricula LIKE $1
      ORDER BY CAST(regexp_replace(matricula, '\\D', '', 'g') AS INTEGER) DESC
      LIMIT 1
      FOR UPDATE`;
    const r = await client.query(q, [`${prefix}%`]);
    const next = r.rows.length === 0
      ? 1
      : (parseInt(r.rows[0].matricula.replace(/\D/g, ''), 10) || 0) + 1;
    const matricula = prefix + String(next).padStart(3, '0');

    await client.query('COMMIT');

    return res.json({ matricula });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

/** GET /api/users/count?role=alumno */
router.get('/users/count', async (req, res, next) => {
  try {
    const role = (req.query.role || '').toString();
    if (!role) return res.status(400).json({ ok: false, message: 'Se requiere role en query' });

    const result = await db.query(
      'SELECT COUNT(*)::int as count FROM users WHERE rol_id = (SELECT id FROM roles WHERE nombre = $1)',
      [role]
    );
    return res.json({ count: result.rows[0].count });
  } catch (err) { next(err); }
});

/** POST /api/auth/register */
router.post('/register', async (req, res, next) => {
  const body = req.body || {};
  const { nombre_completo, matricula: matriculaCliente, email, password, rol, estado } = body;

  const missing = [];
  if (!nombre_completo) missing.push('nombre_completo');
  if (!email) missing.push('email');
  if (!password) missing.push('password');
  if (!rol) missing.push('rol');
  if (!estado) missing.push('estado');
  if (missing.length > 0) return res.status(400).json({ ok: false, message: 'Datos incompletos', missing });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    

    const rolQ = await client.query('SELECT id, nombre FROM roles WHERE nombre = $1', [rol]);
    if (rolQ.rows.length === 0) { await client.query('ROLLBACK'); return res.status(400).json({ ok: false, message: 'Rol inválido' }); }
    const rol_id = rolQ.rows[0].id;
    const rol_nombre = rolQ.rows[0].nombre;


    const estadoQ = await client.query('SELECT id, nombre FROM estados_usuario WHERE nombre = $1', [estado]);
    if (estadoQ.rows.length === 0) { await client.query('ROLLBACK'); return res.status(400).json({ ok: false, message: 'Estado inválido' }); }
    const estado_id = estadoQ.rows[0].id;


    const emailQ = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailQ.rows.length > 0) { await client.query('ROLLBACK'); return res.status(409).json({ ok: false, message: 'El email ya está registrado' }); }

    // Generación de matrícula
    let finalMatricula = matriculaCliente;
    if (!finalMatricula) {
      const prefix = getPrefixFromRoleName(rol_nombre);

      const qMax = `
        SELECT matricula FROM users
        WHERE matricula LIKE $1
        ORDER BY CAST(regexp_replace(matricula, '\\D', '', 'g') AS INTEGER) DESC
        LIMIT 1 FOR UPDATE`;
      const r = await client.query(qMax, [`${prefix}%`]);
      if (r.rows.length === 0) finalMatricula = prefix + '001';
      else {
        const last = r.rows[0].matricula; const n = (parseInt(last.replace(/\D/g, ''), 10) || 0) + 1;
        finalMatricula = prefix + String(n).padStart(3, '0');
      }
    } 
    else {
      const mQ = await client.query('SELECT id FROM users WHERE matricula = $1', [finalMatricula]);
      if (mQ.rows.length > 0) { await client.query('ROLLBACK'); return res.status(409).json({ ok: false, message: 'Matrícula ya existe' }); }
    }

    // Hash de contraseña (bcrypt)
    const hashedPassword = await bcrypt.hash(password, 10);

    

    const insertSql = `
      INSERT INTO users (matricula, email, nombre_completo, password, rol_id, estado_id)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id, matricula, email, nombre_completo, rol_id, estado_id`;
    const insertVals = [finalMatricula, email, nombre_completo, hashedPassword, rol_id, estado_id];
    const insertRes = await client.query(insertSql, insertVals);

    await client.query('COMMIT');
    return res.status(201).json({ ok: true, message: 'Usuario creado', user: insertRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally { client.release(); }
});

/** POST /api/auth/login */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Email y contraseña son requeridos' });
    }

    const q = `
      SELECT u.*, r.nombre as rol_nombre, e.nombre as estado_nombre
      FROM users u
      LEFT JOIN roles r ON r.id = u.rol_id
      LEFT JOIN estados_usuario e ON e.id = u.estado_id
      WHERE u.email = $1`;
    const result = await db.query(q, [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ ok: false, message: 'Correo no registrado' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ ok: false, message: 'Contraseña incorrecta' });
    }

    // ✅ Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol_nombre || user.rol_id },
      process.env.JWT_SECRET || 'supersecreto',
      { expiresIn: '2h' } // dura 2 horas
    );

    return res.status(200).json({
      ok: true,
      message: 'Login exitoso',
      token, // 🔑 aquí el token
      usuario: {
        id: user.id,
        nombre_completo: user.nombre_completo,
        email: user.email,
        matricula: user.matricula,
        rol: user.rol_nombre || user.rol_id,
        estado: user.estado_nombre || user.estado_id
      }
    });
  } catch (err) {
    next(err);
  }
});



/** POST /api/auth/reset-password
 * Soporta dos flujos:
 *  - Por identifier (email/matricula)
 *  - Por token (recomendado para link de correo)
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { identifier, token, password } = req.body || {};
    if (!password) return res.status(400).json({ ok: false, message: 'Contraseña requerida.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    // --- Flujo por token ---
if (token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Buscar token válido
  const tq = `
    SELECT tr.user_id
    FROM tokens_reset tr
    WHERE tr.token_hash = $1
      AND tr.usado = false
      AND tr.expiracion > NOW()
    LIMIT 1`;
  const tRes = await db.query(tq, [tokenHash]);
  if (tRes.rows.length === 0) {
    return res.status(400).json({ ok: false, message: 'Token inválido o expirado.' });
  }

  const userId = tRes.rows[0].user_id;

  // ❗ Evitar reutilizar la misma contraseña
  const curQ = 'SELECT password FROM users WHERE id = $1';
  const curRes = await db.query(curQ, [userId]);
  const currentHash = curRes.rows[0]?.password || '';
  const same = await bcrypt.compare(password, currentHash);
  if (same) {
    return res.status(400).json({ ok: false, message: 'La nueva contraseña no puede ser igual a la actual.' });
  }

  // Actualizar a la nueva (hash ya calculado arriba como hashedPassword)
  await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
  await db.query('UPDATE tokens_reset SET usado = true WHERE token_hash = $1', [tokenHash]);

  // Opcional: invalidar otros tokens vigentes del mismo usuario
  await db.query(
    'UPDATE tokens_reset SET usado = true WHERE user_id = $1 AND expiracion > NOW() AND token_hash <> $2',
    [userId, tokenHash]
  );

  return res.json({ ok: true, message: 'Contraseña actualizada correctamente.' });
}


    // --- Flujo por identifier (legacy) ---
    if (!identifier) return res.status(400).json({ ok: false, message: 'Se requiere token o identifier.' });

    const q1 = 'SELECT id FROM users WHERE email = $1 OR matricula = $2 LIMIT 1';
    const r1 = await db.query(q1, [identifier, identifier]);
    if (r1.rows.length === 0) return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });

    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, r1.rows[0].id]);
    return res.json({ ok: true, message: 'Contraseña actualizada correctamente.' });
  } catch (err) { console.error('Error en reset-password:', err); next(err); }
});

/** GET /api/auth/validate-reset-token?token=... 
 *  Devuelve { ok:true } si el token está vigente; si no, 400 con mensaje.
 */
router.get('/validate-reset-token', async (req, res, next) => {
  try {
    const { token } = req.query || {};
    if (!token) {
      return res.status(400).json({ ok: false, message: 'Falta token.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const q = `
      SELECT 1
      FROM tokens_reset
      WHERE token_hash = $1
        AND usado = false
        AND expiracion > NOW()
      LIMIT 1`;
    const r = await db.query(q, [tokenHash]);

    if (r.rows.length === 0) {
      return res.status(400).json({ ok: false, message: 'Token inválido o expirado.' });
    }

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/** POST /api/auth/forgot-password
 * Genera token seguro, guarda hash+expiración y envía correo con enlace
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { identifier } = req.body || {};
    if (!identifier) return res.status(400).json({ ok:false, message: 'Se requiere correo o matrícula.' });

    const q = 'SELECT id, email FROM users WHERE email = $1 OR matricula = $2 LIMIT 1';
    const result = await db.query(q, [identifier, identifier]);
    if (result.rows.length === 0) return res.status(404).json({ ok:false, message: 'Usuario no encontrado.' });

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // ===== Expira en 10 minutos =====
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await db.query(
      'INSERT INTO tokens_reset (user_id, token_hash, expiracion, usado) VALUES ($1, $2, $3, false)',
      [user.id, tokenHash, expiresAt]
    );

    // (Opcional recomendado) invalidar tokens anteriores del mismo usuario
    await db.query(
      'UPDATE tokens_reset SET usado = true WHERE user_id = $1 AND token_hash <> $2',
      [user.id, tokenHash]
    );

    const resetLink = `${FRONTEND_BASE}/reset-password.html?token=${token}`;
    const mailOptions = {
      from: process.env.SMTP_FROM || 'no-reply@midominio.com',
      to: user.email,
      subject: 'Restablece tu contraseña',
      html: `
        <p>Hola,</p>
        <p>Recibimos una solicitud para restablecer la contraseña. Este enlace <strong>expira en 10 minutos</strong>.</p>
        <p><a href="${resetLink}">Restablecer contraseña</a></p>
        <p>Si no solicitaste esto, ignora este correo.</p>`
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ ok:true, message: 'Correo de restablecimiento enviado' });
  } catch (err) { console.error('forgot-password error:', err); next(err); }
});

/** POST /api/auth/check-password
 * Body: { identifier: string, password: string }
 * Devuelve { ok: true, same: true/false } o 404 si usuario no existe.
 */
router.post('/check-password', async (req, res, next) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) return res.status(400).json({ ok: false, message: 'Se requiere identifier y password.' });

    const q = 'SELECT password FROM users WHERE email = $1 OR matricula = $2 LIMIT 1';
    const result = await db.query(q, [identifier, identifier]);
    if (result.rows.length === 0) return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });

    const hash = result.rows[0].password;
    const same = await bcrypt.compare(password, hash);
    return res.json({ ok: true, same });
  } catch (err) { console.error('check-password error:', err); next(err); }
});

/**
 * GET /api/auth/profile?email=... | ?matricula=...
 */
router.get('/profile', async (req, res, next) => {
  try {
    const { email, matricula } = req.query || {};
    if (!email && !matricula) {
      return res.status(400).json({ ok:false, message:'Falta email o matricula' });
    }

    const q = `
      SELECT 
        u.id                AS user_id,
        u.nombre_completo   AS nombre_completo,
        u.email             AS email,
        u.matricula         AS matricula,
        u.rol_id            AS rol_id,
        r.nombre            AS rol_nombre
      FROM users u
      LEFT JOIN roles r ON r.id = u.rol_id
      WHERE 
        (($1::text IS NOT NULL) AND u.email = $1)
        OR
        (($2::text IS NOT NULL) AND u.matricula = $2)
      LIMIT 1
    `;
    const r = await db.query(q, [email || null, matricula || null]);
    if (r.rows.length === 0) {
      return res.status(404).json({ ok:false, message:'Usuario no encontrado' });
    }

    const u = r.rows[0];
    return res.json({
      ok: true,
      profile: {
        id: u.user_id,
        firstName: u.nombre_completo?.split(' ')[0] || u.nombre_completo || '',
        lastName:  u.nombre_completo?.split(' ').slice(1).join(' ') || '',
        email:     u.email,
        studentId: u.matricula
      }
    });
  } catch (err) { next(err); }
});


/** PUT /api/auth/profile
 * Body: { nombre_completo?, email?, matricula? }
 * Requiere Authorization: Bearer <token>
 * Actualiza al usuario autenticado (req.user.id)
 */
router.put('/profile', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { nombre_completo, email, matricula } = req.body || {};

    // Construir UPDATE dinámico sólo con campos presentes
    const fields = [];
    const values = [];
    let idx = 1;

    if (nombre_completo !== undefined) { fields.push(`nombre_completo = $${idx++}`); values.push(nombre_completo); }
    if (email !== undefined)          { fields.push(`email = $${idx++}`); values.push(email); }
    if (matricula !== undefined)      { fields.push(`matricula = $${idx++}`); values.push(matricula); }

    if (fields.length === 0) {
      return res.status(400).json({ ok:false, message:'Nada que actualizar' });
    }

    values.push(userId);
    const sql = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, nombre_completo, email, matricula
    `;
    const r = await db.query(sql, values);

    return res.json({ ok:true, profile: r.rows[0] });
  } catch (err) { next(err); }
});

/**
 * GET /api/students/sessions?email=... | ?matricula=...
 * Retorna un arreglo de sesiones con el formato que espera alumnos.js
 */
router.get('/sessions', async (req, res, next) => {
  try {
    const { email, matricula } = req.query || {};
    if (!email && !matricula) {
      return res.json([]); // vacío por ahora si no se pasa nada
    }

    // Si NO tienes tabla de sesiones aún, devuelve demo:
    // return res.json([]);

    // Si SÍ tienes tabla (ejemplo de consulta; ajusta nombres reales):
    // const q = `
    //   SELECT s.id, s.titulo, s.fecha, s.hora, s.duracion_min,
    //          s.modalidad, s.enlace, s.ubicacion, s.estado, t.nombre_completo AS tutor_nombre
    //   FROM sessions s
    //   JOIN users est ON est.id = s.student_id
    //   JOIN users t ON t.id = s.tutor_id
    //   WHERE ($1::text IS NOT NULL AND est.email = $1) OR ($2::text IS NOT NULL AND est.matricula = $2)
    //   ORDER BY s.fecha, s.hora
    // `;
    // const r = await db.query(q, [email || null, matricula || null]);

    // // Mapea al formato que usa tu frontend:
    // const out = r.rows.map(x => ({
    //   id: x.id,
    //   title: x.titulo || 'Tutoría',
    //   tutor: x.tutor_nombre || '',
    //   modality: x.modalidad || 'presencial',
    //   date: x.fecha,                              // ISO date string
    //   time: x.hora,                               // HH:mm
    //   duration: `${x.duracion_min || 60} min`,
    //   link: x.enlace || '',
    //   location: x.ubicacion || '',
    //   status: mapEstado(x.estado),                // 'accepted' | 'postponed' | 'rejected' | ...
    //   rating: 0,
    //   objective: '',
    //   reschedules: 0,
    //   policy: ''
    // }));

    // Por ahora, sin tabla: demo vacío:
    const out = [];
    return res.json(out);
  } catch (err) {
    next(err);
  }
});

function mapEstado(estado) {
  // Ajusta si tu BD guarda 'aceptada', 'pendiente', etc.
  const m = {
    aceptada: 'accepted',
    pospuesta: 'postponed',
    rechazada: 'rejected',
    cancelada: 'cancelled',
    pendiente: 'pending',
    confirmada: 'confirmed'
  };
  return m[estado?.toLowerCase()] || 'pending';
}


/**
 * GET /api/tutors
 * Lista simple de tutores (rol = tutor)
 */
router.get('/', async (req, res, next) => {
  try {
    const q = `
      SELECT u.id, u.nombre_completo, u.email
      FROM users u
      JOIN roles r ON r.id = u.rol_id
      WHERE LOWER(r.nombre) LIKE '%tutor%'
      ORDER BY u.nombre_completo
    `;
    const r = await db.query(q);
    const out = r.rows.map(t => ({
      id: t.id,
      name: t.nombre_completo,
      specialty: 'Apoyo General',
      rating: null,
      reviewsCount: 0,
      available: true,
      nextAvailable: '',
      modalities: ['Presencial', 'Virtual'],
      price: null
    }));
    res.json(out);
  } catch (err) { next(err); }
});

/**
 * GET /api/tutors/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const q = `
      SELECT u.id, u.nombre_completo, u.email
      FROM users u
      WHERE u.id = $1
      LIMIT 1
    `;
    const r = await db.query(q, [id]);
    if (r.rows.length === 0) return res.status(404).json({ ok:false, message:'Tutor no encontrado' });

    const t = r.rows[0];
    res.json({
      id: t.id,
      name: t.nombre_completo,
      specialty: 'Apoyo General',
      rating: null,
      reviewsCount: 0,
      education: '',
      experience: '',
      specialties: [],
      availability: '',
      pricing: ''
    });
  } catch (err) { next(err); }
});

// GET /api/auth/profile?email=...
router.get('/profile', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ ok:false, message:'Email requerido' });

    // TODO: reemplaza por tu consulta real a DB
    // Ejemplo mock:
    const user = await findUserByEmail(email); // tu función real
    if (!user) return res.status(404).json({ ok:false, message:'Usuario no encontrado' });

    return res.json({
      ok: true,
      profile: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        studentId: user.studentId
      }
    });
  } catch (err) {
    console.error('profile error:', err);
    res.status(500).json({ ok:false, message:'Error interno' });
  }
});

// RUTA TEMPORAL PARA TESTING - ELIMINAR EN PRODUCCIÓN
router.post('/test-admin-token', async (req, res) => {
  try {
    // Buscar un usuario admin en la BD
    const adminUser = await db.query(
      'SELECT id, email, nombre_completo FROM users WHERE rol_id = (SELECT id FROM roles WHERE nombre = \'admin\') LIMIT 1'
    );
    
    if (adminUser.rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        message: 'No hay usuarios admin en la base de datos. Crea uno primero.' 
      });
    }
    
    const user = adminUser.rows[0];
    
    // Crear token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        rol: 'admin',
        nombre: user.nombre_completo
      },
      process.env.JWT_SECRET || 'supersecreto',
      { expiresIn: '24h' }
    );
    
    res.json({
      ok: true,
      message: 'Token de admin generado para testing',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre_completo,
        rol: 'admin'
      }
    });
    
  } catch (error) {
    console.error('Error generando token de admin:', error);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
});

// Ruta para cambiar contraseña
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, targetUserId } = req.body;
    const authenticatedUserId = req.user.id;
    const authenticatedUserRole = req.user.rol;

    if (!newPassword) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Nueva contraseña es requerida' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        ok: false, 
        message: 'La nueva contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Determinar el usuario objetivo
    let targetUserIdToUse = authenticatedUserId;
    
    // Si es admin y se proporciona targetUserId, permitir cambiar contraseña de otros usuarios
    if (authenticatedUserRole === 'admin' && targetUserId) {
      targetUserIdToUse = targetUserId;
    } else if (authenticatedUserRole !== 'admin' && targetUserId) {
      // Solo admins pueden cambiar contraseñas de otros usuarios
      return res.status(403).json({ 
        ok: false, 
        message: 'No tienes permisos para cambiar contraseñas de otros usuarios' 
      });
    }

    // Si es el propio usuario, verificar contraseña actual
    if (targetUserIdToUse === authenticatedUserId) {
      if (!currentPassword) {
        return res.status(400).json({ 
          ok: false, 
          message: 'Contraseña actual es requerida' 
        });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({ 
          ok: false, 
          message: 'La nueva contraseña debe ser diferente a la contraseña actual' 
        });
      }

      // Obtener usuario actual
      const userResult = await db.query('SELECT password FROM users WHERE id = $1', [authenticatedUserId]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ 
          ok: false, 
          message: 'Usuario no encontrado' 
        });
      }

      const user = userResult.rows[0];

      // Verificar contraseña actual
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ 
          ok: false, 
          message: 'La contraseña actual es incorrecta' 
        });
      }
    }

    // Hashear nueva contraseña
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña en la base de datos
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, targetUserIdToUse]);

    res.json({ 
      ok: true, 
      message: 'Contraseña cambiada exitosamente' 
    });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ 
      ok: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// RUTA TEMPORAL PARA RESETEAR CONTRASEÑA DE ADMIN - ELIMINAR EN PRODUCCIÓN
router.post('/reset-admin-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Email y nueva contraseña son requeridos' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        ok: false, 
        message: 'La nueva contraseña debe tener al menos 6 caracteres' 
      });
    }
    
    // Buscar usuario por email
    const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
    // Hashear nueva contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Actualizar contraseña
    await db.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
    
    res.json({ 
      ok: true, 
      message: `Contraseña reseteada exitosamente para ${email}. Nueva contraseña: ${newPassword}` 
    });
    
  } catch (error) {
    console.error('Error reseteando contraseña:', error);
    res.status(500).json({ 
      ok: false, 
      message: 'Error interno del servidor' 
    });
  }
});

module.exports = router;







