// ===============================================
// CONEXIONES ENTRE ESTUDIANTE Y TUTOR
// ===============================================
// Este archivo contiene todas las conexiones necesarias
// para que el backend pueda integrar fácilmente las funcionalidades

// ===============================================
// 1. CONEXIONES DE BÚSQUEDA Y RESERVA DE TUTORES
// ===============================================

// ESTUDIANTE: Buscar Tutores → TUTOR: Ver Solicitudes
function connectTutorSearchToRequests() {
    // Cuando el estudiante busca tutores, se debe conectar con:
    // - Tutor.getAvailableTutors() 
    // - Tutor.getTutorAvailability()
    // - Tutor.getTutorRatings()
    
    return {
        studentAction: 'searchTutors',
        tutorResponse: 'getAvailableTutors',
        backendEndpoints: {
            student: '/students/search-tutors',
            tutor: '/tutors/available',
            availability: '/tutors/:id/availability',
            ratings: '/tutors/:id/ratings'
        },
        dataFlow: 'student → backend → tutor → student'
    };
}

// ESTUDIANTE: Reservar Tutoría → TUTOR: Recibir Solicitud
function connectBookingToRequests() {
    // Cuando el estudiante reserva una tutoría:
    // - Se crea una solicitud pendiente para el tutor
    // - El tutor ve la solicitud en su panel
    // - Se actualiza el calendario del estudiante
    
    return {
        studentAction: 'bookTutor',
        tutorResponse: 'receiveBookingRequest',
        backendEndpoints: {
            create: '/sessions/create',
            notify: '/notifications/send',
            update: '/sessions/:id/status'
        },
        dataFlow: 'student → backend → tutor notification → calendar update'
    };
}

// ===============================================
// 2. CONEXIONES DE GESTIÓN DE SESIONES
// ===============================================

// ESTUDIANTE: Ver Horarios → TUTOR: Disponibilidad Configurada
function connectSchedulesToAvailability() {
    // El calendario del estudiante debe mostrar:
    // - Horarios disponibles del tutor
    // - Estados de las sesiones (aceptada/pospuesta/rechazada)
    
    return {
        studentAction: 'viewSchedule',
        tutorData: 'getAvailability',
        backendEndpoints: {
            availability: '/tutors/:id/availability',
            sessions: '/students/:id/sessions',
            status: '/sessions/:id/status'
        },
        dataFlow: 'tutor availability → student calendar → session status'
    };
}

// ESTUDIANTE: Cancelar Sesión → TUTOR: Notificación de Cancelación
function connectCancellationToNotification() {
    return {
        studentAction: 'cancelSession',
        tutorResponse: 'receiveCancellation',
        backendEndpoints: {
            cancel: '/sessions/:id/cancel',
            notify: '/notifications/cancellation',
            update: '/sessions/:id/status'
        },
        dataFlow: 'student cancellation → tutor notification → status update'
    };
}

// ESTUDIANTE: Reprogramar Sesión → TUTOR: Nueva Propuesta
function connectRescheduleToProposal() {
    return {
        studentAction: 'rescheduleSession',
        tutorResponse: 'receiveRescheduleProposal',
        backendEndpoints: {
            reschedule: '/sessions/:id/reschedule',
            notify: '/notifications/reschedule',
            update: '/sessions/:id/status'
        },
        dataFlow: 'student reschedule → tutor notification → calendar update'
    };
}

// ===============================================
// 3. CONEXIONES DE VALORACIONES
// ===============================================

// ESTUDIANTE: Valorar Sesión → TUTOR: Recibir Valoración
function connectRatingsToFeedback() {
    // Cuando el estudiante valora una sesión:
    // - Se guarda la valoración
    // - Se actualiza el promedio del tutor
    // - Se muestra en el perfil del tutor
    
    return {
        studentAction: 'createRating',
        tutorResponse: 'receiveRating',
        backendEndpoints: {
            create: '/ratings/create',
            update: '/tutors/:id/rating-average',
            display: '/tutors/:id/ratings'
        },
        dataFlow: 'student rating → tutor profile update → public display'
    };
}

// ESTUDIANTE: Ver Valoraciones → TUTOR: Mostrar Valoraciones
function connectRatingDisplay() {
    return {
        studentAction: 'viewRatings',
        tutorData: 'getRatings',
        backendEndpoints: {
            ratings: '/tutors/:id/ratings',
            average: '/tutors/:id/rating-average'
        },
        dataFlow: 'tutor ratings → student view → booking decision'
    };
}

// ===============================================
// 4. CONEXIONES DE NOTIFICACIONES
// ===============================================

// ESTUDIANTE: Recibir Recordatorios → TUTOR: Enviar Recordatorios
function connectNotificationsToReminders() {
    return {
        studentAction: 'receiveReminders',
        tutorAction: 'sendReminders',
        backendEndpoints: {
            create: '/notifications/create',
            send: '/notifications/send',
            schedule: '/notifications/schedule'
        },
        dataFlow: 'tutor reminder → student notification → session preparation'
    };
}

// ESTUDIANTE: Ver Notificaciones → TUTOR: Estado de Notificaciones
function connectNotificationStatus() {
    return {
        studentAction: 'viewNotifications',
        tutorData: 'getNotificationStatus',
        backendEndpoints: {
            notifications: '/notifications/user/:id',
            status: '/notifications/:id/status'
        },
        dataFlow: 'notification status → student view → action required'
    };
}

// ===============================================
// 5. CONEXIONES DE PERFILES
// ===============================================

// ESTUDIANTE: Ver Perfil Tutor → TUTOR: Mostrar Perfil
function connectProfileViewing() {
    return {
        studentAction: 'viewTutorProfile',
        tutorData: 'getProfile',
        backendEndpoints: {
            profile: '/tutors/:id/profile',
            availability: '/tutors/:id/availability',
            ratings: '/tutors/:id/ratings'
        },
        dataFlow: 'tutor profile → student view → booking decision'
    };
}

// ESTUDIANTE: Actualizar Perfil → TUTOR: Ver Cambios
function connectProfileUpdates() {
    return {
        studentAction: 'updateProfile',
        tutorView: 'seeStudentChanges',
        backendEndpoints: {
            update: '/students/:id/profile',
            notify: '/notifications/profile-update'
        },
        dataFlow: 'student update → tutor notification → updated view'
    };
}

// ===============================================
// 6. CONEXIONES DE ESTADOS DE SESIONES
// ===============================================

// ESTADOS PRINCIPALES Y SUS CONEXIONES
const SESSION_STATES_CONNECTIONS = {
    'pending': {
        studentView: 'Solicitud enviada - Esperando respuesta',
        tutorAction: 'Revisar solicitud',
        color: '#ffc107', // Amarillo
        nextStates: ['accepted', 'rejected', 'postponed']
    },
    'accepted': {
        studentView: 'Sesión confirmada - Preparar para la sesión',
        tutorAction: 'Preparar materiales',
        color: '#28a745', // Verde
        nextStates: ['completed', 'cancelled']
    },
    'rejected': {
        studentView: 'Sesión rechazada - Buscar otro tutor',
        tutorAction: 'Sesión rechazada',
        color: '#dc3545', // Rojo
        nextStates: []
    },
    'postponed': {
        studentView: 'Sesión pospuesta - Revisar nueva propuesta',
        tutorAction: 'Proponer nuevo horario',
        color: '#ffc107', // Amarillo
        nextStates: ['accepted', 'rejected']
    },
    'completed': {
        studentView: 'Sesión completada - Valorar experiencia',
        tutorAction: 'Sesión completada',
        color: '#17a2b8', // Azul
        nextStates: ['rated']
    },
    'cancelled': {
        studentView: 'Sesión cancelada',
        tutorAction: 'Sesión cancelada',
        color: '#6c757d', // Gris
        nextStates: []
    }
};

// ===============================================
// 7. FUNCIONES DE INTEGRACIÓN PARA EL BACKEND
// ===============================================

// Función principal para sincronizar estados
function syncSessionStates(sessionId, newState, userId, userType) {
    return {
        sessionId: sessionId,
        newState: newState,
        userId: userId,
        userType: userType, // 'student' o 'tutor'
        actions: {
            updateDatabase: `/sessions/${sessionId}/status`,
            notifyUser: `/notifications/session-status-change`,
            updateCalendar: `/calendar/${userId}/refresh`,
            logActivity: `/activity/log`
        },
        dataFlow: 'state change → database → notification → UI update'
    };
}

// Función para manejar notificaciones bidireccionales
function handleBidirectionalNotifications(senderId, receiverId, notificationType, data) {
    return {
        senderId: senderId,
        receiverId: receiverId,
        notificationType: notificationType,
        data: data,
        endpoints: {
            send: '/notifications/send',
            receive: '/notifications/receive',
            markRead: '/notifications/:id/read'
        },
        dataFlow: 'sender → backend → receiver → UI update'
    };
}

// Función para sincronizar calendarios
function syncCalendars(studentId, tutorId, sessionData) {
    return {
        studentId: studentId,
        tutorId: tutorId,
        sessionData: sessionData,
        endpoints: {
            studentCalendar: `/students/${studentId}/calendar`,
            tutorCalendar: `/tutors/${tutorId}/calendar`,
            sessionUpdate: `/sessions/${sessionData.id}/update`
        },
        dataFlow: 'session change → both calendars → UI refresh'
    };
}

// ===============================================
// 8. MAPA COMPLETO DE CONEXIONES
// ===============================================

const COMPLETE_CONNECTION_MAP = {
    // Búsqueda y Reserva
    'student.searchTutors': 'tutor.showAvailability',
    'student.bookTutor': 'tutor.receiveRequest',
    'student.viewTutorProfile': 'tutor.showProfile',
    
    // Gestión de Sesiones
    'student.viewSchedule': 'tutor.getAvailability',
    'student.cancelSession': 'tutor.receiveCancellation',
    'student.rescheduleSession': 'tutor.receiveReschedule',
    
    // Estados de Sesiones
    'tutor.acceptRequest': 'student.sessionAccepted',
    'tutor.rejectRequest': 'student.sessionRejected',
    'tutor.proposeNewTime': 'student.sessionPostponed',
    
    // Valoraciones
    'student.createRating': 'tutor.receiveRating',
    'student.viewRatings': 'tutor.showRatings',
    
    // Notificaciones
    'tutor.sendReminder': 'student.receiveReminder',
    'student.viewNotifications': 'tutor.getNotificationStatus',
    
    // Perfiles
    'student.updateProfile': 'tutor.seeStudentChanges',
    'tutor.updateProfile': 'student.seeTutorChanges'
};

// ===============================================
// 9. EXPORTAR PARA USO DEL BACKEND
// ===============================================

window.IntegrationConnections = {
    // Conexiones principales
    connectTutorSearchToRequests,
    connectBookingToRequests,
    connectSchedulesToAvailability,
    connectCancellationToNotification,
    connectRescheduleToProposal,
    connectRatingsToFeedback,
    connectRatingDisplay,
    connectNotificationsToReminders,
    connectNotificationStatus,
    connectProfileViewing,
    connectProfileUpdates,
    
    // Estados y sincronización
    SESSION_STATES_CONNECTIONS,
    syncSessionStates,
    handleBidirectionalNotifications,
    syncCalendars,
    
    // Mapa completo
    COMPLETE_CONNECTION_MAP
};

console.log('🔗 Conexiones entre Estudiante y Tutor cargadas correctamente');
console.log('📋 Mapa de conexiones:', COMPLETE_CONNECTION_MAP);