const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware de autenticación
function verifyToken(req, res, next) {
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  if (!token) return res.status(401).json({ ok: false, message: 'Token requerido' });

  try {
    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecreto');
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, message: 'Token inválido' });
  }
}

// Middleware para verificar que es administrador
function verifyAdmin(req, res, next) {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Acceso denegado. Solo administradores.' });
  }
  next();
}

// ===============================================
// RUTAS DE GESTIÓN DE USUARIOS
// ===============================================

/**
 * GET /api/admin/usuarios
 * Obtiene todos los usuarios del sistema
 */
router.get('/usuarios', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { rol, estado, page = 1, limit = 10 } = req.query;
    
    let whereClause = '';
    const params = [];
    let paramIndex = 1;
    
    // Por defecto, solo mostrar usuarios activos
    if (!estado) {
      whereClause += ` AND e.nombre = $${paramIndex}`;
      params.push('activo');
      paramIndex++;
    }
    
    if (rol) {
      whereClause += ` AND r.nombre = $${paramIndex}`;
      params.push(rol);
      paramIndex++;
    }
    
    if (estado) {
      whereClause += ` AND e.nombre = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }
    
    const query = `
      SELECT 
        u.id,
        u.matricula,
        u.email,
        u.nombre_completo,
        u.creado_en,
        r.nombre as rol_nombre,
        e.nombre as estado_nombre
      FROM users u
      LEFT JOIN roles r ON r.id = u.rol_id
      LEFT JOIN estados_usuario e ON e.id = u.estado_id
      WHERE 1=1 ${whereClause}
      ORDER BY u.creado_en DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await db.query(query, params);
    
    // Contar total para paginación
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN roles r ON r.id = u.rol_id
      LEFT JOIN estados_usuario e ON e.id = u.estado_id
      WHERE 1=1 ${whereClause}
    `;
    const countResult = await db.query(countQuery, params.slice(0, -2));
    
    res.json({
      usuarios: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/usuarios/:id
 * Obtiene un usuario específico
 */
router.get('/usuarios/:id', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    const query = `
      SELECT 
        u.id,
        u.matricula,
        u.email,
        u.nombre_completo,
        u.creado_en,
        r.nombre as rol_nombre,
        e.nombre as estado_nombre
      FROM users u
      LEFT JOIN roles r ON r.id = u.rol_id
      LEFT JOIN estados_usuario e ON e.id = u.estado_id
      WHERE u.id = $1
    `;
    
    const result = await db.query(query, [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/admin/usuarios/:id
 * Actualiza un usuario completo
 */
router.put('/usuarios/:id', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { nombre_completo, email, estado } = req.body;
    
    if (!nombre_completo || !email) {
      return res.status(400).json({ ok: false, message: 'Nombre completo y email son requeridos' });
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ ok: false, message: 'Email inválido' });
    }
    
    // Verificar si el email ya existe en otro usuario
    const emailCheck = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ ok: false, message: 'El email ya está en uso por otro usuario' });
    }
    
    // Obtener ID del estado si se proporciona
    let estadoId = null;
    if (estado) {
      const estadoQuery = 'SELECT id FROM estados_usuario WHERE nombre = $1';
      const estadoResult = await db.query(estadoQuery, [estado]);
      if (estadoResult.rows.length === 0) {
        return res.status(400).json({ ok: false, message: 'Estado inválido' });
      }
      estadoId = estadoResult.rows[0].id;
    }
    
    // Construir query de actualización
    let updateQuery = 'UPDATE users SET nombre_completo = $1, email = $2';
    const params = [nombre_completo, email];
    let paramIndex = 3;
    
    if (estadoId) {
      updateQuery += `, estado_id = $${paramIndex}`;
      params.push(estadoId);
      paramIndex++;
    }
    
    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(userId);
    
    const result = await db.query(updateQuery, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }
    
    res.json({ 
      ok: true, 
      message: 'Usuario actualizado exitosamente',
      usuario: result.rows[0]
    });
    
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/admin/usuarios/:id/estado
 * Cambia el estado de un usuario
 */
router.put('/usuarios/:id/estado', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { estado } = req.body;
    
    if (!estado) {
      return res.status(400).json({ ok: false, message: 'Estado requerido' });
    }
    
    // Obtener ID del estado
    const estadoQuery = 'SELECT id FROM estados_usuario WHERE nombre = $1';
    const estadoResult = await db.query(estadoQuery, [estado]);
    if (estadoResult.rows.length === 0) {
      return res.status(400).json({ ok: false, message: 'Estado inválido' });
    }
    const estadoId = estadoResult.rows[0].id;
    
    const updateQuery = `
      UPDATE users 
      SET estado_id = $1
      WHERE id = $2
      RETURNING id, estado_id
    `;
    
    const updateResult = await db.query(updateQuery, [estadoId, userId]);
    
    res.json({
      ok: true,
      message: `Estado del usuario cambiado a ${estado}`,
      usuario: updateResult.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/usuarios/:id
 * Elimina un usuario permanentemente de la base de datos
 */
router.delete('/usuarios/:id', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // Verificar que el usuario existe
    const userCheck = await db.query('SELECT id, email, nombre_completo FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const user = userCheck.rows[0];
    
    // Eliminar relaciones dependientes primero (si las hay)
    // Eliminar sesiones donde el usuario es estudiante o tutor
    await db.query('DELETE FROM sesiones WHERE estudiante_id = $1 OR tutor_id = $1', [userId]);
    
    // Eliminar disponibilidades del tutor
    await db.query('DELETE FROM disponibilidades WHERE tutor_id = $1', [userId]);
    
    // Eliminar relaciones tutor-materia
    await db.query('DELETE FROM tutor_materia WHERE tutor_id = $1', [userId]);
    
    // Eliminar valoraciones de sesiones del usuario
    await db.query(`
      DELETE FROM valoraciones 
      WHERE sesion_id IN (
        SELECT id FROM sesiones WHERE estudiante_id = $1 OR tutor_id = $1
      )
    `, [userId]);
    
    // Eliminar tokens de reset del usuario
    await db.query('DELETE FROM tokens_reset WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
    
    // Finalmente, eliminar el usuario
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    
    res.json({
      ok: true,
      message: `Usuario ${user.nombre_completo} (${user.email}) eliminado permanentemente de la base de datos`
    });
    
  } catch (err) {
    console.error('Error eliminando usuario:', err);
    next(err);
  }
});

// ===============================================
// RUTAS DE GESTIÓN DE MATERIAS
// ===============================================

/**
 * GET /api/admin/materias
 * Obtiene todas las materias
 */
router.get('/materias', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const query = `
      SELECT 
        m.id,
        m.clave,
        m.nombre,
        m.estado_id,
        m.tutor_id,
        e.nombre as estado_nombre,
        u.nombre_completo as tutor_nombre,
        u.email as tutor_email,
        COUNT(tm.tutor_id) as tutores_asignados
      FROM materias m
      LEFT JOIN estados_materia e ON e.id = m.estado_id
      LEFT JOIN users u ON u.id = m.tutor_id
      LEFT JOIN tutor_materia tm ON tm.materia_id = m.id
      GROUP BY m.id, m.clave, m.nombre, m.estado_id, m.tutor_id, e.nombre, u.nombre_completo, u.email
      ORDER BY m.nombre
    `;
    
    const result = await db.query(query);
    res.json({ ok: true, materias: result.rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/tutores
 * Obtiene todos los tutores disponibles
 */
router.get('/tutores', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.nombre_completo,
        u.email,
        u.matricula
      FROM users u
      JOIN roles r ON u.rol_id = r.id
      WHERE r.nombre = 'tutor' AND u.estado_id = (
        SELECT id FROM estados_usuario WHERE nombre = 'activo'
      )
      ORDER BY u.nombre_completo
    `;
    
    const result = await db.query(query);
    res.json({ ok: true, tutores: result.rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/sesiones
 * Obtiene todas las sesiones con información completa
 */
router.get('/sesiones', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const query = `
      SELECT 
        s.id,
        s.fecha,
        s.hora_inicio,
        s.hora_fin,
        s.creado_en,
        -- Información del alumno
        a.nombre_completo as alumno_nombre,
        a.email as alumno_email,
        a.matricula as alumno_matricula,
        -- Información del tutor
        t.nombre_completo as tutor_nombre,
        t.email as tutor_email,
        t.matricula as tutor_matricula,
        -- Información de la materia
        m.nombre as materia_nombre,
        m.clave as materia_clave,
        -- Información de modalidad
        mod.nombre as modalidad_nombre,
        -- Información de estado
        es.nombre as estado_nombre,
        -- Información de motivo de cancelación
        mc.nombre as motivo_cancelacion_nombre,
        mc.comentario as motivo_cancelacion_comentario
      FROM sesiones s
      LEFT JOIN users a ON s.estudiante_id = a.id
      LEFT JOIN users t ON s.tutor_id = t.id
      LEFT JOIN materias m ON s.materia_id = m.id
      LEFT JOIN modalidades mod ON s.modalidad_id = mod.id
      LEFT JOIN estados_sesion es ON s.estado_id = es.id
      LEFT JOIN motivos_cancelacion mc ON s.motivo_cancelacion_id = mc.id
      ORDER BY s.fecha DESC, s.hora_inicio DESC
    `;
    
    const result = await db.query(query);
    res.json({ ok: true, sesiones: result.rows });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/admin/sesiones/:id
 * Actualiza una sesión específica
 */
router.put('/sesiones/:id', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const sesionId = req.params.id;
    const { modalidad_id, estado_id, motivo_cancelacion_id } = req.body;
    
    // Construir query de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (modalidad_id !== undefined) {
      updates.push(`modalidad_id = $${paramCount}`);
      values.push(modalidad_id);
      paramCount++;
    }
    
    if (estado_id !== undefined) {
      updates.push(`estado_id = $${paramCount}`);
      values.push(estado_id);
      paramCount++;
    }
    
    if (motivo_cancelacion_id !== undefined) {
      updates.push(`motivo_cancelacion_id = $${paramCount}`);
      values.push(motivo_cancelacion_id);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        message: 'No se proporcionaron campos para actualizar' 
      });
    }
    
    values.push(sesionId);
    
    const query = `
      UPDATE sesiones 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, modalidad_id, estado_id, motivo_cancelacion_id
    `;
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Sesión no encontrada' 
      });
    }
    
    res.json({ 
      ok: true, 
      message: 'Sesión actualizada exitosamente',
      sesion: result.rows[0]
    });
    
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/estadisticas
 * Obtiene estadísticas del sistema para el dashboard
 */
router.get('/estadisticas', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    // Obtener estadísticas de materias
    const materiasQuery = `
      SELECT COUNT(*) as total_materias
      FROM materias m
      JOIN estados_materia e ON m.estado_id = e.id
      WHERE e.nombre = 'activo'
    `;
    
    // Obtener estadísticas de usuarios
    const usuariosQuery = `
      SELECT 
        COUNT(*) as total_usuarios,
        COUNT(CASE WHEN r.nombre = 'tutor' THEN 1 END) as tutores_activos,
        COUNT(CASE WHEN r.nombre = 'alumno' THEN 1 END) as estudiantes_activos
      FROM users u
      JOIN roles r ON u.rol_id = r.id
      JOIN estados_usuario eu ON u.estado_id = eu.id
      WHERE eu.nombre = 'activo'
    `;
    
    // Obtener estadísticas de sesiones
    const sesionesQuery = `
      SELECT 
        COUNT(*) as sesiones_hoy,
        COUNT(CASE WHEN DATE(s.fecha) = CURRENT_DATE THEN 1 END) as sesiones_hoy_real,
        COUNT(CASE WHEN DATE_TRUNC('month', s.fecha) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as sesiones_mes
      FROM sesiones s
      WHERE DATE(s.fecha) = CURRENT_DATE
    `;
    
    // Obtener estadísticas de sesiones del mes
    const sesionesMesQuery = `
      SELECT COUNT(*) as sesiones_mes_real
      FROM sesiones s
      WHERE DATE_TRUNC('month', s.fecha) = DATE_TRUNC('month', CURRENT_DATE)
    `;
    
    // Ejecutar todas las consultas
    const [materiasResult, usuariosResult, sesionesResult, sesionesMesResult] = await Promise.all([
      db.query(materiasQuery),
      db.query(usuariosQuery),
      db.query(sesionesQuery),
      db.query(sesionesMesQuery)
    ]);
    
    // Calcular promedio de asistencia (sesiones realizadas vs totales)
    const asistenciaQuery = `
      SELECT 
        COUNT(*) as total_sesiones,
        COUNT(CASE WHEN es.nombre = 'realizada' THEN 1 END) as sesiones_realizadas
      FROM sesiones s
      JOIN estados_sesion es ON s.estado_id = es.id
      WHERE s.fecha >= CURRENT_DATE - INTERVAL '30 days'
    `;
    
    const asistenciaResult = await db.query(asistenciaQuery);
    
    // Calcular promedio de asistencia
    const totalSesiones = parseInt(asistenciaResult.rows[0].total_sesiones) || 0;
    const sesionesRealizadas = parseInt(asistenciaResult.rows[0].sesiones_realizadas) || 0;
    const promedioAsistencia = totalSesiones > 0 ? Math.round((sesionesRealizadas / totalSesiones) * 100) : 0;
    
    // Preparar respuesta
    const estadisticas = {
      totalMaterias: parseInt(materiasResult.rows[0].total_materias) || 0,
      totalUsuarios: parseInt(usuariosResult.rows[0].total_usuarios) || 0,
      sesionesHoy: parseInt(sesionesResult.rows[0].sesiones_hoy_real) || 0,
      alertasPendientes: 0, // Por ahora siempre 0, se puede implementar lógica específica
      tutoresActivos: parseInt(usuariosResult.rows[0].tutores_activos) || 0,
      estudiantesActivos: parseInt(usuariosResult.rows[0].estudiantes_activos) || 0,
      sesionesMes: parseInt(sesionesMesResult.rows[0].sesiones_mes_real) || 0,
      promedioAsistencia: promedioAsistencia
    };
    
    res.json({ 
      ok: true, 
      estadisticas: estadisticas 
    });
    
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/materias/:id
 * Obtiene una materia específica por ID
 */
router.get('/materias/:id', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const materiaId = req.params.id;
    
    const query = `
      SELECT 
        m.id,
        m.clave,
        m.nombre,
        m.estado_id,
        m.tutor_id,
        e.nombre as estado_nombre,
        u.nombre_completo as tutor_nombre,
        u.email as tutor_email
      FROM materias m
      LEFT JOIN estados_materia e ON e.id = m.estado_id
      LEFT JOIN users u ON u.id = m.tutor_id
      WHERE m.id = $1
    `;
    
    const result = await db.query(query, [materiaId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Materia no encontrada' 
      });
    }
    
    res.json({ 
      ok: true, 
      materia: result.rows[0] 
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/materias
 * Crea una nueva materia
 */
router.post('/materias', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { clave, nombre, estado, tutor_id } = req.body;
    
    if (!clave || !nombre) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Clave y nombre son requeridos' 
      });
    }
    
    // Verificar si ya existe una materia con la misma clave
    const claveExists = await db.query('SELECT id FROM materias WHERE clave = $1', [clave]);
    if (claveExists.rows.length > 0) {
      return res.status(400).json({
        ok: false,
        message: `Ya existe una materia con la clave "${clave}". Por favor, usa una clave diferente.`
      });
    }
    
    // Verificar si ya existe una materia con el mismo nombre Y tutor
    if (tutor_id) {
      const materiaTutorExists = await db.query('SELECT id FROM materias WHERE nombre = $1 AND tutor_id = $2', [nombre, tutor_id]);
      if (materiaTutorExists.rows.length > 0) {
        return res.status(400).json({
          ok: false,
          message: `Ya existe una materia con el nombre "${nombre}" asignada a este tutor. Un tutor no puede tener la misma materia dos veces.`
        });
      }
    }
    
    // Obtener ID del estado (por defecto "activo" si no se especifica)
    const estadoNombre = estado || 'activo';
    const estadoQuery = 'SELECT id FROM estados_materia WHERE nombre = $1';
    const estadoResult = await db.query(estadoQuery, [estadoNombre]);
    
    if (estadoResult.rows.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Estado inválido' 
      });
    }
    
    const estadoId = estadoResult.rows[0].id;
    
    const insertQuery = `
      INSERT INTO materias (clave, nombre, estado_id, tutor_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, clave, nombre, estado_id, tutor_id
    `;
    
    const insertResult = await db.query(insertQuery, [clave, nombre, estadoId, tutor_id || null]);
    
    res.status(201).json({
      ok: true,
      message: 'Materia creada exitosamente',
      materia: insertResult.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/admin/materias/:id
 * Actualiza una materia
 */
router.put('/materias/:id', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const materiaId = req.params.id;
    const { clave, nombre, estado, tutor_id } = req.body;
    
    // Verificar si la materia existe
    const materiaExists = await db.query('SELECT id FROM materias WHERE id = $1', [materiaId]);
    if (materiaExists.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Materia no encontrada'
      });
    }
    
    // Verificar duplicados solo si se están cambiando clave o nombre
    if (clave !== undefined) {
      const claveExists = await db.query('SELECT id FROM materias WHERE clave = $1 AND id != $2', [clave, materiaId]);
      if (claveExists.rows.length > 0) {
        return res.status(400).json({
          ok: false,
          message: `Ya existe una materia con la clave "${clave}". Por favor, usa una clave diferente.`
        });
      }
    }
    
    // Verificar duplicado de nombre + tutor solo si se están cambiando ambos
    if (nombre !== undefined && tutor_id !== undefined) {
      const materiaTutorExists = await db.query('SELECT id FROM materias WHERE nombre = $1 AND tutor_id = $2 AND id != $3', [nombre, tutor_id, materiaId]);
      if (materiaTutorExists.rows.length > 0) {
        return res.status(400).json({
          ok: false,
          message: `Ya existe una materia con el nombre "${nombre}" asignada a este tutor. Un tutor no puede tener la misma materia dos veces.`
        });
      }
    }
    
    // Construir UPDATE dinámico
    const fields = [];
    const values = [];
    let idx = 1;
    
    if (clave !== undefined) { fields.push(`clave = $${idx++}`); values.push(clave); }
    if (nombre !== undefined) { fields.push(`nombre = $${idx++}`); values.push(nombre); }
    if (tutor_id !== undefined) { fields.push(`tutor_id = $${idx++}`); values.push(tutor_id || null); }
    if (estado !== undefined) {
      const estadoQuery = 'SELECT id FROM estados_materia WHERE nombre = $1';
      const estadoResult = await db.query(estadoQuery, [estado]);
      if (estadoResult.rows.length === 0) {
        return res.status(400).json({ ok: false, message: 'Estado inválido' });
      }
      fields.push(`estado_id = $${idx++}`);
      values.push(estadoResult.rows[0].id);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ ok: false, message: 'Nada que actualizar' });
    }
    
    values.push(materiaId);
    const updateQuery = `
      UPDATE materias 
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, clave, nombre, estado_id, tutor_id
    `;
    
    const updateResult = await db.query(updateQuery, values);
    
    res.json({
      ok: true,
      message: 'Materia actualizada exitosamente',
      materia: updateResult.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/materias/:id
 * Elimina una materia específica
 */
router.delete('/materias/:id', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const materiaId = req.params.id;
    
    // Verificar que la materia existe
    const checkQuery = 'SELECT id, clave, nombre FROM materias WHERE id = $1';
    const checkResult = await db.query(checkQuery, [materiaId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Materia no encontrada' 
      });
    }
    
    const materia = checkResult.rows[0];
    
    // Eliminar relaciones dependientes primero
    // Eliminar relaciones tutor-materia
    await db.query('DELETE FROM tutor_materia WHERE materia_id = $1', [materiaId]);
    
    // Eliminar sesiones relacionadas con esta materia
    await db.query('DELETE FROM sesiones WHERE materia_id = $1', [materiaId]);
    
    // Finalmente, eliminar la materia
    await db.query('DELETE FROM materias WHERE id = $1', [materiaId]);
    
    res.json({
      ok: true,
      message: `Materia "${materia.nombre}" (${materia.clave}) eliminada exitosamente`
    });
  } catch (err) {
    next(err);
  }
});

// ===============================================
// RUTAS DE GESTIÓN DE SESIONES
// ===============================================

/**
 * GET /api/admin/sesiones
 * Obtiene todas las sesiones del sistema
 */
router.get('/sesiones', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { estado, fecha_desde, fecha_hasta, page = 1, limit = 10 } = req.query;
    
    let whereClause = '';
    const params = [];
    let paramIndex = 1;
    
    if (estado) {
      whereClause += ` AND es.nombre = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }
    
    if (fecha_desde) {
      whereClause += ` AND s.fecha >= $${paramIndex}`;
      params.push(fecha_desde);
      paramIndex++;
    }
    
    if (fecha_hasta) {
      whereClause += ` AND s.fecha <= $${paramIndex}`;
      params.push(fecha_hasta);
      paramIndex++;
    }
    
    const query = `
      SELECT 
        s.id,
        s.fecha,
        s.hora_inicio,
        s.hora_fin,
        s.ubicacion_o_enlace,
        s.creado_en,
        e.nombre_completo as estudiante_nombre,
        e.matricula as estudiante_matricula,
        t.nombre_completo as tutor_nombre,
        m.nombre as materia_nombre,
        mod.nombre as modalidad_nombre,
        es.nombre as estado_nombre
      FROM sesiones s
      JOIN users e ON e.id = s.estudiante_id
      JOIN users t ON t.id = s.tutor_id
      JOIN materias m ON m.id = s.materia_id
      LEFT JOIN modalidades mod ON mod.id = s.modalidad_id
      LEFT JOIN estados_sesion es ON es.id = s.estado_id
      WHERE 1=1 ${whereClause}
      ORDER BY s.fecha DESC, s.hora_inicio DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await db.query(query, params);
    
    // Contar total para paginación
    const countQuery = `
      SELECT COUNT(*) as total
      FROM sesiones s
      LEFT JOIN estados_sesion es ON es.id = s.estado_id
      WHERE 1=1 ${whereClause}
    `;
    const countResult = await db.query(countQuery, params.slice(0, -2));
    
    res.json({
      sesiones: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
});

// ===============================================
// RUTAS DE ESTADÍSTICAS DEL SISTEMA
// ===============================================

/**
 * GET /api/admin/estadisticas
 * Obtiene estadísticas generales del sistema
 */
router.get('/estadisticas', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    // Usuarios por rol
    const usuariosQuery = `
      SELECT r.nombre as rol, COUNT(*) as total
      FROM users u
      LEFT JOIN roles r ON r.id = u.rol_id
      GROUP BY r.nombre
    `;
    const usuariosResult = await db.query(usuariosQuery);
    
    // Sesiones por estado
    const sesionesQuery = `
      SELECT es.nombre as estado, COUNT(*) as total
      FROM sesiones s
      LEFT JOIN estados_sesion es ON es.id = s.estado_id
      GROUP BY es.nombre
    `;
    const sesionesResult = await db.query(sesionesQuery);
    
    // Materias activas
    const materiasQuery = `
      SELECT COUNT(*) as total_materias
      FROM materias m
      JOIN estados_materia e ON e.id = m.estado_id
      WHERE e.nombre = 'activo'
    `;
    const materiasResult = await db.query(materiasQuery);
    
    // Valoraciones promedio
    const valoracionesQuery = `
      SELECT AVG(estrellas) as promedio_general, COUNT(*) as total_valoraciones
      FROM valoraciones
    `;
    const valoracionesResult = await db.query(valoracionesQuery);
    
    // Sesiones del mes actual
    const mesActualQuery = `
      SELECT COUNT(*) as sesiones_mes_actual
      FROM sesiones
      WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)
    `;
    const mesActualResult = await db.query(mesActualQuery);
    
    const estadisticas = {
      usuarios_por_rol: usuariosResult.rows,
      sesiones_por_estado: sesionesResult.rows,
      total_materias: parseInt(materiasResult.rows[0].total_materias || 0),
      promedio_valoraciones: parseFloat(valoracionesResult.rows[0].promedio_general || 0),
      total_valoraciones: parseInt(valoracionesResult.rows[0].total_valoraciones || 0),
      sesiones_mes_actual: parseInt(mesActualResult.rows[0].sesiones_mes_actual || 0)
    };
    
    res.json(estadisticas);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/actividad-reciente
 * Obtiene actividad reciente del sistema
 */
router.get('/actividad-reciente', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const query = `
      SELECT 
        'sesion' as tipo,
        s.id,
        s.creado_en,
        CONCAT('Nueva sesión: ', e.nombre_completo, ' - ', t.nombre_completo) as descripcion
      FROM sesiones s
      JOIN users e ON e.id = s.estudiante_id
      JOIN users t ON t.id = s.tutor_id
      WHERE s.creado_en >= NOW() - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        'valoracion' as tipo,
        v.id,
        v.creado_en,
        CONCAT('Nueva valoración: ', v.estrellas, ' estrellas') as descripcion
      FROM valoraciones v
      WHERE v.creado_en >= NOW() - INTERVAL '7 days'
      
      ORDER BY creado_en DESC
      LIMIT 20
    `;
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/usuarios
 * Crea un nuevo usuario
 */
router.post('/usuarios', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { nombre_completo, email, password, rol_id, estado } = req.body;
    
    // Validaciones
    if (!nombre_completo || !email || !password || !rol_id || !estado) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Todos los campos son requeridos' 
      });
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ ok: false, message: 'Email inválido' });
    }
    
    // Validar contraseña
    if (password.length < 6) {
      return res.status(400).json({ 
        ok: false, 
        message: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }
    
    // Verificar si el email ya existe (exacto)
    const emailCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ 
        ok: false, 
        message: 'El email ya está en uso' 
      });
    }
    
    // Verificar si existe un email muy similar (mismo nombre de usuario, diferente dominio)
    const emailParts = email.split('@');
    if (emailParts.length === 2) {
      const username = emailParts[0];
      const domain = emailParts[1];
      
      // Buscar emails con el mismo nombre de usuario pero diferente dominio
      const similarEmailCheck = await db.query(
        'SELECT email FROM users WHERE email LIKE $1 AND email != $2', 
        [`${username}@%`, email]
      );
      
      if (similarEmailCheck.rows.length > 0) {
        const existingEmail = similarEmailCheck.rows[0].email;
        return res.status(400).json({ 
          ok: false, 
          message: `Ya existe un usuario con un email similar: ${existingEmail}` 
        });
      }
    }
    
    // Obtener ID del rol
    const rolQuery = 'SELECT id FROM roles WHERE nombre = $1';
    const rolResult = await db.query(rolQuery, [rol_id]);
    if (rolResult.rows.length === 0) {
      return res.status(400).json({ ok: false, message: 'Rol inválido' });
    }
    const rolId = rolResult.rows[0].id;
    
    // Obtener ID del estado
    const estadoQuery = 'SELECT id FROM estados_usuario WHERE nombre = $1';
    const estadoResult = await db.query(estadoQuery, [estado]);
    if (estadoResult.rows.length === 0) {
      return res.status(400).json({ ok: false, message: 'Estado inválido' });
    }
    const estadoId = estadoResult.rows[0].id;
    
    // Generar matrícula automáticamente según el rol
    const matricula = await generarMatricula(rol_id);
    
    // Hashear contraseña
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insertar usuario
    const insertQuery = `
      INSERT INTO users (matricula, email, nombre_completo, password, rol_id, estado_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, matricula, email, nombre_completo, rol_id, estado_id, creado_en
    `;
    
    const result = await db.query(insertQuery, [
      matricula,
      email,
      nombre_completo,
      hashedPassword,
      rolId,
      estadoId
    ]);
    
    const nuevoUsuario = result.rows[0];
    
    res.status(201).json({
      ok: true,
      message: 'Usuario creado exitosamente',
      usuario: nuevoUsuario
    });
    
  } catch (err) {
    next(err);
  }
});

/**
 * Función para generar matrícula automáticamente
 */
async function generarMatricula(rolNombre) {
  try {
    // Obtener el último número de matrícula para este rol
    const query = `
      SELECT matricula FROM users u
      JOIN roles r ON r.id = u.rol_id
      WHERE r.nombre = $1
      ORDER BY matricula DESC
      LIMIT 1
    `;
    
    const result = await db.query(query, [rolNombre]);
    
    let siguienteNumero = 1;
    
    if (result.rows.length > 0) {
      const ultimaMatricula = result.rows[0].matricula;
      // Extraer el número de la matrícula (ej: "T001" -> 1)
      const numeroMatch = ultimaMatricula.match(/\d+/);
      if (numeroMatch) {
        siguienteNumero = parseInt(numeroMatch[0]) + 1;
      }
    }
    
    // Generar prefijo según el rol
    const prefijos = {
      'alumno': 'A',
      'tutor': 'T', 
      'admin': 'AD'
    };
    
    const prefijo = prefijos[rolNombre] || 'U';
    const numeroFormateado = siguienteNumero.toString().padStart(3, '0');
    
    return `${prefijo}${numeroFormateado}`;
    
  } catch (error) {
    console.error('Error generando matrícula:', error);
    // Fallback: generar matrícula con timestamp
    const timestamp = Date.now().toString().slice(-6);
    return `U${timestamp}`;
  }
}

module.exports = router;
