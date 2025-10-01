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

// Middleware para verificar que es estudiante
function verifyStudent(req, res, next) {
  if (req.user.rol !== 'estudiante') {
    return res.status(403).json({ ok: false, message: 'Acceso denegado. Solo estudiantes.' });
  }
  next();
}

// ===============================================
// RUTAS DE SESIONES DEL ESTUDIANTE
// ===============================================

/**
 * GET /api/alumnos/sesiones
 * Obtiene todas las sesiones del estudiante logueado
 */
router.get('/sesiones', verifyToken, verifyStudent, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT 
        s.id,
        s.fecha,
        s.hora_inicio,
        s.hora_fin,
        s.ubicacion_o_enlace,
        s.creado_en,
        t.nombre_completo as tutor_nombre,
        t.email as tutor_email,
        m.nombre as materia_nombre,
        m.clave as materia_clave,
        mod.nombre as modalidad_nombre,
        es.nombre as estado_nombre,
        mc.nombre as motivo_cancelacion
      FROM sesiones s
      JOIN users t ON t.id = s.tutor_id
      JOIN materias m ON m.id = s.materia_id
      LEFT JOIN modalidades mod ON mod.id = s.modalidad_id
      LEFT JOIN estados_sesion es ON es.id = s.estado_id
      LEFT JOIN motivos_cancelacion mc ON mc.id = s.motivo_cancelacion_id
      WHERE s.estudiante_id = $1
      ORDER BY s.fecha DESC, s.hora_inicio DESC
    `;
    
    const result = await db.query(query, [userId]);
    
    // Mapear al formato que espera el frontend
    const sesiones = result.rows.map(sesion => ({
      id: sesion.id,
      title: `${sesion.materia_nombre} - ${sesion.tutor_nombre}`,
      tutor: sesion.tutor_nombre,
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
 * POST /api/alumnos/sesiones
 * Crea una nueva sesión (solicitud de tutoría)
 */
router.post('/sesiones', verifyToken, verifyStudent, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { tutor_id, materia_id, fecha, hora_inicio, hora_fin, modalidad_id, ubicacion_o_enlace } = req.body;
    
    // Validar datos requeridos
    if (!tutor_id || !materia_id || !fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Datos incompletos. Se requiere: tutor_id, materia_id, fecha, hora_inicio, hora_fin' 
      });
    }
    
    // Verificar que el tutor existe y es tutor
    const tutorQuery = `
      SELECT u.id, u.nombre_completo, r.nombre as rol_nombre
      FROM users u
      JOIN roles r ON r.id = u.rol_id
      WHERE u.id = $1 AND r.nombre = 'tutor'
    `;
    const tutorResult = await db.query(tutorQuery, [tutor_id]);
    if (tutorResult.rows.length === 0) {
      return res.status(400).json({ ok: false, message: 'Tutor no válido' });
    }
    
    // Verificar que la materia existe
    const materiaQuery = 'SELECT id, nombre FROM materias WHERE id = $1';
    const materiaResult = await db.query(materiaQuery, [materia_id]);
    if (materiaResult.rows.length === 0) {
      return res.status(400).json({ ok: false, message: 'Materia no válida' });
    }
    
    // Crear la sesión con estado "pendiente"
    const estadoPendienteQuery = 'SELECT id FROM estados_sesion WHERE nombre = $1';
    const estadoResult = await db.query(estadoPendienteQuery, ['pendiente']);
    const estadoId = estadoResult.rows[0].id;
    
    const insertQuery = `
      INSERT INTO sesiones (
        estudiante_id, tutor_id, materia_id, fecha, hora_inicio, hora_fin, 
        modalidad_id, ubicacion_o_enlace, estado_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, fecha, hora_inicio, hora_fin, creado_en
    `;
    
    const insertResult = await db.query(insertQuery, [
      userId, tutor_id, materia_id, fecha, hora_inicio, hora_fin, 
      modalidad_id, ubicacion_o_enlace, estadoId
    ]);
    
    const nuevaSesion = insertResult.rows[0];
    
    res.status(201).json({
      ok: true,
      message: 'Solicitud de tutoría enviada exitosamente',
      sesion: {
        id: nuevaSesion.id,
        fecha: nuevaSesion.fecha,
        hora_inicio: nuevaSesion.hora_inicio,
        hora_fin: nuevaSesion.hora_fin,
        estado: 'pending'
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/alumnos/sesiones/:id
 * Actualiza una sesión (solo si es del estudiante)
 */
router.put('/sesiones/:id', verifyToken, verifyStudent, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sesionId = req.params.id;
    const { fecha, hora_inicio, hora_fin, ubicacion_o_enlace } = req.body;
    
    // Verificar que la sesión pertenece al estudiante
    const verifyQuery = 'SELECT id FROM sesiones WHERE id = $1 AND estudiante_id = $2';
    const verifyResult = await db.query(verifyQuery, [sesionId, userId]);
    if (verifyResult.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Sesión no encontrada o no tienes permisos' });
    }
    
    // Construir UPDATE dinámico
    const fields = [];
    const values = [];
    let idx = 1;
    
    if (fecha !== undefined) { fields.push(`fecha = $${idx++}`); values.push(fecha); }
    if (hora_inicio !== undefined) { fields.push(`hora_inicio = $${idx++}`); values.push(hora_inicio); }
    if (hora_fin !== undefined) { fields.push(`hora_fin = $${idx++}`); values.push(hora_fin); }
    if (ubicacion_o_enlace !== undefined) { fields.push(`ubicacion_o_enlace = $${idx++}`); values.push(ubicacion_o_enlace); }
    
    if (fields.length === 0) {
      return res.status(400).json({ ok: false, message: 'Nada que actualizar' });
    }
    
    values.push(sesionId);
    const updateQuery = `
      UPDATE sesiones 
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, fecha, hora_inicio, hora_fin, ubicacion_o_enlace
    `;
    
    const updateResult = await db.query(updateQuery, values);
    
    res.json({
      ok: true,
      message: 'Sesión actualizada exitosamente',
      sesion: updateResult.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/alumnos/sesiones/:id
 * Cancela una sesión (solo si es del estudiante)
 */
router.delete('/sesiones/:id', verifyToken, verifyStudent, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sesionId = req.params.id;
    const { motivo } = req.body;
    
    // Verificar que la sesión pertenece al estudiante
    const verifyQuery = 'SELECT id FROM sesiones WHERE id = $1 AND estudiante_id = $2';
    const verifyResult = await db.query(verifyQuery, [sesionId, userId]);
    if (verifyResult.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Sesión no encontrada o no tienes permisos' });
    }
    
    // Obtener ID del estado "cancelada"
    const estadoQuery = 'SELECT id FROM estados_sesion WHERE nombre = $1';
    const estadoResult = await db.query(estadoQuery, ['cancelada']);
    const estadoId = estadoResult.rows[0].id;
    
    // Obtener ID del motivo de cancelación (si se proporciona)
    let motivoId = null;
    if (motivo) {
      const motivoQuery = 'SELECT id FROM motivos_cancelacion WHERE nombre = $1';
      const motivoResult = await db.query(motivoQuery, [motivo]);
      motivoId = motivoResult.rows[0]?.id;
    }
    
    // Actualizar estado a cancelada
    const updateQuery = `
      UPDATE sesiones 
      SET estado_id = $1, motivo_cancelacion_id = $2
      WHERE id = $3
      RETURNING id
    `;
    
    await db.query(updateQuery, [estadoId, motivoId, sesionId]);
    
    res.json({
      ok: true,
      message: 'Sesión cancelada exitosamente'
    });
  } catch (err) {
    next(err);
  }
});

// ===============================================
// RUTAS DE TUTORES DISPONIBLES
// ===============================================

/**
 * GET /api/alumnos/tutores-disponibles
 * Obtiene tutores disponibles con filtros opcionales
 */
router.get('/tutores-disponibles', verifyToken, verifyStudent, async (req, res, next) => {
  try {
    const { area, modalidad, dia, hora, duracion } = req.query;
    
    let query = `
      SELECT DISTINCT
        u.id,
        u.nombre_completo,
        u.email,
        m.nombre as materia_nombre,
        m.clave as materia_clave
      FROM users u
      JOIN roles r ON r.id = u.rol_id
      JOIN tutor_materia tm ON tm.tutor_id = u.id
      JOIN materias m ON m.id = tm.materia_id
      WHERE r.nombre = 'tutor'
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // Filtro por área/materia
    if (area) {
      query += ` AND LOWER(m.nombre) LIKE LOWER($${paramIndex})`;
      params.push(`%${area}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY u.nombre_completo, m.nombre`;
    
    const result = await db.query(query, params);
    
    // Agrupar por tutor
    const tutoresMap = new Map();
    result.rows.forEach(row => {
      if (!tutoresMap.has(row.id)) {
        tutoresMap.set(row.id, {
          id: row.id,
          name: row.nombre_completo,
          email: row.email,
          specialties: [],
          rating: 0, // TODO: calcular promedio real
          reviewsCount: 0, // TODO: contar valoraciones reales
          available: true,
          nextAvailable: '',
          modalities: ['Presencial', 'Virtual'], // TODO: obtener de disponibilidades
          price: null
        });
      }
      tutoresMap.get(row.id).specialties.push(row.materia_nombre);
    });
    
    const tutores = Array.from(tutoresMap.values());
    
    res.json(tutores);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/alumnos/tutores/:id
 * Obtiene perfil detallado de un tutor específico
 */
router.get('/tutores/:id', verifyToken, verifyStudent, async (req, res, next) => {
  try {
    const tutorId = req.params.id;
    
    // Información básica del tutor
    const tutorQuery = `
      SELECT u.id, u.nombre_completo, u.email, u.telefono
      FROM users u
      JOIN roles r ON r.id = u.rol_id
      WHERE u.id = $1 AND r.nombre = 'tutor'
    `;
    const tutorResult = await db.query(tutorQuery, [tutorId]);
    if (tutorResult.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Tutor no encontrado' });
    }
    
    const tutor = tutorResult.rows[0];
    
    // Materias que enseña
    const materiasQuery = `
      SELECT m.id, m.nombre, m.clave, n.nombre as nivel_nombre
      FROM tutor_materia tm
      JOIN materias m ON m.id = tm.materia_id
      LEFT JOIN niveles n ON n.id = tm.nivel_id
      WHERE tm.tutor_id = $1
    `;
    const materiasResult = await db.query(materiasQuery, [tutorId]);
    
    // Disponibilidades
    const disponibilidadesQuery = `
      SELECT dia_semana, hora_inicio, hora_fin
      FROM disponibilidades
      WHERE tutor_id = $1
      ORDER BY dia_semana, hora_inicio
    `;
    const disponibilidadesResult = await db.query(disponibilidadesQuery, [tutorId]);
    
    // Valoraciones promedio
    const valoracionesQuery = `
      SELECT AVG(estrellas) as promedio, COUNT(*) as total
      FROM valoraciones v
      JOIN sesiones s ON s.id = v.sesion_id
      WHERE s.tutor_id = $1
    `;
    const valoracionesResult = await db.query(valoracionesQuery, [tutorId]);
    
    const promedio = parseFloat(valoracionesResult.rows[0]?.promedio || 0);
    const totalValoraciones = parseInt(valoracionesResult.rows[0]?.total || 0);
    
    res.json({
      id: tutor.id,
      name: tutor.nombre_completo,
      email: tutor.email,
      telefono: tutor.telefono,
      specialty: materiasResult.rows.map(m => m.nombre).join(', '),
      rating: promedio,
      reviewsCount: totalValoraciones,
      education: '', // TODO: agregar campo educación
      experience: '', // TODO: agregar campo experiencia
      specialties: materiasResult.rows.map(m => ({
        id: m.id,
        nombre: m.nombre,
        clave: m.clave,
        nivel: m.nivel_nombre
      })),
      availability: disponibilidadesResult.rows.map(d => ({
        dia: d.dia_semana,
        hora_inicio: d.hora_inicio,
        hora_fin: d.hora_fin
      })),
      pricing: 'Consultar', // TODO: implementar sistema de precios
      modalities: ['Presencial', 'Virtual'] // TODO: obtener de disponibilidades
    });
  } catch (err) {
    next(err);
  }
});

// ===============================================
// RUTAS DE MATERIAS
// ===============================================

/**
 * GET /api/alumnos/materias
 * Obtiene todas las materias disponibles
 */
router.get('/materias', verifyToken, verifyStudent, async (req, res, next) => {
  try {
    const query = `
      SELECT m.id, m.clave, m.nombre, c.nombre as carrera_nombre
      FROM materias m
      LEFT JOIN carreras c ON c.id = m.carrera_id
      WHERE m.estado_id = (SELECT id FROM estados_materia WHERE nombre = 'activo')
      ORDER BY m.nombre
    `;
    
    const result = await db.query(query);
    
    res.json(result.rows);
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

