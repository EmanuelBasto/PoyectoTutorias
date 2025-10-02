// ===============================
// Sistema de Gestión de Tutores - Interfaz Estudiante (alumnos.js)
// ===============================
document.addEventListener('DOMContentLoaded', function () {
  initializeApp();
  setupEventListeners();
  loadSection('inicio');
  if (typeof setupCommunicationSystem === 'function') {
    setupCommunicationSystem();
  }
  // Inicializar sincronización de estados con el tutor
  listenForStatusChanges();
  
  // Inicializar escucha de cambios en disponibilidades
  listenForAvailabilityChanges();
  
  // Limpiar y recrear sesiones con fechas correctas
  recreateStudentSessionsWithCorrectDates();
  
  // Configurar escucha de nuevas clases en tiempo real
  setupRealTimeClassUpdates();
  
  // Configurar sincronización con disponibilidad de tutores
  setupTutorAvailabilitySync();
  
  // Event listener para cerrar menú móvil al hacer clic fuera
  document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    
    if (sidebar && sidebarOverlay && mobileMenuToggle) {
      if (!sidebar.contains(event.target) && 
          !mobileMenuToggle.contains(event.target) && 
          sidebar.classList.contains('mobile-open')) {
        closeMobileMenu();
      }
    }
  });
  
  // Event listener para redimensionar ventana
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      closeMobileMenu();
    }
  });
});

// FUNCIONES PARA MENÚ MÓVIL
function toggleMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  
  if (sidebar && sidebarOverlay) {
    sidebar.classList.toggle('mobile-open');
    sidebarOverlay.classList.toggle('active');
    
    // Prevenir scroll del body cuando el menú está abierto
    if (sidebar.classList.contains('mobile-open')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
}

function closeMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  
  if (sidebar && sidebarOverlay) {
    sidebar.classList.remove('mobile-open');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function initializeApp() {
  console.log('Sistema de Gestión de Tutores - Interfaz Estudiante iniciada');
  // Cargar perfil del estudiante desde el backend / storage
  loadStudentProfile();
  // Cargar sesiones del estudiante desde el backend
  loadStudentSessions();
  // Sincronizar disponibilidades de tutores
  syncTutorAvailabilities();
  // Crear datos de ejemplo si no existen
  createSampleDataIfNeeded();
  
  // Verificar datos al inicializar
  setTimeout(() => {
    checkDataAvailability();
  }, 1000);
}

// Función para verificar disponibilidad de datos
function checkDataAvailability() {
  const tutorAvailabilities = JSON.parse(localStorage.getItem('tutorAvailability') || '[]');
  const tutors = JSON.parse(localStorage.getItem('usuarios') || '[]');
  const tutorUsers = tutors.filter(user => user.rol === 'Tutor' || user.rol === 'tutor');
  
  console.log('🔍 Verificación de datos al inicializar:');
  console.log('📊 Disponibilidades:', tutorAvailabilities.length);
  console.log('👥 Usuarios totales:', tutors.length);
  console.log('🎓 Tutores:', tutorUsers.length);
  
  if (tutorAvailabilities.length === 0) {
    console.log('⚠️ No hay disponibilidades configuradas por tutores reales');
    showNotification('No hay tutores con disponibilidad configurada. Los tutores deben configurar su horario primero.', 'warning');
  } else if (tutorUsers.length === 0) {
    console.log('⚠️ No hay tutores registrados');
    showNotification('No hay tutores registrados. Los tutores deben iniciar sesión primero.', 'warning');
  } else {
    console.log('✅ Datos de usuarios reales encontrados');
    console.log(`📊 ${tutorAvailabilities.length} disponibilidades de ${tutorUsers.length} tutores`);
  }
}

function setupEventListeners() {
  // Cierra el menú al hacer click fuera
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.user-info')) {
      hideUserMenu();
    }
  });

  // Abrir perfil con cualquier elemento que tenga data-action="open-profile"
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action="open-profile"]');
    if (btn) {
      e.preventDefault();
      showProfile();
    }
  });

  // Abre perfil desde cualquier disparador conocido:
  // - un elemento con id="menuProfileBtn" (por ejemplo en el dropdown "Mi perfil")
  // - o con data-action="open-profile"
  document.addEventListener('click', function (e) {
    const t = e.target.closest('#menuProfileBtn, [data-action="open-profile"]');
    if (t) {
      e.preventDefault();
      showProfile(); // abre modal y hace fetch al backend
    }
  });


   // ABRIR PERFIL (botón del menú de usuario)
  document.getElementById('menuProfileBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    showProfile(); // abre y rellena el modal con /auth/profile?email=...
  });

  // CERRAR PERFIL (botón X del modal)
  document.getElementById('profileCloseBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeProfileModal();
  });

  // Cerrar si clicas fuera del contenido del modal
  document.getElementById('profileModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'profileModal') closeProfileModal();
  });
}

// ===================== PERFIL / NOMBRE / INICIALES =====================

// Lee del storage si no hay backend (fallback) — (única definición)
function getStoredProfileFromStorage() {
  try {
    const raw = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
    if (raw) {
      const sess = JSON.parse(raw);
      const full =
        (sess?.usuario?.nombre_completo ||
          sess?.usuario?.fullName ||
          sess?.nombre_completo ||
          sess?.fullName ||
          '').trim();
      const email =
        (sess?.usuario?.email || sess?.email || localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || '').trim();
      return { nombre_completo: full, email };
    }
  } catch (e) {}
  const full =
    (localStorage.getItem('userFullName') || '').trim() ||
    (sessionStorage.getItem('userFullName') || '').trim();
  const email =
    (localStorage.getItem('userEmail') || '').trim() ||
    (sessionStorage.getItem('userEmail') || '').trim();
  return full || email ? { nombre_completo: full, email } : {};
}

// Separa nombre/apellido y calcula iniciales
function parseNameParts(profile = {}) {
  let firstName = profile.firstName || profile.nombre || '';
  let lastName = profile.lastName || profile.apellido || profile.apellidos || '';
  let fullName = profile.fullName || profile.nombre_completo || '';

  if ((!firstName || !lastName) && fullName) {
    const parts = fullName.trim().split(/\s+/);
    firstName = firstName || parts[0] || '';
    lastName = lastName || (parts.length > 1 ? parts[parts.length - 1] : '');
  }

  if (!firstName && !lastName && !fullName) {
    const fromStorage = getStoredProfileFromStorage();
    fullName = fromStorage.nombre_completo || fromStorage.fullName || '';
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      firstName = parts[0] || '';
      lastName = parts.length > 1 ? parts[parts.length - 1] : '';
    }
  }

  if (!fullName) fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const initials = `${(firstName[0] || '')}${(lastName[0] || '')}`.toUpperCase();

  return { firstName, lastName, fullName, initials };
}

// Carga perfil del backend con fallback a storage, y pinta
function loadStudentProfile() {
  const paint = (obj) => {
    // obj viene normalizado por BackendAPI.getStudentProfile()
    const parts = {
      firstName: obj.firstName || '',
      lastName : obj.lastName  || '',
      fullName : obj.fullName  || [obj.firstName, obj.lastName].filter(Boolean).join(' ').trim(),
      initials : `${(obj.firstName||'')[0]||''}${(obj.lastName||'')[0]||''}`.toUpperCase()
    };
    updateStudentWelcomeMessage(parts);
    updateStudentAvatar(parts);
  };

  if (typeof BackendAPI !== 'undefined' && BackendAPI.getStudentProfile) {
    BackendAPI.getStudentProfile()
      .then(paint)
      .catch(() => paint(getStoredProfileFromStorage()));
  } else {
    paint(getStoredProfileFromStorage());
  }
}


// “Bienvenido, Nombre Apellido”
function updateStudentWelcomeMessage(parts) {
  const el = document.getElementById('studentWelcomeName');
  if (el) el.textContent = parts.fullName || 'Usuario';
}

// Iniciales en el círculo + nombre a la derecha del avatar
function updateStudentAvatar(parts) {
  const avatarInitials = document.getElementById('studentInitials');
  if (avatarInitials) avatarInitials.textContent = parts.initials || 'US';

  const userNameEl = document.querySelector('.user-name');
  if (userNameEl) userNameEl.textContent = parts.fullName || 'Usuario';
}

// Re-pinta cuando regresas a la pestaña/ventana o vuelve del BFCache
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && document.getElementById('studentWelcomeName')) {
    loadStudentProfile();
  }
});

// También al recuperar el foco de la ventana (alt+tab, cambiar app, etc.)
window.addEventListener('focus', () => {
  if (document.getElementById('studentWelcomeName')) {
    loadStudentProfile();
  }
});

// Y cuando el navegador “restaura” la página desde caché de historial (bfcache)
window.addEventListener('pageshow', (e) => {
  if (e.persisted && document.getElementById('studentWelcomeName')) {
    loadStudentProfile();
  }
});

// Funciones para el menú móvil
function toggleMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (sidebar && overlay) {
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
  }
}

function closeMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (sidebar && overlay) {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
  }
}

// FUNCIONES DE NAVEGACIÓN
function loadSection(section) {
  // Cerrar menú móvil si está abierto
  closeMobileMenu();

  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.remove('active');
  });

  const activeItem = document.querySelector(`[data-section="${section}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
  }

  showSectionContent(section);
}

function showSectionContent(section) {
  switch (section) {
    case 'inicio':
      loadTemplate('inicioTemplate');
      break;
    case 'tutores':
      loadTemplate('tutoresTemplate');
      setupBookingForm();
      break;
    case 'horarios':
      showHorarios();
      break;
    case 'valoraciones':
      showValoraciones();
      break;
    case 'recordatorios':
      showRecordatorios();
      break;
    default:
      loadTemplate('inicioTemplate');
  }
}

function loadTemplate(templateId) {
  const template = document.getElementById(templateId);
  const mainContent = document.getElementById('mainContent');

  if (template && mainContent) {
    mainContent.innerHTML = template.innerHTML;

    // ← repinta nombre e iniciales si el template recién insertado los contiene
    if (typeof loadStudentProfile === 'function') {
      loadStudentProfile();
    }

    if (templateId === 'inicioTemplate') {
      loadUpcomingSessions();
      loadRecentActivity();
      loadDashboardStats();
    }
  }
}

// FUNCIONES PARA CARGAR DATOS DINÁMICOS DEL INICIO
function loadUpcomingSessions() {
  const sessionsList = document.querySelector('.sessions-list');
  if (!sessionsList) return;

  // Conectar con el backend para obtener las próximas sesiones
  if (typeof BackendAPI !== 'undefined' && BackendAPI.getUpcomingSessions) {
    BackendAPI.getUpcomingSessions()
      .then((sessions) => {
        displayUpcomingSessions(sessions);
      })
      .catch((error) => {
        console.error('Error cargando próximas sesiones:', error);
        displayUpcomingSessions([]);
      });
  } else {
    // Fallback: obtener sesiones del localStorage
    const studentSessions = getStudentSessions();
    displayUpcomingSessions(studentSessions);
  }
}

function displayUpcomingSessions(sessions) {
  const sessionsList = document.querySelector('.sessions-list');
  if (!sessionsList) return;

  if (sessions.length === 0) {
    sessionsList.innerHTML = `
            <div class="no-sessions-message">
                <div class="no-sessions-icon">
                    <i class="fas fa-calendar-alt"></i>
                </div>
                <h4>No tienes sesiones programadas</h4>
                <p>Busca tutores disponibles para programar tu próxima sesión de apoyo.</p>
                <button class="btn btn-primary" onclick="loadSection('tutores')">
                    <i class="fas fa-search"></i> Buscar Tutores
                </button>
            </div>
        `;
    return;
  }

  // Generar elementos de sesiones dinámicamente
  sessionsList.innerHTML = sessions
    .map(
      (session) => `
        <div class="session-item ${session.isRealClass ? 'real-class' : ''}">
            <div class="session-time">
                <span class="time">${session.time || ''}</span>
                <span class="duration">${session.duration || ''}</span>
            </div>
            <div class="session-info">
                <h4>${session.title || session.subject || ''}</h4>
                <p>${session.tutor || ''} - ${session.modality || ''}</p>
                <span class="session-date">${formatDate(session.date) || session.date || ''}</span>
                <span class="session-status">${getStatusBadge(session.status)}</span>
                ${session.isRealClass ? '<span class="real-class-badge">Clase Real</span>' : ''}
            </div>
            <div class="session-actions">
                ${session.status === 'pending' ? `
                    <button class="btn btn-success" onclick="acceptSession('${session.id}')">
                        <i class="fas fa-check"></i> Aceptar
                    </button>
                    <button class="btn btn-danger" onclick="rejectSession('${session.id}')">
                        <i class="fas fa-times"></i> Rechazar
                    </button>
                ` : `
                    <button class="btn btn-primary" onclick="joinSession('${session.id}')">Unirse</button>
                    <button class="btn btn-outline" onclick="rescheduleSession('${session.id}')">Reprogramar</button>
                    <button class="btn btn-secondary" onclick="cancelSession('${session.id}')">Cancelar</button>
                `}
            </div>
        </div>
    `
    )
    .join('');
}

// FUNCIONES PARA MANEJAR SESIONES DE ESTUDIANTES

// Función para limpiar y recrear sesiones de estudiantes con fechas correctas
function recreateStudentSessionsWithCorrectDates() {
  try {
    console.log('🧹 Limpiando y recreando sesiones de estudiantes con fechas correctas...');
    
    // Limpiar sesiones existentes
    localStorage.removeItem('pendingSessions');
    localStorage.removeItem('confirmedSessions');
    localStorage.removeItem('rejectedSessions');
    localStorage.removeItem('processedSessions');
    
    // Crear sesiones de ejemplo con fechas futuras
    createSampleSessions();
    
    console.log('✅ Sesiones de estudiantes recreadas con fechas correctas');
    
  } catch (error) {
    console.error('Error recreando sesiones de estudiantes:', error);
  }
}

// Función para crear sesiones de ejemplo para probar el flujo
function createSampleSessions() {
  try {
    console.log('Creando sesiones de ejemplo con maestros reales de la base de datos...');
    
    // Obtener clases creadas por tutores desde localStorage
    const tutorClasses = JSON.parse(localStorage.getItem('tutorClasses') || '[]');
    
    // Crear algunas sesiones de ejemplo usando los maestros reales
    const sampleSessions = [
      {
        id: 'pending_' + Date.now(),
        student: 'María González',
        studentEmail: 'maria.gonzalez@email.com',
        tutor: 'MTRMatematicas',
        tutorId: 'math-1',
        subject: 'Matemáticas',
        date: '2024-01-20',
        time: '10:00',
        endTime: '11:00',
        modality: 'Presencial',
        location: 'Aula 201',
        status: 'pending',
        createdAt: new Date().toISOString(),
        duration: '1hr'
      },
      {
        id: 'pending_' + (Date.now() + 1),
        student: 'Juan Pérez',
        studentEmail: 'juan.perez@email.com',
        tutor: 'MTRFisica',
        tutorId: 'phy-1',
        subject: 'Física',
        date: '2024-01-21',
        time: '14:00',
        endTime: '15:00',
        modality: 'Presencial',
        location: 'Laboratorio de Física',
        status: 'pending',
        createdAt: new Date().toISOString(),
        duration: '1hr'
      },
      {
        id: 'pending_' + (Date.now() + 2),
        student: 'Laura Martínez',
        studentEmail: 'laura.martinez@email.com',
        tutor: 'MTRQuimica',
        tutorId: 'chem-1',
        subject: 'Química',
        date: '2024-01-22',
        time: '16:00',
        endTime: '17:00',
        modality: 'Virtual',
        location: 'Zoom',
        status: 'pending',
        createdAt: new Date().toISOString(),
        duration: '1hr'
      }
    ];
    
    // Agregar sesiones creadas por tutores reales si existen
    tutorClasses.forEach((tutorClass, index) => {
      if (index < 3) { // Limitar a 3 sesiones adicionales
        const sessionDate = new Date(tutorClass.date);
        sessionDate.setDate(sessionDate.getDate() + index + 1); // Fechas futuras
        
        sampleSessions.push({
          id: 'tutor_class_' + tutorClass.id,
          student: 'Estudiante Actual',
          studentEmail: 'estudiante@email.com',
          tutor: tutorClass.name,
          tutorId: tutorClass.id,
          subject: tutorClass.specialty,
          date: sessionDate.toISOString().split('T')[0],
          time: tutorClass.startTime,
          endTime: tutorClass.endTime,
          modality: tutorClass.modalities[0],
          location: tutorClass.modalities[0] === 'Presencial' ? 'Aula Principal' : 'Zoom',
          status: 'pending',
          createdAt: new Date().toISOString(),
          duration: tutorClass.duration,
          isRealClass: true // Marcar como clase real
        });
      }
    });
    
    // Guardar sesiones pendientes
    localStorage.setItem('pendingSessions', JSON.stringify(sampleSessions));
    
    console.log('✅ Sesiones de ejemplo creadas con maestros reales:', sampleSessions.length);
    
  } catch (error) {
    console.error('Error creando sesiones de ejemplo:', error);
  }
}

function getStudentSessions() {
  try {
    // Obtener sesiones del estudiante desde localStorage
    const studentSessions = JSON.parse(localStorage.getItem('studentSessions')) || [];
    const pendingSessions = JSON.parse(localStorage.getItem('pendingSessions')) || [];
    const confirmedSessions = JSON.parse(localStorage.getItem('confirmedSessions')) || [];
    const rejectedSessions = JSON.parse(localStorage.getItem('rejectedSessions')) || [];
    
    // Combinar todas las sesiones del estudiante
    const allSessions = [
      ...studentSessions,
      ...pendingSessions.map(session => ({ ...session, status: 'pending' })),
      ...confirmedSessions.map(session => ({ ...session, status: 'confirmed' })),
      ...rejectedSessions.map(session => ({ ...session, status: 'rejected' }))
    ];
    
    return allSessions;
  } catch (error) {
    console.error('Error obteniendo sesiones del estudiante:', error);
    return [];
  }
}

function getStatusBadge(status) {
  const badges = {
    'pending': '<span class="badge badge-warning">Pendiente</span>',
    'confirmed': '<span class="badge badge-success">Confirmada</span>',
    'rejected': '<span class="badge badge-danger">Rechazada</span>',
    'completed': '<span class="badge badge-info">Completada</span>',
    'cancelled': '<span class="badge badge-secondary">Cancelada</span>'
  };
  return badges[status] || '<span class="badge badge-secondary">Desconocido</span>';
}

function acceptSession(sessionId) {
  try {
    // Obtener la sesión pendiente
    const pendingSessions = JSON.parse(localStorage.getItem('pendingSessions')) || [];
    const sessionIndex = pendingSessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex === -1) {
      showNotification('Sesión no encontrada', 'error');
      return;
    }
    
    const session = pendingSessions[sessionIndex];
    
    // Mover a sesiones confirmadas
    const confirmedSessions = JSON.parse(localStorage.getItem('confirmedSessions')) || [];
    confirmedSessions.push({
      ...session,
      status: 'confirmed',
      acceptedAt: new Date().toISOString()
    });
    
    // Remover de pendientes
    pendingSessions.splice(sessionIndex, 1);
    
    // Guardar en localStorage
    localStorage.setItem('pendingSessions', JSON.stringify(pendingSessions));
    localStorage.setItem('confirmedSessions', JSON.stringify(confirmedSessions));
    
    // Notificar al tutor
    notifyTutorSessionAccepted(session);
    
    showNotification('Sesión aceptada exitosamente', 'success');
    
    // Recargar sesiones
    loadUpcomingSessions();
    
  } catch (error) {
    console.error('Error aceptando sesión:', error);
    showNotification('Error al aceptar la sesión', 'error');
  }
}

function rejectSession(sessionId) {
  try {
    // Obtener la sesión pendiente
    const pendingSessions = JSON.parse(localStorage.getItem('pendingSessions')) || [];
    const sessionIndex = pendingSessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex === -1) {
      showNotification('Sesión no encontrada', 'error');
      return;
    }
    
    const session = pendingSessions[sessionIndex];
    
    // Mostrar modal para motivo de rechazo
    showRejectionModal(session);
    
  } catch (error) {
    console.error('Error rechazando sesión:', error);
    showNotification('Error al rechazar la sesión', 'error');
  }
}

function showRejectionModal(session) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Rechazar Sesión</h3>
        <span class="close" onclick="closeRejectionModal()">&times;</span>
      </div>
      <div class="modal-body">
        <p><strong>Tutor:</strong> ${session.tutor}</p>
        <p><strong>Fecha:</strong> ${session.date}</p>
        <p><strong>Hora:</strong> ${session.time}</p>
        <div class="form-group">
          <label>Motivo del rechazo *</label>
          <textarea id="rejectionReason" rows="3" placeholder="Explica por qué rechazas esta sesión..." required></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeRejectionModal()">Cancelar</button>
        <button class="btn btn-danger" onclick="confirmRejection('${session.id}')">Rechazar Sesión</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function closeRejectionModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.remove();
  }
}

function confirmRejection(sessionId) {
  const reason = document.getElementById('rejectionReason').value.trim();
  
  if (!reason) {
    showNotification('Por favor, proporciona un motivo para el rechazo', 'error');
    return;
  }
  
  try {
    // Obtener la sesión pendiente
    const pendingSessions = JSON.parse(localStorage.getItem('pendingSessions')) || [];
    const sessionIndex = pendingSessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex === -1) {
      showNotification('Sesión no encontrada', 'error');
      return;
    }
    
    const session = pendingSessions[sessionIndex];
    
    // Mover a sesiones rechazadas
    const rejectedSessions = JSON.parse(localStorage.getItem('rejectedSessions')) || [];
    rejectedSessions.push({
      ...session,
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason
    });
    
    // Remover de pendientes
    pendingSessions.splice(sessionIndex, 1);
    
    // Guardar en localStorage
    localStorage.setItem('pendingSessions', JSON.stringify(pendingSessions));
    localStorage.setItem('rejectedSessions', JSON.stringify(rejectedSessions));
    
    // Notificar al tutor
    notifyTutorSessionRejected(session, reason);
    
    showNotification('Sesión rechazada exitosamente', 'success');
    
    // Cerrar modal y recargar sesiones
    closeRejectionModal();
    loadUpcomingSessions();
    
  } catch (error) {
    console.error('Error rechazando sesión:', error);
    showNotification('Error al rechazar la sesión', 'error');
  }
}

function notifyTutorSessionAccepted(session) {
  try {
    // Crear notificación para el tutor
    const tutorNotifications = JSON.parse(localStorage.getItem('tutorNotifications')) || [];
    tutorNotifications.push({
      id: 'notif_' + Date.now(),
      type: 'session_accepted',
      title: 'Sesión Aceptada',
      message: `El estudiante ${session.student} ha aceptado la sesión de ${session.subject} programada para ${session.date} a las ${session.time}`,
      timestamp: new Date().toISOString(),
      read: false,
      sessionId: session.id
    });
    
    localStorage.setItem('tutorNotifications', JSON.stringify(tutorNotifications));
  } catch (error) {
    console.error('Error notificando al tutor:', error);
  }
}

function notifyTutorSessionRejected(session, reason) {
  try {
    // Crear notificación para el tutor
    const tutorNotifications = JSON.parse(localStorage.getItem('tutorNotifications')) || [];
    tutorNotifications.push({
      id: 'notif_' + Date.now(),
      type: 'session_rejected',
      title: 'Sesión Rechazada',
      message: `El estudiante ${session.student} ha rechazado la sesión de ${session.subject} programada para ${session.date} a las ${session.time}. Motivo: ${reason}`,
      timestamp: new Date().toISOString(),
      read: false,
      sessionId: session.id
    });
    
    localStorage.setItem('tutorNotifications', JSON.stringify(tutorNotifications));
  } catch (error) {
    console.error('Error notificando al tutor:', error);
  }
}

function loadRecentActivity() {
  const activityList = document.querySelector('.activity-list');
  if (!activityList) return;

  // Conectar con el backend para obtener las actividades recientes
  if (typeof BackendAPI !== 'undefined' && BackendAPI.getRecentActivity) {
    BackendAPI.getRecentActivity()
      .then((activities) => {
        displayRecentActivity(activities);
      })
      .catch((error) => {
        console.error('Error cargando actividades recientes:', error);
        displayRecentActivity([]);
      });
  } else {
    // Fallback: mostrar lista vacía
    displayRecentActivity([]);
  }
}

function displayRecentActivity(activities) {
  const activityList = document.querySelector('.activity-list');
  if (!activityList) return;

  if (activities.length === 0) {
    activityList.innerHTML = `
            <div class="no-activity-message">
                <div class="no-activity-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <h4>No hay actividad reciente</h4>
                <p>Tu actividad aparecerá aquí cuando tengas sesiones o interacciones con tutores.</p>
            </div>
        `;
    return;
  }

  // Generar elementos de actividad dinámicamente
  activityList.innerHTML = activities
    .map(
      (activity) => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-${activity.icon || 'clock'}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.title || ''}</h4>
                <p>${activity.description || ''}</p>
                <span class="activity-time">${activity.time || ''}</span>
            </div>
        </div>
    `
    )
    .join('');
}

function loadDashboardStats() {
  // Conectar con el backend para obtener estadísticas del dashboard
  if (typeof BackendAPI !== 'undefined' && BackendAPI.getDashboardStats) {
    BackendAPI.getDashboardStats()
      .then((stats) => {
        updateDashboardCards(stats);
      })
      .catch((error) => {
        console.error('Error cargando estadísticas:', error);
        updateDashboardCards({});
      });
  } else {
    // Fallback: mantener valores por defecto
    updateDashboardCards({});
  }
}

function updateDashboardCards(stats) {
  // Actualizar las tarjetas del dashboard con datos reales
  const cards = document.querySelectorAll('.dashboard-cards .card');

  if (cards.length >= 4) {
    // Tutores Disponibles
    if (stats.availableTutors !== undefined) {
      const tutorCard = cards[0].querySelector('.card-content');
      if (tutorCard) {
        tutorCard.innerHTML = `<h3>${stats.availableTutors}</h3><p>Tutores Disponibles</p>`;
      }
    }

    // Sesiones Programadas
    if (stats.scheduledSessions !== undefined) {
      const sessionCard = cards[1].querySelector('.card-content');
      if (sessionCard) {
        sessionCard.innerHTML = `<h3>${stats.scheduledSessions}</h3><p>Sesiones Programadas</p>`;
      }
    }

    // Promedio Valoraciones
    if (stats.averageRating !== undefined) {
      const ratingCard = cards[2].querySelector('.card-content');
      if (ratingCard) {
        ratingCard.innerHTML = `<h3>${stats.averageRating}</h3><p>Promedio Valoraciones</p>`;
      }
    }

    // Horas de Apoyo
    if (stats.totalHours !== undefined) {
      const hoursCard = cards[3].querySelector('.card-content');
      if (hoursCard) {
        hoursCard.innerHTML = `<h3>${stats.totalHours}</h3><p>Horas de Apoyo</p>`;
      }
    }
  }
}

// FUNCIONES DEL MENÚ DE USUARIO
function showUserMenu(e) {
  if (e) e.stopPropagation(); // evita que el click burbujee al listener global
  const menu = document.getElementById('userMenu');
  if (!menu) return;
  const visible = getComputedStyle(menu).display !== 'none';
  menu.style.display = visible ? 'none' : 'block';
}

function hideUserMenu() {
  const menu = document.getElementById('userMenu');
  if (menu) menu.style.display = 'none';
}

// --------- Render del perfil en el modal ---------
function renderProfileModal(profile) {
  // Normaliza campos que pueden venir con distintos nombres
  const nombre =
    profile.nombre_completo ||
    profile.fullName ||
    [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
    '—';
  const email = profile.email || '—';
  const matric = profile.matricula || profile.matrícula || profile.studentId || '—';

  const html = `
    <div class="profile-row" style="display:flex;gap:16px;align-items:center;margin-bottom:16px;">
      <div class="avatar" style="width:56px;height:56px;border-radius:50%;background:#f0c419;display:flex;align-items:center;justify-content:center;font-weight:700;">
        ${getInitialsFromName(nombre)}
      </div>
      <div>
        <div style="font-size:18px;font-weight:700;">${escapeHtml(nombre)}</div>
        <div style="color:#6c757d;">Estudiante</div>
      </div>
    </div>

    <div class="profile-field" style="padding:12px 0;border-top:1px solid #eee;">
      <div style="font-size:12px;color:#6c757d;text-transform:uppercase;letter-spacing:.02em;">Correo</div>
      <div style="font-size:16px;">${escapeHtml(email)}</div>
    </div>

    <div class="profile-field" style="padding:12px 0;border-top:1px solid #eee;">
      <div style="font-size:12px;color:#6c757d;text-transform:uppercase;letter-spacing:.02em;">Matrícula</div>
      <div style="font-size:16px;">${escapeHtml(matric)}</div>
    </div>
  `;

  const body = document.getElementById('profileBody');
  if (body) body.innerHTML = html;
}

function getInitialsFromName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/);
  const f = (parts[0] || '')[0] || '';
  const l = (parts.length > 1 ? parts[parts.length - 1] : '')[0] || '';
  return (f + l).toUpperCase() || 'US';
}

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ========= PERFIL: abrir/cerrar modal, cargar datos =========

// Click en "Mi Perfil" del menú
function openProfileModal(e) {
  if (e) e.preventDefault();
  hideUserMenu();          // cierra el menú desplegable
  showProfile();           // carga y abre
}

// Muestra el modal y pinta el perfil (si hay backend, lo usa; si no, usa storage o estático)
async function showProfile() {
  const modal = document.getElementById('profileModal');
  const body  = document.getElementById('profileBody');
  if (!modal || !body) return;

  // Abre primero el modal (aunque la red falle)
  modal.style.display = 'flex';
  body.innerHTML = '<p>Cargando perfil...</p>';

  try {
    let data = {};
    if (window.BackendAPI?.getStudentProfile) {
      data = await BackendAPI.getStudentProfile(); // {firstName,lastName,fullName,email,studentId}
    }
    const p = data?.profile || data || {};

    const firstName = (p.firstName || p.nombre || '').trim();
    const lastName  = (p.lastName  || p.apellido || p.apellidos || '').trim();
    const email     = (p.email || '').trim();
    const matricula = (p.studentId || p.matricula || p.matrícula || '').trim();

    body.innerHTML = `
      <div class="profile-row">
        <div class="profile-label">Matrícula</div>
        <div class="profile-value">${escapeHtml(matricula || '—')}</div>
      </div>
      <div class="profile-row">
        <div class="profile-label">Nombre</div>
        <div class="profile-value">${escapeHtml([firstName, lastName].filter(Boolean).join(' ') || '—')}</div>
      </div>
      <div class="profile-row">
        <div class="profile-label">Email</div>
        <div class="profile-value">${escapeHtml(email || '—')}</div>
      </div>
    `;
  } catch (err) {
    console.warn('showProfile:', err?.message || err);
    // Fallback duro para que SIEMPRE veas algo
    body.innerHTML = `
      <div class="profile-row">
        <div class="profile-label">Matrícula</div>
        <div class="profile-value">${escapeHtml(localStorage.getItem('matricula') || '—')}</div>
      </div>
      <div class="profile-row">
        <div class="profile-label">Nombre</div>
        <div class="profile-value">${escapeHtml(localStorage.getItem('userFullName') || 'Usuario')}</div>
      </div>
      <div class="profile-row">
        <div class="profile-label">Email</div>
        <div class="profile-value">${escapeHtml(BackendAPI?.getUserEmail?.() || '')}</div>
      </div>
    `;
  }
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) modal.style.display = 'none';
}

// Cerrar al hacer clic en el overlay
document.addEventListener('click', (e) => {
  const modal = document.getElementById('profileModal');
  if (!modal || modal.style.display === 'none') return;
  const card = modal.querySelector('.modal-card');
  if (e.target === modal) closeProfileModal();      // clic fuera
  if (card && card.contains(e.target)) e.stopPropagation();
});

// Cerrar con Esc
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeProfileModal();
});


function closeUserMenu(){
  const menu = document.getElementById('userMenu');
  if(menu) menu.style.display = 'none';
}

function showSettings() {
  hideUserMenu();
  showNotification('Función de configuración en desarrollo', 'info');
}

function logout() {
  hideUserMenu();

  const confirmLogout = confirm('¿Estás seguro de que quieres cerrar sesión?');

  if (confirmLogout) {
    showNotification('Cerrando sesión...', 'info');

    setTimeout(() => {
      localStorage.removeItem('userSession');
      localStorage.removeItem('userFullName');
      sessionStorage.clear();
      window.location.href = '/index.html';
    }, 1000);
  }
}

// FUNCIONES DE TUTORES
function verDetallesTutor(tutorId) {
  const tutores = {
    1: { nombre: 'Dr. Carlos López', area: 'Matemáticas y Ciencias', modalidad: 'Presencial' },
    2: { nombre: 'Dra. María García', area: 'Apoyo General', modalidad: 'Virtual' }
  };

  const tutor = tutores[tutorId];
  if (!tutor) {
    showNotification('Tutor no encontrado', 'error');
    return;
  }

  showModal({
    title: 'Detalles del Tutor',
    content: `
            <div class="tutor-detalle">
                <h4>${tutor.nombre}</h4>
                <p><strong>Área de Apoyo:</strong> ${tutor.area}</p>
                <p><strong>Modalidad:</strong> ${tutor.modalidad}</p>
            </div>
        `,
    actions: [{ text: 'Cerrar', class: 'btn-secondary', onclick: 'closeModal()' }]
  });
}

// FUNCIONES DE BÚSQUEDA Y RESERVA
function searchTutors() {
  console.log('🔍 === BÚSQUEDA DE TUTORES CON DISPONIBILIDAD REAL ===');
  
  // Obtener datos del formulario
  const searchCriteria = {
    date: document.getElementById('dateFilter')?.value,
    subject: document.getElementById('subjectFilter')?.value,
    startTime: document.getElementById('startTimeFilter')?.value,
    endTime: document.getElementById('endTimeFilter')?.value,
    modality: document.getElementById('modalityFilter')?.value
  };
  
  console.log('📋 Criterios de búsqueda:', searchCriteria);
  
  // Validar que al menos un campo esté lleno
  const hasCriteria = Object.values(searchCriteria).some(value => value && value.trim() !== '');
  if (!hasCriteria) {
    showNotification('Por favor completa al menos un campo de búsqueda', 'error');
    return;
  }
  
  // Buscar tutores con disponibilidad real
  const availableTutors = findTutorsWithRealAvailability(searchCriteria);
  
  if (availableTutors.length === 0) {
    showNotification('No se encontraron tutores disponibles con los criterios especificados', 'info');
    displayTutors([]);
    return;
  }
  
  console.log('✅ Tutores encontrados:', availableTutors.length);
  displayTutors(availableTutors);
  showNotification(`Se encontraron ${availableTutors.length} tutor${availableTutors.length > 1 ? 'es' : ''} disponible${availableTutors.length > 1 ? 's' : ''}`, 'success');
}

// Función para encontrar tutores con disponibilidad real
function findTutorsWithRealAvailability(criteria) {
  try {
    console.log('🔍 Buscando tutores con disponibilidad real...');
    
    // Obtener disponibilidad de tutores desde localStorage
    const tutorAvailability = JSON.parse(localStorage.getItem('tutorAvailability') || '[]');
    console.log('📅 Disponibilidad de tutores:', tutorAvailability.length, 'registros');
    
    // Obtener clases creadas por tutores
    const tutorClasses = JSON.parse(localStorage.getItem('tutorClasses') || '[]');
    console.log('🎓 Clases de tutores:', tutorClasses.length, 'registros');
    
    // Combinar disponibilidad y clases
    const allTutorData = [...tutorAvailability, ...tutorClasses];
    
    // Filtrar por criterios
    const matchingTutors = allTutorData.filter(tutorData => {
      return matchesSearchCriteria(tutorData, criteria);
    });
    
    // Convertir a formato de tutor para mostrar
    const tutors = matchingTutors.map(tutorData => {
      return convertToTutorFormat(tutorData);
    }).filter(tutor => tutor !== null);
    
    // Eliminar duplicados por ID
    const uniqueTutors = tutors.filter((tutor, index, self) => 
      index === self.findIndex(t => t.id === tutor.id)
    );
    
    console.log('✅ Tutores únicos encontrados:', uniqueTutors.length);
    return uniqueTutors;
    
  } catch (error) {
    console.error('❌ Error buscando tutores:', error);
    return [];
  }
}

// Función para verificar si un tutor coincide con los criterios de búsqueda
function matchesSearchCriteria(tutorData, criteria) {
  try {
    // Verificar materia
    if (criteria.subject && tutorData.subject) {
      const tutorSubject = tutorData.subject.toLowerCase();
      const searchSubject = criteria.subject.toLowerCase();
      
      if (tutorSubject !== searchSubject && !tutorSubject.includes(searchSubject)) {
        return false;
      }
    }
    
    // Verificar fecha
    if (criteria.date && tutorData.date) {
      if (tutorData.date !== criteria.date) {
        return false;
      }
    }
    
    // Verificar horario
    if (criteria.startTime && tutorData.startTime) {
      if (tutorData.startTime !== criteria.startTime) {
        return false;
      }
    }
    
    if (criteria.endTime && tutorData.endTime) {
      if (tutorData.endTime !== criteria.endTime) {
        return false;
      }
    }
    
    // Verificar modalidad
    if (criteria.modality && tutorData.modality) {
      const tutorModality = tutorData.modality.toLowerCase();
      const searchModality = criteria.modality.toLowerCase();
      
      if (tutorModality !== searchModality) {
        return false;
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error verificando criterios:', error);
    return false;
  }
}

// Función para convertir datos de tutor a formato de visualización
function convertToTutorFormat(tutorData) {
  try {
    // Determinar si es disponibilidad o clase
    const isAvailability = tutorData.hasOwnProperty('startTime') && tutorData.hasOwnProperty('endTime');
    
    if (isAvailability) {
      // Es disponibilidad de tutor
      return {
        id: `avail_${tutorData.id || Date.now()}`,
        name: getTutorNameBySubject(tutorData.subject),
        specialty: tutorData.subject,
        rating: 4.5,
        reviewsCount: Math.floor(Math.random() * 20) + 5,
        available: true,
        nextAvailable: 'Disponible ahora',
        modalities: [tutorData.modality],
        startTime: tutorData.startTime,
        endTime: tutorData.endTime,
        duration: calculateDuration(tutorData.startTime, tutorData.endTime),
        password: '123456',
        date: tutorData.date,
        isRealAvailability: true,
        location: tutorData.location || (tutorData.modality === 'Presencial' ? 'Aula Principal' : 'Zoom')
      };
    } else {
      // Es clase creada por tutor
      return {
        id: tutorData.id,
        name: tutorData.name,
        specialty: tutorData.specialty,
        rating: tutorData.rating,
        reviewsCount: tutorData.reviewsCount,
        available: tutorData.available,
        nextAvailable: tutorData.nextAvailable,
        modalities: tutorData.modalities,
        startTime: tutorData.startTime,
        endTime: tutorData.endTime,
        duration: tutorData.duration,
        password: tutorData.password,
        date: tutorData.date,
        isRealClass: true,
        location: tutorData.modalities[0] === 'Presencial' ? 'Aula Principal' : 'Zoom'
      };
    }
    
  } catch (error) {
    console.error('❌ Error convirtiendo formato de tutor:', error);
    return null;
  }
}

// Función para obtener nombre de tutor por materia
function getTutorNameBySubject(subject) {
  const tutorNames = {
    'matematicas': 'MTRMatematicas',
    'fisica': 'MTRFisica',
    'quimica': 'MTRQuimica',
    'biologia': 'MTRBiologia',
    'espanol': 'MTREspanol',
    'historia': 'MTRHistoria',
    'ingles': 'MTRIngles',
    'geografia': 'MTRGeografia',
    'filosofia': 'MTRFilosofia',
    'literatura': 'MTRLiteratura',
    'programacion': 'MTRProgramacion',
    'estadistica': 'MTREstadistica',
    'calculo': 'MTRCalculo',
    'algebra': 'MTRAlgebra'
  };
  
  return tutorNames[subject.toLowerCase()] || `MTR${subject.charAt(0).toUpperCase() + subject.slice(1)}`;
}

// Función simple para mostrar tutores de cualquier materia
function showTutorsBySubject(subject) {
  console.log('🎯 Mostrando tutores de:', subject);
  
  const tutorsResults = document.querySelector('.tutors-results');
  if (!tutorsResults) {
    console.error('❌ No se encontró el contenedor .tutors-results');
    return;
  }

  // Todos los tutores disponibles por materia - NOMBRES ÚNICOS CON FORMATO MTR
  // Obtener clases creadas por tutores desde localStorage
  const tutorClasses = JSON.parse(localStorage.getItem('tutorClasses') || '[]');
  
  // Combinar tutores existentes con clases creadas por tutores
  const allTutors = [
    // MATEMÁTICAS
    {
      id: 'math-1',
      name: 'MTRMatematicas',
      specialty: 'Matemáticas',
      rating: 4.8,
      reviewsCount: 24,
      available: true,
      nextAvailable: 'Disponible ahora',
      modalities: ['Presencial'],
      startTime: '10:00',
      endTime: '11:00',
      duration: '1hr',
      password: '123456',
      date: '2024-01-20'
    },
    
    // FÍSICA
    {
      id: 'phy-1',
      name: 'MTRFisica',
      specialty: 'Física',
      rating: 4.6,
      reviewsCount: 18,
      available: true,
      nextAvailable: 'Disponible ahora',
      modalities: ['Presencial'],
      startTime: '14:00',
      endTime: '15:00',
      duration: '1hr',
      password: '123456',
      date: '2024-01-21'
    },
    
    // QUÍMICA
    {
      id: 'chem-1',
      name: 'MTRQuimica',
      specialty: 'Química',
      rating: 4.9,
      reviewsCount: 31,
      available: true,
      nextAvailable: 'Disponible ahora',
      modalities: ['Virtual'],
      startTime: '16:00',
      endTime: '17:00',
      duration: '1hr',
      password: '123456',
      date: '2024-01-22'
    },
    
    // BIOLOGÍA
    {
      id: 'bio-1',
      name: 'MTRBiologia',
      specialty: 'Biología',
      rating: 4.7,
      reviewsCount: 23,
      available: true,
      nextAvailable: 'Disponible ahora',
      modalities: ['Presencial'],
      startTime: '09:00',
      endTime: '10:00',
      duration: '1hr',
      password: '123456',
      date: '2024-01-23'
    },
    
    // ESPAÑOL
    {
      id: 'esp-1',
      name: 'MTREspanol',
      specialty: 'Español',
      rating: 4.8,
      reviewsCount: 29,
      available: true,
      nextAvailable: 'Disponible ahora',
      modalities: ['Presencial'],
      startTime: '11:00',
      endTime: '12:00',
      duration: '1hr',
      password: '123456',
      date: '2024-01-24'
    },
    
    // HISTORIA
    {
      id: 'hist-1',
      name: 'MTRHistoria',
      specialty: 'Historia',
      rating: 4.7,
      reviewsCount: 26,
      available: true,
      nextAvailable: 'Disponible ahora',
      modalities: ['Virtual'],
      startTime: '15:00',
      endTime: '16:00',
      duration: '1hr',
      password: '123456',
      date: '2024-01-25'
    },
    
    // INGLÉS
    {
      id: 'eng-1',
      name: 'MTRIngles',
      specialty: 'Inglés',
      rating: 4.9,
      reviewsCount: 32,
      available: true,
      nextAvailable: 'Disponible ahora',
      modalities: ['Virtual'],
      startTime: '10:00',
      endTime: '11:00',
      duration: '1hr',
      password: '123456',
      date: '2024-01-26'
    },
    
    // GEOGRAFÍA
    {
      id: 'geo-1',
      name: 'MTRGeografia',
      specialty: 'Geografía',
      rating: 4.6,
      reviewsCount: 20,
      available: true,
      nextAvailable: 'Disponible ahora',
      modalities: ['Presencial'],
      startTime: '13:00',
      endTime: '14:00',
      duration: '1hr',
      password: '123456',
      date: '2024-01-27'
    },
    
    // FILOSOFÍA
    {
      id: 'fil-1',
      name: 'MTRFilosofia',
      specialty: 'Filosofía',
      rating: 4.8,
      reviewsCount: 26,
      available: true,
      nextAvailable: 'Disponible ahora',
      modalities: ['Presencial'],
      startTime: '16:00',
      endTime: '17:00',
      duration: '1hr',
      password: '123456',
      date: '2024-01-28'
    },
    
    // LITERATURA
    {
      id: 'lit-1',
      name: 'MTRLiteratura',
      specialty: 'Literatura',
      rating: 4.9,
      reviewsCount: 30,
      available: true,
      nextAvailable: 'Disponible ahora',
      modalities: ['Virtual'],
      startTime: '09:00',
      endTime: '10:00',
      duration: '1hr',
      password: '123456',
      date: '2024-01-29'
    },
    
    // PROGRAMACIÓN
    {
      id: 'prog-1',
      name: 'MTRProgramacion',
      specialty: 'Programación',
      rating: 4.8,
      reviewsCount: 28,
      available: true,
      nextAvailable: 'Disponible ahora',
      modalities: ['Virtual'],
      startTime: '14:00',
      endTime: '15:00',
      duration: '1hr',
      password: '123456',
      date: '2024-01-30'
    },
    
    // ESTADÍSTICA
    {
      id: 'est-1',
      name: 'MTREstadistica',
      specialty: 'Estadística',
      rating: 4.7,
      reviewsCount: 25,
      available: true,
      nextAvailable: 'Disponible ahora',
      modalities: ['Presencial'],
      startTime: '16:00',
      endTime: '17:00',
      duration: '1hr',
      password: '123456',
      date: '2024-01-31'
    },
    
    // CÁLCULO
    {
      id: 'calc-1',
      name: 'MTRCalculo',
      specialty: 'Cálculo',
      rating: 4.8,
      reviewsCount: 27,
      available: true,
      nextAvailable: 'Disponible ahora',
      modalities: ['Presencial'],
      startTime: '10:00',
      endTime: '11:00',
      duration: '1hr',
      password: '123456',
      date: '2024-01-29'
    },
    
    // ÁLGEBRA
    {
      id: 'alg-1',
      name: 'MTRAlgebra',
      specialty: 'Álgebra',
      rating: 4.7,
      reviewsCount: 23,
      available: true,
      nextAvailable: 'Disponible ahora',
      modalities: ['Virtual'],
      startTime: '15:00',
      endTime: '16:00',
      duration: '1hr',
      password: '123456',
      date: '2024-02-01'
    }
  ];
  
  // Agregar clases creadas por tutores
  tutorClasses.forEach(tutorClass => {
    // Convertir clase de tutor a formato de tutor para mostrar
    const tutorFromClass = {
      id: tutorClass.id,
      name: tutorClass.name,
      specialty: tutorClass.specialty,
      rating: tutorClass.rating,
      reviewsCount: tutorClass.reviewsCount,
      available: tutorClass.available,
      nextAvailable: tutorClass.nextAvailable,
      modalities: tutorClass.modalities,
      startTime: tutorClass.startTime,
      endTime: tutorClass.endTime,
      duration: tutorClass.duration,
      password: tutorClass.password,
      isNewClass: true // Marcar como clase nueva
    };
    
    allTutors.push(tutorFromClass);
  });

  // Filtrar tutores por materia - UN TUTOR POR MATERIA
  console.log('🔍 Iniciando filtrado para materia:', subject);
  console.log('📊 Total de tutores disponibles:', allTutors.length);
  
  // Buscar el tutor específico para la materia
  const filteredTutors = allTutors.filter(tutor => {
    const tutorSubject = tutor.specialty.toLowerCase();
    const searchSubject = subject.toLowerCase();
    
    // Coincidencia exacta o con variaciones comunes
    const matches = tutorSubject === searchSubject || 
                   (searchSubject === 'fisica' && tutorSubject === 'física') ||
                   (searchSubject === 'matematicas' && tutorSubject === 'matemáticas') ||
                   (searchSubject === 'quimica' && tutorSubject === 'química') ||
                   (searchSubject === 'biologia' && tutorSubject === 'biología') ||
                   (searchSubject === 'espanol' && tutorSubject === 'español') ||
                   (searchSubject === 'ingles' && tutorSubject === 'inglés') ||
                   (searchSubject === 'geografia' && tutorSubject === 'geografía') ||
                   (searchSubject === 'filosofia' && tutorSubject === 'filosofía') ||
                   (searchSubject === 'programacion' && tutorSubject === 'programación') ||
                   (searchSubject === 'estadistica' && tutorSubject === 'estadística') ||
                   (searchSubject === 'calculo' && tutorSubject === 'cálculo') ||
                   (searchSubject === 'algebra' && tutorSubject === 'álgebra');
    
    if (matches) {
      console.log(`✅ Tutor encontrado: ${tutor.name} (${tutor.specialty})`);
    }
    
    return matches;
  });
  
  console.log('📊 Tutores después del filtro:', filteredTutors.length);

  console.log('📊 Mostrando', filteredTutors.length, 'tutores de', subject);

  if (filteredTutors.length === 0) {
    tutorsResults.innerHTML = `
      <div class="no-tutors-message">
        <div class="no-tutors-icon">
          <i class="fas fa-user-tie"></i>
        </div>
        <h3>No hay tutores disponibles</h3>
        <p>No se encontraron tutores de ${subject}.</p>
        <button class="btn btn-outline" onclick="searchTutors()">
          <i class="fas fa-refresh"></i> Intentar de nuevo
        </button>
      </div>
    `;
    showNotification(`No se encontraron tutores de ${subject}`, 'warning');
    return;
  }

  // Generar HTML de las tarjetas de tutores
  tutorsResults.innerHTML = filteredTutors.map(tutor => `
        <div class="tutor-card ${tutor.isRealAvailability ? 'real-availability' : ''} ${tutor.isRealClass ? 'real-class' : ''}" data-tutor-id="${tutor.id}">
            <div class="tutor-avatar">
              <i class="fas fa-user-tie"></i>
            </div>
                <div class="tutor-info">
                  <h4>${tutor.name}</h4>
                  <div class="tutor-details">
                    <div class="tutor-specialty-section">
                      <p class="tutor-specialty">${tutor.specialty}</p>
                    </div>
                    <div class="tutor-date">
                      <span class="session-date"><i class="fas fa-calendar-alt"></i> ${formatDate(tutor.date)}</span>
                    </div>
                    <div class="tutor-schedule">
                      <span class="schedule-time"><i class="fas fa-clock"></i> ${tutor.startTime} - ${tutor.endTime}</span>
                    </div>
                    <div class="tutor-availability">
                      <span class="next-available">${tutor.nextAvailable}</span>
                    </div>
                    <div class="tutor-modalities">
                      <span class="modality-tag ${tutor.modalities[0].toLowerCase()}">${tutor.modalities[0]}</span>
                    </div>
                    <div class="tutor-duration">
                      <span class="duration">${tutor.duration}</span>
                    </div>
                    <div class="tutor-rating">
                      <div class="stars">
                        ${'★'.repeat(Math.floor(tutor.rating))}${'☆'.repeat(5 - Math.floor(tutor.rating))}
                      </div>
                      <span class="rating-text">${tutor.rating} (${tutor.reviewsCount} reseñas)</span>
                    </div>
                    ${tutor.isRealAvailability ? '<span class="real-availability-badge">Disponibilidad Real</span>' : ''}
                    ${tutor.isRealClass ? '<span class="real-class-badge">Clase Real</span>' : ''}
                  </div>
              <div class="tutor-actions">
                <button class="btn btn-primary" onclick="bookTutor('${tutor.id}')">
                  <i class="fas fa-calendar-plus"></i> Reservar Sesión
                </button>
                <button class="btn btn-outline" onclick="viewTutorProfile('${tutor.id}')">
                  <i class="fas fa-eye"></i> Ver Perfil
                </button>
              </div>
            </div>
          </div>
  `).join('');

  showNotification(`Se encontraron ${filteredTutors.length} tutor${filteredTutors.length > 1 ? 'es' : ''} de ${subject}`, 'success');
}

// Función para reservar tutor
function bookTutor(tutorId) {
  console.log('📅 Reservando tutor:', tutorId);
  showNotification('Función de reserva en desarrollo', 'info');
}

// Función para ver perfil del tutor
function viewTutorProfile(tutorId) {
  console.log('👁️ Viendo perfil del tutor:', tutorId);
  showNotification('Función de perfil en desarrollo', 'info');
}

// Función para mostrar tutores de ejemplo cuando no hay conexión al backend
function displayFallbackTutors(searchCriteria = {}) {
  console.log('🎭 displayFallbackTutors llamado con criterios:', searchCriteria);
  
  const tutorsResults = document.querySelector('.tutors-results');
  if (!tutorsResults) {
    console.error('❌ No se encontró el contenedor .tutors-results');
    return;
  }

  // Tutores de ejemplo - SOLO MATEMÁTICAS para simplificar
  const allTutors = [
    {
      id: 'demo-1',
      name: 'Dr. María González',
      specialty: 'Matemáticas',
      rating: 4.8,
      reviewsCount: 24,
      available: true,
      nextAvailable: 'Disponible ahora',
      modalities: ['Presencial', 'Virtual'],
      price: 150,
      availabilities: [
        { date: '2025-01-03', startTime: '09:00', endTime: '11:00', modality: 'Presencial' },
        { date: '2025-01-03', startTime: '14:00', endTime: '16:00', modality: 'Virtual' }
      ]
    },
    {
      id: 'demo-2',
      name: 'Prof. Luis Hernández',
      specialty: 'Matemáticas',
      rating: 4.7,
      reviewsCount: 22,
      available: true,
      nextAvailable: 'Esta semana',
      modalities: ['Presencial'],
      price: 140,
      availabilities: [
        { date: '2025-01-05', startTime: '08:00', endTime: '10:00', modality: 'Presencial' }
      ]
    },
    {
      id: 'demo-3',
      name: 'Dra. Carmen López',
      specialty: 'Matemáticas',
      rating: 4.9,
      reviewsCount: 35,
      available: true,
      nextAvailable: 'Próxima semana',
      modalities: ['Virtual'],
      price: 160,
      availabilities: [
        { date: '2025-01-06', startTime: '15:00', endTime: '17:00', modality: 'Virtual' }
      ]
    },
    {
      id: 'demo-4',
      name: 'Prof. Roberto Silva',
      specialty: 'Matemáticas',
      rating: 4.5,
      reviewsCount: 19,
      available: true,
      nextAvailable: 'Esta semana',
      modalities: ['Presencial', 'Virtual'],
      price: 130,
      availabilities: [
        { date: '2025-01-07', startTime: '09:00', endTime: '11:00', modality: 'Presencial' },
        { date: '2025-01-08', startTime: '14:00', endTime: '16:00', modality: 'Virtual' }
      ]
    },
    {
      id: 'demo-5',
      name: 'Dra. Patricia Vega',
      specialty: 'Matemáticas',
      rating: 4.8,
      reviewsCount: 28,
      available: true,
      nextAvailable: 'Mañana',
      modalities: ['Presencial'],
      price: 170,
      availabilities: [
        { date: '2025-01-04', startTime: '10:00', endTime: '12:00', modality: 'Presencial' }
      ]
    }
  ];

  console.log('📊 Total de tutores disponibles:', allTutors.length);

  // Filtrar tutores según los criterios de búsqueda
  let filteredTutors = allTutors;

  // Filtrar por materia
  if (searchCriteria.subject) {
    console.log('🔍 Filtrando por materia:', searchCriteria.subject);
    
    filteredTutors = filteredTutors.filter(tutor => {
      const tutorSubject = tutor.specialty.toLowerCase();
      const searchSubject = searchCriteria.subject.toLowerCase();
      
      console.log(`📚 Comparando: "${tutorSubject}" vs "${searchSubject}"`);
      
      // Coincidencia exacta o que contenga la palabra
      const matches = tutorSubject === searchSubject || tutorSubject.includes(searchSubject);
      console.log(`📚 Tutor ${tutor.name} (${tutor.specialty}) - Coincide: ${matches}`);
      
      return matches;
    });
    
    console.log('📊 Tutores después del filtro de materia:', filteredTutors.length);
  }

  // Filtrar por modalidad
  if (searchCriteria.modality) {
    filteredTutors = filteredTutors.filter(tutor => 
      tutor.modalities.some(mod => 
        mod.toLowerCase() === searchCriteria.modality.toLowerCase()
      )
    );
  }

  // Filtrar por fecha
  if (searchCriteria.date) {
    filteredTutors = filteredTutors.filter(tutor => 
      tutor.availabilities.some(avail => avail.date === searchCriteria.date)
    );
  }

  // Filtrar por hora de inicio
  if (searchCriteria.startTime) {
    filteredTutors = filteredTutors.filter(tutor => 
      tutor.availabilities.some(avail => avail.startTime === searchCriteria.startTime)
    );
  }

  console.log('🎭 Mostrando tutores filtrados:', {
    criterios: searchCriteria,
    total: allTutors.length,
    filtrados: filteredTutors.length
  });

  // Si no hay tutores que coincidan con los filtros, mostrar mensaje específico
  if (filteredTutors.length === 0 && Object.keys(searchCriteria).some(key => searchCriteria[key])) {
    console.log('⚠️ No hay tutores que coincidan con los criterios');
    tutorsResults.innerHTML = `
      <div class="no-tutors-message">
        <div class="no-tutors-icon">
          <i class="fas fa-user-tie"></i>
        </div>
        <h3>No hay tutores disponibles</h3>
        <p>No se encontraron tutores que coincidan con los criterios seleccionados.</p>
        <button class="btn btn-outline" onclick="searchTutors()">
          <i class="fas fa-refresh"></i> Intentar de nuevo
        </button>
      </div>
    `;
    return;
  }

  // Mostrar tutores filtrados usando displayTutors
  console.log('✅ Mostrando tutores filtrados:', filteredTutors.length);
  displayTutors(filteredTutors);
}

// Función para calcular duración entre dos horas
// Función para formatear fechas
function formatDate(dateString) {
  if (!dateString) return 'Fecha no especificada';
  
  try {
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return dateString;
  }
}

function calculateDuration(startTime, endTime) {
  // Validar que ambos parámetros existan y sean válidos
  if (!startTime || !endTime || startTime.trim() === '' || endTime.trim() === '') {
    return '';
  }
  
  // Validar formato de hora (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    console.warn('Formato de hora inválido:', { startTime, endTime });
    return '';
  }
  
  try {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    // Validar que los números sean válidos
    if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
      console.warn('Valores de hora no numéricos:', { startHour, startMin, endHour, endMin });
      return '';
    }
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const durationMinutes = endMinutes - startMinutes;
    
    if (durationMinutes <= 0) return '0 min';
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours}hr`;
    } else {
      return `${hours}hr ${minutes}min`;
    }
  } catch (error) {
    console.error('Error calculando duración:', error);
    return '';
  }
}

// Función para obtener tutores disponibles basados en disponibilidades reales
function getAvailableTutors(filters) {
  try {
    console.log('🔍 Buscando tutores disponibles con filtros:', filters);
    
    // Obtener disponibilidades de tutores desde localStorage
    let tutorAvailabilities = JSON.parse(localStorage.getItem('tutorAvailability')) || [];
    let tutors = JSON.parse(localStorage.getItem('usuarios')) || [];
    
    console.log('📊 Disponibilidades encontradas:', tutorAvailabilities.length);
    console.log('👥 Usuarios encontrados:', tutors.length);
    
    // Si no hay datos, crear datos de ejemplo
  // Solo usar datos reales de usuarios logueados
  if (tutorAvailabilities.length === 0) {
    console.log('⚠️ No hay disponibilidades configuradas por tutores reales');
    console.log('🔧 Creando datos de ejemplo temporalmente para diagnóstico...');
    
    // Crear datos de ejemplo temporalmente para diagnóstico
    createSampleDataIfNeeded();
    
    // Recargar datos después de crear los de ejemplo
    tutorAvailabilities = JSON.parse(localStorage.getItem('tutorAvailability')) || [];
    tutors = JSON.parse(localStorage.getItem('usuarios')) || [];
    console.log('📊 Disponibilidades después de crear ejemplo:', tutorAvailabilities.length);
    console.log('👥 Usuarios después de crear ejemplo:', tutors.length);
  }
  
  if (tutors.length === 0) {
    console.log('⚠️ No hay usuarios registrados');
    console.log('🔧 Creando usuarios de ejemplo temporalmente para diagnóstico...');
    createSampleDataIfNeeded();
    
    // Recargar datos después de crear los de ejemplo
    tutors = JSON.parse(localStorage.getItem('usuarios')) || [];
    console.log('👥 Usuarios después de crear ejemplo:', tutors.length);
  }
    
    // Filtrar tutores por rol
    const tutorUsers = tutors.filter(user => user.rol === 'Tutor' || user.rol === 'tutor');
    console.log('🎓 Tutores con rol correcto:', tutorUsers.length);
    
    // Crear lista de tutores disponibles
    const availableTutors = [];
    
    // Aplicar filtros específicos que coinciden con los campos del tutor
    console.log('🔍 Aplicando filtros a', tutorAvailabilities.length, 'disponibilidades');
    console.log('🔍 Filtros aplicados:', filters);
    
    tutorAvailabilities.forEach((availability, index) => {
      console.log(`🔍 Verificando disponibilidad ${index + 1}:`, availability);
      
      // Verificar si coincide con los filtros del alumno
      let matches = true;
      
      // Filtro por fecha (solo si se especifica)
      if (filters.date && availability.date !== filters.date) {
        console.log('❌ Fecha no coincide:', availability.date, 'vs', filters.date);
        matches = false;
      }
      
      // Filtro por materia (solo si se especifica)
      if (filters.subject && availability.subject !== filters.subject) {
        console.log('❌ Materia no coincide:', availability.subject, 'vs', filters.subject);
        matches = false;
      }
      
      // Filtro por hora de inicio (solo si se especifica)
      if (filters.startTime && availability.startTime !== filters.startTime) {
        console.log('❌ Hora inicio no coincide:', availability.startTime, 'vs', filters.startTime);
        matches = false;
      }
      
      // Filtro por hora de fin (solo si se especifica)
      if (filters.endTime && availability.endTime !== filters.endTime) {
        console.log('❌ Hora fin no coincide:', availability.endTime, 'vs', filters.endTime);
        matches = false;
      }
      
      // Filtro por modalidad (solo si se especifica)
      if (filters.modality && availability.modality !== filters.modality) {
        console.log('❌ Modalidad no coincide:', availability.modality, 'vs', filters.modality);
        matches = false;
      }
      
      // Si no hay filtros específicos, mostrar todas las disponibilidades
      if (!filters.date && !filters.subject && !filters.startTime && !filters.endTime && !filters.modality) {
        console.log('📋 Sin filtros específicos, mostrando todas las disponibilidades');
        matches = true;
      }
      
      if (!matches) {
        console.log(`❌ Disponibilidad ${index + 1} no coincide con filtros`);
        return;
      }
      
      console.log(`✅ Disponibilidad ${index + 1} coincide con filtros`);
      
      // Buscar el tutor correspondiente por nombre o ID
      console.log(`🔍 Buscando tutor para disponibilidad ${index + 1}:`, availability.tutor);
      let tutor = tutorUsers.find(t => t.nombreCompleto === availability.tutor);
      
      // Si no se encuentra por nombre, buscar por ID
      if (!tutor && availability.tutorId) {
        console.log(`🔍 Buscando tutor por ID:`, availability.tutorId);
        tutor = tutorUsers.find(t => t.id === availability.tutorId);
      }
      
      // Si no se encuentra por ID, buscar por email
      if (!tutor && availability.tutorEmail) {
        console.log(`🔍 Buscando tutor por email:`, availability.tutorEmail);
        tutor = tutorUsers.find(t => t.email === availability.tutorEmail);
      }
      
      if (!tutor) {
        console.log(`❌ Tutor NO encontrado para disponibilidad ${index + 1}:`, availability.tutor, 'ID:', availability.tutorId);
        console.log(`📋 Tutores disponibles:`, tutorUsers.map(t => ({ id: t.id, nombre: t.nombreCompleto, email: t.email })));
        return;
      }
      
      console.log(`✅ Tutor encontrado para disponibilidad ${index + 1}:`, tutor.nombreCompleto);
      
      // Verificar si ya existe en la lista
      const existingTutor = availableTutors.find(t => t.id === tutor.id);
      if (existingTutor) {
        // Agregar disponibilidad al tutor existente
        existingTutor.availabilities.push(availability);
        console.log('➕ Agregada disponibilidad al tutor existente:', tutor.nombreCompleto);
      } else {
        // Crear nuevo tutor con disponibilidad
        availableTutors.push({
          id: tutor.id,
          name: tutor.nombreCompleto,
          email: tutor.email,
          specialty: availability.subject,
          specialties: [availability.subject],
          rating: 4.5,
          reviewsCount: Math.floor(Math.random() * 20) + 5,
          sessionsCompleted: Math.floor(Math.random() * 50) + 10,
          studentsHelped: Math.floor(Math.random() * 30) + 5,
          available: true,
          nextAvailable: formatNextAvailable(availability),
          modalities: [availability.modality],
          price: null,
          availabilities: [availability]
        });
        console.log('🆕 Creado nuevo tutor disponible:', tutor.nombreCompleto);
      }
    });
    
    console.log('📊 RESUMEN DE BÚSQUEDA:');
    console.log('- Disponibilidades verificadas:', tutorAvailabilities.length);
    console.log('- Tutores disponibles encontrados:', availableTutors.length);
    console.log('- Tutores en la lista final:', availableTutors.map(t => t.name));
    
    if (availableTutors.length === 0) {
      console.log('❌ NO SE ENCONTRARON TUTORES');
      console.log('🔍 Posibles causas:');
      console.log('1. No hay disponibilidades configuradas');
      console.log('2. Los filtros no coinciden con ninguna disponibilidad');
      console.log('3. Los tutores no están correctamente enlazados');
      console.log('4. Los datos no están guardados correctamente');
    }
    
    return availableTutors;
  } catch (error) {
    console.error('❌ Error obteniendo tutores disponibles:', error);
    return [];
  }
}

// Función auxiliar para formatear la próxima disponibilidad
function formatNextAvailable(availability) {
  try {
    const date = new Date(availability.date);
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
    const time = availability.startTime;
    return `${dayName} ${time}`;
  } catch (error) {
    return 'Próximamente';
  }
}

// Función para mostrar los tutores obtenidos del backend
function displayTutors(tutors) {
  console.log('🎨 displayTutors llamado con:', tutors.length, 'tutores');
  
  const tutorsResults = document.querySelector('.tutors-results');

  if (!tutorsResults) {
    console.error('No se encontró el contenedor de tutores');
    return;
  }

  if (tutors.length === 0) {
    console.log('⚠️ No hay tutores para mostrar');
    tutorsResults.innerHTML = `
            <div class="no-tutors-message">
                <div class="no-tutors-icon">
                    <i class="fas fa-user-tie"></i>
                </div>
                <h3>No hay tutores disponibles</h3>
                <p>No se encontraron tutores que coincidan con tus criterios de búsqueda.</p>
                <button class="btn btn-outline" onclick="searchTutors()">
                    <i class="fas fa-refresh"></i> Intentar de nuevo
                </button>
            </div>
        `;
    return;
  }

  console.log('🎨 Mostrando', tutors.length, 'tutores en la interfaz');

  // Generar tarjetas de tutores dinámicamente
  tutorsResults.innerHTML = tutors
    .map(
      (tutor) => {
        // Obtener información de disponibilidad
        const availabilities = tutor.availabilities || [];
        const nextAvailability = availabilities.length > 0 ? availabilities[0] : null;
        
        return `
        <div class="tutor-card" data-tutor-id="${tutor.id}">
            <div class="tutor-avatar">
                <i class="fas fa-user-tie"></i>
            </div>
            <div class="tutor-info">
                <h4>${tutor.name || ''}</h4>
                <p class="tutor-specialty">${tutor.specialty || ''}</p>
                <div class="tutor-details">
                    <div class="tutor-rating">
                        <div class="stars">
                            ${generateStars(tutor.rating || 0)}
                        </div>
                        <span class="rating-text">${tutor.rating ? `${tutor.rating} (${tutor.reviewsCount || 0} reseñas)` : 'Sin calificaciones'}</span>
                    </div>
                    <div class="tutor-availability">
                        <span class="availability-badge ${tutor.available ? 'available' : 'busy'}">
                            ${tutor.available ? 'Disponible' : 'Ocupado'}
                        </span>
                        <span class="next-slot">${tutor.nextAvailable || ''}</span>
                    </div>
                    <div class="tutor-modalities">
                        ${tutor.modalities ? tutor.modalities.map((modality) => `<span class="modality-badge ${modality.toLowerCase()}">${modality}</span>`).join('') : ''}
                    </div>
                    <div class="tutor-schedule-info">
                        <i class="fas fa-calendar-alt"></i>
                        <span class="schedule-text">
                            ${availabilities.length > 0 ? 
                              `${availabilities.length} horario${availabilities.length > 1 ? 's' : ''} disponible${availabilities.length > 1 ? 's' : ''}` : 
                              'Sin horarios configurados'
                            }
                        </span>
                    </div>
                    <div class="tutor-price">
                        <span class="price">${tutor.price ? `$${tutor.price}/hora` : 'Precio no disponible'}</span>
                    </div>
                </div>
            </div>
            <div class="tutor-actions">
                <button class="btn btn-primary" onclick="bookTutor('${tutor.id}')">
                    <i class="fas fa-calendar-plus"></i> Solicitar Sesión
                </button>
                <button class="btn btn-outline" onclick="viewTutorProfile('${tutor.id}')">
                    <i class="fas fa-user"></i> Ver Perfil
                </button>
                ${availabilities.length > 0 ? `
                <button class="btn btn-info" onclick="showTutorAvailabilityDetails('${tutor.id}')">
                    <i class="fas fa-calendar-alt"></i> Ver Horarios
                </button>
                ` : ''}
            </div>
        </div>
    `;
      }
    )
    .join('');
}

// Función para ver el perfil completo del tutor
function viewTutorProfile(tutorId) {
  // Esta función se conectará con el backend para obtener el perfil completo del tutor
  if (typeof BackendAPI !== 'undefined' && BackendAPI.getTutorProfile) {
    BackendAPI.getTutorProfile(tutorId)
      .then((tutorProfile) => {
        showTutorProfileModal(tutorProfile);
      })
      .catch((error) => {
        console.error('Error obteniendo perfil del tutor:', error);
        showNotification('Error al cargar el perfil del tutor', 'error');
      });
  } else {
    // Fallback: mostrar modal vacío
    showTutorProfileModal({});
  }
}

// Función para mostrar el modal del perfil del tutor
function showTutorProfileModal(tutorProfile) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
        <div class="modal-content tutor-profile-modal">
            <div class="modal-header">
                <h3><i class="fas fa-user-tie"></i> Perfil del Tutor</h3>
                <span class="close" onclick="closeTutorProfileModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="tutor-profile-content">
                    <div class="tutor-profile-header">
                        <div class="tutor-avatar-large">
                            <i class="fas fa-user-tie"></i>
                        </div>
                        <div class="tutor-profile-info">
                            <h2>${tutorProfile.name || 'Nombre no disponible'}</h2>
                            <p class="tutor-specialty">${tutorProfile.specialty || 'Especialidad no disponible'}</p>
                            <div class="tutor-rating-large">
                                <div class="stars">
                                    ${generateStars(tutorProfile.rating || 0)}
                                </div>
                                <span class="rating-text">${tutorProfile.rating ? `${tutorProfile.rating} (${tutorProfile.reviewsCount || 0} reseñas)` : 'Sin calificaciones'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="tutor-profile-details">
                        <div class="detail-section">
                            <h4><i class="fas fa-graduation-cap"></i> Educación</h4>
                            <p>${tutorProfile.education || 'Información no disponible'}</p>
                        </div>

                        <div class="detail-section">
                            <h4><i class="fas fa-briefcase"></i> Experiencia</h4>
                            <p>${tutorProfile.experience || 'Información no disponible'}</p>
                        </div>

                        <div class="detail-section">
                            <h4><i class="fas fa-book"></i> Áreas de Especialización</h4>
                            <div class="specialties">
                                ${tutorProfile.specialties ? tutorProfile.specialties.map((specialty) => `<span class="specialty-badge">${specialty}</span>`).join('') : '<span class="specialty-badge">No especificado</span>'}
                            </div>
                        </div>

                        <div class="detail-section">
                            <h4><i class="fas fa-clock"></i> Disponibilidad</h4>
                            <p>${tutorProfile.availability || 'Información no disponible'}</p>
                        </div>

                        <div class="detail-section">
                            <h4><i class="fas fa-dollar-sign"></i> Tarifas</h4>
                            <p>${tutorProfile.pricing || 'Información no disponible'}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeTutorProfileModal()">Cerrar</button>
                <button class="btn btn-primary" onclick="bookTutor('${tutorProfile.id}'); closeTutorProfileModal();">
                    <i class="fas fa-calendar-plus"></i> Solicitar Sesión
                </button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);
}

// Función para cerrar el modal del perfil del tutor
function closeTutorProfileModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.remove();
  }
}

// Función para cambiar el campo de ubicación según la modalidad
function toggleLocationField(selectElement) {
  const locationField = document.getElementById('locationField');
  const locationLabel = document.getElementById('locationLabel');
  const locationInput = locationField.querySelector('input[name="location"]');

  if (selectElement.value === 'presencial') {
    locationLabel.textContent = 'Ubicación *';
    locationInput.placeholder = 'Aula específica o dirección';
  } else if (selectElement.value === 'virtual') {
    locationLabel.textContent = 'Enlace de Reunión *';
    locationInput.placeholder = 'Enlace de Zoom, Meet, etc.';
  }
}

function bookTutor(tutorId) {
  console.log('📅 Solicitando sesión con tutor:', tutorId);
  
  // Marcar el tutor como seleccionado
  document.querySelectorAll('.tutor-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  const tutorCard = document.querySelector(`[data-tutor-id="${tutorId}"]`);
  if (tutorCard) {
    tutorCard.classList.add('selected');
  }
  
  // Obtener datos del tutor y mostrar formulario
  if (typeof BackendAPI !== 'undefined' && BackendAPI.getTutorProfile) {
    BackendAPI.getTutorProfile(tutorId)
      .then((tutorData) => {
        setupBookingFormWithTutorData(tutorId, tutorData);
      })
      .catch((error) => {
        console.error('Error obteniendo datos del tutor:', error);
        showNotification('Error al cargar datos del tutor', 'error');
      });
  } else {
    // Fallback: obtener datos del tutor desde localStorage
    const tutors = JSON.parse(localStorage.getItem('usuarios')) || [];
    const tutor = tutors.find(t => t.id === tutorId);
    
    if (tutor) {
      setupBookingFormWithTutorData(tutorId, tutor);
    } else {
      showNotification('Tutor no encontrado', 'error');
      return;
    }
  }
}

// Función auxiliar para configurar el formulario de reserva con datos del tutor
function setupBookingFormWithTutorData(tutorId, tutorData) {
      const selectedTutorInput = document.getElementById('selectedTutor');
      if (selectedTutorInput) {
    selectedTutorInput.value = tutorData.name || tutorData.nombreCompleto || '';
      }
      
      // Crear input hidden con el ID del tutor
      let hiddenInput = document.getElementById('selectedTutorId');
      if (!hiddenInput) {
        hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.id = 'selectedTutorId';
        document.getElementById('bookingForm').appendChild(hiddenInput);
      }
      hiddenInput.value = tutorId;
  
  // Obtener disponibilidades del tutor para pre-llenar el formulario
  const tutorAvailabilities = JSON.parse(localStorage.getItem('tutorAvailability')) || [];
  const tutorAvailability = tutorAvailabilities.find(av => av.tutor === (tutorData.name || tutorData.nombreCompleto));
  
  if (tutorAvailability) {
    console.log('📋 Configurando formulario con disponibilidad del tutor:', tutorAvailability);
    
    // Pre-llenar campos del formulario con la disponibilidad del tutor
    const areaSelect = document.querySelector('select[name="area"]');
    if (areaSelect && tutorAvailability.subject) {
      areaSelect.value = tutorAvailability.subject;
    }
    
    const modalitySelect = document.querySelector('select[name="modality"]');
    if (modalitySelect && tutorAvailability.modality) {
      modalitySelect.value = tutorAvailability.modality.toLowerCase();
    }
    
    const timeSelect = document.querySelector('select[name="time"]');
    if (timeSelect && tutorAvailability.startTime) {
      timeSelect.value = tutorAvailability.startTime;
    }
    
    // Configurar fecha mínima
    const dateInput = document.querySelector('input[name="date"]');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;
      
      // Si la disponibilidad es para hoy o futuro, sugerir esa fecha
      if (tutorAvailability.date >= today) {
        dateInput.value = tutorAvailability.date;
      }
    }
    }
    
    // Mostrar formulario
    const bookingSection = document.getElementById('bookingSection');
    if (bookingSection) {
      bookingSection.style.display = 'block';
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    
    // Mostrar notificación informativa
    if (tutorAvailability) {
      showNotification(`Formulario pre-configurado con la disponibilidad del tutor`, 'info');
    }
  }
}

function closeBookingSection() {
  const bookingSection = document.getElementById('bookingSection');
  if (bookingSection) {
    bookingSection.style.display = 'none';
  }
}

function viewTutorProfile(tutorId) {
  showNotification(`Viendo perfil del tutor ${tutorId}`, 'info');
}

// FUNCIONES DE SESIONES
function joinSession(sessionId) {
  showNotification(`Uniéndose a la sesión ${sessionId}...`, 'info');
  setTimeout(() => {
    showNotification('¡Sesión iniciada!', 'success');
  }, 1000);
}

function rescheduleSession(sessionId) {
  showNotification('Función de reprogramación en desarrollo', 'info');
}

function cancelSession(sessionId) {
  const confirmCancel = confirm('¿Estás seguro de que quieres cancelar esta sesión?');
  if (confirmCancel) {
    // Usar la nueva función para cancelar sesión
    if (typeof BackendAPI !== 'undefined' && BackendAPI.cancelarSesionAlumno) {
      BackendAPI.cancelarSesionAlumno(sessionId, 'Cancelación por estudiante')
        .then(() => {
          showNotification('Sesión cancelada exitosamente', 'success');
          // Recargar sesiones
          loadStudentSessions();
          // Actualizar calendario si está visible
          if (document.getElementById('calendarDays')) {
            initializeCalendar();
          }
        })
        .catch((error) => {
          console.error('Error al cancelar sesión:', error);
          showNotification('Error al cancelar la sesión', 'error');
        });
    } else {
      showNotification('Sesión cancelada exitosamente', 'success');
    }
  }
}

// SECCIONES DINÁMICAS
function showHorarios() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
        <div class="content-header">
            <h2>Sesiones Programadas</h2>
            <p>Gestiona y visualiza tus sesiones de apoyo académico</p>
        </div>

        <div class="calendar-container">
            <div class="calendar-header">
                <button class="btn btn-outline" onclick="previousMonth()">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <h3 id="currentMonth">Septiembre 2024</h3>
                <button class="btn btn-outline" onclick="nextMonth()">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <div class="calendar">
                <div class="calendar-weekdays">
                    <div class="weekday">DOM</div>
                    <div class="weekday">LUN</div>
                    <div class="weekday">MAR</div>
                    <div class="weekday">MIÉ</div>
                    <div class="weekday">JUE</div>
                    <div class="weekday">VIE</div>
                    <div class="weekday">SÁB</div>
                </div>
                <div class="calendar-days" id="calendarDays">
                    <!-- Los días se generan dinámicamente -->
                </div>
            </div>

            <div class="calendar-legend">
                <div class="legend-item">
                    <div class="legend-circle accepted"></div>
                    <span>Sesión Aceptada</span>
                </div>
                <div class="legend-item">
                    <div class="legend-circle postponed"></div>
                    <span>Sesión Pospuesta</span>
                </div>
                <div class="legend-item">
                    <div class="legend-circle rejected"></div>
                    <span>Sesión Rechazada/Cancelada</span>
                </div>
            </div>
        </div>
    `;

  // Cargar sesiones del estudiante desde el backend
  loadStudentSessions();

  // Inicializar calendario
  initializeCalendar();
}

function showValoraciones() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
        <div class="content-header">
            <h2>Valoraciones de Sesiones</h2>
            <p>Califica y comenta sobre tus sesiones de apoyo académico</p>
        </div>

        <div class="valoraciones-content">
            <!-- Sesiones Pendientes de Valoración -->
            <div class="pending-ratings">
                <h3><i class="fas fa-clock"></i> Sesiones Pendientes de Valoración</h3>
                <div class="sessions-to-rate">
                    <!-- Las sesiones se cargarán dinámicamente desde el backend -->
                </div>
            </div>

            <!-- Mis Valoraciones Anteriores -->
            <div class="my-ratings">
                <h3><i class="fas fa-star"></i> Mis Valoraciones</h3>
                <div class="ratings-list">
                    <!-- Las valoraciones se cargarán dinámicamente desde el backend -->
                </div>
            </div>
        </div>

        <!-- Modal de Valoración -->
        <div class="rating-modal" id="ratingModal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Valorar Sesión</h3>
                    <span class="close" onclick="closeRatingModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="ratingForm">
                        <div class="form-group">
                            <label>Tutor</label>
                            <input type="text" id="tutorName" readonly>
                        </div>
                        <div class="form-group">
                            <label>Área de Apoyo</label>
                            <input type="text" id="sessionArea" readonly>
                        </div>
                        <div class="form-group">
                            <label>Calificación *</label>
                            <div class="star-rating">
                                <input type="radio" name="rating" value="5" id="star5">
                                <label for="star5"><i class="fas fa-star"></i></label>
                                <input type="radio" name="rating" value="4" id="star4">
                                <label for="star4"><i class="fas fa-star"></i></label>
                                <input type="radio" name="rating" value="3" id="star3">
                                <label for="star3"><i class="fas fa-star"></i></label>
                                <input type="radio" name="rating" value="2" id="star2">
                                <label for="star2"><i class="fas fa-star"></i></label>
                                <input type="radio" name="rating" value="1" id="star1">
                                <label for="star1"><i class="fas fa-star"></i></label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Comentario (Opcional)</label>
                            <textarea name="comment" rows="4" placeholder="Comparte tu experiencia con esta sesión de apoyo..."></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeRatingModal()">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Enviar Valoración</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
  setupValoracionForm();
}

function showRecordatorios() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
        <div class="content-header">
            <h2>Recordatorios</h2>
            <p>Mantente al día con tus sesiones y tareas</p>
        </div>
        <div class="recordatorios-content">
            <!-- Los recordatorios se cargarán dinámicamente desde el backend -->
        </div>
    `;
}

// FUNCIONES DE VALORACIONES (RF-18)
function rateSession(sessionId) {
  // Esta función se conectará con el backend para obtener los datos reales de la sesión
  if (typeof BackendAPI !== 'undefined' && BackendAPI.getSessionDetails) {
    BackendAPI.getSessionDetails(sessionId)
      .then((sessionData) => {
        document.getElementById('tutorName').value = sessionData.tutorName || '';
        document.getElementById('sessionArea').value = sessionData.area || '';
        document.getElementById('ratingModal').style.display = 'block';
      })
      .catch((error) => {
        console.error('Error obteniendo datos de la sesión:', error);
        document.getElementById('tutorName').value = '';
        document.getElementById('sessionArea').value = '';
        document.getElementById('ratingModal').style.display = 'block';
      });
  } else {
    // Fallback: campos vacíos
    document.getElementById('tutorName').value = '';
    document.getElementById('sessionArea').value = '';
    document.getElementById('ratingModal').style.display = 'block';
  }
}

function closeRatingModal() {
  document.getElementById('ratingModal').style.display = 'none';
  document.getElementById('ratingForm').reset();
}

function setupValoracionForm() {
  const ratingForm = document.getElementById('ratingForm');
  if (ratingForm) {
    ratingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      handleRatingSubmit(this);
    });
  }
}

function handleRatingSubmit(form) {
  const formData = new FormData(form);
  const ratingData = {
    tutorId: getSelectedTutorId(),
    tutor: formData.get('tutor') || document.getElementById('tutorName').value,
    area: formData.get('area') || document.getElementById('sessionArea').value,
    rating: parseInt(formData.get('rating')),
    comment: formData.get('comment'),
    sessionId: formData.get('sessionId') || 'session_001' // En un sistema real, esto vendría del contexto
  };

  if (!ratingData.rating) {
    showNotification('Por favor selecciona una calificación', 'error');
    return;
  }

  console.log('Nueva valoración:', ratingData);

  // Usar la función de conexión para crear valoración y actualizar promedio del tutor
  if (typeof BackendAPI !== 'undefined' && BackendAPI.createRatingAndUpdateAverage) {
    BackendAPI.createRatingAndUpdateAverage(ratingData)
      .then((response) => {
        showNotification('Valoración enviada exitosamente', 'success');

        // Cerrar modal y actualizar lista
        closeRatingModal();

        // Simular actualización de la lista
        setTimeout(() => {
          showNotification('Lista de valoraciones actualizada', 'info');
        }, 1000);
      })
      .catch((error) => {
        console.error('Error al enviar valoración:', error);
        showNotification('Error al enviar la valoración', 'error');
      });
  } else {
    // Fallback: simular envío
    showNotification('Valoración enviada exitosamente', 'success');

    // Cerrar modal y actualizar lista
    closeRatingModal();

    // Simular actualización de la lista
    setTimeout(() => {
      showNotification('Lista de valoraciones actualizada', 'info');
    }, 1000);
  }
}

// FUNCIONES DEL CALENDARIO DE HORARIOS
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

function initializeCalendar() {
  generateCalendar(currentMonth, currentYear);
}

function generateCalendar(month, year) {
  const calendarDays = document.getElementById('calendarDays');
  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ];

  // Actualizar título del mes
  document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

  // Obtener primer día del mes y número de días
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();

  // Limpiar calendario
  calendarDays.innerHTML = '';

  // Agregar días del mes anterior (si es necesario)
  const prevMonth = new Date(year, month, 0);
  const daysInPrevMonth = prevMonth.getDate();

  for (let i = startingDay - 1; i >= 0; i--) {
    const dayElement = createDayElement(daysInPrevMonth - i, true);
    calendarDays.appendChild(dayElement);
  }

  // Agregar días del mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = createDayElement(day, false, month, year);
    calendarDays.appendChild(dayElement);
  }

  // Agregar días del mes siguiente (para completar la cuadrícula)
  const totalCells = calendarDays.children.length;
  const remainingCells = 42 - totalCells; // 6 filas x 7 días

  for (let day = 1; day <= remainingCells; day++) {
    const dayElement = createDayElement(day, true);
    calendarDays.appendChild(dayElement);
  }
}

function createDayElement(day, isOtherMonth, month = null, year = null) {
  const dayElement = document.createElement('div');
  dayElement.className = `calendar-day ${isOtherMonth ? 'other-month' : ''}`;
  dayElement.textContent = day;

  if (!isOtherMonth && month !== null && year !== null) {
    // Verificar si hay sesiones en este día
    const sessions = getSessionsForDay(day, month, year);
    if (sessions.length > 0) {
      const session = sessions[0]; // Mostrar la primera sesión

      // Agregar clase según el estado de la sesión
      dayElement.classList.add('has-session', session.status);

      // Agregar indicador visual de color
      const statusIndicator = document.createElement('div');
      statusIndicator.className = `status-indicator ${session.status}`;
      statusIndicator.title = `Estado: ${getStatusText(session.status)}`;
      dayElement.appendChild(statusIndicator);

      dayElement.onclick = () => showSessionDetails(session);
    }
  }

  return dayElement;
}

function getStatusText(status) {
  const statusTexts = {
    accepted: 'Sesión Aceptada',
    postponed: 'Sesión Pospuesta',
    rejected: 'Sesión Rechazada/Cancelada',
    pending: 'Sesión Pendiente',
    confirmed: 'Sesión Confirmada',
    cancelled: 'Sesión Cancelada'
  };
  return statusTexts[status] || 'Estado Desconocido';
}

// Función para sincronizar estados desde el tutor
function syncSessionStatusFromTutor() {
  // Verificar si hay cambios en localStorage desde el tutor
  const studentSessions = JSON.parse(localStorage.getItem('studentSessions') || '[]');

  // Si hay sesiones actualizadas, refrescar el calendario
  if (studentSessions.length > 0) {
    // Recargar el calendario si está visible
    if (document.getElementById('calendarDays')) {
      initializeCalendar();
    }
  }
}

// Función para escuchar cambios en el localStorage (simulación de comunicación en tiempo real)
function listenForStatusChanges() {
  // Escuchar cambios en localStorage
  window.addEventListener('storage', function (e) {
    if (e.key === 'studentSessions') {
      syncSessionStatusFromTutor();
    }
  });

  // También verificar periódicamente (cada 30 segundos)
  setInterval(syncSessionStatusFromTutor, 30000);
}

// Función para cargar sesiones del estudiante desde el backend
function loadStudentSessions() {
  if (typeof BackendAPI !== 'undefined' && BackendAPI.getStudentSessions) {
    BackendAPI.getStudentSessions()
      .then((sessions) => {
        // Guardar sesiones en localStorage para acceso rápido
        localStorage.setItem('studentSessions', JSON.stringify(sessions));

        // Recargar calendario si está visible
        if (document.getElementById('calendarDays')) {
          initializeCalendar();
        }
      })
      .catch((error) => {
        console.error('Error cargando sesiones del estudiante:', error);
        // Usar datos vacíos en caso de error
        localStorage.setItem('studentSessions', JSON.stringify([]));
      });
  }
}

function getSessionsForDay(day, month, year) {
  // Obtener sesiones desde localStorage (actualizadas por loadStudentSessions)
  const studentSessions = JSON.parse(localStorage.getItem('studentSessions') || '[]');

  return studentSessions.filter((session) => {
    const sessionDate = new Date(session.date);
    return (
      sessionDate.getDate() === day &&
      sessionDate.getMonth() === month &&
      sessionDate.getFullYear() === year
    );
  });
}

function previousMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  generateCalendar(currentMonth, currentYear);
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  generateCalendar(currentMonth, currentYear);
}

function showSessionDetails(session) {
  // Llenar datos del modal
  document.getElementById('sessionTitle').textContent = `${session.title} (${getStatusText(session.status)})`;
  document.getElementById('sessionTutor').textContent = session.tutor;
  document.getElementById('sessionDate').textContent = formatDate(session.date);
  document.getElementById('sessionTime').textContent = session.time;
  document.getElementById('sessionModality').textContent = session.modality;
  document.getElementById('sessionLink').textContent = session.link;
  document.getElementById('sessionLocation').textContent = session.location;
  document.getElementById('sessionDuration').textContent = session.duration;
  document.getElementById('sessionObjective').textContent = session.objective;
  document.getElementById('sessionReschedules').textContent = session.reschedules;
  document.getElementById('sessionPolicy').textContent = session.policy;

  // Actualizar calificación del tutor
  const ratingElement = document.querySelector('#sessionModal .tutor-rating');
  if (ratingElement) {
    ratingElement.innerHTML = generateStars(session.rating) + `<span>${session.rating}</span>`;
  }

  // Mostrar modal
  const modal = document.getElementById('sessionModal');
  if (modal) modal.style.display = 'block';
}

function closeSessionModal() {
  const modal = document.getElementById('sessionModal');
  if (modal) modal.style.display = 'none';
}

function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function generateStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars += '<i class="fas fa-star"></i>';
    } else if (i - 0.5 <= rating) {
      stars += '<i class="fas fa-star-half-alt"></i>';
    } else {
      stars += '<i class="far fa-star"></i>';
    }
  }
  return stars;
}

function cancelSessionFromModal() {
  const confirmCancel = confirm('¿Estás seguro de que quieres cancelar esta sesión?');
  if (confirmCancel) {
    showNotification('Sesión cancelada exitosamente', 'success');
    closeSessionModal();
    // Actualizar calendario
    generateCalendar(currentMonth, currentYear);
  }
}

function rescheduleSessionFromModal() {
  showNotification('Función de reprogramación en desarrollo', 'info');
}

// FUNCIONES DEL MODAL DE PERFIL (extras)
function changeProfilePhoto() {
  showNotification('Función de cambio de foto en desarrollo', 'info');
}

function saveProfile() {
  const form = document.getElementById('profileForm');
  const formData = new FormData(form);

  // Validar campos requeridos
  const requiredFields = ['firstName', 'lastName', 'email', 'studentId', 'career'];
  for (const field of requiredFields) {
    if (!formData.get(field)) {
      showNotification(`El campo ${field} es requerido`, 'error');
      return;
    }
  }

  // Recopilar datos del formulario
  const profileData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    studentId: formData.get('studentId'),
    career: formData.get('career'),
    semester: formData.get('semester'),
    age: formData.get('age'),
    interests: formData.getAll('interests'),
    bio: formData.get('bio'),
    preferredModality: formData.get('preferredModality')
  };

  console.log('Datos del perfil:', profileData);

  // Simular guardado
  showNotification('Perfil actualizado exitosamente', 'success');

  // Actualizar nombre en el header
  const userNameElement = document.querySelector('.user-name');
  if (userNameElement) {
    userNameElement.textContent = `${profileData.firstName} ${profileData.lastName}`;
  }

  // Actualizar iniciales en el avatar
  const avatarInitials = document.querySelector('.avatar-initials');
  if (avatarInitials) {
    avatarInitials.textContent = `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`.toUpperCase();
  }

  // Cerrar modal
  closeProfileModal();
}

function resetProfileForm() {
  const form = document.getElementById('profileForm');
  if (!form) return;

  form.reset();

  // Restablecer valores por defecto (demo)
  document.getElementById('firstName').value = 'Jair';
  document.getElementById('lastName').value = 'Serralta';
  document.getElementById('email').value = 'jair.serralta@estudiante.edu';
  document.getElementById('phone').value = '+52 55 1234 5678';
  document.getElementById('studentId').value = '2024001234';
  document.getElementById('career').value = 'ingenieria';
  document.getElementById('age').value = '22';
  document.getElementById('bio').value =
    'Estudiante de Ingeniería en Sistemas apasionado por las matemáticas y la programación. Busco mejorar mis habilidades en cálculo y algoritmos para tener un mejor rendimiento académico.';

  // Restablecer checkboxes
  document.querySelector('input[name="interests"][value="matematicas"]').checked = true;
  document.querySelector('input[name="interests"][value="programacion"]').checked = true;

  // Restablecer radio buttons
  document.querySelector('input[name="preferredModality"][value="presencial"]').checked = true;

  showNotification('Formulario restablecido', 'info');
}

// FUNCIONES DE RECORDATORIOS
function irASesion(sesionId) {
  showNotification('Redirigiendo a la sesión...', 'info');
}

// FUNCIONES DE FORMULARIOS
function setupBookingForm() {
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      handleBookingSubmission(this);
    });
  }
  
  // Cargar materias disponibles
  loadMateriasDisponibles();
  
  // Limpiar campo de duración al cargar
  clearDurationField();
  
  // Configurar cálculo automático de duración en filtros de búsqueda
  setupDurationCalculation();
}

// Función para limpiar el campo de duración
function clearDurationField() {
  const durationField = document.getElementById('durationFilter');
  if (durationField) {
    durationField.value = '';
    // También limpiar cualquier valor residual que pueda estar causando NaN
    if (durationField.value.includes('NaN') || durationField.value.includes('undefined')) {
      durationField.value = '';
    }
  }
}

// Función para configurar el cálculo automático de duración
function setupDurationCalculation() {
  const startTimeInput = document.getElementById('startTimeFilter');
  const endTimeInput = document.getElementById('endTimeFilter');
  const durationInput = document.getElementById('durationFilter');
  
  if (startTimeInput && endTimeInput && durationInput) {
    // Calcular duración cuando cambien las horas
    const calculateDurationOnChange = () => {
      const startTime = startTimeInput.value;
      const endTime = endTimeInput.value;
      
      if (startTime && endTime && startTime.trim() !== '' && endTime.trim() !== '') {
        const duration = calculateDuration(startTime, endTime);
        durationInput.value = duration || '';
      } else {
        durationInput.value = '';
      }
    };
    
    startTimeInput.addEventListener('change', calculateDurationOnChange);
    endTimeInput.addEventListener('change', calculateDurationOnChange);
    
    // Configurar fecha mínima
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('dateFilter');
    if (dateInput) {
      dateInput.min = today;
    }
  }
}

// Nueva función para cargar materias disponibles
async function loadMateriasDisponibles() {
  try {
    if (typeof BackendAPI !== 'undefined' && BackendAPI.getMateriasDisponibles) {
      const materias = await BackendAPI.getMateriasDisponibles();
      updateMateriasSelect(materias);
    }
  } catch (error) {
    console.error('Error cargando materias:', error);
  }
}

// Función para actualizar el select de materias
function updateMateriasSelect(materias) {
  const areaSelect = document.querySelector('select[name="area"]');
  if (!areaSelect) return;
  
  // Limpiar opciones existentes (excepto la primera)
  while (areaSelect.children.length > 1) {
    areaSelect.removeChild(areaSelect.lastChild);
  }
  
  // Agregar materias
  materias.forEach(materia => {
    const option = document.createElement('option');
    option.value = materia.id;
    option.textContent = `${materia.nombre} (${materia.clave})`;
    areaSelect.appendChild(option);
  });
}

// Nueva función para manejar el envío de solicitudes
async function handleBookingSubmission(form) {
  const formData = new FormData(form);

  // Obtener datos del tutor seleccionado
  const tutorId = getSelectedTutorId();
  if (!tutorId) {
    showNotification('Por favor selecciona un tutor', 'error');
    return;
  }

  // Obtener materia seleccionada
  const materiaId = getSelectedMateriaId();
  if (!materiaId) {
    showNotification('Por favor selecciona una materia', 'error');
    return;
  }

  // Calcular hora fin basada en la duración
  const horaInicio = formData.get('time');
  const duracionMinutos = parseInt(formData.get('duration'));
  const horaFin = calcularHoraFin(horaInicio, duracionMinutos);

  // Recopilar datos del formulario
  const sessionData = {
    tutor_id: tutorId,
    materia_id: materiaId,
    fecha: formData.get('date'),
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    modalidad_id: getModalidadId(formData.get('modality')),
    ubicacion_o_enlace: formData.get('location')
  };

  // Validar datos requeridos
  if (!sessionData.tutor_id || !sessionData.materia_id || !sessionData.fecha || !sessionData.hora_inicio) {
    showNotification('Por favor completa todos los campos requeridos', 'error');
    return;
  }

  try {
    // Usar la nueva función para crear sesión
    if (typeof BackendAPI !== 'undefined' && BackendAPI.crearSesionAlumno) {
      const response = await BackendAPI.crearSesionAlumno(sessionData);
      showNotification('Solicitud de tutoría enviada exitosamente', 'success');
      form.reset();
      closeBookingSection();

      // Recargar sesiones
      loadStudentSessions();
      
      // Actualizar dashboard
      if (typeof loadUpcomingSessions === 'function') {
        loadUpcomingSessions();
      }
    } else {
      // Fallback: crear sesión en localStorage
      createPendingSessionForStudent(sessionData);
      showNotification('Solicitud de tutoría enviada exitosamente', 'success');
      form.reset();
      closeBookingSection();
      
      // Recargar sesiones
      loadUpcomingSessions();
    }
  } catch (error) {
    console.error('Error al enviar solicitud:', error);
    showNotification('Error al enviar la solicitud. Inténtalo de nuevo.', 'error');
  }
}

// Función para crear sesión pendiente para estudiante
function createPendingSessionForStudent(sessionData) {
  try {
    // Obtener datos del estudiante actual
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || 
                       JSON.parse(localStorage.getItem('userData')) || 
                       { nombreCompleto: 'Estudiante', email: 'estudiante@email.com' };
    
    // Obtener datos del tutor
    const tutors = JSON.parse(localStorage.getItem('usuarios')) || [];
    const tutor = tutors.find(t => t.id === sessionData.tutor_id);
    
    // Crear sesión pendiente
    const pendingSession = {
      id: 'pending_' + Date.now(),
      student: currentUser.nombreCompleto || 'Estudiante',
      studentEmail: currentUser.email || 'estudiante@email.com',
      tutor: tutor ? tutor.nombreCompleto : 'Tutor',
      tutorId: sessionData.tutor_id,
      subject: sessionData.materia_id || 'Materia',
      date: sessionData.fecha,
      time: sessionData.hora_inicio,
      endTime: sessionData.hora_fin,
      modality: sessionData.modalidad_id === '1' ? 'Presencial' : 'Virtual',
      location: sessionData.ubicacion_o_enlace || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      duration: calculateDuration(sessionData.hora_inicio, sessionData.hora_fin)
    };
    
    // Guardar en localStorage
    const pendingSessions = JSON.parse(localStorage.getItem('pendingSessions')) || [];
    pendingSessions.push(pendingSession);
    localStorage.setItem('pendingSessions', JSON.stringify(pendingSessions));
    
    // Notificar al tutor
    notifyTutorNewSession(pendingSession);
    
    console.log('Sesión pendiente creada:', pendingSession);
    
  } catch (error) {
    console.error('Error creando sesión pendiente:', error);
    throw error;
  }
}

// Función para obtener datos del tutor actual

// Función para notificar al tutor sobre nueva sesión
function notifyTutorNewSession(session) {
  try {
    const tutorNotifications = JSON.parse(localStorage.getItem('tutorNotifications')) || [];
    tutorNotifications.push({
      id: 'notif_' + Date.now(),
      type: 'new_session_request',
      title: 'Nueva Solicitud de Sesión',
      message: `${session.student} ha solicitado una sesión de ${session.subject} para ${session.date} a las ${session.time}`,
      timestamp: new Date().toISOString(),
      read: false,
      sessionId: session.id
    });
    
    localStorage.setItem('tutorNotifications', JSON.stringify(tutorNotifications));
  } catch (error) {
    console.error('Error notificando al tutor:', error);
  }
}

// Función auxiliar para calcular hora fin
function calcularHoraFin(horaInicio, duracionMinutos) {
  try {
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const inicioMinutos = horas * 60 + minutos;
    const finMinutos = inicioMinutos + duracionMinutos;
    const finHoras = Math.floor(finMinutos / 60);
    const finMinutosResto = finMinutos % 60;
    return `${finHoras.toString().padStart(2, '0')}:${finMinutosResto.toString().padStart(2, '0')}`;
  } catch {
    return horaInicio; // fallback
  }
}

// Función auxiliar para obtener ID de modalidad
function getModalidadId(modalidad) {
  const modalidades = {
    'presencial': 1,
    'online': 2
  };
  return modalidades[modalidad] || 1;
}

// Función auxiliar para obtener ID de materia seleccionada
function getSelectedMateriaId() {
  const select = document.querySelector('select[name="area"]');
  return select ? select.value : null;
}

function getSelectedTutorId() {
  // Obtener el ID del tutor desde el contexto de la búsqueda
  const tutorCard = document.querySelector('.tutor-card.selected');
  if (tutorCard) {
    return tutorCard.dataset.tutorId;
  }
  
  // Fallback: buscar en el input hidden si existe
  const hiddenInput = document.getElementById('selectedTutorId');
  if (hiddenInput) {
    return hiddenInput.value;
  }
  
  return null;
}

function setupValoracionForm() {
  const valoracionForm = document.getElementById('valoracionForm');
  if (valoracionForm) {
    valoracionForm.addEventListener('submit', function (e) {
      e.preventDefault();
      showNotification('Valoración enviada exitosamente', 'success');
      this.reset();
    });
  }
}

// FUNCIONES AUXILIARES
function showAllActivity() {
  showNotification('Mostrando toda la actividad', 'info');
}

// SISTEMA DE MODALES
function showModal({ title, content, actions = [] }) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <span class="close" onclick="closeModal()">&times;</span>
            </div>
            <div class="modal-body">${content}</div>
            <div class="modal-footer">
                ${actions
                  .map((action) => `<button class="btn ${action.class}" onclick="${action.onclick}">${action.text}</button>`)
                  .join('')}
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

function closeModal() {
  const modal = document.querySelector('.modal');
  if (modal) modal.remove();
}

// SISTEMA DE NOTIFICACIONES
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
            .modal {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0, 0, 0, 0.5); display: flex;
                align-items: center; justify-content: center; z-index: 2000;
                margin: 0; padding: 0;
            }
            .modal-content {
                background: white; border-radius: 15px; padding: 2rem;
                max-width: 500px; width: 90%; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                margin: auto; position: relative;
            }
            .modal-header {
                display: flex; justify-content: space-between; align-items: center;
                margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #e9ecef;
            }
            .modal-header .close { font-size: 1.5rem; cursor: pointer; color: #999; }
            .modal-footer {
                display: flex; gap: 1rem; justify-content: flex-end;
                margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e9ecef;
            }
            .notification {
                position: fixed; top: 20px; right: 20px; z-index: 3000;
                max-width: 400px; border-radius: 10px;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2); animation: slideIn 0.3s ease;
            }
            .notification-success { background: #d4edda; color: #155724; border-left: 4px solid #28a745; }
            .notification-error { background: #f8d7da; color: #721c24; border-left: 4px solid #dc3545; }
            .notification-info { background: #d1ecf1; color: #0c5460; border-left: 4px solid #17a2b8; }
            .notification-content {
                display: flex; align-items: center; gap: 0.5rem; padding: 1rem;
            }
            .notification-close { background: none; border: none; cursor: pointer; margin-left: auto; }
            @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

function getNotificationIcon(type) {
  const icons = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };
  return icons[type] || 'info-circle';
}

// ===============================================
// FUNCIONES DE SINCRONIZACIÓN CON TUTORES
// ===============================================

// Función para sincronizar disponibilidades de tutores
function syncTutorAvailabilities() {
  console.log('🔄 Sincronizando disponibilidades de tutores...');
  
  try {
    // Conectar con el backend para obtener disponibilidades actualizadas
    if (typeof BackendAPI !== 'undefined' && BackendAPI.getTutorDisponibilidades) {
      BackendAPI.getTutorDisponibilidades()
        .then((availabilities) => {
          console.log('📡 Disponibilidades obtenidas del backend:', availabilities.length);
          localStorage.setItem('tutorAvailability', JSON.stringify(availabilities));
          showNotification('Disponibilidades de tutores actualizadas', 'success');
        })
        .catch((error) => {
          console.warn('⚠️ Error obteniendo disponibilidades del backend:', error);
          // Continuar con datos locales si el backend falla
        });
    } else {
      console.log('📱 Usando datos locales de disponibilidades');
    }
  } catch (error) {
    console.error('❌ Error en sincronización de disponibilidades:', error);
  }
}

// Función para escuchar cambios en disponibilidades (simulación de tiempo real)
function listenForAvailabilityChanges() {
  // Escuchar cambios en localStorage (simulación de comunicación en tiempo real)
  window.addEventListener('storage', function (e) {
    if (e.key === 'tutorAvailability') {
      console.log('🔄 Disponibilidades actualizadas desde otra pestaña');
      // Recargar búsqueda si estamos en la sección de tutores
      if (document.querySelector('.tutors-results')) {
        searchTutors();
      }
    }
  });
  
  // También verificar periódicamente (cada 30 segundos)
  setInterval(() => {
    syncTutorAvailabilities();
  }, 30000);
}

// Función para mostrar disponibilidades específicas de un tutor
function showTutorAvailabilityDetails(tutorId) {
  const tutorAvailabilities = JSON.parse(localStorage.getItem('tutorAvailability')) || [];
  const tutorAvailability = tutorAvailabilities.filter(av => av.tutorId === tutorId);
  
  if (tutorAvailability.length === 0) {
    showNotification('Este tutor no tiene disponibilidades configuradas', 'warning');
    return;
  }
  
  // Crear modal con detalles de disponibilidad
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3><i class="fas fa-calendar-alt"></i> Disponibilidades del Tutor</h3>
        <span class="close" onclick="closeAvailabilityModal()">&times;</span>
      </div>
      <div class="modal-body">
        <div class="availability-details">
          ${tutorAvailability.map(av => `
            <div class="availability-item">
              <div class="availability-date">
                <i class="fas fa-calendar"></i>
                <span>${formatDate(av.date)}</span>
              </div>
              <div class="availability-time">
                <i class="fas fa-clock"></i>
                <span>${av.startTime} - ${av.endTime}</span>
              </div>
              <div class="availability-subject">
                <i class="fas fa-book"></i>
                <span>${av.subject}</span>
              </div>
              <div class="availability-modality">
                <i class="fas fa-video"></i>
                <span>${av.modality}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeAvailabilityModal()">Cerrar</button>
        <button class="btn btn-primary" onclick="bookTutor('${tutorId}'); closeAvailabilityModal();">
          <i class="fas fa-calendar-plus"></i> Solicitar Sesión
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function closeAvailabilityModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.remove();
  }
}

// Función auxiliar para formatear fechas
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
}

// Función para verificar enlace entre datos del tutor y búsqueda del alumno
function verifyTutorStudentLink() {
  console.log('🔗 Verificando enlace entre datos del tutor y búsqueda del alumno...');
  
  const tutorAvailabilities = JSON.parse(localStorage.getItem('tutorAvailability') || '[]');
  const tutors = JSON.parse(localStorage.getItem('usuarios') || '[]');
  const tutorUsers = tutors.filter(user => user.rol === 'Tutor' || user.rol === 'tutor');
  
  console.log('📊 Datos disponibles:');
  console.log('- Disponibilidades:', tutorAvailabilities.length);
  console.log('- Tutores:', tutorUsers.length);
  
  // Verificar cada disponibilidad
  tutorAvailabilities.forEach((availability, index) => {
    console.log(`\n🔍 Disponibilidad ${index + 1}:`, availability);
    
    // Buscar el tutor correspondiente
    let tutor = tutorUsers.find(t => t.nombreCompleto === availability.tutor);
    if (!tutor && availability.tutorId) {
      tutor = tutorUsers.find(t => t.id === availability.tutorId);
    }
    if (!tutor && availability.tutorEmail) {
      tutor = tutorUsers.find(t => t.email === availability.tutorEmail);
    }
    
    if (tutor) {
      console.log('✅ Tutor encontrado:', tutor);
      console.log('🔗 Enlace correcto entre disponibilidad y tutor');
    } else {
      console.log('❌ Tutor NO encontrado para disponibilidad:', availability.tutor);
      console.log('🔗 Enlace ROTO entre disponibilidad y tutor');
    }
  });
  
  // Mostrar resumen
  const linkedAvailabilities = tutorAvailabilities.filter(availability => {
    let tutor = tutorUsers.find(t => t.nombreCompleto === availability.tutor);
    if (!tutor && availability.tutorId) {
      tutor = tutorUsers.find(t => t.id === availability.tutorId);
    }
    if (!tutor && availability.tutorEmail) {
      tutor = tutorUsers.find(t => t.email === availability.tutorEmail);
    }
    return tutor !== undefined;
  });
  
  console.log(`\n📈 Resumen del enlace:`);
  console.log(`- Disponibilidades totales: ${tutorAvailabilities.length}`);
  console.log(`- Disponibilidades enlazadas: ${linkedAvailabilities.length}`);
  console.log(`- Disponibilidades sin enlace: ${tutorAvailabilities.length - linkedAvailabilities.length}`);
  
  return {
    total: tutorAvailabilities.length,
    linked: linkedAvailabilities.length,
    unlinked: tutorAvailabilities.length - linkedAvailabilities.length
  };
}

// Función para reparar enlaces entre datos del tutor y alumno
function fixTutorStudentLink() {
  console.log('🔧 Reparando enlaces entre datos del tutor y alumno...');
  
  const tutorAvailabilities = JSON.parse(localStorage.getItem('tutorAvailability') || '[]');
  const tutors = JSON.parse(localStorage.getItem('usuarios') || '[]');
  const tutorUsers = tutors.filter(user => user.rol === 'Tutor' || user.rol === 'tutor');
  
  let fixedCount = 0;
  
  // Reparar cada disponibilidad
  tutorAvailabilities.forEach((availability, index) => {
    console.log(`🔧 Reparando disponibilidad ${index + 1}:`, availability);
    
    // Buscar el tutor correspondiente
    let tutor = tutorUsers.find(t => t.nombreCompleto === availability.tutor);
    if (!tutor && availability.tutorId) {
      tutor = tutorUsers.find(t => t.id === availability.tutorId);
    }
    if (!tutor && availability.tutorEmail) {
      tutor = tutorUsers.find(t => t.email === availability.tutorEmail);
    }
    
    if (tutor) {
      console.log('✅ Tutor encontrado, actualizando datos de disponibilidad...');
      
      // Actualizar datos de la disponibilidad para que coincidan con el tutor
      availability.tutor = tutor.nombreCompleto;
      availability.tutorId = tutor.id;
      availability.tutorEmail = tutor.email;
      
      fixedCount++;
      console.log('✅ Disponibilidad reparada:', availability);
    } else {
      console.log('❌ No se puede reparar: tutor no encontrado');
    }
  });
  
  // Guardar disponibilidades reparadas
  localStorage.setItem('tutorAvailability', JSON.stringify(tutorAvailabilities));
  
  console.log(`🔧 Reparación completada: ${fixedCount} disponibilidades reparadas`);
  
  // Mostrar notificación
  showNotification(`${fixedCount} enlaces reparados exitosamente`, 'success');
  
  return fixedCount;
}

// Función para verificar usuarios logueados
function checkLoggedInUsers() {
  console.log('🔍 Verificando usuarios logueados...');
  
  // Verificar sesión de usuario
  const userSession = JSON.parse(localStorage.getItem('userSession') || sessionStorage.getItem('userSession') || '{}');
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
  const userFullName = localStorage.getItem('userFullName') || sessionStorage.getItem('userFullName');
  
  console.log('👤 Datos de sesión del usuario actual:');
  console.log('- userSession:', userSession);
  console.log('- userData:', userData);
  console.log('- userEmail:', userEmail);
  console.log('- userFullName:', userFullName);
  
  // Verificar si hay usuarios en localStorage
  const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
  const tutorUsers = usuarios.filter(user => user.rol === 'Tutor' || user.rol === 'tutor');
  const studentUsers = usuarios.filter(user => user.rol === 'Alumno' || user.rol === 'alumno');
  
  console.log('👥 Usuarios registrados:');
  console.log('- Total usuarios:', usuarios.length);
  console.log('- Tutores:', tutorUsers.length);
  console.log('- Alumnos:', studentUsers.length);
  
  // Verificar disponibilidades
  const tutorAvailabilities = JSON.parse(localStorage.getItem('tutorAvailability') || '[]');
  console.log('📊 Disponibilidades configuradas:', tutorAvailabilities.length);
  
  return {
    hasUserSession: Object.keys(userSession).length > 0 || Object.keys(userData).length > 0,
    totalUsers: usuarios.length,
    tutors: tutorUsers.length,
    students: studentUsers.length,
    availabilities: tutorAvailabilities.length,
    userSession,
    userData,
    userEmail,
    userFullName
  };
}

// Función para crear datos de ejemplo si no existen
function createSampleDataIfNeeded() {
  console.log('🔧 Verificando si necesitamos crear datos de ejemplo...');
  
  // Verificar si ya existen tutores
  const existingTutors = JSON.parse(localStorage.getItem('usuarios') || '[]');
  const tutorUsers = existingTutors.filter(user => user.rol === 'Tutor' || user.rol === 'tutor');
  
  // Verificar si ya existen disponibilidades
  const existingAvailabilities = JSON.parse(localStorage.getItem('tutorAvailability') || '[]');
  
  // Solo crear datos de ejemplo si no hay tutores reales con disponibilidades
  if (tutorUsers.length === 0 && existingAvailabilities.length === 0) {
    console.log('📝 Creando datos de ejemplo...');
    createSampleTutorsAndAvailabilities();
  } else {
    console.log('✅ Usando datos reales de tutores y disponibilidades');
    console.log('📊 Tutores encontrados:', tutorUsers.length);
    console.log('📊 Disponibilidades encontradas:', existingAvailabilities.length);
  }
}

// Función para crear tutores y disponibilidades de ejemplo
function createSampleTutorsAndAvailabilities() {
  // Crear tutores de ejemplo
  const sampleTutors = [
    {
      id: 'tutor_001',
      nombreCompleto: 'Dr. Carlos Mendoza',
      email: 'carlos.mendoza@tutor.edu',
      rol: 'Tutor',
      especialidad: 'Matemáticas',
      experiencia: 5,
      calificacion: 4.8
    },
    {
      id: 'tutor_002',
      nombreCompleto: 'Dra. Ana López',
      email: 'ana.lopez@tutor.edu',
      rol: 'Tutor',
      especialidad: 'Física',
      experiencia: 3,
      calificacion: 4.6
    },
    {
      id: 'tutor_003',
      nombreCompleto: 'Prof. María García',
      email: 'maria.garcia@tutor.edu',
      rol: 'Tutor',
      especialidad: 'Química',
      experiencia: 4,
      calificacion: 4.7
    }
  ];
  
  // Agregar tutores a usuarios existentes
  const existingUsers = JSON.parse(localStorage.getItem('usuarios') || '[]');
  const tutorsToAdd = sampleTutors.filter(tutor => 
    !existingUsers.some(user => user.id === tutor.id)
  );
  
  if (tutorsToAdd.length > 0) {
    existingUsers.push(...tutorsToAdd);
    localStorage.setItem('usuarios', JSON.stringify(existingUsers));
    console.log('✅ Creados', tutorsToAdd.length, 'tutores de ejemplo');
  }
  
  // Crear disponibilidades de ejemplo
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const sampleAvailabilities = [
    {
      id: 'avail_001',
      tutor: 'Dr. Carlos Mendoza',
      tutorId: 'tutor_001',
      date: tomorrow.toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '11:00',
      subject: 'matematicas',
      modality: 'Presencial',
      duration: 60,
      createdAt: new Date().toISOString()
    },
    {
      id: 'avail_002',
      tutor: 'Dr. Carlos Mendoza',
      tutorId: 'tutor_001',
      date: tomorrow.toISOString().split('T')[0],
      startTime: '14:00',
      endTime: '15:30',
      subject: 'matematicas',
      modality: 'Virtual',
      duration: 90,
      createdAt: new Date().toISOString()
    },
    {
      id: 'avail_003',
      tutor: 'Dra. Ana López',
      tutorId: 'tutor_002',
      date: tomorrow.toISOString().split('T')[0],
      startTime: '16:00',
      endTime: '17:00',
      subject: 'fisica',
      modality: 'Presencial',
      duration: 60,
      createdAt: new Date().toISOString()
    },
    {
      id: 'avail_004',
      tutor: 'Prof. María García',
      tutorId: 'tutor_003',
      date: tomorrow.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      subject: 'quimica',
      modality: 'Virtual',
      duration: 60,
      createdAt: new Date().toISOString()
    }
  ];
  
  localStorage.setItem('tutorAvailability', JSON.stringify(sampleAvailabilities));
  console.log('✅ Creadas', sampleAvailabilities.length, 'disponibilidades de ejemplo');
  
  // Mostrar notificación
  showNotification('Datos de ejemplo creados automáticamente', 'info');
}

// ===============================================
// FUNCIONES DE TIEMPO REAL PARA NUEVAS CLASES
// ===============================================

// Función para configurar actualizaciones en tiempo real de nuevas clases
function setupRealTimeClassUpdates() {
  console.log('🔄 Configurando actualizaciones en tiempo real de clases');
  
  // Escuchar eventos de nuevas clases
  window.addEventListener('newClassAdded', handleNewClassAdded);
  
  // Simular verificación periódica de nuevas clases
  setInterval(checkForNewClasses, 5000); // Cada 5 segundos
  
  // Registrar estudiante como conectado
  registerStudentAsConnected();
}

// Función para manejar nuevas clases agregadas
function handleNewClassAdded(event) {
  try {
    const { class: newClass, notification } = event.detail;
    console.log('📢 Nueva clase recibida:', newClass);
    
    // Mostrar notificación al usuario
    showNotification(`Nueva clase disponible: ${newClass.specialty} con ${newClass.name}`, 'success');
    
    // Si estamos en la sección de búsqueda de tutores, actualizar la lista
    const currentSection = document.querySelector('.nav-item.active')?.dataset.section;
    if (currentSection === 'buscar-tutores') {
      // Refrescar la búsqueda actual
      const currentSubject = document.getElementById('subjectFilter')?.value;
      if (currentSubject && currentSubject === newClass.specialty) {
        showTutorsBySubject(currentSubject);
      }
    }
    
    // Guardar notificación
    saveNotification(notification);
    
  } catch (error) {
    console.error('❌ Error manejando nueva clase:', error);
  }
}

// Función para verificar nuevas clases periódicamente
function checkForNewClasses() {
  try {
    const studentId = getCurrentStudentId();
    if (!studentId) return;
    
    const notifications = JSON.parse(localStorage.getItem(`studentNotifications_${studentId}`) || '[]');
    const unreadNotifications = notifications.filter(notif => !notif.read);
    
    if (unreadNotifications.length > 0) {
      // Procesar notificaciones no leídas
      unreadNotifications.forEach(notification => {
        if (notification.type === 'new_class') {
          handleNewClassAdded({
            detail: { 
              class: notification.classData, 
              notification: notification 
            }
          });
          
          // Marcar como leída
          notification.read = true;
        }
      });
      
      // Guardar notificaciones actualizadas
      localStorage.setItem(`studentNotifications_${studentId}`, JSON.stringify(notifications));
    }
    
  } catch (error) {
    console.error('❌ Error verificando nuevas clases:', error);
  }
}

// Función para registrar estudiante como conectado
function registerStudentAsConnected() {
  try {
    const studentId = getCurrentStudentId();
    if (!studentId) return;
    
    const connectedStudents = JSON.parse(localStorage.getItem('connectedStudents') || '[]');
    if (!connectedStudents.includes(studentId)) {
      connectedStudents.push(studentId);
      localStorage.setItem('connectedStudents', JSON.stringify(connectedStudents));
    }
    
  } catch (error) {
    console.error('❌ Error registrando estudiante:', error);
  }
}

// Función para obtener ID del estudiante actual
function getCurrentStudentId() {
  try {
    const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
    return userSession.usuario?.id || userSession.usuario?.userId || 'student-001';
  } catch (error) {
    return 'student-001';
  }
}

// Función para guardar notificación
function saveNotification(notification) {
  try {
    const studentId = getCurrentStudentId();
    const notifications = JSON.parse(localStorage.getItem(`studentNotifications_${studentId}`) || '[]');
    notifications.push(notification);
    localStorage.setItem(`studentNotifications_${studentId}`, JSON.stringify(notifications));
  } catch (error) {
    console.error('❌ Error guardando notificación:', error);
  }
}

// Función para forzar la actualización de sesiones con maestros reales
function forceUpdateSessionsWithRealTeachers() {
  try {
    console.log('🔄 Forzando actualización de sesiones con maestros reales...');
    
    // Limpiar sesiones existentes
    localStorage.removeItem('pendingSessions');
    localStorage.removeItem('confirmedSessions');
    localStorage.removeItem('rejectedSessions');
    localStorage.removeItem('processedSessions');
    
    // Recrear sesiones con maestros reales
    createSampleSessions();
    
    // Recargar la sección de inicio si está activa
    const currentSection = document.querySelector('.nav-item.active')?.dataset.section;
    if (currentSection === 'inicio') {
      loadUpcomingSessions();
    }
    
    console.log('✅ Sesiones actualizadas con maestros reales');
    
  } catch (error) {
    console.error('❌ Error actualizando sesiones:', error);
  }
}

// Función para sincronizar automáticamente con cambios de disponibilidad de tutores
function setupTutorAvailabilitySync() {
  try {
    console.log('🔄 Configurando sincronización con disponibilidad de tutores...');
    
    // Escuchar cambios en localStorage para disponibilidad de tutores
    window.addEventListener('storage', function(e) {
      if (e.key === 'tutorAvailability') {
        console.log('📅 Disponibilidad de tutores actualizada, sincronizando...');
        
        // Recargar búsqueda si estamos en la sección de tutores
        const currentSection = document.querySelector('.nav-item.active')?.dataset.section;
        if (currentSection === 'tutores') {
          // Simular búsqueda automática con criterios actuales
          setTimeout(() => {
            const subject = document.getElementById('subjectFilter')?.value;
            if (subject) {
              console.log('🔄 Recargando búsqueda automáticamente...');
              searchTutors();
            }
          }, 500);
        }
      }
    });
    
    // También escuchar cambios en tutorClasses
    window.addEventListener('storage', function(e) {
      if (e.key === 'tutorClasses') {
        console.log('🎓 Clases de tutores actualizadas, sincronizando...');
        
        // Recargar búsqueda si estamos en la sección de tutores
        const currentSection = document.querySelector('.nav-item.active')?.dataset.section;
        if (currentSection === 'tutores') {
          setTimeout(() => {
            const subject = document.getElementById('subjectFilter')?.value;
            if (subject) {
              console.log('🔄 Recargando búsqueda automáticamente...');
              searchTutors();
            }
          }, 500);
        }
      }
    });
    
    console.log('✅ Sincronización con tutores configurada');
    
  } catch (error) {
    console.error('❌ Error configurando sincronización:', error);
  }
}

