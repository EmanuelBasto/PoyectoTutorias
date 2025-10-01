// ===============================================
// CONFIGURACIÓN PARA INTEGRACIÓN BACKEND (COMPLETO)
// ===============================================
// Este archivo conecta las interfaces (Alumno/Tutor) con tu backend real.
// Incluye:
//  - Mapa de endpoints (BACKEND_CONFIG)
//  - Utilidades de red (apiRequest, tokens, headers)
//  - Funciones usadas por alumnos.js/tutores.js (perfil, sesiones, tutores, etc.)
//  - Conectores de notificaciones/calendario/ratings (stubs seguros si no existen aún)
//
// Nota: Si tu backend todavía no implementa algunos endpoints, estas funciones
// devuelven valores vacíos o lanzan errores controlados para que el front no se rompa.

// ===============================================
// 1) Mapa de Endpoints
// ===============================================
const BACKEND_CONFIG = {
  // URL base del backend (ajustado a tu servidor)
  BASE_URL: 'http://127.0.0.1:4000/api',

  // Autenticación
  // En BACKEND_CONFIG.AUTH
AUTH: {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  PROFILE: '/auth/profile' // <-- NUEVO
},



  // Usuarios (generales)
  USERS: {
    GET_PROFILE: '/users/profile',            // GET /users/profile?email=
    UPDATE_PROFILE: '/users/profile',         // PUT
    GET_ALL_USERS: '/users',                  // GET
    CREATE_USER: '/users',                    // POST
    UPDATE_USER: '/users/:id',                // PUT
    DELETE_USER: '/users/:id',                // DELETE
    CHANGE_PASSWORD: '/users/change-password' // POST
  },

  // Tutores
  TUTORS: {
    GET_ALL_TUTORS: '/tutors',                        // GET (admite filtros como ?area=&modality=&day=&time=&duration=)
    GET_TUTOR_PROFILE: '/tutors/:id',                 // GET
    UPDATE_TUTOR_PROFILE: '/tutors/:id',              // PUT
    GET_TUTOR_AVAILABILITY: '/tutors/:id/availability', // GET
    SET_TUTOR_AVAILABILITY: '/tutors/:id/availability', // PUT/POST
    GET_TUTOR_SESSIONS: '/tutors/:id/sessions',       // GET
    GET_TUTOR_RATINGS: '/tutors/:id/ratings'         // GET
  },

  // Estudiantes/Alumnos
  STUDENTS: {
    GET_ALL_STUDENTS: '/students',                  // GET
    GET_STUDENT_PROFILE: '/students/:id',           // GET
    UPDATE_STUDENT_PROFILE: '/students/:id',        // PUT
    GET_STUDENT_SESSIONS: '/students/:id/sessions', // GET (también soportamos /students/sessions?email= como alternativa)
    GET_STUDENT_COURSES: '/students/:id/courses',   // GET
    GET_STUDENT_PROGRESS: '/students/:id/progress'  // GET
  },

  // Alumnos (nuevas rutas específicas)
  ALUMNOS: {
    GET_SESIONES: '/alumnos/sesiones',                    // GET - Obtener sesiones del estudiante
    CREATE_SESION: '/alumnos/sesiones',                   // POST - Crear nueva sesión
    UPDATE_SESION: '/alumnos/sesiones/:id',               // PUT - Actualizar sesión
    DELETE_SESION: '/alumnos/sesiones/:id',               // DELETE - Cancelar sesión
    GET_TUTORES_DISPONIBLES: '/alumnos/tutores-disponibles', // GET - Buscar tutores
    GET_TUTOR_PROFILE: '/alumnos/tutores/:id',            // GET - Perfil del tutor
    GET_MATERIAS: '/alumnos/materias'                     // GET - Materias disponibles
  },

  // Tutores (nuevas rutas específicas)
  TUTORES_ROUTES: {
    GET_SESIONES: '/tutores/sesiones',                    // GET - Obtener sesiones del tutor
    UPDATE_SESION_ESTADO: '/tutores/sesiones/:id/estado', // PUT - Cambiar estado de sesión
    GET_DISPONIBILIDADES: '/tutores/disponibilidades',   // GET - Obtener disponibilidades
    CREATE_DISPONIBILIDAD: '/tutores/disponibilidades',  // POST - Crear disponibilidad
    DELETE_DISPONIBILIDAD: '/tutores/disponibilidades/:id', // DELETE - Eliminar disponibilidad
    GET_MATERIAS: '/tutores/materias',                   // GET - Materias del tutor
    CREATE_MATERIA: '/tutores/materias',                 // POST - Asignar materia
    DELETE_MATERIA: '/tutores/materias/:id',             // DELETE - Eliminar materia
    GET_ESTADISTICAS: '/tutores/estadisticas'            // GET - Estadísticas del tutor
  },

  // Administrador (nuevas rutas específicas)
  ADMIN_ROUTES: {
    GET_USUARIOS: '/admin/usuarios',                     // GET - Obtener todos los usuarios
    GET_USUARIO: '/admin/usuarios/:id',                  // GET - Obtener usuario específico
    UPDATE_USUARIO_ESTADO: '/admin/usuarios/:id/estado', // PUT - Cambiar estado de usuario
    DELETE_USUARIO: '/admin/usuarios/:id',               // DELETE - Eliminar usuario
    GET_MATERIAS: '/admin/materias',                     // GET - Obtener todas las materias
    CREATE_MATERIA: '/admin/materias',                   // POST - Crear materia
    UPDATE_MATERIA: '/admin/materias/:id',               // PUT - Actualizar materia
    GET_SESIONES: '/admin/sesiones',                     // GET - Obtener todas las sesiones
    GET_ESTADISTICAS: '/admin/estadisticas',             // GET - Estadísticas del sistema
    GET_ACTIVIDAD_RECIENTE: '/admin/actividad-reciente'  // GET - Actividad reciente
  },

  // Sesiones
  SESSIONS: {
    GET_ALL_SESSIONS: '/sessions',
    CREATE_SESSION: '/sessions',
    GET_SESSION: '/sessions/:id',
    UPDATE_SESSION: '/sessions/:id',
    DELETE_SESSION: '/sessions/:id',
    ACCEPT_SESSION: '/sessions/:id/accept',
    REJECT_SESSION: '/sessions/:id/reject',
    RESCHEDULE_SESSION: '/sessions/:id/reschedule',
    CANCEL_SESSION: '/sessions/:id/cancel',
    COMPLETE_SESSION: '/sessions/:id/complete',
    GET_SESSION_HISTORY: '/sessions/history'
  },

  // Áreas de apoyo
  SUPPORT_AREAS: {
    GET_ALL_AREAS: '/support-areas',
    CREATE_AREA: '/support-areas',
    UPDATE_AREA: '/support-areas/:id',
    DELETE_AREA: '/support-areas/:id',
    GET_AREA_TUTORS: '/support-areas/:id/tutors'
  },

  // Valoraciones
  RATINGS: {
    GET_ALL_RATINGS: '/ratings',
    CREATE_RATING: '/ratings',            // POST
    UPDATE_RATING: '/ratings/:id',        // PUT
    DELETE_RATING: '/ratings/:id',        // DELETE
    GET_TUTOR_RATINGS: '/ratings/tutor/:id',
    GET_SESSION_RATINGS: '/ratings/session/:id'
  },

  // Notificaciones
  NOTIFICATIONS: {
    GET_NOTIFICATIONS: '/notifications',
    MARK_AS_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/mark-all-read',
    DELETE_NOTIFICATION: '/notifications/:id',
    GET_UNREAD_COUNT: '/notifications/unread-count'
  },

  // Mensajes
  MESSAGES: {
    GET_CONVERSATIONS: '/messages/conversations',
    GET_MESSAGES: '/messages/:conversationId',
    SEND_MESSAGE: '/messages',
    MARK_AS_READ: '/messages/:id/read',
    DELETE_MESSAGE: '/messages/:id'
  },

  // Reportes
  REPORTS: {
    GET_DASHBOARD_STATS: '/reports/dashboard',
    GET_SESSION_REPORTS: '/reports/sessions',
    GET_TUTOR_REPORTS: '/reports/tutors',
    GET_STUDENT_REPORTS: '/reports/students',
    EXPORT_REPORT: '/reports/export/:type'
  },

  // Configuración del sistema
  CONFIG: {
    GET_SYSTEM_CONFIG: '/config',
    UPDATE_SYSTEM_CONFIG: '/config',
    GET_CANCELLATION_POLICY: '/config/cancellation-policy',
    UPDATE_CANCELLATION_POLICY: '/config/cancellation-policy'
  },

  // Administradores
  ADMIN: {
    GET_ALL_USERS: '/admin/usuarios',
    GET_USER: '/admin/usuarios/:id',
    CREATE_USER: '/admin/usuarios',
    UPDATE_USER: '/admin/usuarios/:id',
    DELETE_USER: '/admin/usuarios/:id',
    RESET_USER_PASSWORD: '/admin/usuarios/:id/reset-password',
    GET_ALL_MATERIAS: '/admin/materias',
    GET_MATERIA: '/admin/materias/:id',
    CREATE_MATERIA: '/admin/materias',
    UPDATE_MATERIA: '/admin/materias/:id',
    DELETE_MATERIA: '/admin/materias/:id',
    GET_ALL_SESIONES: '/admin/sesiones',
    GET_SESION: '/admin/sesiones/:id',
    UPDATE_SESION: '/admin/sesiones/:id',
    GET_SYSTEM_STATS: '/admin/stats',
    GET_RECENT_ACTIVITY: '/admin/recent-activity',
    GET_SYSTEM_PARAMETERS: '/admin/parametros',
    UPDATE_SYSTEM_PARAMETERS: '/admin/parametros',
    GENERATE_REPORT: '/admin/reportes/generate',
    EXPORT_REPORT: '/admin/reportes/export/:type'
  }
};

// ===============================================
// 2) Utilidades: Token, Headers, Limpieza de sesión
// ===============================================
function getAuthToken() {
  const t = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (!t) return null;
  // Evita strings basura guardadas accidentalmente
  if (t === 'undefined' || t === 'null' || t.trim() === '') return null;
  return t;
}


function setAuthToken(token, remember = false) {
  if (!token) return;
  if (remember) localStorage.setItem('authToken', token);
  else sessionStorage.setItem('authToken', token);
}

function clearAuth() {
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
  localStorage.removeItem('userSession');
  sessionStorage.removeItem('userEmail');
}

// Guarda y lee email del usuario (para llamadas por email en alumnos.js)
function setUserEmail(email, remember = false) {
  if (!email) return;
  if (remember) localStorage.setItem('userEmail', email);
  else sessionStorage.setItem('userEmail', email);
}
function getUserEmail() {
  return localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || '';
}

// Headers comunes
function getDefaultHeaders(method = 'GET') {
  const base = {};
  // Solo agrega Content-Type cuando vayas a mandar body JSON
  if (method && method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD') {
    base['Content-Type'] = 'application/json';
  }
  const token = getAuthToken();
  if (token) base['Authorization'] = `Bearer ${token}`;
  // Evita caching agresivo del navegador
  base['Cache-Control'] = 'no-cache';
  return base;
}


// ===============================================
// 3) apiRequest (fetch con manejo de errores y JSON opcional)
// ===============================================
async function apiRequest(endpoint, options = {}) {
  const url = `${BACKEND_CONFIG.BASE_URL}${endpoint}`;
  const config = {
    method: 'GET',
    cache: 'no-store',                  // <- fuerza no-cache del lado fetch
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',      // <- y del lado request
      ...(getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {})
    },
    ...options
  };

  const res = await fetch(url, config);

  // Trata 304 como error de cache y no de "no encontrado"
  if (res.status === 304) {
    throw new Error('HTTP 304');
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.message || data?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (!ct.includes('application/json')) return null;
  return res.json();
}



// ===============================================
// 4) Autenticación (front → backend)
// ===============================================
async function loginUser(email, password, remember = false) {
  const response = await apiRequest(BACKEND_CONFIG.AUTH.LOGIN, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  // si el backend retorna { token, usuario }, guardamos token + email
  if (response?.token) setAuthToken(response.token, remember);
  setUserEmail(email, remember);
  return response;
}

async function logoutUser() {
  try {
    await apiRequest(BACKEND_CONFIG.AUTH.LOGOUT, { method: 'POST' });
  } catch (e) {
    // no pasa nada si no existe endpoint; limpiamos igual
  } finally {
    clearAuth();
  }
}

async function registerUser(userData) {
  return apiRequest(BACKEND_CONFIG.AUTH.REGISTER, {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

// ===============================================
// 5) Usuarios y Perfiles
// ===============================================
async function getUserProfile() {
  // Variante general si usas /users/profile con email
  const email = getUserEmail();
  const qs = email ? `?${new URLSearchParams({ email }).toString()}` : '';
  return apiRequest(`${BACKEND_CONFIG.USERS.GET_PROFILE}${qs}`);
}

async function updateUserProfile(profileData) {
  return apiRequest(BACKEND_CONFIG.USERS.UPDATE_PROFILE, {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });
}

// ===============================================
// 6) Estudiantes (perfil/sesiones) usados por alumnos.js
// ===============================================

// Asegúrate de tener esta clave en BACKEND_CONFIG.AUTH:
/// AUTH: { ..., PROFILE: '/auth/profile' }

// ===============================================
// 6) Estudiantes (perfil/sesiones) usados por alumnos.js
// ===============================================
async function getStudentProfile() {
  const email = getUserEmail();
  if (!email) return {};

  const base = BACKEND_CONFIG.BASE_URL;
  const headers = getDefaultHeaders();

  // 1) /auth/profile?email=... con "cache-busting"
  if (true) {
    try {
      const res = await fetch(
        `${base}${BACKEND_CONFIG.AUTH.PROFILE || '/auth/profile'}?email=${encodeURIComponent(email)}&_=${Date.now()}`,
        { headers, cache: 'no-store' }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const p = data.profile || data || {};
      const fullName = p.fullName || [p.firstName, p.lastName].filter(Boolean).join(' ').trim();

      return {
        firstName: p.firstName || '',
        lastName : p.lastName  || '',
        fullName : fullName || '',
        email    : p.email || email || '',
        studentId: p.studentId || p.matricula || p.matrícula || ''
      };
    } catch (e) {
      console.warn('getStudentProfile(/auth/profile) fallback -> try /users/profile:', e.message);
      // continúa con el fallback abajo
    }
  }

  // 2) Fallback: /users/profile?email=...
  try {
    const qs = `?${new URLSearchParams({ email, _: Date.now() }).toString()}`;
    return await apiRequest(`${BACKEND_CONFIG.USERS.GET_PROFILE}${qs}`, { cache: 'no-store' });
  } catch (e2) {
    console.warn('getStudentProfile fallback {}:', e2.message);
    return {};
  }
}






async function getStudentSessions() {
  const token = getAuthToken();
  if (!token) return [];

  try {
    // Usar la nueva ruta específica para alumnos
    const data = await apiRequest(BACKEND_CONFIG.ALUMNOS.GET_SESIONES);
    return Array.isArray(data) ? data : [];
  } catch (e1) {
    console.warn('getStudentSessions(/alumnos/sesiones) falló → intento fallback:', e1.message);
    
    // Fallback: usar ruta anterior
    const email = getUserEmail();
    if (!email) return [];

    try {
      const url = `${BACKEND_CONFIG.BASE_URL}/students/sessions?${new URLSearchParams({ email })}`;
      const r = await fetch(url, { headers: getDefaultHeaders() });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const ct = (r.headers.get('content-type') || '').toLowerCase();
      const data = ct.includes('application/json') ? await r.json() : null;
      const list = Array.isArray(data) ? data : (data?.sessions || []);
      return list || [];
    } catch (e2) {
      console.warn('getStudentSessions fallback []:', e2.message);
      return [];
    }
  }
}


// Próximas sesiones para dashboard Inicio
function _cryptoRandomId() { return 'id_' + Math.random().toString(36).slice(2, 10); }
function _formatDateStr(d) { try { const x=new Date(d); return x.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'});} catch { return d||''; } }

async function getUpcomingSessions() {
  const sessions = await getStudentSessions();
  const now = new Date();
  return sessions
    .filter(s => new Date(s.date || s.startDate || Date.now()) >= now)
    .sort((a,b)=> new Date(a.date||a.startDate) - new Date(b.date||b.startDate))
    .slice(0,5)
    .map(s => ({
      id: s.id || s.sessionId || _cryptoRandomId(),
      title: s.title || s.titulo || 'Sesión de apoyo',
      tutor: s.tutor || s.tutorName || s.tutor_nombre || 'Tutor',
      modality: s.modality || s.modalidad || '—',
      date: _formatDateStr(s.date || s.fecha || s.startDate),
      time: s.time || s.hora || '',
      duration: (s.duration || s.duracion) ? `${s.duration || s.duracion} min` : '',
      link: s.link || s.enlace || '',
      location: s.location || s.ubicacion || ''
    }));
}

async function getRecentActivity() {
  const email = getUserEmail();
  if (!email) return [];
  const qs = new URLSearchParams({ email }).toString();
  try {
    const data = await apiRequest(`/students/activity?${qs}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ===============================================
// 7) Tutores (búsqueda y perfil) usados por alumnos.js
// ===============================================
async function getTutorProfile(tutorId) {
  if (!tutorId) throw new Error('tutorId requerido');
  const ep = BACKEND_CONFIG.TUTORS.GET_TUTOR_PROFILE.replace(':id', encodeURIComponent(String(tutorId)));
  return apiRequest(ep);
}

async function searchTutorsByAvailability({ area = '', modality = '', day = '', time = '', duration = '' } = {}) {
  // Usar la nueva ruta específica para alumnos
  const qp = new URLSearchParams();
  if (area) qp.set('area', area);
  if (modality) qp.set('modalidad', modality);
  if (day) qp.set('dia', day);
  if (time) qp.set('hora', time);
  if (duration) qp.set('duracion', duration);

  try {
    const list = await apiRequest(`${BACKEND_CONFIG.ALUMNOS.GET_TUTORES_DISPONIBLES}?${qp.toString()}`);
    return (Array.isArray(list) ? list : []).map(t => ({
      id: t.id,
      name: t.name || t.nombre || 'Tutor',
      specialty: t.specialty || t.especialidad || area || 'Apoyo',
      rating: t.rating || t.promedio || 0,
      reviewsCount: t.reviewsCount || t.num_reviews || 0,
      available: t.available !== false,
      nextAvailable: t.nextAvailable || '',
      modalities: t.modalities || t.modalidades || (modality ? [modality] : []),
      price: t.price || t.tarifa || null
    }));
  } catch (e) {
    console.warn('searchTutorsByAvailability fallback []:', e.message);
    return [];
  }
}

// Nueva función para obtener materias disponibles
async function getMateriasDisponibles() {
  try {
    const materias = await apiRequest(BACKEND_CONFIG.ALUMNOS.GET_MATERIAS);
    return Array.isArray(materias) ? materias : [];
  } catch (e) {
    console.warn('getMateriasDisponibles fallback []:', e.message);
    return [];
  }
}

// Nueva función para crear sesión
async function crearSesionAlumno(sessionData) {
  return apiRequest(BACKEND_CONFIG.ALUMNOS.CREATE_SESION, {
    method: 'POST',
    body: JSON.stringify(sessionData)
  });
}

// Nueva función para actualizar sesión
async function actualizarSesionAlumno(sessionId, sessionData) {
  return apiRequest(BACKEND_CONFIG.ALUMNOS.UPDATE_SESION.replace(':id', sessionId), {
    method: 'PUT',
    body: JSON.stringify(sessionData)
  });
}

// ===============================================
// FUNCIONES PARA TUTORES
// ===============================================

// Obtener sesiones del tutor
async function getTutorSessions() {
  try {
    const sesiones = await apiRequest(BACKEND_CONFIG.TUTORES_ROUTES.GET_SESIONES);
    return Array.isArray(sesiones) ? sesiones : [];
  } catch (e) {
    console.warn('getTutorSessions fallback []:', e.message);
    return [];
  }
}

// Cambiar estado de sesión
async function cambiarEstadoSesion(sessionId, estado, datosAdicionales = {}) {
  return apiRequest(BACKEND_CONFIG.TUTORES_ROUTES.UPDATE_SESION_ESTADO.replace(':id', sessionId), {
    method: 'PUT',
    body: JSON.stringify({ estado, ...datosAdicionales })
  });
}

// Obtener disponibilidades del tutor
async function getTutorDisponibilidades() {
  try {
    const disponibilidades = await apiRequest(BACKEND_CONFIG.TUTORES_ROUTES.GET_DISPONIBILIDADES);
    return Array.isArray(disponibilidades) ? disponibilidades : [];
  } catch (e) {
    console.warn('getTutorDisponibilidades fallback []:', e.message);
    return [];
  }
}

// Crear disponibilidad
async function crearDisponibilidad(disponibilidadData) {
  return apiRequest(BACKEND_CONFIG.TUTORES_ROUTES.CREATE_DISPONIBILIDAD, {
    method: 'POST',
    body: JSON.stringify(disponibilidadData)
  });
}

// Eliminar disponibilidad
async function eliminarDisponibilidad(disponibilidadId) {
  return apiRequest(BACKEND_CONFIG.TUTORES_ROUTES.DELETE_DISPONIBILIDAD.replace(':id', disponibilidadId), {
    method: 'DELETE'
  });
}

// Obtener materias del tutor
async function getTutorMaterias() {
  try {
    const materias = await apiRequest(BACKEND_CONFIG.TUTORES_ROUTES.GET_MATERIAS);
    return Array.isArray(materias) ? materias : [];
  } catch (e) {
    console.warn('getTutorMaterias fallback []:', e.message);
    return [];
  }
}

// Asignar materia al tutor
async function asignarMateriaTutor(materiaData) {
  return apiRequest(BACKEND_CONFIG.TUTORES_ROUTES.CREATE_MATERIA, {
    method: 'POST',
    body: JSON.stringify(materiaData)
  });
}

// Eliminar materia del tutor
async function eliminarMateriaTutor(asignacionId) {
  return apiRequest(BACKEND_CONFIG.TUTORES_ROUTES.DELETE_MATERIA.replace(':id', asignacionId), {
    method: 'DELETE'
  });
}

// ===============================================
// FUNCIONES PARA ADMINISTRADOR
// ===============================================

// Obtener todos los usuarios
async function getAdminUsuarios(filtros = {}) {
  try {
    const queryParams = new URLSearchParams(filtros).toString();
    const endpoint = queryParams ? `${BACKEND_CONFIG.ADMIN_ROUTES.GET_USUARIOS}?${queryParams}` : BACKEND_CONFIG.ADMIN_ROUTES.GET_USUARIOS;
    const response = await apiRequest(endpoint);
    return response || { usuarios: [], pagination: {} };
  } catch (e) {
    console.warn('getAdminUsuarios fallback []:', e.message);
    return { usuarios: [], pagination: {} };
  }
}

// Obtener usuario específico
async function getAdminUsuario(userId) {
  try {
    const usuario = await apiRequest(BACKEND_CONFIG.ADMIN_ROUTES.GET_USUARIO.replace(':id', userId));
    return usuario || {};
  } catch (e) {
    console.warn('getAdminUsuario fallback {}:', e.message);
    return {};
  }
}

// Cambiar estado de usuario
async function cambiarEstadoUsuario(userId, estado) {
  return apiRequest(BACKEND_CONFIG.ADMIN_ROUTES.UPDATE_USUARIO_ESTADO.replace(':id', userId), {
    method: 'PUT',
    body: JSON.stringify({ estado })
  });
}

// Eliminar usuario
async function eliminarUsuario(userId) {
  return apiRequest(BACKEND_CONFIG.ADMIN_ROUTES.DELETE_USUARIO.replace(':id', userId), {
    method: 'DELETE'
  });
}

// Obtener todas las materias
async function getAdminMaterias() {
  try {
    const materias = await apiRequest(BACKEND_CONFIG.ADMIN_ROUTES.GET_MATERIAS);
    return Array.isArray(materias) ? materias : [];
  } catch (e) {
    console.warn('getAdminMaterias fallback []:', e.message);
    return [];
  }
}

// Crear materia
async function crearMateria(materiaData) {
  return apiRequest(BACKEND_CONFIG.ADMIN_ROUTES.CREATE_MATERIA, {
    method: 'POST',
    body: JSON.stringify(materiaData)
  });
}

// Actualizar materia
async function actualizarMateria(materiaId, materiaData) {
  return apiRequest(BACKEND_CONFIG.ADMIN_ROUTES.UPDATE_MATERIA.replace(':id', materiaId), {
    method: 'PUT',
    body: JSON.stringify(materiaData)
  });
}

// Obtener todas las sesiones
async function getAdminSesiones(filtros = {}) {
  try {
    const queryParams = new URLSearchParams(filtros).toString();
    const endpoint = queryParams ? `${BACKEND_CONFIG.ADMIN_ROUTES.GET_SESIONES}?${queryParams}` : BACKEND_CONFIG.ADMIN_ROUTES.GET_SESIONES;
    const response = await apiRequest(endpoint);
    return response || { sesiones: [], pagination: {} };
  } catch (e) {
    console.warn('getAdminSesiones fallback []:', e.message);
    return { sesiones: [], pagination: {} };
  }
}

// Obtener estadísticas del sistema
async function getAdminEstadisticas() {
  try {
    const estadisticas = await apiRequest(BACKEND_CONFIG.ADMIN_ROUTES.GET_ESTADISTICAS);
    return estadisticas || {};
  } catch (e) {
    console.warn('getAdminEstadisticas fallback {}:', e.message);
    return {};
  }
}

// Obtener actividad reciente
async function getAdminActividadReciente() {
  try {
    const actividad = await apiRequest(BACKEND_CONFIG.ADMIN_ROUTES.GET_ACTIVIDAD_RECIENTE);
    return Array.isArray(actividad) ? actividad : [];
  } catch (e) {
    console.warn('getAdminActividadReciente fallback []:', e.message);
    return [];
  }
}

// ===============================================
// 8) Sesiones / Ratings / Notificaciones (conectores)
// ===============================================
async function getSessions(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = queryParams ? `${BACKEND_CONFIG.SESSIONS.GET_ALL_SESSIONS}?${queryParams}` : BACKEND_CONFIG.SESSIONS.GET_ALL_SESSIONS;
  return apiRequest(endpoint);
}

async function createSession(sessionData) {
  return apiRequest(BACKEND_CONFIG.SESSIONS.CREATE_SESSION, {
    method: 'POST',
    body: JSON.stringify(sessionData)
  });
}

async function updateSession(sessionId, sessionData) {
  return apiRequest(BACKEND_CONFIG.SESSIONS.UPDATE_SESSION.replace(':id', sessionId), {
    method: 'PUT',
    body: JSON.stringify(sessionData)
  });
}

async function cancelSession(sessionId, reason) {
  return apiRequest(BACKEND_CONFIG.SESSIONS.CANCEL_SESSION.replace(':id', sessionId), {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
}

async function createRating(ratingData) {
  return apiRequest(BACKEND_CONFIG.RATINGS.CREATE_RATING, {
    method: 'POST',
    body: JSON.stringify(ratingData)
  });
}

async function createSessionAndNotify(sessionData) {
  const response = await createSession(sessionData);
  try {
    await apiRequest('/notifications/new-session-request', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: response.id,
        tutorId: sessionData.tutorId,
        studentId: sessionData.studentId,
        sessionData
      })
    });
  } catch {
    // si aún no hay endpoint, seguimos sin romper el flujo
  }
  return response;
}

// Estados de sesión entre usuarios (si ya lo implementaste en backend)
async function syncSessionStatus(sessionId, newStatus, userId, userType) {
  const response = await apiRequest(`/sessions/${sessionId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: newStatus, userId, userType, timestamp: new Date().toISOString() })
  });
  // Notificar al otro usuario
  try {
    await notifyUserStatusChange(sessionId, newStatus, userId, userType);
  } catch {}
  return response;
}

async function notifyUserStatusChange(sessionId, status, userId, userType) {
  return apiRequest('/notifications/session-status-change', {
    method: 'POST',
    body: JSON.stringify({ sessionId, status, userId, userType })
  });
}

async function syncCalendars(studentId, tutorId, sessionData) {
  return apiRequest('/calendar/sync', {
    method: 'POST',
    body: JSON.stringify({ studentId, tutorId, sessionData })
  });
}

async function handleBidirectionalNotification(senderId, receiverId, type, data) {
  return apiRequest('/notifications/bidirectional', {
    method: 'POST',
    body: JSON.stringify({ senderId, receiverId, type, data })
  });
}

async function updateTutorAvailabilityAndNotify(tutorId, availabilityData) {
  const response = await apiRequest(`/tutors/${tutorId}/availability`, {
    method: 'PUT',
    body: JSON.stringify(availabilityData)
  });
  try {
    await apiRequest('/notifications/availability-update', {
      method: 'POST',
      body: JSON.stringify({ tutorId, availabilityData })
    });
  } catch {}
  return response;
}

// Dashboard
async function getDashboardStats() {
  const email = getUserEmail();
  if (!email) return { availableTutors: 0, scheduledSessions: 0, averageRating: 0, totalHours: 0 };
  try {
    const qs = new URLSearchParams({ email }).toString();
    return await apiRequest(`${BACKEND_CONFIG.REPORTS.GET_DASHBOARD_STATS}?${qs}`);
  } catch {
    const sessions = await getStudentSessions();
    const future = sessions.filter(s => new Date(s.date || s.startDate || Date.now()) >= new Date());
    const totalMin = sessions.reduce((acc, s) => acc + (parseInt(s.duration || s.duracion || 0, 10) || 0), 0);
    return {
      availableTutors: 0,
      scheduledSessions: future.length,
      averageRating: 0,
      totalHours: Math.round(totalMin / 60)
    };
  }
}

// ===============================================
// 9) Stubs/Helpers extra (sustituye cuando tengas endpoints reales)
// ===============================================
function getTutorIdByNameStub(name) {
  // Reemplaza por un endpoint real cuando lo tengas
  return null;
}

// ===============================================
// 10) Export para navegador (window.BackendAPI)
// ===============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BACKEND_CONFIG,
    apiRequest,
    getDefaultHeaders,
    getAuthToken,
    setAuthToken,
    setUserEmail,
    getUserEmail,

    // auth
    loginUser,
    logoutUser,
    registerUser,

    // usuarios
    getUserProfile,
    updateUserProfile,

    // alumnos.js
    getStudentProfile,
    getStudentSessions,
    getUpcomingSessions,
    getRecentActivity,

    // tutores
    getTutorProfile,
    searchTutorsByAvailability,

    // nuevas funciones para alumnos
    getMateriasDisponibles,
    crearSesionAlumno,
    actualizarSesionAlumno,
    cancelarSesionAlumno,

    // nuevas funciones para tutores
    getTutorSessions,
    cambiarEstadoSesion,
    getTutorDisponibilidades,
    crearDisponibilidad,
    eliminarDisponibilidad,
    getTutorMaterias,
    asignarMateriaTutor,
    eliminarMateriaTutor,
    getTutorEstadisticas,

    // nuevas funciones para administrador
    getAdminUsuarios,
    getAdminUsuario,
    cambiarEstadoUsuario,
    eliminarUsuario,
    getAdminMaterias,
    crearMateria,
    actualizarMateria,
    getAdminSesiones,
    getAdminEstadisticas,
    getAdminActividadReciente,

    // sesiones/ratings/notifications
    getSessions,
    createSession,
    updateSession,
    cancelSession,
    createRating,
    createSessionAndNotify,
    syncSessionStatus,
    notifyUserStatusChange,
    syncCalendars,
    handleBidirectionalNotification,
    updateTutorAvailabilityAndNotify,

    // reportes
    getDashboardStats,

    // stub
    getTutorIdByNameStub
  };
} else {
  window.BackendAPI = {
    // Config y helpers base
    BACKEND_CONFIG,
    baseURL: BACKEND_CONFIG.BASE_URL,
    getHeaders: getDefaultHeaders,

    // Utils/token
    apiRequest,
    getAuthToken,
    setAuthToken,
    setUserEmail,
    getUserEmail,

    // Auth
    loginUser,
    logoutUser,
    registerUser,

    // Usuarios
    getUserProfile,
    updateUserProfile,

    // Alumno
    getStudentProfile,
    getStudentSessions,
    getUpcomingSessions,
    getRecentActivity,

    // Tutor
    getTutorProfile,
    searchTutorsByAvailability,

    // nuevas funciones para alumnos
    getMateriasDisponibles,
    crearSesionAlumno,
    actualizarSesionAlumno,
    cancelarSesionAlumno,

    // nuevas funciones para tutores
    getTutorSessions,
    cambiarEstadoSesion,
    getTutorDisponibilidades,
    crearDisponibilidad,
    eliminarDisponibilidad,
    getTutorMaterias,
    asignarMateriaTutor,
    eliminarMateriaTutor,
    getTutorEstadisticas,

    // nuevas funciones para administrador
    getAdminUsuarios,
    getAdminUsuario,
    cambiarEstadoUsuario,
    eliminarUsuario,
    getAdminMaterias,
    crearMateria,
    actualizarMateria,
    getAdminSesiones,
    getAdminEstadisticas,
    getAdminActividadReciente,

    // Sesiones/ratings/notifs
    getSessions,
    createSession,
    updateSession,
    cancelSession,
    createRating,
    createSessionAndNotify,
    syncSessionStatus,
    notifyUserStatusChange,
    syncCalendars,
    handleBidirectionalNotification,
    updateTutorAvailabilityAndNotify,

    // Reportes
    getDashboardStats,

    // Stub
    getTutorIdByName: getTutorIdByNameStub
  };
}


