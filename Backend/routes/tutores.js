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

// Middleware para verificar que es tutor
function verifyTutor(req, res, next) {
  if (req.user.rol !== 'tutor') {
    return res.status(403).json({ ok: false, message: 'Acceso denegado. Solo tutores.' });
  }
  next();
}

// ===============================================
// RUTAS DE SESIONES DEL TUTOR
// ===============================================

/**
 * GET /api/tutores/sesiones
 * Obtiene todas las sesiones del tutor logueado
 */
router.get('/sesiones', verifyToken, verifyTutor, async (req, res, next) => {
  try {
    const tutorId = req.user.id;
    
    const query = `
      SELECT 
        s.id,
        s.fecha,
        s.hora_inicio,
        s.hora_fin,
        s.ubicacion_o_enlace,
        s.creado_en,
        e.nombre_completo as estudiante_nombre,
        e.email as estudiante_email,
        e.matricula as estudiante_matricula,
        m.nombre as materia_nombre,
        m.clave as materia_clave,
        mod.nombre as modalidad_nombre,
        es.nombre as estado_nombre,
        mc.nombre as motivo_cancelacion
      FROM sesiones s
      JOIN users e ON e.id = s.estudiante_id
      JOIN materias m ON m.id = s.materia_id
      LEFT JOIN modalidades mod ON mod.id = s.modalidad_id
      LEFT JOIN estados_sesion es ON es.id = s.estado_id
      LEFT JOIN motivos_cancelacion mc ON mc.id = s.motivo_cancelacion_id
      WHERE s.tutor_id = $1
      ORDER BY s.fecha DESC, s.hora_inicio DESC
    `;
    
    const result = await db.query(query, [tutorId]);
    
    // Mapear al formato que espera el frontend
    const sesiones = result.rows.map(sesion => ({
      id: sesion.id,
      estudiante: sesion.estudiante_nombre,
      estudiante_email: sesion.estudiante_email,
      estudiante_matricula: sesion.estudiante_matricula,
      materia: sesion.materia_nombre,
      modality: sesion.modalidad_nombre || 'presencial',
      date: sesion.fecha,
      time: sesion.hora_inicio,
      duration: calcularDuracion(sesion.hora_inicio, sesion.hora_fin),
      link: sesion.ubicacion_o_enlace || '',
      location: sesion.ubicacion_o_enlace || '',
      status: mapearEstado(sesion.estado_nombre),
      motivo_cancelacion: sesion.motivo_cancelacion,
      creado_en: sesion.creado_en
    }));
    
    res.json(sesiones);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/tutores/sesiones/:id/estado
 * Cambia el estado de una sesión (aceptar/rechazar/reprogramar)
 */
router.put('/sesiones/:id/estado', verifyToken, verifyTutor, async (req, res, next) => {
  try {
    const tutorId = req.user.id;
    const sesionId = req.params.id;
    const { estado, nueva_fecha, nueva_hora_inicio, nueva_hora_fin, motivo } = req.body;
    
    // Verificar que la sesión pertenece al tutor
    const verifyQuery = 'SELECT id FROM sesiones WHERE id = $1 AND tutor_id = $2';
    const verifyResult = await db.query(verifyQuery, [sesionId, tutorId]);
    if (verifyResult.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Sesión no encontrada o no tienes permisos' });
    }
    
    // Obtener ID del estado
    const estadoQuery = 'SELECT id FROM estados_sesion WHERE nombre = $1';
    const estadoResult = await db.query(estadoQuery, [estado]);
    if (estadoResult.rows.length === 0) {
      return res.status(400).json({ ok: false, message: 'Estado inválido' });
    }
    const estadoId = estadoResult.rows[0].id;
    
    // Construir UPDATE dinámico
    const fields = [`estado_id = $1`];
    const values = [estadoId];
    let idx = 2;
    
    if (nueva_fecha) { fields.push(`fecha = $${idx++}`); values.push(nueva_fecha); }
    if (nueva_hora_inicio) { fields.push(`hora_inicio = $${idx++}`); values.push(nueva_hora_inicio); }
    if (nueva_hora_fin) { fields.push(`hora_fin = $${idx++}`); values.push(nueva_hora_fin); }
    
    values.push(sesionId);
    const updateQuery = `
      UPDATE sesiones 
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, fecha, hora_inicio, hora_fin, estado_id
    `;
    
    const updateResult = await db.query(updateQuery, values);
    
    res.json({
      ok: true,
      message: `Sesión ${estado} exitosamente`,
      sesion: updateResult.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// ===============================================
// RUTAS DE DISPONIBILIDADES DEL TUTOR
// ===============================================

/**
 * GET /api/tutores/disponibilidades
 * Obtiene las disponibilidades del tutor logueado
 */
router.get('/disponibilidades', verifyToken, verifyTutor, async (req, res, next) => {
  try {
    const tutorId = req.user.id;
    
    const query = `
      SELECT id, dia_semana, hora_inicio, hora_fin, recurrente
      FROM disponibilidades
      WHERE tutor_id = $1
      ORDER BY dia_semana, hora_inicio
    `;
    
    const result = await db.query(query, [tutorId]);
    
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tutores/disponibilidades
 * Crea una nueva disponibilidad para el tutor
 */
router.post('/disponibilidades', verifyToken, verifyTutor, async (req, res, next) => {
  try {
    const tutorId = req.user.id;
    const { dia_semana, hora_inicio, hora_fin, recurrente = true } = req.body;
    
    if (!dia_semana || !hora_inicio || !hora_fin) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Datos incompletos. Se requiere: dia_semana, hora_inicio, hora_fin' 
      });
    }
    
    const insertQuery = `
      INSERT INTO disponibilidades (tutor_id, dia_semana, hora_inicio, hora_fin, recurrente)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, dia_semana, hora_inicio, hora_fin, recurrente
    `;
    
    const insertResult = await db.query(insertQuery, [
      tutorId, dia_semana, hora_inicio, hora_fin, recurrente
    ]);
    
    res.status(201).json({
      ok: true,
      message: 'Disponibilidad creada exitosamente',
      disponibilidad: insertResult.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/tutores/disponibilidades/:id
 * Elimina una disponibilidad del tutor
 */
router.delete('/disponibilidades/:id', verifyToken, verifyTutor, async (req, res, next) => {
  try {
    const tutorId = req.user.id;
    const disponibilidadId = req.params.id;
    
    // Verificar que la disponibilidad pertenece al tutor
    const verifyQuery = 'SELECT id FROM disponibilidades WHERE id = $1 AND tutor_id = $2';
    const verifyResult = await db.query(verifyQuery, [disponibilidadId, tutorId]);
    if (verifyResult.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Disponibilidad no encontrada' });
    }
    
    const deleteQuery = 'DELETE FROM disponibilidades WHERE id = $1';
    await db.query(deleteQuery, [disponibilidadId]);
    
    res.json({
      ok: true,
      message: 'Disponibilidad eliminada exitosamente'
    });
  } catch (err) {
    next(err);
  }
});

// ===============================================
// RUTAS DE MATERIAS DEL TUTOR
// ===============================================

/**
 * GET /api/tutores/materias
 * Obtiene las materias que enseña el tutor
 */
router.get('/materias', verifyToken, verifyTutor, async (req, res, next) => {
  try {
    const tutorId = req.user.id;
    
    const query = `
      SELECT 
        tm.id,
        m.id as materia_id,
        m.clave,
        m.nombre as materia_nombre,
        c.nombre as carrera_nombre,
        n.nombre as nivel_nombre
      FROM tutor_materia tm
      JOIN materias m ON m.id = tm.materia_id
      LEFT JOIN carreras c ON c.id = m.carrera_id
      LEFT JOIN niveles n ON n.id = tm.nivel_id
      WHERE tm.tutor_id = $1
      ORDER BY m.nombre
    `;
    
    const result = await db.query(query, [tutorId]);
    
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tutores/materias
 * Asigna una nueva materia al tutor
 */
router.post('/materias', verifyToken, verifyTutor, async (req, res, next) => {
  try {
    const tutorId = req.user.id;
    const { materia_id, nivel_id } = req.body;
    
    if (!materia_id) {
      return res.status(400).json({ 
        ok: false, 
        message: 'materia_id es requerido' 
      });
    }
    
    // Verificar que la materia existe
    const materiaQuery = 'SELECT id FROM materias WHERE id = $1';
    const materiaResult = await db.query(materiaQuery, [materia_id]);
    if (materiaResult.rows.length === 0) {
      return res.status(400).json({ ok: false, message: 'Materia no válida' });
    }
    
    // Verificar que no esté ya asignada
    const existingQuery = 'SELECT id FROM tutor_materia WHERE tutor_id = $1 AND materia_id = $2';
    const existingResult = await db.query(existingQuery, [tutorId, materia_id]);
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ ok: false, message: 'Ya tienes esta materia asignada' });
    }
    
    const insertQuery = `
      INSERT INTO tutor_materia (tutor_id, materia_id, nivel_id)
      VALUES ($1, $2, $3)
      RETURNING id, materia_id, nivel_id
    `;
    
    const insertResult = await db.query(insertQuery, [tutorId, materia_id, nivel_id]);
    
    res.status(201).json({
      ok: true,
      message: 'Materia asignada exitosamente',
      asignacion: insertResult.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/tutores/materias/:id
 * Elimina una materia del tutor
 */
router.delete('/materias/:id', verifyToken, verifyTutor, async (req, res, next) => {
  try {
    const tutorId = req.user.id;
    const asignacionId = req.params.id;
    
    // Verificar que la asignación pertenece al tutor
    const verifyQuery = 'SELECT id FROM tutor_materia WHERE id = $1 AND tutor_id = $2';
    const verifyResult = await db.query(verifyQuery, [asignacionId, tutorId]);
    if (verifyResult.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Asignación no encontrada' });
    }
    
    const deleteQuery = 'DELETE FROM tutor_materia WHERE id = $1';
    await db.query(deleteQuery, [asignacionId]);
    
    res.json({
      ok: true,
      message: 'Materia eliminada exitosamente'
    });
  } catch (err) {
    next(err);
  }
});

// ===============================================
// RUTAS DE ESTADÍSTICAS DEL TUTOR
// ===============================================

/**
 * GET /api/tutores/estadisticas
 * Obtiene estadísticas del tutor
 */
router.get('/estadisticas', verifyToken, verifyTutor, async (req, res, next) => {
  try {
    const tutorId = req.user.id;
    
    // Sesiones totales
    const sesionesQuery = `
      SELECT COUNT(*) as total_sesiones,
             COUNT(CASE WHEN es.nombre = 'realizada' THEN 1 END) as sesiones_realizadas,
             COUNT(CASE WHEN es.nombre = 'pendiente' THEN 1 END) as sesiones_pendientes,
             COUNT(CASE WHEN es.nombre = 'confirmada' THEN 1 END) as sesiones_confirmadas
      FROM sesiones s
      LEFT JOIN estados_sesion es ON es.id = s.estado_id
      WHERE s.tutor_id = $1
    `;
    const sesionesResult = await db.query(sesionesQuery, [tutorId]);
    
    // Valoraciones promedio
    const valoracionesQuery = `
      SELECT AVG(estrellas) as promedio, COUNT(*) as total_valoraciones
      FROM valoraciones v
      JOIN sesiones s ON s.id = v.sesion_id
      WHERE s.tutor_id = $1
    `;
    const valoracionesResult = await db.query(valoracionesQuery, [tutorId]);
    
    // Estudiantes únicos
    const estudiantesQuery = `
      SELECT COUNT(DISTINCT estudiante_id) as estudiantes_unicos
      FROM sesiones
      WHERE tutor_id = $1
    `;
    const estudiantesResult = await db.query(estudiantesQuery, [tutorId]);
    
    const estadisticas = {
      total_sesiones: parseInt(sesionesResult.rows[0].total_sesiones || 0),
      sesiones_realizadas: parseInt(sesionesResult.rows[0].sesiones_realizadas || 0),
      sesiones_pendientes: parseInt(sesionesResult.rows[0].sesiones_pendientes || 0),
      sesiones_confirmadas: parseInt(sesionesResult.rows[0].sesiones_confirmadas || 0),
      promedio_valoraciones: parseFloat(valoracionesResult.rows[0].promedio || 0),
      total_valoraciones: parseInt(valoracionesResult.rows[0].total_valoraciones || 0),
      estudiantes_unicos: parseInt(estudiantesResult.rows[0].estudiantes_unicos || 0)
    };
    
    res.json(estadisticas);
  } catch (err) {
    next(err);
  }
});

// ===============================================
// FUNCIONES AUXILIARES
// ===============================================

function calcularDuracion(horaInicio, horaFin) {
  try {
    const inicio = new Date(`2000-01-01T${horaInicio}`);
    const fin = new Date(`2000-01-01T${horaFin}`);
    const diffMs = fin - inicio;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    return `${diffMin} min`;
  } catch {
    return '60 min';
  }
}

function mapearEstado(estado) {
  const estados = {
    'pendiente': 'pending',
    'confirmada': 'confirmed',
    'reprogramada': 'postponed',
    'cancelada': 'cancelled',
    'realizada': 'completed'
  };
  return estados[estado?.toLowerCase()] || 'pending';
}

module.exports = router;

