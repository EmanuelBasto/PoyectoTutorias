// Sistema de Gestión de Tutores - Interfaz Tutor
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadSection('inicio');
    
    // Limpiar COMPLETAMENTE todas las sesiones y recrear con fechas correctas
    clearAllSessionsAndRecreate();
});

// ===============================================
// INICIALIZACIÓN Y CONFIGURACIÓN
// ===============================================

function initializeApp() {
    console.log('Inicializando aplicación del tutor');
    
    // Cargar datos del tutor desde localStorage o configuración
    loadTutorData();
    
    // Configurar fecha mínima para formularios
    setupDateRestrictions();
    
    // Inicializar contadores del dashboard
    updateDashboardCounters();
    
    // Configurar notificaciones
    setupNotifications();
}

function loadTutorData() {
    // Conectar con el backend para obtener datos del tutor
    if (typeof BackendAPI !== 'undefined' && BackendAPI.getStudentProfile) {
        BackendAPI.getStudentProfile()
            .then(profile => {
                updateTutorWelcomeMessage(profile);
                updateTutorAvatar(profile);
                
                // Guardar en localStorage para persistencia
                localStorage.setItem('tutorData', JSON.stringify(profile));
            })
            .catch(error => {
                console.error('Error cargando perfil del tutor:', error);
                loadFallbackData();
            });
    } else {
        loadFallbackData();
    }
}

function loadFallbackData() {
    const emptyData = {
        firstName: 'Tutor',
        lastName: 'Usuario',
        email: '',
        specialty: '',
        experience: 0,
        timezone: '',
        maxDailySessions: 8,
        maxWeeklySessions: 40,
        sessionDuration: 45,
        breakTime: 15
    };
    localStorage.setItem('tutorData', JSON.stringify(emptyData));
    updateTutorWelcomeMessage(emptyData);
    updateTutorAvatar(emptyData);
}

function getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
}

function setupDateRestrictions() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.hasAttribute('data-no-restriction')) {
            input.min = today;
        }
    });
}

function updateDashboardCounters() {
    // Simular datos del dashboard (en producción vendrían del backend)
    const dashboardData = {
        pendingRequests: "",
        upcomingSessions: "",
        averageRating: "",
        totalStudents: ""
    };
    
    document.getElementById('pendingRequests').textContent = dashboardData.pendingRequests;
    document.getElementById('upcomingSessions').textContent = dashboardData.upcomingSessions;
    document.getElementById('averageRating').textContent = dashboardData.averageRating;
    document.getElementById('totalStudents').textContent = dashboardData.totalStudents;
}

// ===============================================
// NAVEGACIÓN Y CARGA DE SECCIONES
// ===============================================

function loadSection(section) {
    console.log(`Cargando sección: ${section}`);
    
    // Cerrar menú móvil si está abierto
    closeMobileMenu();
    
    // Actualizar navegación activa
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`[data-section="${section}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    // Mostrar contenido según la sección
    showSectionContent(section);
}

function showSectionContent(section) {
    const mainContent = document.getElementById('mainContent');
    
    switch(section) {
        case 'inicio':
            loadInicioSection();
            break;
        case 'horarios':
            loadHorariosSection();
            break;
        case 'sesiones':
            loadSesionesSection();
            break;
        case 'estudiantes':
            loadEstudiantesSection();
            break;
        case 'valoraciones':
            loadValoracionesSection();
            break;
        case 'historial':
            loadHistorialSection();
            break;
        case 'notificaciones':
            loadNotificacionesSection();
            break;
        default:
            loadInicioSection();
    }
}

function loadInicioSection() {
    const template = document.getElementById('inicioTemplate');
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = template.innerHTML;
    
    // Actualizar datos dinámicos
    updateDashboardCounters();
    
    // Cargar datos dinámicos desde el backend
    loadPendingRequests();
    loadUpcomingSessions();
    loadRecentActivity();
}

// FUNCIONES PARA CARGAR DATOS DINÁMICOS DEL INICIO
function loadPendingRequests() {
    const requestsList = document.querySelector('.requests-list');
    if (!requestsList) return;
    
    // Conectar con el backend para obtener las solicitudes pendientes
    if (typeof BackendAPI !== 'undefined') {
        BackendAPI.getPendingRequests()
            .then(requests => {
                displayPendingRequests(requests);
            })
            .catch(error => {
                console.error('Error cargando solicitudes pendientes:', error);
                displayPendingRequests([]);
            });
    } else {
        // Fallback: mostrar lista vacía
        displayPendingRequests([]);
    }
}

function displayPendingRequests(requests) {
    const requestsList = document.querySelector('.requests-list');
    if (!requestsList) return;
    
    if (requests.length === 0) {
        requestsList.innerHTML = `
            <div class="no-requests-message">
                <div class="no-requests-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <h4>No hay solicitudes pendientes</h4>
                <p>Las nuevas solicitudes de estudiantes aparecerán aquí.</p>
            </div>
        `;
        return;
    }
    
    // Generar elementos de solicitudes dinámicamente
    requestsList.innerHTML = requests.map(request => `
        <div class="request-item">
            <div class="request-info">
                <h4>${request.studentName || ''}</h4>
                <p>${request.subject || ''}</p>
                <span class="request-date">${request.date || ''}</span>
                <span class="request-type ${request.modality || ''}">${request.modality || ''}</span>
            </div>
            <div class="request-actions">
                <button class="btn btn-success" onclick="acceptRequest('${request.id}')">Aceptar</button>
                <button class="btn btn-warning" onclick="proposeNewTime('${request.id}')">Proponer Hora</button>
                <button class="btn btn-danger" onclick="rejectRequest('${request.id}')">Rechazar</button>
            </div>
        </div>
    `).join('');
}

function loadUpcomingSessions() {
    const sessionsList = document.querySelector('.sessions-list');
    if (!sessionsList) return;
    
    // Conectar con el backend para obtener las próximas sesiones
    if (typeof BackendAPI !== 'undefined') {
        BackendAPI.getUpcomingSessions()
            .then(sessions => {
                displayUpcomingSessions(sessions);
            })
            .catch(error => {
                console.error('Error cargando próximas sesiones:', error);
                displayUpcomingSessions([]);
            });
    } else {
        // Fallback: combinar sesiones pendientes con sesiones asignadas
        const pendingSessions = getSamplePendingSessions();
        const assignedSessions = getAssignedSessions();
        
        // Combinar y mostrar ambas
        const allSessions = [...pendingSessions, ...assignedSessions];
        displayUpcomingSessions(allSessions);
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
                <p>Las sesiones confirmadas aparecerán aquí.</p>
            </div>
        `;
        return;
    }
    
    // Generar elementos de sesiones dinámicamente
    sessionsList.innerHTML = sessions.map(session => `
        <div class="session-item">
            <div class="session-time">
                <span class="time">${session.time || ''}</span>
                <span class="duration">${session.duration || ''}</span>
            </div>
            <div class="session-info">
                <h4>${session.title || ''}</h4>
                <p>${session.studentName || ''}</p>
                <span class="session-date">${session.date || ''}</span>
            </div>
            <div class="session-actions">
                <button class="btn btn-primary" onclick="markAttendance('${session.id}')">Marcar Asistencia</button>
                <button class="btn btn-outline" onclick="viewSessionDetails('${session.id}')">Ver Detalles</button>
            </div>
        </div>
    `).join('');
}

function loadRecentActivity() {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;
    
    // Conectar con el backend para obtener las actividades recientes
    if (typeof BackendAPI !== 'undefined') {
        BackendAPI.getRecentActivity()
            .then(activities => {
                displayRecentActivity(activities);
            })
            .catch(error => {
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
                <p>Tu actividad aparecerá aquí cuando tengas interacciones con estudiantes.</p>
            </div>
        `;
        return;
    }
    
    // Generar elementos de actividad dinámicamente
    activityList.innerHTML = activities.map(activity => `
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
    `).join('');
}

function loadHorariosSection() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="content-header">
            <h2>Gestión de Horarios</h2>
            <p>Configura tu disponibilidad y gestiona tu calendario de tutorías</p>
        </div>
        
        <div class="schedule-management">
            <div class="schedule-actions">
                <button class="btn btn-primary" onclick="openScheduleModal()">
                    <i class="fas fa-calendar-plus"></i> Configurar Disponibilidad
                </button>
                <button class="btn btn-outline" onclick="viewCurrentSchedule()">
                    <i class="fas fa-eye"></i> Ver Horario Actual
                </button>
            </div>
            
            <div class="current-availability">
                <h3>Disponibilidades Actuales</h3>
                <div class="availability-list">
                    <!-- Las disponibilidades se cargarán dinámicamente desde el backend -->
                </div>
            </div>
            
            <div class="schedule-blocks">
                <h3>Bloqueos Programados</h3>
                <div class="blocks-list">
                    <!-- Los bloqueos se cargarán dinámicamente desde el backend -->
                </div>
            </div>
            
            <div class="schedule-limits">
                <h3>Límites de Sesiones</h3>
                <div class="limits-display">
                    <!-- Los límites se cargarán dinámicamente desde el backend -->
                </div>
            </div>
        </div>
    `;
    
    // Cargar datos dinámicos desde el backend
    loadScheduleData();
}

// FUNCIONES PARA CARGAR DATOS DINÁMICOS DE HORARIOS
function loadScheduleData() {
    // Cargar disponibilidades actuales
    loadCurrentAvailability();
    
    // Cargar bloqueos programados
    loadScheduleBlocks();
    
    // Cargar límites de sesiones
    loadScheduleLimits();
}

function loadCurrentAvailability() {
    const availabilityList = document.querySelector('.availability-list');
    if (!availabilityList) {
        console.log('No se encontró el elemento .availability-list');
        return;
    }
    
    // Conectar con el backend para obtener las disponibilidades actuales
    if (typeof BackendAPI !== 'undefined') {
        BackendAPI.getCurrentAvailability()
            .then(availability => {
                displayCurrentAvailability(availability);
            })
            .catch(error => {
                console.error('Error cargando disponibilidades:', error);
                // Fallback: usar localStorage
                const tutorAvailability = JSON.parse(localStorage.getItem('tutorAvailability') || '[]');
                console.log('Cargando desde localStorage:', tutorAvailability.length, 'elementos');
                displayCurrentAvailability(tutorAvailability);
            });
    } else {
        // Fallback: usar localStorage
        const tutorAvailability = JSON.parse(localStorage.getItem('tutorAvailability') || '[]');
        console.log('Cargando desde localStorage:', tutorAvailability.length, 'elementos');
        displayCurrentAvailability(tutorAvailability);
    }
}

function displayCurrentAvailability(availability) {
    const availabilityList = document.querySelector('.availability-list');
    if (!availabilityList) {
        console.log('No se encontró el elemento .availability-list en displayCurrentAvailability');
        return;
    }
    
    // Filtrar solo registros que tengan fecha y materia (datos nuevos)
    const validAvailability = availability.filter(item => item.date && item.subject);
    console.log('Mostrando disponibilidades:', validAvailability.length, 'de', availability.length, 'totales');
    
    if (validAvailability.length === 0) {
        console.log('No hay disponibilidades válidas, mostrando mensaje vacío');
        availabilityList.innerHTML = `
            <div class="no-availability-message">
                <div class="no-availability-icon">
                    <i class="fas fa-calendar-times"></i>
                </div>
                <h4>No hay disponibilidades configuradas</h4>
                <p>Configura tu disponibilidad para que los estudiantes puedan solicitar sesiones.</p>
                <button class="btn btn-primary" onclick="openScheduleModal()">
                    <i class="fas fa-calendar-plus"></i> Configurar Disponibilidad
                </button>
            </div>
        `;
        return;
    }
    
    console.log('Generando HTML para', validAvailability.length, 'disponibilidades');
    
    // Generar elementos de disponibilidad dinámicamente
    availabilityList.innerHTML = validAvailability.map(item => {
        // Asegurar que el ID existe
        const itemId = item.id || `avail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('Generando elemento para ID:', itemId);
        
        return `
        <div class="availability-item" data-id="${itemId}">
            <div class="availability-info">
                <div class="availability-main">
                    <span class="date">${formatDate(item.date) || ''}</span>
                    <span class="time">${formatTime(item.startTime) || ''} - ${formatTime(item.endTime) || ''}</span>
                </div>
                <div class="availability-details">
                    <span class="subject">${getSubjectName(item.subject) || ''}</span>
                    <span class="modality ${item.modality || ''}">${getModalityName(item.modality) || ''}</span>
                    <span class="duration">${formatDuration(item.duration || 45)}</span>
                </div>
            </div>
            <div class="availability-actions">
                <button class="btn btn-outline" onclick="editAvailability('${itemId}')" data-edit-id="${itemId}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-danger" onclick="deleteAvailability('${itemId}')" data-delete-id="${itemId}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `;
    }).join('');
    
    console.log('HTML generado exitosamente');
}

function loadScheduleBlocks() {
    const blocksList = document.querySelector('.blocks-list');
    if (!blocksList) return;
    
    // Conectar con el backend para obtener los bloqueos programados
    if (typeof BackendAPI !== 'undefined') {
        BackendAPI.getScheduleBlocks()
            .then(blocks => {
                displayScheduleBlocks(blocks);
            })
            .catch(error => {
                console.error('Error cargando bloqueos:', error);
                displayScheduleBlocks([]);
            });
    } else {
        // Fallback: mostrar lista vacía
        displayScheduleBlocks([]);
    }
}

function displayScheduleBlocks(blocks) {
    const blocksList = document.querySelector('.blocks-list');
    if (!blocksList) return;
    
    if (blocks.length === 0) {
        blocksList.innerHTML = `
            <div class="no-blocks-message">
                <div class="no-blocks-icon">
                    <i class="fas fa-calendar-check"></i>
                        </div>
                <h4>No hay bloqueos programados</h4>
                <p>Los bloqueos de horario aparecerán aquí cuando los configures.</p>
            </div>
        `;
        return;
    }
    
    // Generar elementos de bloqueos dinámicamente
    blocksList.innerHTML = blocks.map(block => `
        <div class="block-item">
            <div class="block-info">
                <span class="block-dates">${block.dateRange || ''}</span>
                <span class="block-time">${block.timeRange || ''}</span>
                <span class="block-reason">${block.reason || ''}</span>
                ${block.description ? `<span class="block-description">${block.description}</span>` : ''}
            </div>
            <div class="block-actions">
                <button class="btn btn-outline" onclick="editBlock('${block.id}')">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                <button class="btn btn-danger" onclick="deleteBlock('${block.id}')">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
    `).join('');
}

function loadScheduleLimits() {
    const limitsDisplay = document.querySelector('.limits-display');
    if (!limitsDisplay) return;
    
    // Conectar con el backend para obtener los límites de sesiones
    if (typeof BackendAPI !== 'undefined') {
        BackendAPI.getScheduleLimits()
            .then(limits => {
                displayScheduleLimits(limits);
            })
            .catch(error => {
                console.error('Error cargando límites:', error);
                displayScheduleLimits({});
            });
    } else {
        // Fallback: mostrar valores por defecto
        displayScheduleLimits({});
    }
}

function displayScheduleLimits(limits) {
    const limitsDisplay = document.querySelector('.limits-display');
    if (!limitsDisplay) return;
    
    limitsDisplay.innerHTML = `
        <div class="limits-grid">
            <div class="limit-item">
                <div class="limit-icon">
                    <i class="fas fa-calendar-day"></i>
                </div>
                <div class="limit-info">
                    <h4>Máximo por Día</h4>
                    <span class="limit-value">${limits.maxDailySessions || 'No configurado'}</span>
            </div>
            </div>
            <div class="limit-item">
                <div class="limit-icon">
                    <i class="fas fa-calendar-week"></i>
                </div>
                <div class="limit-info">
                    <h4>Máximo por Semana</h4>
                    <span class="limit-value">${limits.maxWeeklySessions || 'No configurado'}</span>
                </div>
            </div>
            <div class="limit-item">
                <div class="limit-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="limit-info">
                    <h4>Duración Estándar</h4>
                    <span class="limit-value">${limits.sessionDuration || 'No configurado'} min</span>
                </div>
            </div>
            <div class="limit-item">
                <div class="limit-icon">
                    <i class="fas fa-pause"></i>
                </div>
                <div class="limit-info">
                    <h4>Tiempo de Descanso</h4>
                    <span class="limit-value">${limits.breakTime || 'No configurado'} min</span>
                </div>
            </div>
        </div>
        <div class="limits-actions">
            <button class="btn btn-outline" onclick="openScheduleModal()">
                <i class="fas fa-cog"></i> Configurar Límites
            </button>
        </div>
    `;
}

function loadSesionesSection() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="content-header">
            <h2>Gestión de Sesiones</h2>
            <p>Administra las solicitudes y sesiones de tutoría</p>
        </div>
        
        <div class="sessions-tabs">
            <button class="tab-btn active" onclick="showSessionTab('pending')">Pendientes</button>
            <button class="tab-btn" onclick="showSessionTab('assigned')">Asignadas</button>
            <button class="tab-btn" onclick="showSessionTab('confirmed')">Confirmadas</button>
            <button class="tab-btn" onclick="showSessionTab('rejected')">No Aceptados</button>
            <button class="tab-btn" onclick="showSessionTab('completed')">Completadas</button>
        </div>
        
        <div class="sessions-content">
            <div class="session-tab-content active" id="pendingSessions">
                <!-- Las sesiones pendientes se cargarán dinámicamente desde el backend -->
            </div>
            <div class="session-tab-content" id="assignedSessions">
                <!-- Las sesiones asignadas por el administrador se cargarán aquí -->
            </div>
            <div class="session-tab-content" id="confirmedSessions">
                <!-- Las sesiones confirmadas se cargarán dinámicamente desde el backend -->
            </div>
            <div class="session-tab-content" id="rejectedSessions">
                <!-- Las sesiones no aceptadas se cargarán dinámicamente desde el backend -->
            </div>
            <div class="session-tab-content" id="completedSessions">
                <!-- Las sesiones completadas se cargarán dinámicamente desde el backend -->
            </div>
        </div>
    `;
    
    // Cargar datos dinámicos desde el backend
    loadSessionsData();
}

// FUNCIONES PARA CARGAR DATOS DINÁMICOS DE SESIONES
function loadSessionsData() {
    // Cargar sesiones pendientes
    loadPendingSessions();
    
    // Cargar sesiones asignadas
    loadAssignedSessions();
    
    // Cargar sesiones confirmadas
    loadConfirmedSessions();
    
    // Cargar sesiones rechazadas/no aceptadas
    loadRejectedSessions();
    
    // Cargar sesiones completadas
    loadCompletedSessions();
}

function loadPendingSessions() {
    const pendingSessionsContainer = document.getElementById('pendingSessions');
    if (!pendingSessionsContainer) return;
    
    // Conectar con el backend para obtener las sesiones pendientes
    if (typeof BackendAPI !== 'undefined') {
        BackendAPI.getPendingSessions()
            .then(sessions => {
                displayPendingSessions(sessions);
            })
            .catch(error => {
                console.error('Error cargando sesiones pendientes:', error);
                displayPendingSessions([]);
            });
    } else {
        // Fallback: mostrar datos de ejemplo
        const sampleSessions = getSamplePendingSessions();
        displayPendingSessions(sampleSessions);
    }
}

function displayPendingSessions(sessions) {
    const pendingSessionsContainer = document.getElementById('pendingSessions');
    if (!pendingSessionsContainer) return;
    
    if (sessions.length === 0) {
        pendingSessionsContainer.innerHTML = `
            <div class="no-sessions-message">
                <div class="no-sessions-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <h4>No hay sesiones pendientes</h4>
                <p>Las nuevas solicitudes de estudiantes aparecerán aquí.</p>
            </div>
        `;
        return;
    }
    
    // Generar elementos de sesiones pendientes dinámicamente
    pendingSessionsContainer.innerHTML = sessions.map(session => `
                <div class="session-item">
                    <div class="session-info">
                        <h4>${session.subject || ''}</h4>
                        <p><strong>Estudiante:</strong> ${session.studentName || ''}</p>
                        <p><strong>Email:</strong> ${session.studentEmail || ''}</p>
                        <p><strong>Fecha:</strong> ${formatDate(session.date) || ''}</p>
                        <p><strong>Hora:</strong> ${formatTime(session.time) || ''}</p>
                        <p><strong>Duración:</strong> ${formatDuration(session.duration) || ''}</p>
                        <p><strong>Modalidad:</strong> ${session.modality || ''}</p>
                        <p><strong>Ubicación:</strong> ${session.location || ''}</p>
                        <p><strong>Mensaje:</strong> ${session.message || ''}</p>
                    </div>
                    <div class="session-actions">
                        <button class="btn btn-success" onclick="acceptRequest('${session.id}')">Aceptar</button>
                        <button class="btn btn-danger" onclick="rejectRequest('${session.id}')">Rechazar</button>
                    </div>
                </div>
    `).join('');
}

function loadAssignedSessions() {
    const assignedSessionsContainer = document.getElementById('assignedSessions');
    if (!assignedSessionsContainer) return;
    
    // Obtener sesiones asignadas por el administrador
    const assignedSessions = getAssignedSessions();
    displayAssignedSessions(assignedSessions);
}

function displayAssignedSessions(sessions) {
    const assignedSessionsContainer = document.getElementById('assignedSessions');
    if (!assignedSessionsContainer) return;
    
    if (sessions.length === 0) {
        assignedSessionsContainer.innerHTML = `
            <div class="no-sessions-message">
                <div class="no-sessions-icon">
                    <i class="fas fa-user-tie"></i>
                </div>
                <h4>No tienes sesiones asignadas</h4>
                <p>Las sesiones asignadas por el administrador aparecerán aquí.</p>
            </div>
        `;
        return;
    }
    
    // Generar elementos de sesiones asignadas dinámicamente
    assignedSessionsContainer.innerHTML = sessions.map(session => `
        <div class="session-item assigned-session">
            <div class="session-info">
                <h4>${session.materia || 'Materia'}</h4>
                <p><strong>Estudiante:</strong> ${session.alumno || 'Estudiante'}</p>
                <p><strong>ID Sesión:</strong> ${session.id}</p>
                <p><strong>Fecha:</strong> ${formatDate(session.fecha) || ''}</p>
                <p><strong>Hora:</strong> ${formatTime(session.hora_inicio) || ''} - ${formatTime(session.hora_fin) || ''}</p>
                <p><strong>Modalidad:</strong> ${session.modalidad || ''}</p>
                <p><strong>Estado:</strong> <span class="status-badge assigned">Asignada</span></p>
            </div>
            <div class="session-actions">
                <button class="btn btn-primary" onclick="acceptAssignedSession('${session.id}')">Aceptar</button>
                <button class="btn btn-warning" onclick="rejectAssignedSession('${session.id}')">Rechazar</button>
                <button class="btn btn-outline" onclick="viewSessionDetails('${session.id}')">Ver Detalles</button>
            </div>
        </div>
    `).join('');
}

function loadConfirmedSessions() {
    const confirmedSessionsContainer = document.getElementById('confirmedSessions');
    if (!confirmedSessionsContainer) return;
    
    // Conectar con el backend para obtener las sesiones confirmadas
    if (typeof BackendAPI !== 'undefined') {
        BackendAPI.getConfirmedSessions()
            .then(sessions => {
                displayConfirmedSessions(sessions);
            })
            .catch(error => {
                console.error('Error cargando sesiones confirmadas:', error);
                displayConfirmedSessions([]);
            });
    } else {
        // Fallback: combinar datos de ejemplo con sesiones guardadas
        const sampleSessions = getSampleConfirmedSessions();
        const savedSessions = JSON.parse(localStorage.getItem('confirmedSessions') || '[]');
        const allSessions = [...sampleSessions, ...savedSessions];
        displayConfirmedSessions(allSessions);
    }
}

function displayConfirmedSessions(sessions) {
    const confirmedSessionsContainer = document.getElementById('confirmedSessions');
    if (!confirmedSessionsContainer) return;
    
    if (sessions.length === 0) {
        confirmedSessionsContainer.innerHTML = `
            <div class="no-sessions-message">
                <div class="no-sessions-icon">
                    <i class="fas fa-calendar-check"></i>
            </div>
                <h4>No hay sesiones confirmadas</h4>
                <p>Las sesiones confirmadas aparecerán aquí.</p>
        </div>
    `;
        return;
    }
    
    // Generar elementos de sesiones confirmadas dinámicamente
    confirmedSessionsContainer.innerHTML = sessions.map(session => `
        <div class="session-item">
            <div class="session-info">
                <h4>${session.subject || ''}</h4>
                <p><strong>Estudiante:</strong> ${session.studentName || ''}</p>
                <p><strong>Email:</strong> ${session.studentEmail || ''}</p>
                <p><strong>Fecha:</strong> ${formatDate(session.date) || ''}</p>
                <p><strong>Hora:</strong> ${formatTime(session.time) || ''}</p>
                <p><strong>Duración:</strong> ${formatDuration(session.duration) || ''}</p>
                <p><strong>Modalidad:</strong> ${session.modality || ''}</p>
                <p><strong>Ubicación:</strong> ${session.location || ''}</p>
                <p><strong>Estado:</strong> <span class="status-badge confirmed">Confirmada</span></p>
            </div>
            <div class="session-actions">
                <button class="btn btn-primary" onclick="markAttendance('${session.id}')">Marcar Asistencia</button>
                <button class="btn btn-success" onclick="markSessionAsCompleted('${session.id}')">Marcar Completada</button>
                <button class="btn btn-outline" onclick="viewSessionDetails('${session.id}')">Ver Detalles</button>
                <button class="btn btn-warning" onclick="rescheduleSession('${session.id}')">Reprogramar</button>
            </div>
        </div>
    `).join('');
}

function loadRejectedSessions() {
    const rejectedSessionsContainer = document.getElementById('rejectedSessions');
    if (!rejectedSessionsContainer) return;
    
    // Conectar con el backend para obtener las sesiones rechazadas
    if (typeof BackendAPI !== 'undefined') {
        BackendAPI.getRejectedSessions()
            .then(sessions => {
                displayRejectedSessions(sessions);
            })
            .catch(error => {
                console.error('Error cargando sesiones rechazadas:', error);
                displayRejectedSessions([]);
            });
    } else {
        // Fallback: combinar datos de ejemplo con sesiones guardadas
        const sampleSessions = getSampleRejectedSessions();
        const savedSessions = JSON.parse(localStorage.getItem('rejectedSessions') || '[]');
        const allSessions = [...sampleSessions, ...savedSessions];
        displayRejectedSessions(allSessions);
    }
}

function displayRejectedSessions(sessions) {
    const rejectedSessionsContainer = document.getElementById('rejectedSessions');
    if (!rejectedSessionsContainer) return;
    
    if (sessions.length === 0) {
        rejectedSessionsContainer.innerHTML = `
            <div class="no-sessions-message">
                <div class="no-sessions-icon">
                    <i class="fas fa-times-circle"></i>
                </div>
                <h4>No hay sesiones rechazadas</h4>
                <p>Las sesiones rechazadas aparecerán aquí.</p>
            </div>
        `;
        return;
    }
    
    // Generar elementos de sesiones rechazadas dinámicamente
    rejectedSessionsContainer.innerHTML = sessions.map(session => `
        <div class="session-item">
            <div class="session-info">
                <h4>${session.subject || ''}</h4>
                <p><strong>Estudiante:</strong> ${session.studentName || ''}</p>
                <p><strong>Email:</strong> ${session.studentEmail || ''}</p>
                <p><strong>Fecha:</strong> ${formatDate(session.date) || ''}</p>
                <p><strong>Hora:</strong> ${formatTime(session.time) || ''}</p>
                <p><strong>Duración:</strong> ${formatDuration(session.duration) || ''}</p>
                <p><strong>Modalidad:</strong> ${session.modality || ''}</p>
                <p><strong>Ubicación:</strong> ${session.location || ''}</p>
                <p><strong>Estado:</strong> <span class="status-badge rejected">Rechazada</span></p>
                <p><strong>Motivo:</strong> ${session.reason || 'No especificado'}</p>
            </div>
            <div class="session-actions">
                <button class="btn btn-outline" onclick="viewSessionDetails('${session.id}')">Ver Detalles</button>
                <button class="btn btn-primary" onclick="reconsiderSession('${session.id}')">Reconsiderar</button>
            </div>
        </div>
    `).join('');
}

function loadCompletedSessions() {
    const completedSessionsContainer = document.getElementById('completedSessions');
    if (!completedSessionsContainer) return;
    
    // Conectar con el backend para obtener las sesiones completadas
    if (typeof BackendAPI !== 'undefined') {
        BackendAPI.getCompletedSessions()
            .then(sessions => {
                displayCompletedSessions(sessions);
            })
            .catch(error => {
                console.error('Error cargando sesiones completadas:', error);
                displayCompletedSessions([]);
            });
    } else {
        // Fallback: mostrar datos de ejemplo
        const sampleSessions = getSampleCompletedSessions();
        displayCompletedSessions(sampleSessions);
    }
}

function displayCompletedSessions(sessions) {
    const completedSessionsContainer = document.getElementById('completedSessions');
    if (!completedSessionsContainer) return;
    
    if (sessions.length === 0) {
        completedSessionsContainer.innerHTML = `
            <div class="no-sessions-message">
                <div class="no-sessions-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h4>No hay sesiones completadas</h4>
                <p>Las sesiones completadas aparecerán aquí.</p>
            </div>
        `;
        return;
    }
    
    // Generar elementos de sesiones completadas dinámicamente
    completedSessionsContainer.innerHTML = sessions.map(session => `
        <div class="session-item">
            <div class="session-info">
                <h4>${session.subject || ''}</h4>
                <p><strong>Estudiante:</strong> ${session.studentName || ''}</p>
                <p><strong>Email:</strong> ${session.studentEmail || ''}</p>
                <p><strong>Fecha:</strong> ${formatDate(session.date) || ''}</p>
                <p><strong>Hora:</strong> ${formatTime(session.time) || ''}</p>
                <p><strong>Duración:</strong> ${formatDuration(session.duration) || ''}</p>
                <p><strong>Modalidad:</strong> ${session.modality || ''}</p>
                <p><strong>Ubicación:</strong> ${session.location || ''}</p>
                <p><strong>Estado:</strong> <span class="status-badge completed">Completada</span></p>
                <p><strong>Calificación:</strong> ${session.rating ? '★'.repeat(session.rating) + ' (' + session.rating + '/5)' : 'Sin calificar'}</p>
                <p><strong>Comentarios:</strong> ${session.feedback || 'Sin comentarios'}</p>
                <p><strong>Asistencia:</strong> ${session.attendance || ''}</p>
            </div>
            <div class="session-actions">
                <button class="btn btn-outline" onclick="viewSessionDetails('${session.id}')">Ver Detalles</button>
                <button class="btn btn-secondary" onclick="viewSessionNotes('${session.id}')">Ver Notas</button>
            </div>
        </div>
    `).join('');
}

// Función para cambiar entre pestañas de sesiones
function showSessionTab(tabType) {
    console.log(`Cambiando a pestaña: ${tabType}`);
    
    // Ocultar todas las pestañas
    document.querySelectorAll('.session-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remover clase active de todos los botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar la pestaña seleccionada
    const targetTab = document.getElementById(tabType + 'Sessions');
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Activar el botón correspondiente
    const targetBtn = document.querySelector(`[onclick="showSessionTab('${tabType}')"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
    
    // Cargar datos de la pestaña seleccionada con un pequeño delay
    setTimeout(() => {
        if (tabType === 'pending') {
            loadPendingSessions();
        } else if (tabType === 'assigned') {
            loadAssignedSessions();
        } else if (tabType === 'confirmed') {
            loadConfirmedSessions();
        } else if (tabType === 'rejected') {
            loadRejectedSessions();
        } else if (tabType === 'completed') {
            loadCompletedSessions();
        }
    }, 100);
}

// FUNCIONES SIMPLIFICADAS PARA GESTIÓN DE HORARIOS
function openScheduleModal() {
    const modal = document.getElementById('scheduleModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Limpiar formulario
        const form = document.getElementById('simpleScheduleForm');
        if (form) {
            form.reset();
        }
        
        // Configurar fecha mínima (hoy)
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('scheduleDate');
        if (dateInput) {
            dateInput.min = today;
        }
        
        // Resetear el botón de guardar
        const saveBtn = document.querySelector('[onclick="saveSimpleSchedule()"]');
        if (saveBtn) {
            saveBtn.textContent = 'Guardar Disponibilidad';
            saveBtn.removeAttribute('data-edit-id');
        }
    } else {
        console.error('Modal scheduleModal no encontrado');
        showNotification('Error: Modal no disponible', 'error');
    }
}

function closeScheduleModal() {
    const modal = document.getElementById('scheduleModal');
    if (modal) {
        modal.style.display = 'none';
    } else {
        console.error('Modal scheduleModal no encontrado para cerrar');
    }
}

function saveSimpleSchedule() {
    const form = document.getElementById('simpleScheduleForm');
    if (!form) {
        console.error('Formulario simpleScheduleForm no encontrado');
        showNotification('Error: Formulario no disponible', 'error');
        return;
    }
    
    const formData = new FormData(form);
    
    // Validar formulario
    const date = document.getElementById('scheduleDate').value;
    const subject = document.getElementById('scheduleSubject').value;
    const start = document.getElementById('scheduleStart').value;
    const end = document.getElementById('scheduleEnd').value;
    const modality = document.getElementById('scheduleModality').value;
    
    // Calcular duración automáticamente
    const duration = calculateDuration(start, end);
    
    if (!date || !subject || !start || !end || !modality) {
        showNotification('Por favor completa todos los campos requeridos', 'error');
        return;
    }
    
    // Validar que la hora de fin sea mayor que la de inicio
    if (start >= end) {
        showNotification('La hora de fin debe ser mayor que la hora de inicio', 'error');
        return;
    }
    
    // Validar que la fecha no sea en el pasado
    const selectedDate = new Date(date + 'T00:00:00'); // Usar hora local para evitar problemas de zona horaria
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showNotification('No puedes programar disponibilidad para fechas pasadas', 'error');
        return;
    }
    
    // Verificar si es una edición
    const saveBtn = document.querySelector('[onclick="saveSimpleSchedule()"]');
    const editId = saveBtn ? saveBtn.getAttribute('data-edit-id') : null;
    
    // Si es una edición, verificar si hay cambios
    if (editId) {
        const tutorAvailability = JSON.parse(localStorage.getItem('tutorAvailability') || '[]');
        const existingAvailability = tutorAvailability.find(av => av.id === editId);
        
        if (existingAvailability) {
            // Comparar todos los campos para detectar cambios
            const hasChanges = 
                existingAvailability.date !== date ||
                existingAvailability.subject !== subject ||
                existingAvailability.startTime !== start ||
                existingAvailability.endTime !== end ||
                existingAvailability.modality !== modality ||
                existingAvailability.duration !== duration;
            
            if (!hasChanges) {
                showModalNotification('No se realizaron cambios', 'info');
                return; // No cerrar el modal
            }
        }
    }
    
    // Crear objeto de disponibilidad
    const availability = {
        id: editId || `avail_${Date.now()}`,
        date: date, // Usar la fecha directamente del input (formato YYYY-MM-DD)
        day: getDayNameFromDate(date),
        subject: subject,
        startTime: start,
        endTime: end,
        modality: modality,
        duration: duration, // Usar la duración calculada automáticamente
        createdAt: editId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    console.log('Disponibilidad creada:', availability);
    
    // Validar duplicados (solo para nuevas disponibilidades)
    if (!editId) {
        if (validateDuplicateAvailability(availability)) {
            showNotification('Ya tienes una disponibilidad configurada para esta fecha, materia y horario', 'error');
            return;
        }
    }
    
    // Guardar en el backend y sincronizar con estudiantes
    if (typeof BackendAPI !== 'undefined') {
        const apiCall = editId ? 
            BackendAPI.updateTutorAvailability(availability) : 
            BackendAPI.createTutorAvailability(availability);
            
        apiCall.then(() => {
            // Notificar a los estudiantes sobre la disponibilidad
            const notificationCall = editId ?
                BackendAPI.notifyStudentsAboutAvailabilityUpdate(availability) :
                BackendAPI.notifyStudentsAboutAvailability(availability);
                
            notificationCall.then(() => {
                console.log(`Disponibilidad ${editId ? 'actualizada' : 'creada'} y notificada a estudiantes`);
                showNotification(`Disponibilidad ${editId ? 'actualizada' : 'guardada'} exitosamente`, 'success');
                closeScheduleModal();
                
                // Recargar la sección de horarios
                loadCurrentAvailability();
            })
            .catch(error => {
                console.error('Error notificando a estudiantes:', error);
                showNotification(`Disponibilidad ${editId ? 'actualizada' : 'guardada'}, pero hubo un problema notificando a los estudiantes`, 'warning');
                closeScheduleModal();
                loadCurrentAvailability();
            });
        })
        .catch(error => {
            console.error(`Error ${editId ? 'actualizando' : 'guardando'} disponibilidad:`, error);
            showNotification(`Error al ${editId ? 'actualizar' : 'guardar'} la disponibilidad`, 'error');
        });
    } else {
        // Fallback: usar localStorage para simular
        const tutorAvailability = JSON.parse(localStorage.getItem('tutorAvailability') || '[]');
        
        if (editId) {
            // Actualizar disponibilidad existente
            const index = tutorAvailability.findIndex(av => av.id === editId);
            if (index !== -1) {
                tutorAvailability[index] = availability;
            }
        } else {
            // Crear nueva disponibilidad
            tutorAvailability.push(availability);
        }
        
        localStorage.setItem('tutorAvailability', JSON.stringify(tutorAvailability));
        
        // Simular notificación a estudiantes
        const studentNotifications = JSON.parse(localStorage.getItem('studentNotifications') || '[]');
        studentNotifications.push({
            id: `notif_${Date.now()}`,
            type: editId ? 'availability_updated' : 'new_availability',
            tutorId: 'current_tutor',
            message: `${editId ? 'Disponibilidad actualizada' : 'Nueva disponibilidad'}: ${getDayNameFromDate(date)} de ${start} a ${end} (${modality})`,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('studentNotifications', JSON.stringify(studentNotifications));
        
        showNotification(`Disponibilidad ${editId ? 'actualizada' : 'guardada'} exitosamente`, 'success');
        closeScheduleModal();
        
        // Recargar las disponibilidades actuales
        loadCurrentAvailability();
    }
}

function getDayName(dayValue) {
    const days = {
        'monday': 'Lunes',
        'tuesday': 'Martes', 
        'wednesday': 'Miércoles',
        'thursday': 'Jueves',
        'friday': 'Viernes',
        'saturday': 'Sábado',
        'sunday': 'Domingo'
    };
    return days[dayValue] || dayValue;
}

function getDayNameFromDate(dateString) {
    if (!dateString) return '';
    
    // Evitar problemas de zona horaria usando método manual
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
}

function getSubjectName(subjectValue) {
    const subjects = {
        'matematicas': 'Matemáticas',
        'fisica': 'Física',
        'quimica': 'Química',
        'biologia': 'Biología',
        'espanol': 'Español',
        'historia': 'Historia',
        'geografia': 'Geografía',
        'ingles': 'Inglés',
        'filosofia': 'Filosofía',
        'literatura': 'Literatura',
        'programacion': 'Programación',
        'estadistica': 'Estadística',
        'calculo': 'Cálculo',
        'algebra': 'Álgebra',
        'otra': 'Otra'
    };
    return subjects[subjectValue] || subjectValue;
}

function validateDuplicateAvailability(newAvailability) {
    const tutorAvailability = JSON.parse(localStorage.getItem('tutorAvailability') || '[]');
    
    return tutorAvailability.some(existing => {
        // Solo validar si el registro existente tiene los campos necesarios
        if (!existing.date || !existing.subject) {
            return false; // No considerar registros antiguos sin fecha/materia
        }
        
        return existing.date === newAvailability.date &&
               existing.subject === newAvailability.subject &&
               existing.startTime === newAvailability.startTime &&
               existing.endTime === newAvailability.endTime &&
               existing.modality === newAvailability.modality;
    });
}

function formatTime(timeString) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'p. m.' : 'a. m.';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    // Evitar problemas de zona horaria usando método manual
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    const yearNum = date.getFullYear();
    
    return `${dayName} ${dayNum}/${monthName}/${yearNum}`;
}

function getModalityName(modality) {
    const modalities = {
        'presencial': 'Presencial',
        'virtual': 'Virtual',
        'both': 'Presencial/Virtual'
    };
    return modalities[modality] || modality;
}

function calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return 0;
    
    // Convertir horas a minutos para facilitar el cálculo
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    // Calcular la diferencia
    let duration = endMinutes - startMinutes;
    
    // Si la duración es negativa (por ejemplo, de 23:00 a 01:00), asumir que es al día siguiente
    if (duration < 0) {
        duration += 24 * 60; // Agregar 24 horas en minutos
    }
    
    return duration;
}

function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

function formatDuration(minutes) {
    if (!minutes || minutes <= 0) return '';
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
        return `${remainingMinutes}min`;
    } else if (remainingMinutes === 0) {
        return `${hours}hr`;
    } else {
        return `${hours}hr ${remainingMinutes}min`;
    }
}

function updateDurationField() {
    const startTime = document.getElementById('scheduleStart');
    const endTime = document.getElementById('scheduleEnd');
    const durationField = document.getElementById('scheduleDuration');
    
    if (startTime && endTime && durationField) {
        const duration = calculateDuration(startTime.value, endTime.value);
        
        if (duration > 0) {
            durationField.value = formatDuration(duration);
        } else {
            durationField.value = '';
        }
    }
}

function editAvailability(availabilityId) {
    console.log('Intentando editar disponibilidad:', availabilityId);
    
    // Obtener datos de la disponibilidad
    if (typeof BackendAPI !== 'undefined') {
        BackendAPI.getAvailabilityById(availabilityId)
            .then(availability => {
                console.log('Disponibilidad encontrada:', availability);
                openScheduleModal();
                populateScheduleForm(availability);
            })
            .catch(error => {
                console.error('Error obteniendo disponibilidad:', error);
                showNotification('Error al cargar la disponibilidad', 'error');
            });
    } else {
        // Fallback: buscar en localStorage
        const tutorAvailability = JSON.parse(localStorage.getItem('tutorAvailability') || '[]');
        console.log('Buscando en localStorage:', tutorAvailability.length, 'elementos');
        console.log('IDs disponibles:', tutorAvailability.map(av => av.id));
        
        const availability = tutorAvailability.find(av => av.id === availabilityId);
        
        if (availability) {
            console.log('Disponibilidad encontrada:', availability);
            openScheduleModal();
            populateScheduleForm(availability);
        } else {
            console.error('Disponibilidad no encontrada con ID:', availabilityId);
            showNotification('Disponibilidad no encontrada', 'error');
        }
    }
}

function populateScheduleForm(availability) {
    console.log('Poblando formulario con:', availability);
    
    try {
        // Verificar que todos los elementos existan antes de asignar valores
        const dateInput = document.getElementById('scheduleDate');
        const subjectSelect = document.getElementById('scheduleSubject');
        const startInput = document.getElementById('scheduleStart');
        const endInput = document.getElementById('scheduleEnd');
        const modalitySelect = document.getElementById('scheduleModality');
        const durationSelect = document.getElementById('scheduleDuration');
        
        if (!dateInput || !subjectSelect || !startInput || !endInput || !modalitySelect || !durationSelect) {
            console.error('Elementos del formulario no encontrados');
            showNotification('Error: Formulario no disponible', 'error');
            return;
        }
        
        // Corregir el problema de fecha - manejar diferentes formatos
        if (availability.date) {
            let dateValue = availability.date;
            console.log('Fecha original en disponibilidad:', dateValue);
            
            // Si la fecha viene como string en formato YYYY-MM-DD, usarla directamente
            if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
                dateInput.value = dateValue;
                console.log('✅ Fecha asignada directamente:', dateValue);
            } else {
                // Si viene como objeto Date o string con hora, extraer solo la fecha
                const date = new Date(dateValue);
                if (!isNaN(date.getTime())) {
                    // Usar método manual para evitar problemas de zona horaria
                    const [year, month, day] = dateValue.split('-');
                    const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    const isoDate = localDate.toISOString().split('T')[0];
                    dateInput.value = isoDate;
                    console.log('✅ Fecha convertida manualmente:', dateValue, '->', isoDate);
                } else {
                    console.error('❌ Fecha inválida:', dateValue);
                    dateInput.value = '';
                }
            }
            
            console.log('📅 Fecha final en input:', dateInput.value);
        }
        
        // Asignar valores
        subjectSelect.value = availability.subject || '';
        startInput.value = availability.startTime || '';
        endInput.value = availability.endTime || '';
        modalitySelect.value = availability.modality || '';
        
        // Calcular duración automáticamente
        updateDurationField();
        
        // Cambiar el botón para indicar que es una edición
        const saveBtn = document.querySelector('[onclick="saveSimpleSchedule()"]');
        if (saveBtn) {
            saveBtn.textContent = 'Actualizar Disponibilidad';
            saveBtn.setAttribute('data-edit-id', availability.id);
            console.log('Botón actualizado para edición:', availability.id);
        } else {
            console.error('Botón de guardar no encontrado');
        }
        
        console.log('Formulario poblado exitosamente');
    } catch (error) {
        console.error('Error poblando formulario:', error);
        showNotification('Error al cargar los datos en el formulario', 'error');
    }
}

function deleteAvailability(availabilityId) {
    console.log('Intentando eliminar disponibilidad:', availabilityId);
    
    if (confirm('¿Estás seguro de que quieres eliminar esta disponibilidad?')) {
        console.log('Confirmación recibida, procediendo con eliminación');
        
        if (typeof BackendAPI !== 'undefined') {
            BackendAPI.deleteTutorAvailability(availabilityId)
                .then(() => {
                    // Notificar a estudiantes sobre la eliminación
                    BackendAPI.notifyStudentsAboutAvailabilityDeletion(availabilityId)
                        .then(() => {
                            console.log('Disponibilidad eliminada y notificada a estudiantes');
                            showNotification('Disponibilidad eliminada exitosamente', 'success');
                            
                            // Recargar las disponibilidades actuales
                            loadCurrentAvailability();
                        })
                        .catch(error => {
                            console.error('Error notificando eliminación:', error);
                            showNotification('Disponibilidad eliminada, pero hubo un problema notificando a los estudiantes', 'warning');
                            loadCurrentAvailability();
                        });
                })
                .catch(error => {
                    console.error('Error eliminando disponibilidad:', error);
                    showNotification('Error al eliminar la disponibilidad', 'error');
                });
        } else {
            // Fallback: eliminar de localStorage
            try {
                const tutorAvailability = JSON.parse(localStorage.getItem('tutorAvailability') || '[]');
                console.log('Disponibilidades antes de eliminar:', tutorAvailability.length);
                console.log('IDs disponibles:', tutorAvailability.map(av => av.id));
                
                const filteredAvailability = tutorAvailability.filter(av => av.id !== availabilityId);
                console.log('Disponibilidades después de eliminar:', filteredAvailability.length);
                
                if (filteredAvailability.length === tutorAvailability.length) {
                    console.error('No se encontró la disponibilidad para eliminar');
                    showNotification('No se encontró la disponibilidad para eliminar', 'error');
                    return;
                }
                
                localStorage.setItem('tutorAvailability', JSON.stringify(filteredAvailability));
                
                showNotification('Disponibilidad eliminada exitosamente', 'success');
                
                // Recargar las disponibilidades actuales con un pequeño delay
                setTimeout(() => {
                    loadCurrentAvailability();
                }, 100);
                
            } catch (error) {
                console.error('Error en proceso de eliminación:', error);
                showNotification('Error al eliminar la disponibilidad', 'error');
            }
        }
    } else {
        console.log('Eliminación cancelada por el usuario');
    }
}

function loadEstudiantesSection() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="content-header">
            <h2>Mis Estudiantes</h2>
            <p>Gestiona la información y progreso de tus estudiantes</p>
        </div>
        
        <div class="students-grid">
            <!-- Los estudiantes se cargarán dinámicamente desde el backend -->
        </div>
    `;
    
    // Cargar datos dinámicos desde el backend
    loadStudentsData();
}

function loadValoracionesSection() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="content-header">
            <h2>Valoraciones</h2>
            <p>Revisa las calificaciones y comentarios de tus estudiantes</p>
        </div>
        
        <div class="ratings-summary">
            <!-- El resumen de calificaciones se cargará dinámicamente desde el backend -->
        </div>
        
        <div class="recent-ratings">
            <h3>Valoraciones Recientes</h3>
            <div class="ratings-list">
                <!-- Las valoraciones recientes se cargarán dinámicamente desde el backend -->
            </div>
        </div>
    `;
    
    // Cargar datos dinámicos desde el backend
    loadRatingsData();
}

function loadHistorialSection() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="content-header">
            <h2>Historial de Sesiones</h2>
            <p>Consulta el historial completo de tus sesiones de tutoría</p>
        </div>
        
        <div class="history-filters">
            <div class="filter-group">
                <label>Filtrar por fecha:</label>
                <input type="date" id="historyDateFilter">
            </div>
            <div class="filter-group">
                <label>Filtrar por estudiante:</label>
                <select id="historyStudentFilter">
                    <option value="">Todos los estudiantes</option>
                    <option value="1"></option>
                    <option value="2"></option>
                </select>
            </div>
            <button class="btn btn-primary" onclick="filterHistory()">Filtrar</button>
        </div>
        
        <div class="history-list">
            <div class="history-item">
                <div class="history-date"></div>
                <div class="history-info">
                    <h4></h4>
                    <p>Con: </p>
                    <p>Duración: </p>
                </div>
                <div class="history-actions">
                    <button class="btn btn-outline" onclick="viewHistoryDetails(1)">Ver Detalles</button>
                </div>
            </div>
        </div>
    `;
}

function loadNotificacionesSection() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="content-header">
            <h2>Notificaciones</h2>
            <p>Gestiona tus notificaciones y recordatorios</p>
        </div>
        
        <div class="notifications-list">
            <!-- Las notificaciones se cargarán dinámicamente desde el backend -->
        </div>
    `;
    
    // Cargar datos dinámicos desde el backend
    loadNotificationsData();
}

// FUNCIONES PARA CARGAR DATOS DINÁMICOS DE ESTUDIANTES
function loadStudentsData() {
    const studentsGrid = document.querySelector('.students-grid');
    if (!studentsGrid) return;
    
    // Conectar con el backend para obtener los estudiantes del tutor
    if (typeof BackendAPI !== 'undefined') {
        BackendAPI.getTutorStudents()
            .then(students => {
                displayStudents(students);
            })
            .catch(error => {
                console.error('Error cargando estudiantes:', error);
                displayStudents([]);
            });
    } else {
        // Fallback: mostrar lista vacía
        displayStudents([]);
    }
}

function displayStudents(students) {
    const studentsGrid = document.querySelector('.students-grid');
    if (!studentsGrid) return;
    
    if (students.length === 0) {
        studentsGrid.innerHTML = `
            <div class="no-students-message">
                <div class="no-students-icon">
                    <i class="fas fa-user-graduate"></i>
                </div>
                <h4>No tienes estudiantes asignados</h4>
                <p>Los estudiantes aparecerán aquí cuando soliciten tus servicios de tutoría.</p>
            </div>
        `;
        return;
    }
    
    // Generar tarjetas de estudiantes dinámicamente
    studentsGrid.innerHTML = students.map(student => `
        <div class="student-card">
            <div class="student-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="student-info">
                <h4>${student.name || ''}</h4>
                <p>${student.email || ''}</p>
                <div class="student-stats">
                    <span>Sesiones: ${student.totalSessions || 0}</span>
                    <span>Promedio: ${student.averageGrade || 'N/A'}</span>
                </div>
            </div>
            <div class="student-actions">
                <button class="btn btn-primary" onclick="viewStudentProfile('${student.id}')">Ver Perfil</button>
                <button class="btn btn-outline" onclick="messageStudent('${student.id}')">Mensaje</button>
            </div>
        </div>
    `).join('');
}

// FUNCIONES PARA CARGAR DATOS DINÁMICOS DE VALORACIONES
function loadRatingsData() {
    // Cargar resumen de calificaciones
    loadRatingsSummary();
    
    // Cargar valoraciones recientes
    loadRecentRatings();
}

function loadRatingsSummary() {
    const ratingsSummary = document.querySelector('.ratings-summary');
    if (!ratingsSummary) return;
    
    // Conectar con el backend para obtener el resumen de calificaciones
    if (typeof BackendAPI !== 'undefined') {
        BackendAPI.getTutorRatingsSummary()
            .then(summary => {
                displayRatingsSummary(summary);
            })
            .catch(error => {
                console.error('Error cargando resumen de calificaciones:', error);
                displayRatingsSummary({});
            });
    } else {
        // Fallback: mostrar valores por defecto
        displayRatingsSummary({});
    }
}

function displayRatingsSummary(summary) {
    const ratingsSummary = document.querySelector('.ratings-summary');
    if (!ratingsSummary) return;
    
    ratingsSummary.innerHTML = `
        <div class="rating-overview">
            <h3>Calificación Promedio</h3>
            <div class="rating-display">
                <span class="rating-number">${summary.averageRating || '0.0'}</span>
                <div class="stars">
                    ${generateStars(summary.averageRating || 0)}
                </div>
                <p class="rating-count">Basado en ${summary.totalRatings || 0} valoraciones</p>
            </div>
        </div>
    `;
}

function loadRecentRatings() {
    const ratingsList = document.querySelector('.ratings-list');
    if (!ratingsList) return;
    
    // Conectar con el backend para obtener las valoraciones recientes
    if (typeof BackendAPI !== 'undefined') {
        BackendAPI.getTutorRecentRatings()
            .then(ratings => {
                displayRecentRatings(ratings);
            })
            .catch(error => {
                console.error('Error cargando valoraciones recientes:', error);
                displayRecentRatings([]);
            });
    } else {
        // Fallback: mostrar lista vacía
        displayRecentRatings([]);
    }
}

function displayRecentRatings(ratings) {
    const ratingsList = document.querySelector('.ratings-list');
    if (!ratingsList) return;
    
    if (ratings.length === 0) {
        ratingsList.innerHTML = `
            <div class="no-ratings-message">
                <div class="no-ratings-icon">
                    <i class="fas fa-star"></i>
                </div>
                <h4>No hay valoraciones aún</h4>
                <p>Las valoraciones de tus estudiantes aparecerán aquí.</p>
            </div>
        `;
        return;
    }
    
    // Generar elementos de valoraciones dinámicamente
    ratingsList.innerHTML = ratings.map(rating => `
        <div class="rating-item">
            <div class="rating-header">
                <span class="student-name">${rating.studentName || ''}</span>
                <div class="rating-stars">
                    ${generateStars(rating.value || 0)}
                </div>
                <span class="rating-date">${rating.createdAt || ''}</span>
            </div>
            <p class="rating-comment">${rating.comment || 'Sin comentarios'}</p>
        </div>
    `).join('');
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    
    // Estrellas llenas
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    // Media estrella
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Estrellas vacías
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// FUNCIONES PARA CARGAR DATOS DINÁMICOS DE NOTIFICACIONES
function loadNotificationsData() {
    const notificationsList = document.querySelector('.notifications-list');
    if (!notificationsList) return;
    
    // Conectar con el backend para obtener las notificaciones del tutor
    if (typeof BackendAPI !== 'undefined') {
        BackendAPI.getTutorNotifications()
            .then(notifications => {
                displayNotifications(notifications);
            })
            .catch(error => {
                console.error('Error cargando notificaciones:', error);
                displayNotifications([]);
            });
    } else {
        // Fallback: mostrar lista vacía
        displayNotifications([]);
    }
}

function displayNotifications(notifications) {
    const notificationsList = document.querySelector('.notifications-list');
    if (!notificationsList) return;
    
    if (notifications.length === 0) {
        notificationsList.innerHTML = `
            <div class="no-notifications-message">
                <div class="no-notifications-icon">
                    <i class="fas fa-bell-slash"></i>
                </div>
                <h4>No hay notificaciones</h4>
                <p>Las notificaciones aparecerán aquí cuando recibas nuevas solicitudes o actualizaciones.</p>
            </div>
        `;
        return;
    }
    
    // Generar elementos de notificaciones dinámicamente
    notificationsList.innerHTML = notifications.map(notification => `
        <div class="notification-item ${notification.read ? 'read' : 'unread'}">
                <div class="notification-icon">
                <i class="fas ${getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                <h4>${notification.title || ''}</h4>
                <p>${notification.message || ''}</p>
                <span class="notification-time">${notification.createdAt || ''}</span>
                </div>
                <div class="notification-actions">
                <button class="btn btn-primary" onclick="viewNotification('${notification.id}')">Ver</button>
                ${!notification.read ? `<button class="btn btn-secondary" onclick="markAsRead('${notification.id}')">Marcar como leída</button>` : ''}
                </div>
            </div>
    `).join('');
}

function getNotificationIcon(type) {
    const icons = {
        'session_request': 'fa-calendar-plus',
        'session_accepted': 'fa-check-circle',
        'session_rejected': 'fa-times-circle',
        'session_completed': 'fa-calendar-check',
        'rating_received': 'fa-star',
        'message_received': 'fa-envelope',
        'general': 'fa-bell'
    };
    return icons[type] || 'fa-bell';
}

// ===============================================
// GESTIÓN DE HORARIOS (RF-05, RF-06, RF-07)
// ===============================================

function openScheduleModal() {
    const modal = document.getElementById('scheduleModal');
    modal.style.display = 'flex';
    
    // Limpiar formulario
    const form = document.getElementById('simpleScheduleForm');
    if (form) {
        form.reset();
    }
    
    // Configurar fecha mínima (hoy)
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('scheduleDate');
    if (dateInput) {
        dateInput.min = today;
    }
    
    // Resetear el botón de guardar
    const saveBtn = document.querySelector('[onclick="saveSimpleSchedule()"]');
    if (saveBtn) {
        saveBtn.textContent = 'Guardar Disponibilidad';
        saveBtn.removeAttribute('data-edit-id');
    }
}

function closeScheduleModal() {
    document.getElementById('scheduleModal').style.display = 'none';
}

function showScheduleTab(tabName) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.schedule-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Ocultar todos los botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar la pestaña seleccionada
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Activar el botón correspondiente
    event.target.classList.add('active');
}

function saveScheduleSettings() {
    const activeTab = document.querySelector('.schedule-tab-content.active');
    const tabId = activeTab.id;
    
    switch(tabId) {
        case 'recurringTab':
            saveRecurringAvailability();
            break;
        case 'blocksTab':
            saveBlockedPeriod();
            break;
        case 'limitsTab':
            saveSessionLimits();
            break;
    }
    
    showNotification('Configuración guardada exitosamente', 'success');
    closeScheduleModal();
}

function saveRecurringAvailability() {
    const form = document.getElementById('recurringForm');
    const formData = new FormData(form);
    
    const availability = {
        day: formData.get('recurringDay'),
        modality: formData.get('recurringModality'),
        startTime: formData.get('recurringStart'),
        endTime: formData.get('recurringEnd'),
        location: formData.get('recurringLocation'),
        link: formData.get('recurringLink')
    };
    
    console.log('Guardando disponibilidad recurrente:', availability);
    
    // Validar disponibilidad (RF-06: Prevención de choques)
    if (validateAvailabilityConflict(availability)) {
        showNotification('Conflicto de horario detectado. Verifica tu disponibilidad.', 'warning');
        return;
    }
    
    // Guardar en localStorage (en producción sería en el backend)
    const availabilities = JSON.parse(localStorage.getItem('tutorAvailabilities') || '[]');
    availabilities.push(availability);
    localStorage.setItem('tutorAvailabilities', JSON.stringify(availabilities));
}

function saveBlockedPeriod() {
    const form = document.getElementById('blocksForm');
    const formData = new FormData(form);
    
    const block = {
        startDate: formData.get('blockStartDate'),
        endDate: formData.get('blockEndDate'),
        startTime: formData.get('blockStartTime'),
        endTime: formData.get('blockEndTime'),
        reason: formData.get('blockReason'),
        description: formData.get('blockDescription')
    };
    
    console.log('Guardando bloqueo:', block);
    
    // Guardar en localStorage
    const blocks = JSON.parse(localStorage.getItem('tutorBlocks') || '[]');
    blocks.push(block);
    localStorage.setItem('tutorBlocks', JSON.stringify(blocks));
}

function saveSessionLimits() {
    const limits = {
        maxDailySessions: document.getElementById('maxDailySessions').value,
        maxWeeklySessions: document.getElementById('maxWeeklySessions').value,
        sessionDuration: document.getElementById('sessionDuration').value,
        breakTime: document.getElementById('breakTime').value,
        timezone: document.getElementById('timezone').value
    };
    
    console.log('Guardando límites de sesiones:', limits);
    
    // Guardar en localStorage
    localStorage.setItem('tutorLimits', JSON.stringify(limits));
    
    // Actualizar datos del tutor
    const tutorData = JSON.parse(localStorage.getItem('tutorData') || '{}');
    Object.assign(tutorData, limits);
    localStorage.setItem('tutorData', JSON.stringify(tutorData));
}

function validateAvailabilityConflict(newAvailability) {
    // RF-06: Prevención de choques
    const existingAvailabilities = JSON.parse(localStorage.getItem('tutorAvailabilities') || '[]');
    
    return existingAvailabilities.some(existing => {
        return existing.day === newAvailability.day &&
               existing.startTime < newAvailability.endTime &&
               existing.endTime > newAvailability.startTime;
    });
}

// ===============================================
// GESTIÓN DE SOLICITUDES (RF-11, RF-12, RF-13)
// ===============================================

function acceptRequest(requestId) {
    const confirmAccept = confirm('¿Estás seguro de que quieres aceptar esta solicitud?');
    if (confirmAccept) {
        console.log('Aceptando solicitud:', requestId);
        
        // Actualizar estado de la solicitud
        updateRequestStatus(requestId, 'accepted');
        
        // Actualizar estado en el calendario del estudiante usando BackendAPI
        if (typeof BackendAPI !== 'undefined') {
            BackendAPI.syncSessionStatus(requestId, 'accepted', 'tutor', 'tutor')
                .then(() => {
                    console.log('Estado sincronizado con el estudiante');
                })
                .catch(error => {
                    console.error('Error sincronizando estado:', error);
                });
        } else {
            // Fallback: usar función local
            updateStudentCalendarStatus(requestId, 'accepted');
        }
        
        // Enviar notificación al estudiante (RF-15)
        sendNotificationToStudent(requestId, 'accepted');
        
        // Actualizar contador de solicitudes pendientes
        updatePendingRequestsCounter(-1);
        
        showNotification('Solicitud aceptada exitosamente', 'success');
        
        // Remover la solicitud de la lista
        removeRequestFromList(requestId);
    }
}

function rejectRequest(requestId) {
    const reason = prompt('Motivo del rechazo (opcional):');
    const confirmReject = confirm('¿Estás seguro de que quieres rechazar esta solicitud?');
    if (confirmReject) {
        console.log('Rechazando solicitud:', requestId, 'Motivo:', reason);
        
        // Actualizar estado de la solicitud
        updateRequestStatus(requestId, 'rejected', reason);
        
        // Actualizar estado en el calendario del estudiante usando BackendAPI
        if (typeof BackendAPI !== 'undefined') {
            BackendAPI.syncSessionStatus(requestId, 'rejected', 'tutor', 'tutor')
                .then(() => {
                    console.log('Estado sincronizado con el estudiante');
                })
                .catch(error => {
                    console.error('Error sincronizando estado:', error);
                });
        } else {
            // Fallback: usar función local
            updateStudentCalendarStatus(requestId, 'rejected');
        }
        
        // Enviar notificación al estudiante (RF-15)
        sendNotificationToStudent(requestId, 'rejected', reason);
        
        // Actualizar contador de solicitudes pendientes
        updatePendingRequestsCounter(-1);
        
        showNotification('Solicitud rechazada', 'info');
        
        // Remover la solicitud de la lista
        removeRequestFromList(requestId);
    }
}

function proposeNewTime(requestId) {
    const newDate = prompt('Proponer nueva fecha (formato: YYYY-MM-DD):');
    const newTime = prompt('Proponer nueva hora (formato: HH:MM):');
    const message = prompt('Mensaje adicional para el estudiante:');
    
    if (newDate && newTime) {
        console.log('Proponiendo nuevo horario para solicitud:', requestId);
        
        // Validar nueva fecha/hora (RF-12: Reglas de reprogramación)
        if (validateRescheduleRules(newDate, newTime)) {
            // Actualizar estado de la solicitud
            updateRequestStatus(requestId, 'reschedule_proposed', {
                newDate: newDate,
                newTime: newTime,
                message: message
            });
            
            // Actualizar estado en el calendario del estudiante usando BackendAPI
            if (typeof BackendAPI !== 'undefined') {
                BackendAPI.syncSessionStatus(requestId, 'postponed', 'tutor', 'tutor')
                    .then(() => {
                        console.log('Estado sincronizado con el estudiante');
                    })
                    .catch(error => {
                        console.error('Error sincronizando estado:', error);
                    });
            } else {
                // Fallback: usar función local
                updateStudentCalendarStatus(requestId, 'postponed');
            }
            
            // Enviar notificación al estudiante (RF-15)
            sendNotificationToStudent(requestId, 'reschedule_proposed', {
                newDate: newDate,
                newTime: newTime,
                message: message
            });
            
            showNotification('Nueva hora propuesta enviada al estudiante', 'success');
        } else {
            showNotification('La nueva fecha/hora no cumple con las reglas de reprogramación', 'error');
        }
    }
}

function validateRescheduleRules(newDate, newTime) {
    // RF-12: Reglas de reprogramación
    const today = new Date();
    const proposedDate = new Date(newDate);
    const minAdvanceHours = 12; // Mínimo 12 horas de anticipación
    
    // Verificar que la fecha sea futura
    if (proposedDate <= today) {
        return false;
    }
    
    // Verificar ventana mínima de anticipación
    const timeDiff = proposedDate.getTime() - today.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff < minAdvanceHours) {
        return false;
    }
    
    // Verificar límites de sesiones (RF-07)
    return validateSessionLimits(newDate);
}

function validateSessionLimits(date) {
    const tutorLimits = JSON.parse(localStorage.getItem('tutorLimits') || '{}');
    const maxDailySessions = tutorLimits.maxDailySessions || 8;
    
    // Contar sesiones existentes para esa fecha
    const existingSessions = JSON.parse(localStorage.getItem('tutorSessions') || '[]');
    const sessionsOnDate = existingSessions.filter(session => session.date === date);
    
    return sessionsOnDate.length < maxDailySessions;
}

// ===============================================
// REGISTRO DE ASISTENCIA (RF-19)
// ===============================================

function markAttendance(sessionId) {
    // Obtener datos de la sesión
    const sessionData = getSessionData(sessionId);
    
    // Actualizar modal con datos de la sesión
    document.getElementById('attendanceSessionTitle').textContent = sessionData.title;
    document.getElementById('attendanceStudentName').textContent = `Con: ${sessionData.studentName}`;
    document.getElementById('attendanceSessionTime').textContent = `${sessionData.date} - ${sessionData.time}`;
    
    // Mostrar modal
    document.getElementById('attendanceModal').style.display = 'flex';
}

function closeAttendanceModal() {
    document.getElementById('attendanceModal').style.display = 'none';
}

function saveAttendance() {
    const attendanceStatus = document.querySelector('input[name="attendance"]:checked').value;
    const notes = document.getElementById('attendanceNotes').value;
    const nextSession = document.getElementById('nextSession').value;
    
    console.log('Guardando asistencia:', {
        status: attendanceStatus,
        notes: notes,
        nextSession: nextSession
    });
    
    // Guardar asistencia en localStorage
    const attendanceData = {
        sessionId: Date.now(), // En producción sería el ID real
        status: attendanceStatus,
        notes: notes,
        nextSession: nextSession,
        timestamp: new Date().toISOString()
    };
    
    const attendances = JSON.parse(localStorage.getItem('tutorAttendances') || '[]');
    attendances.push(attendanceData);
    localStorage.setItem('tutorAttendances', JSON.stringify(attendances));
    
    // Enviar notificación al estudiante sobre la sesión completada (RF-15)
    sendSessionCompletedNotification(attendanceData);
    
    showNotification('Asistencia registrada exitosamente', 'success');
    closeAttendanceModal();
}

// ===============================================
// NOTIFICACIONES (RF-15, RF-16, RF-17, RF-18)
// ===============================================

function setupNotifications() {
    // RF-16: Recordatorios automáticos
    setupAutomaticReminders();
    
    // RF-17: Resumen semanal
    setupWeeklySummary();
}

function setupAutomaticReminders() {
    // Simular recordatorios automáticos
    setInterval(() => {
        checkUpcomingSessions();
    }, 60000); // Verificar cada minuto
}

function checkUpcomingSessions() {
    const now = new Date();
    const sessions = JSON.parse(localStorage.getItem('tutorSessions') || '[]');
    
    sessions.forEach(session => {
        const sessionDate = new Date(session.date + ' ' + session.time);
        const timeDiff = sessionDate.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        // Recordatorio 24 horas antes
        if (hoursDiff > 23 && hoursDiff < 24.5) {
            showNotification(`Recordatorio: Sesión con ${session.studentName} mañana a las ${session.time}`, 'info');
        }
        
        // Recordatorio 1 hora antes
        if (hoursDiff > 0.5 && hoursDiff < 1.5) {
            showNotification(`Recordatorio: Sesión con ${session.studentName} en 1 hora`, 'warning');
        }
    });
}

function setupWeeklySummary() {
    // RF-17: Resumen semanal (ejecutar cada lunes)
    const today = new Date();
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - today.getDay() + 1);
    
    const lastSummary = localStorage.getItem('lastWeeklySummary');
    if (!lastSummary || new Date(lastSummary) < lastMonday) {
        generateWeeklySummary();
        localStorage.setItem('lastWeeklySummary', new Date().toISOString());
    }
}

function generateWeeklySummary() {
    const sessions = JSON.parse(localStorage.getItem('tutorSessions') || '[]');
    const weekSessions = sessions.filter(session => {
        const sessionDate = new Date(session.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return sessionDate >= weekAgo;
    });
    
    const summary = {
        totalSessions: weekSessions.length,
        completedSessions: weekSessions.filter(s => s.status === 'completed').length,
        averageRating: calculateAverageRating(),
        newStudents: getNewStudentsCount()
    };
    
    showNotification(`Resumen semanal: ${summary.totalSessions} sesiones, ${summary.completedSessions} completadas`, 'info');
}

function sendNotificationToStudent(requestId, type, data = null) {
    // RF-15: Notificaciones transaccionales
    const notification = {
        id: Date.now(),
        requestId: requestId,
        type: type,
        data: data,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    // En producción, esto se enviaría al backend
    console.log('Enviando notificación al estudiante:', notification);
    
    // Simular notificación en la interfaz del estudiante
    simulateStudentNotification(notification);
}

function simulateStudentNotification(notification) {
    // Simular que el estudiante recibe la notificación
    const studentNotifications = JSON.parse(localStorage.getItem('studentNotifications') || '[]');
    studentNotifications.push(notification);
    localStorage.setItem('studentNotifications', JSON.stringify(studentNotifications));
}

function sendSessionCompletedNotification(attendanceData) {
    const notification = {
        id: Date.now(),
        type: 'session_completed',
        data: attendanceData,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    console.log('Enviando notificación de sesión completada:', notification);
    simulateStudentNotification(notification);
}

// ===============================================
// FUNCIONES AUXILIARES
// ===============================================

function updateRequestStatus(requestId, status, data = null) {
    const requests = JSON.parse(localStorage.getItem('tutorRequests') || '[]');
    const requestIndex = requests.findIndex(req => req.id === requestId);
    
    if (requestIndex !== -1) {
        requests[requestIndex].status = status;
        requests[requestIndex].updatedAt = new Date().toISOString();
        if (data) {
            requests[requestIndex].data = data;
        }
        localStorage.setItem('tutorRequests', JSON.stringify(requests));
    }
}

function updatePendingRequestsCounter(change) {
    const currentCount = parseInt(document.getElementById('pendingRequests').textContent);
    document.getElementById('pendingRequests').textContent = Math.max(0, currentCount + change);
}

function removeRequestFromList(requestId) {
    const requestItem = document.querySelector(`[onclick*="${requestId}"]`).closest('.request-item');
    if (requestItem) {
        requestItem.remove();
    }
}

function getSessionData(sessionId) {
    // Simular datos de sesión
    return {
        id: sessionId,
        title: '',
        studentName: '',
        date: '',
        time: ''
    };
}

function calculateAverageRating() {
    const ratings = JSON.parse(localStorage.getItem('tutorRatings') || '[]');
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((acc, rating) => acc + rating.value, 0);
    return (sum / ratings.length).toFixed(1);
}

// FUNCIÓN PARA ACTUALIZAR MENSAJE DE BIENVENIDA DEL TUTOR
function updateTutorWelcomeMessage(profile) {
    const welcomeElement = document.getElementById('tutorWelcomeName');
    if (welcomeElement && profile.firstName) {
        welcomeElement.textContent = profile.firstName;
    }
}

// FUNCIÓN PARA ACTUALIZAR AVATAR DEL TUTOR
function updateTutorAvatar(profile) {
    const tutorNameElement = document.getElementById('tutorName');
    const tutorInitialsElement = document.getElementById('tutorInitials');
    const profileInitialsElement = document.getElementById('profileInitials');
    
    if (profile.firstName && profile.lastName) {
        const fullName = `${profile.firstName} ${profile.lastName}`;
        const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
        
        if (tutorNameElement) {
            tutorNameElement.textContent = fullName;
        }
        if (tutorInitialsElement) {
            tutorInitialsElement.textContent = initials;
        }
        if (profileInitialsElement) {
            profileInitialsElement.textContent = initials;
        }
    }
}

function getNewStudentsCount() {
    const students = JSON.parse(localStorage.getItem('tutorStudents') || '[]');
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return students.filter(student => new Date(student.joinedAt) >= weekAgo).length;
}

function showModalNotification(message, type = 'info') {
    // Crear notificación pequeña tipo celular dentro del modal
    const modal = document.getElementById('scheduleModal');
    if (!modal) return;
    
    // Remover notificación anterior si existe
    const existingNotification = modal.querySelector('.modal-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'modal-notification';
    notification.innerHTML = `
        <div class="modal-notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Estilos para la notificación tipo celular
    notification.style.position = 'absolute';
    notification.style.top = '10px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.zIndex = '1001';
    notification.style.backgroundColor = getNotificationColor(type);
    notification.style.color = type === 'warning' ? 'black' : 'white';
    notification.style.padding = '8px 16px';
    notification.style.borderRadius = '20px';
    notification.style.fontSize = '12px';
    notification.style.fontWeight = '500';
    notification.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.gap = '8px';
    notification.style.maxWidth = '300px';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease';
    
    // Agregar al modal
    modal.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}

function showNotification(message, type = 'info') {
    // Crear notificación pequeña tipo celular
    const notification = document.createElement('div');
    notification.className = `mobile-notification ${type}`;
    notification.innerHTML = `
        <div class="mobile-notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Estilos para notificación tipo celular pequeña
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '10000';
    notification.style.backgroundColor = '#7f0222'; // Color rojo como los encabezados
    notification.style.color = 'white';
    notification.style.padding = '8px 16px';
    notification.style.borderRadius = '20px';
    notification.style.fontSize = '12px';
    notification.style.fontWeight = '500';
    notification.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.gap = '8px';
    notification.style.maxWidth = '300px';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease';
    notification.style.border = '1px solid #a0032a';
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}

function getNotificationColor(type) {
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    return colors[type] || '#17a2b8';
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// ===============================================
// EVENT LISTENERS
// ===============================================

function setupEventListeners() {
    // Menú de usuario
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-info')) {
            document.getElementById('userMenu').style.display = 'none';
        }
    });
    
    // Cerrar modales al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('schedule-modal') || 
            e.target.classList.contains('attendance-modal') || 
            e.target.classList.contains('profile-modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Funciones para el menú móvil
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
}

function closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
}

// ===============================================
// FUNCIONES DEL MENÚ DE USUARIO
// ===============================================

function showUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function showProfile() {
    document.getElementById('profileModal').style.display = 'block';
    document.getElementById('userMenu').style.display = 'none';
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
}

function saveProfile() {
    const form = document.getElementById('profileForm');
    const formData = new FormData(form);
    
    const profileData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        specialty: formData.get('specialty'),
        experience: formData.get('experience')
    };
    
    console.log('Guardando perfil:', profileData);
    
    // Actualizar datos del tutor
    const tutorData = JSON.parse(localStorage.getItem('tutorData') || '{}');
    Object.assign(tutorData, profileData);
    localStorage.setItem('tutorData', JSON.stringify(tutorData));
    
    // Actualizar interfaz
    document.getElementById('tutorName').textContent = `${profileData.firstName} ${profileData.lastName}`;
    document.getElementById('tutorWelcomeName').textContent = `${profileData.firstName} ${profileData.lastName}`;
    
    showNotification('Perfil actualizado exitosamente', 'success');
    closeProfileModal();
}

function resetProfileForm() {
    document.getElementById('profileForm').reset();
}

function showSettings() {
    showNotification('Configuración disponible próximamente', 'info');
}

function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        localStorage.removeItem('tutorData');
        showNotification('Sesión cerrada exitosamente', 'info');
        // En producción, redirigir al login
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1000);
    }
}

// ===============================================
// FUNCIONES ADICIONALES
// ===============================================

function viewCurrentSchedule() {
    showNotification('Vista de horario disponible próximamente', 'info');
}

// Estas funciones están duplicadas y se eliminan aquí
// Las funciones reales están definidas más arriba en el código

function viewStudentProfile(id) {
    showNotification(`Viendo perfil del estudiante ${id}`, 'info');
}

function messageStudent(id) {
    showNotification(`Enviando mensaje al estudiante ${id}`, 'info');
}

function viewNotification(id) {
    showNotification(`Viendo notificación ${id}`, 'info');
}

function markAsRead(id) {
    showNotification(`Notificación ${id} marcada como leída`, 'success');
}

function filterHistory() {
    showNotification('Filtrando historial...', 'info');
}

function viewHistoryDetails(id) {
    showNotification(`Viendo detalles del historial ${id}`, 'info');
}

function showAllActivity() {
    showNotification('Mostrando toda la actividad', 'info');
}


// Función para actualizar el estado en el calendario del estudiante
function updateStudentCalendarStatus(requestId, status) {
    // Esta función se comunicará con el backend para actualizar el estado
    // y el calendario del estudiante se actualizará automáticamente
    
    console.log(`Actualizando estado de sesión ${requestId} a: ${status}`);
    
    // Simular llamada al backend
    if (typeof BackendAPI !== 'undefined') {
        BackendAPI.updateSessionStatus(requestId, status)
            .then(() => {
                console.log('Estado actualizado en el backend');
                // El calendario del estudiante se actualizará automáticamente
                // cuando se recargue la página o se haga una nueva consulta
            })
            .catch(error => {
                console.error('Error actualizando estado:', error);
            });
    }
    
    // También podemos usar localStorage para simular la sincronización
    const sessionData = {
        id: requestId,
        status: status,
        updatedAt: new Date().toISOString()
    };
    
    // Guardar en localStorage para que el estudiante pueda ver el cambio
    const studentSessions = JSON.parse(localStorage.getItem('studentSessions') || '[]');
    const sessionIndex = studentSessions.findIndex(session => session.id === requestId);
    
    if (sessionIndex !== -1) {
        studentSessions[sessionIndex].status = status;
        studentSessions[sessionIndex].updatedAt = new Date().toISOString();
        localStorage.setItem('studentSessions', JSON.stringify(studentSessions));
    }
}

// ===============================================
// FUNCIONES DE MANTENIMIENTO Y LIMPIEZA
// ===============================================

function cleanOldAvailabilityData() {
    // Limpiar datos antiguos que no tengan fecha o materia
    const tutorAvailability = JSON.parse(localStorage.getItem('tutorAvailability') || '[]');
    const cleanedAvailability = tutorAvailability.filter(item => item.date && item.subject);
    
    if (cleanedAvailability.length !== tutorAvailability.length) {
        localStorage.setItem('tutorAvailability', JSON.stringify(cleanedAvailability));
        console.log(`Limpieza completada: ${tutorAvailability.length - cleanedAvailability.length} registros antiguos eliminados`);
        
        // Recargar la vista si estamos en la sección de horarios
        if (document.getElementById('mainContent').innerHTML.includes('Gestión de Horarios')) {
            loadCurrentAvailability();
        }
    }
}

// Ejecutar limpieza al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Limpiar datos antiguos después de un breve delay
    setTimeout(() => {
        cleanOldAvailabilityData();
    }, 1000);
    
    // Agregar event listeners para calcular duración automáticamente
    setTimeout(() => {
        const startTimeField = document.getElementById('scheduleStart');
        const endTimeField = document.getElementById('scheduleEnd');
        
        if (startTimeField) {
            startTimeField.addEventListener('change', updateDurationField);
            startTimeField.addEventListener('input', updateDurationField);
        }
        
        if (endTimeField) {
            endTimeField.addEventListener('change', updateDurationField);
            endTimeField.addEventListener('input', updateDurationField);
        }
    }, 500);
    
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

// FUNCIONES PARA GESTIÓN DE SESIONES
function acceptRequest(sessionId) {
    console.log('Aceptando sesión:', sessionId);
    
    // Obtener las sesiones pendientes (tanto de ejemplo como reales)
    const pendingSessions = getSamplePendingSessions();
    const sessionToAccept = pendingSessions.find(session => session.id === sessionId);
    
    if (!sessionToAccept) {
        showNotification('No se encontró la sesión para aceptar', 'error');
        return;
    }
    
    // Crear sesión real para el administrador
    createRealSession(sessionToAccept);
    
    // Agregar timestamp de confirmación
    const confirmedSession = {
        ...sessionToAccept,
        confirmedAt: new Date().toISOString()
    };
    
    // Guardar en localStorage para sesiones confirmadas
    const confirmedSessions = JSON.parse(localStorage.getItem('confirmedSessions') || '[]');
    confirmedSessions.push(confirmedSession);
    localStorage.setItem('confirmedSessions', JSON.stringify(confirmedSessions));
    
    // Marcar la sesión como procesada para que no aparezca más en pendientes
    const processedSessions = JSON.parse(localStorage.getItem('processedSessions') || '[]');
    processedSessions.push(sessionId);
    localStorage.setItem('processedSessions', JSON.stringify(processedSessions));
    
    showNotification(`Sesión con ${sessionToAccept.studentName} aceptada exitosamente`, 'success');
    
    // Recargar las sesiones
    loadSessionsData();
    
    // Cambiar automáticamente a la pestaña "Confirmadas"
    showSessionTab('confirmed');
}

function rejectRequest(sessionId) {
    console.log('Rechazando sesión:', sessionId);
    
    // Obtener las sesiones pendientes (tanto de ejemplo como reales)
    const pendingSessions = getSamplePendingSessions();
    const sessionToReject = pendingSessions.find(session => session.id === sessionId);
    
    if (!sessionToReject) {
        showNotification('No se encontró la sesión para rechazar', 'error');
        return;
    }
    
    // Mostrar modal para comentario de rechazo
    showRejectionModal(sessionToReject);
}

function showRejectionModal(session) {
    // Crear modal de rechazo
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'rejectionModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Rechazar Sesión</h3>
                <span class="close" onclick="closeRejectionModal()">&times;</span>
            </div>
            <div class="modal-body">
                <p><strong>Estudiante:</strong> ${session.studentName}</p>
                <p><strong>Materia:</strong> ${session.subject}</p>
                <p><strong>Fecha:</strong> ${formatDate(session.date)}</p>
                <p><strong>Hora:</strong> ${formatTime(session.time)}</p>
                
                <div class="form-group">
                    <label for="rejectionReason">Motivo del rechazo *</label>
                    <textarea id="rejectionReason" rows="4" placeholder="Explica por qué rechazas esta sesión..." required></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeRejectionModal()">Cancelar</button>
                <button class="btn btn-danger" onclick="confirmRejection('${session.id}')">Rechazar Sesión</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

function closeRejectionModal() {
    const modal = document.getElementById('rejectionModal');
    if (modal) {
        modal.remove();
    }
}

function confirmRejection(sessionId) {
    const rejectionReason = document.getElementById('rejectionReason').value.trim();
    
    if (!rejectionReason) {
        showNotification('Por favor proporciona un motivo para el rechazo', 'error');
        return;
    }
    
    // Obtener las sesiones pendientes
    const pendingSessions = getSamplePendingSessions();
    const sessionToReject = pendingSessions.find(session => session.id === sessionId);
    
    if (!sessionToReject) {
        showNotification('No se encontró la sesión para rechazar', 'error');
        return;
    }
    
    // Crear sesión rechazada
    const rejectedSession = {
        ...sessionToReject,
        rejectedAt: new Date().toISOString(),
        reason: rejectionReason
    };
    
    // Guardar en localStorage para sesiones rechazadas
    const rejectedSessions = JSON.parse(localStorage.getItem('rejectedSessions') || '[]');
    rejectedSessions.push(rejectedSession);
    localStorage.setItem('rejectedSessions', JSON.stringify(rejectedSessions));
    
    // Marcar la sesión como procesada para que no aparezca más en pendientes
    const processedSessions = JSON.parse(localStorage.getItem('processedSessions') || '[]');
    processedSessions.push(sessionId);
    localStorage.setItem('processedSessions', JSON.stringify(processedSessions));
    
    // Cerrar modal
    closeRejectionModal();
    
    showNotification(`Sesión con ${sessionToReject.studentName} rechazada`, 'info');
    
    // Recargar las sesiones
    loadSessionsData();
    
    // Cambiar automáticamente a la pestaña "No Aceptados"
    showSessionTab('rejected');
}

// FUNCIONES PARA DATOS DE EJEMPLO DE SESIONES
function getSamplePendingSessions() {
    try {
        // Obtener sesiones pendientes reales creadas por estudiantes
        const pendingSessions = JSON.parse(localStorage.getItem('pendingSessions') || '[]');
        
        // Obtener el nombre del tutor actual
        const currentTutor = getCurrentTutorName();
        
        // Filtrar sesiones asignadas al tutor actual
        const tutorPendingSessions = pendingSessions.filter(session => 
            session.tutor === currentTutor || session.tutorId === getCurrentTutorId()
        );
        
        // Obtener sesiones ya procesadas
        const processedSessions = JSON.parse(localStorage.getItem('processedSessions') || '[]');
        
        // Filtrar sesiones no procesadas
        const unprocessedSessions = tutorPendingSessions.filter(session => 
            !processedSessions.includes(session.id)
        );
        
        // Convertir formato para compatibilidad
        return unprocessedSessions.map(session => ({
            id: session.id,
            studentName: session.student,
            studentEmail: session.studentEmail,
            subject: session.subject,
            date: session.date,
            time: session.time,
            duration: session.duration,
            modality: session.modality,
            location: session.location,
            message: `Solicitud de sesión de ${session.subject}`,
            createdAt: session.createdAt
        }));
        
    } catch (error) {
        console.error('Error obteniendo sesiones pendientes:', error);
        return [];
    }
}

// Función para obtener el nombre del tutor actual
function getCurrentTutorName() {
    try {
        // Intentar obtener desde localStorage
        const tutorData = JSON.parse(localStorage.getItem('tutorData') || '{}');
        if (tutorData.firstName && tutorData.lastName) {
            return `${tutorData.firstName} ${tutorData.lastName}`;
        }
        
        // Fallback: obtener desde usuarios
        const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
        const tutor = usuarios.find(u => u.rol === 'Tutor' || u.rol === 'tutor');
        if (tutor) {
            return tutor.nombreCompleto || 'Tutor';
        }
        
        return 'Dr. Carlos Mendoza'; // Fallback por defecto
    } catch (error) {
        console.error('Error obteniendo nombre del tutor:', error);
        return 'Dr. Carlos Mendoza';
    }
}

// Función para obtener el ID del tutor actual
function getCurrentTutorId() {
    try {
        // Intentar obtener desde localStorage
        const tutorData = JSON.parse(localStorage.getItem('tutorData') || '{}');
        if (tutorData.id) {
            return tutorData.id;
        }
        
        // Fallback: obtener desde usuarios
        const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
        const tutor = usuarios.find(u => u.rol === 'Tutor' || u.rol === 'tutor');
        if (tutor) {
            return tutor.id;
        }
        
        return 'tutor_001'; // Fallback por defecto
    } catch (error) {
        console.error('Error obteniendo ID del tutor:', error);
        return 'tutor_001';
    }
}

// Función para obtener sesiones asignadas al tutor actual
function getAssignedSessions() {
    // Retornar siempre array vacío - sesiones asignadas eliminadas
    return [];
}

// Función para crear una sesión real que el administrador pueda ver
function createRealSession(sessionData) {
    try {
        // Obtener el tutor actual (en producción sería dinámico)
        const currentTutor = 'Dr. Carlos Mendoza';
        
        // Crear ID corto para la sesión
        const realSessions = JSON.parse(localStorage.getItem('realSessions') || '[]');
        const sessionId = `SES-${String(realSessions.length + 1).padStart(3, '0')}`;
        
        // Crear sesión real
        const realSession = {
            id: sessionId,
            alumno: sessionData.studentName || 'Estudiante',
            tutor: currentTutor,
            materia: sessionData.subject || 'Materia',
            fecha: sessionData.date || new Date().toISOString().split('T')[0],
            hora_inicio: sessionData.time || '10:00',
            hora_fin: calculateEndTime(sessionData.time, sessionData.duration),
            modalidad: sessionData.modality || 'Presencial',
            estado: 'Confirmada',
            motivo_cancelacion: null,
            creado_en: new Date().toISOString(),
            tutorAsignado: currentTutor,
            estudiante_email: sessionData.studentEmail || '',
            ubicacion: sessionData.location || '',
            mensaje: sessionData.message || ''
        };
        
        // Guardar en localStorage
        realSessions.push(realSession);
        localStorage.setItem('realSessions', JSON.stringify(realSessions));
        
        console.log('✅ Sesión real creada:', realSession);
        
        // También actualizar las sesiones organizadas por tutor
        updateSessionsByTutor(realSession);
        
    } catch (error) {
        console.error('❌ Error creando sesión real:', error);
    }
}

// Función para calcular hora de fin basada en duración
function calculateEndTime(startTime, duration) {
    try {
        const [hours, minutes] = startTime.split(':').map(Number);
        const durationMinutes = parseDuration(duration);
        
        const totalMinutes = hours * 60 + minutes + durationMinutes;
        const endHours = Math.floor(totalMinutes / 60);
        const endMinutes = totalMinutes % 60;
        
        return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
    } catch (error) {
        console.error('Error calculando hora de fin:', error);
        return '11:00';
    }
}

// Función para actualizar sesiones organizadas por tutor
function updateSessionsByTutor(session) {
    try {
        const sessionsByTutor = JSON.parse(localStorage.getItem('sessionsByTutor') || '{}');
        const tutorName = session.tutorAsignado || session.tutor;
        
        if (!sessionsByTutor[tutorName]) {
            sessionsByTutor[tutorName] = [];
        }
        
        sessionsByTutor[tutorName].push(session);
        localStorage.setItem('sessionsByTutor', JSON.stringify(sessionsByTutor));
        
        console.log(`📚 Sesión agregada a ${tutorName}:`, session.id);
        
    } catch (error) {
        console.error('Error actualizando sesiones por tutor:', error);
    }
}

// Función para obtener estudiantes que se han inscrito a disponibilidades
function getEnrolledStudents() {
    try {
        // Buscar inscripciones en localStorage
        const enrollments = JSON.parse(localStorage.getItem('studentEnrollments') || '[]');
        
        if (enrollments.length === 0) {
            // Si no hay inscripciones reales, simular algunas basadas en usuarios reales
            return simulateStudentEnrollments();
        }
        
        // Convertir inscripciones a formato de estudiantes
        return enrollments.map(enrollment => ({
            name: enrollment.studentName,
            email: enrollment.studentEmail,
            availabilityId: enrollment.availabilityId,
            enrolledAt: enrollment.enrolledAt
        }));
        
    } catch (error) {
        console.error('Error obteniendo estudiantes inscritos:', error);
        return simulateStudentEnrollments();
    }
}

// Función para simular inscripciones de estudiantes reales
function simulateStudentEnrollments() {
    try {
        // Obtener estudiantes reales de la base de datos
        const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userData = JSON.parse(localStorage.getItem('userData') || '[]');
        
        // Combinar todas las fuentes
        const allUsers = [...usuarios, ...users, ...userData];
        
        // Filtrar solo alumnos/estudiantes
        const estudiantes = allUsers.filter(user => {
            const rol = (user.rol || user.role || '').toLowerCase();
            return rol.includes('alumno') || rol.includes('estudiante') || rol.includes('student');
        }).slice(0, 5); // Tomar solo los primeros 5
        
        // Si no hay estudiantes reales, usar algunos por defecto
        if (estudiantes.length === 0) {
            return [
                { name: 'María González', email: 'maria.gonzalez@email.com' },
                { name: 'Carlos Rodríguez', email: 'carlos.rodriguez@email.com' },
                { name: 'Ana Martínez', email: 'ana.martinez@email.com' },
                { name: 'Luis Fernández', email: 'luis.fernandez@email.com' },
                { name: 'Sofia Herrera', email: 'sofia.herrera@email.com' }
            ];
        }
        
        // Convertir a formato esperado
        return estudiantes.map(estudiante => ({
            name: estudiante.nombre_completo || 
                  `${estudiante.nombre || ''} ${estudiante.apellido || ''}`.trim() ||
                  estudiante.name || 
                  estudiante.email?.split('@')[0] || 
                  'Estudiante',
            email: estudiante.email || `${estudiante.name || 'estudiante'}@email.com`
        }));
        
    } catch (error) {
        console.error('Error simulando inscripciones:', error);
        return [
            { name: 'María González', email: 'maria.gonzalez@email.com' },
            { name: 'Carlos Rodríguez', email: 'carlos.rodriguez@email.com' }
        ];
    }
}

function getSampleConfirmedSessions() {
    // Retornar siempre array vacío - sesiones confirmadas eliminadas
    return [];
}

function getSampleRejectedSessions() {
    const tutorAvailability = JSON.parse(localStorage.getItem('tutorAvailability') || '[]');
    
    if (tutorAvailability.length === 0) {
        return [];
    }
    
    // Generar una sesión rechazada basada en la primera disponibilidad
    const availability = tutorAvailability[0];
    if (!availability) return [];
    
    return [{
        id: `session_rejected_${availability.id}`,
        studentName: 'Pedro López',
        studentEmail: 'pedro.lopez@email.com',
        subject: getSubjectName(availability.subject),
        date: '2025-09-30', // Ayer (fecha fija anterior a hoy)
        time: '06:00',
        duration: '4hr 20min',
        modality: getModalityName(availability.modality),
        location: availability.modality === 'presencial' ? 'Aula 203' : 'Zoom',
        message: 'Ayuda con este tema',
        createdAt: new Date('2025-09-29T06:00:00').toISOString(), // 2 días atrás
        rejectedAt: new Date('2025-09-30T06:00:00').toISOString(), // Ayer
        reason: 'Horario no disponible'
    }];
}

function getSampleCompletedSessions() {
    // Retornar siempre array vacío - sesiones completadas eliminadas
    return [];
}

// Función para eliminar COMPLETAMENTE las sesiones completadas y asignadas
function clearAllSessionsAndRecreate() {
    try {
        console.log('🗑️ ELIMINANDO sesiones completadas y asignadas...');
        
        // Eliminar COMPLETAMENTE las sesiones completadas y asignadas
        localStorage.removeItem('completedSessions');
        localStorage.removeItem('confirmedSessions');
        localStorage.removeItem('realSessions');
        localStorage.removeItem('sessionsByTutor');
        
        // Mantener solo las sesiones pendientes y rechazadas
        console.log('✅ Sesiones completadas y asignadas eliminadas completamente');
        
    } catch (error) {
        console.error('Error eliminando sesiones:', error);
    }
}

// Función para limpiar y recrear todas las sesiones con fechas correctas
function recreateAllSessionsWithCorrectDates() {
    try {
        console.log('🧹 Limpiando y recreando todas las sesiones con fechas correctas...');
        
        // Limpiar todas las sesiones existentes
        localStorage.removeItem('completedSessions');
        localStorage.removeItem('rejectedSessions');
        localStorage.removeItem('confirmedSessions');
        localStorage.removeItem('pendingSessions');
        localStorage.removeItem('processedSessions');
        
        // Crear sesiones completadas para Fridman Balam
        createSampleCompletedSessionsForFridman();
        
        // Crear sesiones rechazadas de ejemplo
        createSampleRejectedSessions();
        
        // Forzar la recreación de sesiones completadas con fechas correctas
        forceRecreateCompletedSessions();
        
        console.log('✅ Todas las sesiones recreadas con fechas correctas');
        
    } catch (error) {
        console.error('Error recreando sesiones:', error);
    }
}

// Función para forzar la recreación de sesiones completadas con fechas correctas
function forceRecreateCompletedSessions() {
    try {
        console.log('🔄 Forzando recreación de sesiones completadas...');
        
        // Limpiar sesiones completadas existentes
        localStorage.removeItem('completedSessions');
        
        // Crear sesiones completadas con fechas SIEMPRE anteriores a hoy
        const completedSessions = [
            {
                id: 'completed_isabella_001',
                student: 'Isabella Torres',
                studentName: 'Isabella Torres',
                studentEmail: 'isabella.torres@email.com',
                tutor: getCurrentTutorName(),
                tutorName: getCurrentTutorName(),
                subject: 'Historia',
                date: '2025-09-30', // Ayer - SIEMPRE anterior a hoy
                time: '07:00',
                endTime: '10:30',
                duration: '3hr 30min',
                modality: 'Virtual',
                location: 'Zoom',
                status: 'completed',
                createdAt: new Date('2025-09-30T07:00:00').toISOString(),
                confirmedAt: new Date('2025-09-30T07:00:00').toISOString(),
                completedAt: new Date('2025-09-30T10:30:00').toISOString(),
                rating: 5,
                feedback: 'Excelente explicación, muy clara'
            },
            {
                id: 'completed_diego_001',
                student: 'Diego Morales',
                studentName: 'Diego Morales',
                studentEmail: 'diego.morales@email.com',
                tutor: getCurrentTutorName(),
                tutorName: getCurrentTutorName(),
                subject: 'Programación',
                date: '2025-09-28', // 3 días atrás - SIEMPRE anterior a hoy
                time: '06:00',
                endTime: '07:00',
                duration: '1hr',
                modality: 'Presencial',
                location: 'Aula 201',
                status: 'completed',
                createdAt: new Date('2025-09-28T06:00:00').toISOString(),
                confirmedAt: new Date('2025-09-28T06:00:00').toISOString(),
                completedAt: new Date('2025-09-28T07:00:00').toISOString(),
                rating: 4,
                feedback: 'Muy buena sesión, entendí los conceptos'
            }
        ];
        
        // Guardar las sesiones completadas
        localStorage.setItem('completedSessions', JSON.stringify(completedSessions));
        
        console.log('✅ Sesiones completadas recreadas con fechas correctas:', completedSessions);
        
    } catch (error) {
        console.error('Error recreando sesiones completadas:', error);
    }
}

// Función para crear sesiones rechazadas de ejemplo
function createSampleRejectedSessions() {
    try {
        const rejectedSessions = [
            {
                id: 'rejected_sample_001',
                student: 'Pedro López',
                studentName: 'Pedro López',
                studentEmail: 'pedro.lopez@email.com',
                tutor: getCurrentTutorName(),
                tutorName: getCurrentTutorName(),
                subject: 'Química',
                date: '2025-09-30', // Ayer
                time: '06:00',
                endTime: '10:20',
                duration: '4hr 20min',
                modality: 'Presencial',
                location: 'Aula 203',
                status: 'rejected',
                createdAt: new Date('2025-09-29T06:00:00').toISOString(),
                rejectedAt: new Date('2025-09-30T06:00:00').toISOString(),
                reason: 'Horario no disponible'
            }
        ];
        
        localStorage.setItem('rejectedSessions', JSON.stringify(rejectedSessions));
        console.log('Sesiones rechazadas creadas:', rejectedSessions);
        
    } catch (error) {
        console.error('Error creando sesiones rechazadas:', error);
    }
}

// Función para crear sesiones completadas de ejemplo para Fridman Balam
function createSampleCompletedSessionsForFridman() {
    try {
        console.log('Creando sesiones completadas para Fridman Balam con fechas correctas...');
        
        // Crear sesiones completadas de ejemplo para Fridman Balam (fechas anteriores a hoy 1/10/2025)
        const fridmanCompletedSessions = [
            {
                id: 'completed_fridman_001',
                student: 'María González',
                studentName: 'María González',
                studentEmail: 'maria.gonzalez@email.com',
                tutor: 'Fridman Balam',
                tutorName: 'Fridman Balam',
                subject: 'Matemáticas',
                date: '2025-09-29', // 2 días atrás
                time: '10:00',
                endTime: '11:00',
                duration: '1hr',
                modality: 'Presencial',
                location: 'Aula 201',
                status: 'completed',
                createdAt: new Date('2025-09-27T10:00:00').toISOString(), // 4 días atrás
                confirmedAt: new Date('2025-09-28T10:00:00').toISOString(), // 3 días atrás
                completedAt: new Date('2025-09-29T11:00:00').toISOString(), // 2 días atrás
                rating: 5,
                feedback: 'Excelente explicación, muy clara y didáctica'
            },
            {
                id: 'completed_fridman_002',
                student: 'Carlos Rodríguez',
                studentName: 'Carlos Rodríguez',
                studentEmail: 'carlos.rodriguez@email.com',
                tutor: 'Fridman Balam',
                tutorName: 'Fridman Balam',
                subject: 'Física',
                date: '2025-09-27', // 4 días atrás
                time: '14:00',
                endTime: '15:30',
                duration: '1hr 30min',
                modality: 'Virtual',
                location: 'Zoom',
                status: 'completed',
                createdAt: new Date('2025-09-25T14:00:00').toISOString(), // 6 días atrás
                confirmedAt: new Date('2025-09-26T14:00:00').toISOString(), // 5 días atrás
                completedAt: new Date('2025-09-27T15:30:00').toISOString(), // 4 días atrás
                rating: 4,
                feedback: 'Muy buena sesión, entendí los conceptos fundamentales'
            },
            {
                id: 'completed_fridman_003',
                student: 'Ana Martínez',
                studentName: 'Ana Martínez',
                studentEmail: 'ana.martinez@email.com',
                tutor: 'Fridman Balam',
                tutorName: 'Fridman Balam',
                subject: 'Química',
                date: '2025-09-25', // 6 días atrás
                time: '16:00',
                endTime: '17:00',
                duration: '1hr',
                modality: 'Presencial',
                location: 'Laboratorio 3',
                status: 'completed',
                createdAt: new Date('2025-09-23T16:00:00').toISOString(), // 8 días atrás
                confirmedAt: new Date('2025-09-24T16:00:00').toISOString(), // 7 días atrás
                completedAt: new Date('2025-09-25T17:00:00').toISOString(), // 6 días atrás
                rating: 5,
                feedback: 'Increíble sesión práctica, aprendí mucho'
            }
        ];
        
        // Guardar las sesiones completadas
        localStorage.setItem('completedSessions', JSON.stringify(fridmanCompletedSessions));
        
        console.log('Sesiones completadas creadas para Fridman Balam:', fridmanCompletedSessions);
        
    } catch (error) {
        console.error('Error creando sesiones completadas para Fridman Balam:', error);
    }
}

// Función para marcar una sesión como completada
function markSessionAsCompleted(sessionId) {
    try {
        // Obtener la sesión confirmada
        const confirmedSessions = JSON.parse(localStorage.getItem('confirmedSessions') || '[]');
        const sessionIndex = confirmedSessions.findIndex(session => session.id === sessionId);
        
        if (sessionIndex === -1) {
            showNotification('Sesión no encontrada', 'error');
            return;
        }
        
        const session = confirmedSessions[sessionIndex];
        
        // Crear sesión completada
        const completedSession = {
            ...session,
            id: sessionId,
            status: 'completed',
            completedAt: new Date().toISOString(),
            tutor: getCurrentTutorName(),
            tutorName: getCurrentTutorName()
        };
        
        // Agregar a sesiones completadas
        const completedSessions = JSON.parse(localStorage.getItem('completedSessions') || '[]');
        completedSessions.push(completedSession);
        localStorage.setItem('completedSessions', JSON.stringify(completedSessions));
        
        // Remover de sesiones confirmadas
        confirmedSessions.splice(sessionIndex, 1);
        localStorage.setItem('confirmedSessions', JSON.stringify(confirmedSessions));
        
        showNotification('Sesión marcada como completada', 'success');
        
        // Recargar sesiones
        loadConfirmedSessions();
        loadCompletedSessions();
        
    } catch (error) {
        console.error('Error marcando sesión como completada:', error);
        showNotification('Error al marcar sesión como completada', 'error');
    }
}

// Exportar funciones para uso global
window.TutorInterface = {
    loadSection,
    acceptRequest,
    rejectRequest,
    proposeNewTime,
    markAttendance,
    closeAttendanceModal,
    saveAttendance,
    openScheduleModal,
    closeScheduleModal,
    showScheduleTab,
    saveScheduleSettings,
    showUserMenu,
    showProfile,
    closeProfileModal,
    saveProfile,
    resetProfileForm,
    showSettings,
    logout,
    updateStudentCalendarStatus,
    cleanOldAvailabilityData
};

