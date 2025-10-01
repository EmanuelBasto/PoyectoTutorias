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
});

function initializeApp() {
  console.log('Sistema de Gestión de Tutores - Interfaz Estudiante iniciada');
  // Cargar perfil del estudiante desde el backend / storage
  loadStudentProfile();
  // Cargar sesiones del estudiante desde el backend
  loadStudentSessions();
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
    // Fallback: mostrar lista vacía
    displayUpcomingSessions([]);
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
        <div class="session-item">
            <div class="session-time">
                <span class="time">${session.time || ''}</span>
                <span class="duration">${session.duration || ''}</span>
            </div>
            <div class="session-info">
                <h4>${session.title || ''}</h4>
                <p>${session.tutor || ''} - ${session.modality || ''}</p>
                <span class="session-date">${session.date || ''}</span>
            </div>
            <div class="session-actions">
                <button class="btn btn-primary" onclick="joinSession('${session.id}')">Unirse</button>
                <button class="btn btn-outline" onclick="rescheduleSession('${session.id}')">Reprogramar</button>
                <button class="btn btn-secondary" onclick="cancelSession('${session.id}')">Cancelar</button>
            </div>
        </div>
    `
    )
    .join('');
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
  const area = document.getElementById('areaFilter')?.value || '';
  const modality = document.getElementById('modalityFilter')?.value || '';
  const day = document.getElementById('dayFilter')?.value || '';
  const time = document.getElementById('timeFilter')?.value || '';
  const duration = document.getElementById('durationFilter')?.value || '';

  console.log('Buscando tutores:', { area, modality, day, time, duration });
  showNotification('Buscando tutores disponibles...', 'info');

  // Conectar con el backend para obtener tutores reales basados en disponibilidad
  if (typeof BackendAPI !== 'undefined' && BackendAPI.searchTutorsByAvailability) {
    BackendAPI.searchTutorsByAvailability({ area, modality, day, time, duration })
      .then((tutors) => {
        displayTutors(tutors);
        showNotification(`Se encontraron ${tutors.length} tutores disponibles`, 'success');
      })
      .catch((error) => {
        console.error('Error buscando tutores:', error);
        showNotification('Error al buscar tutores. Inténtalo de nuevo.', 'error');
        displayTutors([]); // Mostrar lista vacía
      });
  } else {
    // Fallback: mostrar lista vacía
    setTimeout(() => {
      showNotification('No hay tutores disponibles en este momento', 'info');
      displayTutors([]);
    }, 1500);
  }
}

// Función para mostrar los tutores obtenidos del backend
function displayTutors(tutors) {
  const tutorsResults = document.querySelector('.tutors-results');

  if (!tutorsResults) {
    console.error('No se encontró el contenedor de tutores');
    return;
  }

  if (tutors.length === 0) {
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

  // Generar tarjetas de tutores dinámicamente
  tutorsResults.innerHTML = tutors
    .map(
      (tutor) => `
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
            </div>
        </div>
    `
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
        const selectedTutorInput = document.getElementById('selectedTutor');
        if (selectedTutorInput) {
          selectedTutorInput.value = tutorData.name || '';
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
        
        // Mostrar formulario
        const bookingSection = document.getElementById('bookingSection');
        if (bookingSection) {
          bookingSection.style.display = 'block';
          bookingSection.scrollIntoView({ behavior: 'smooth' });
        }
      })
      .catch((error) => {
        console.error('Error obteniendo datos del tutor:', error);
        showNotification('Error al cargar datos del tutor', 'error');
      });
  } else {
    // Fallback: mostrar formulario sin datos del tutor
    const bookingSection = document.getElementById('bookingSection');
    if (bookingSection) {
      bookingSection.style.display = 'block';
      bookingSection.scrollIntoView({ behavior: 'smooth' });
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
      showNotification('Error: BackendAPI no disponible', 'error');
    }
  } catch (error) {
    console.error('Error al enviar solicitud:', error);
    showNotification('Error al enviar la solicitud. Inténtalo de nuevo.', 'error');
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





