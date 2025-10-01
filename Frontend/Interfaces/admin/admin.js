// Sistema de Gestión de Tutores - Interfaz Administrador
console.log('🚀 Cargando admin.js...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado, inicializando aplicación...');
    initializeApp();
    setupEventListeners();
    loadSection('inicio');
    setupCommunicationSystem();
    console.log('✅ Aplicación inicializada completamente');
});

function initializeApp() {
    console.log('Sistema de Gestión de Tutores - Interfaz Administrador iniciada');
    
    // Cargar perfil del administrador desde el backend
    loadAdminProfile();
    
    // Cargar estadísticas del sistema
    loadSystemStats();
    
    // Cargar datos iniciales
    loadMaterias();
    loadUsuarios();
    loadSesiones();
}

function setupEventListeners() {
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-info')) {
            hideUserMenu();
        }
    });
}

// FUNCIONES DE NAVEGACIÓN
function loadSection(section) {
    console.log('🔄 Cargando sección:', section);
    closeMobileMenu();
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`[data-section="${section}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
        console.log('✅ Item activo encontrado:', activeItem.textContent.trim());
    } else {
        console.error('❌ No se encontró item con data-section:', section);
    }
    
    showSectionContent(section);
}

function showSectionContent(section) {
    console.log('📄 Mostrando contenido de sección:', section);
    switch(section) {
        case 'inicio':
            console.log('🏠 Cargando panel principal...');
            loadTemplate('inicioTemplate');
            loadDashboardData();
            break;
        case 'materias':
            console.log('📚 Cargando catálogo de materias...');
            loadTemplate('materiasTemplate');
            loadMaterias();
            break;
        case 'usuarios':
            console.log('👥 Cargando gestión de usuarios...');
            loadTemplate('usuariosTemplate');
            loadUsuarios();
            break;
        case 'parametros':
            console.log('⚙️ Cargando parámetros del sistema...');
            loadTemplate('parametrosTemplate');
            loadSystemParameters();
            break;
        case 'asistencia':
            console.log('📋 Cargando control de asistencia...');
            loadTemplate('asistenciaTemplate');
            loadSesiones();
            break;
        case 'reportes':
            console.log('📊 Cargando reportes...');
            loadTemplate('reportesTemplate');
            break;
        default:
            loadTemplate('inicioTemplate');
    }
}

function loadTemplate(templateId) {
    console.log('📋 Cargando template:', templateId);
    const template = document.getElementById(templateId);
    const mainContent = document.getElementById('mainContent');
    
    if (template && mainContent) {
        mainContent.innerHTML = template.innerHTML;
        console.log('✅ Template cargado exitosamente:', templateId);
        
        // Si es el template de inicio, cargar datos adicionales
        if (templateId === 'inicioTemplate') {
            console.log('🏠 Cargando datos adicionales del panel principal...');
            setTimeout(() => {
                loadUserProfile();
            }, 100);
        }
    } else {
        console.error('❌ Error cargando template:', templateId, {
            template: !!template,
            mainContent: !!mainContent
        });
    }
}

// FUNCIONES DEL MENÚ MÓVIL
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

// FUNCIONES DE USUARIO
function showUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.style.display = userMenu.style.display === 'none' ? 'block' : 'none';
    }
}

function hideUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.style.display = 'none';
    }
}

function showProfile() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.style.display = 'block';
        loadAdminProfileData();
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        // Implementar logout seguro
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminProfile');
        window.location.href = '/index.html';
    }
}

// FUNCIONES DEL DASHBOARD
function loadDashboardData() {
    console.log('📊 Cargando datos del dashboard...');
    
    // Cargar estadísticas del sistema
    loadSystemStats();
    
    // Cargar actividad reciente
    loadRecentActivity();
    
    // Cargar perfil del usuario
    loadUserProfile();
    
    console.log('✅ Dashboard cargado completamente');
}

async function loadUserProfile() {
    try {
        console.log('👤 Cargando perfil del usuario...');
        
        // Hacer login para obtener datos del usuario
        const loginResponse = await fetch(`${BACKEND_CONFIG.BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'emmanuelbasto10@gmail.com',
                password: 'admin123'
            })
        });
        
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            const user = loginData.usuario;
            
            // Actualizar nombre del usuario en el header
            const userNameElement = document.querySelector('.user-name');
            if (userNameElement) {
                userNameElement.textContent = user.nombre_completo;
            }
            
            // Actualizar iniciales en el círculo
            const initialsElement = document.getElementById('adminInitials');
            if (initialsElement) {
                const initials = getInitials(user.nombre_completo);
                initialsElement.textContent = initials;
                console.log('✅ Iniciales actualizadas:', initials);
            }
            
            // Actualizar título de bienvenida
            const welcomeElement = document.getElementById('adminWelcomeName');
            if (welcomeElement) {
                welcomeElement.textContent = user.nombre_completo;
            }
            
            // Actualizar título de la página según el rol
            const logoTitle = document.querySelector('.logo h1');
            if (logoTitle && user.rol_nombre === 'admin') {
                logoTitle.textContent = 'Tutorías Admin';
                console.log('✅ Título del logo actualizado a:', logoTitle.textContent);
            }
            
            console.log('✅ Perfil del usuario cargado:', user.nombre_completo);
            console.log('📋 Resumen de actualizaciones:');
            console.log('   - Nombre:', user.nombre_completo);
            console.log('   - Iniciales:', getInitials(user.nombre_completo));
            console.log('   - Rol:', user.rol_nombre);
            console.log('   - Título del logo:', logoTitle?.textContent || 'No encontrado');
        }
    } catch (error) {
        console.error('❌ Error cargando perfil del usuario:', error);
    }
}

async function loadSystemStats() {
    console.log('📊 Cargando estadísticas del sistema...');
    
    try {
        // Hacer login para obtener token
        const loginResponse = await fetch(`${BACKEND_CONFIG.BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'emmanuelbasto10@gmail.com',
                password: 'admin123'
            })
        });
        
        if (!loginResponse.ok) {
            throw new Error(`Login falló: ${loginResponse.status}`);
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        
        // Obtener estadísticas del backend
        const statsResponse = await fetch(`${BACKEND_CONFIG.BASE_URL}/admin/estadisticas`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!statsResponse.ok) {
            throw new Error(`Error obteniendo estadísticas: ${statsResponse.status}`);
        }
        
        const statsData = await statsResponse.json();
        const stats = statsData.estadisticas;
        
        console.log('📊 Estadísticas obtenidas:', stats);
        
        // Actualizar elementos del DOM solo si existen
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                console.log(`✅ ${id}: ${value}`);
            } else {
                console.warn(`⚠️ Elemento ${id} no encontrado`);
            }
        };
        
        // Actualizar todos los contadores
        updateElement('totalMaterias', stats.totalMaterias);
        updateElement('totalUsuarios', stats.totalUsuarios);
        updateElement('sesionesHoy', stats.sesionesHoy);
        updateElement('alertasPendientes', stats.alertasPendientes);
        updateElement('tutoresActivos', stats.tutoresActivos);
        updateElement('estudiantesActivos', stats.estudiantesActivos);
        updateElement('sesionesMes', stats.sesionesMes);
        updateElement('promedioAsistencia', stats.promedioAsistencia + '%');
        
        console.log('✅ Estadísticas actualizadas en el dashboard');
        
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        
        // En caso de error, mostrar valores por defecto
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        };
        
        updateElement('totalMaterias', 0);
        updateElement('totalUsuarios', 0);
        updateElement('sesionesHoy', 0);
        updateElement('alertasPendientes', 0);
        updateElement('tutoresActivos', 0);
        updateElement('estudiantesActivos', 0);
        updateElement('sesionesMes', 0);
        updateElement('promedioAsistencia', '0%');
    }
}

function loadRecentActivity() {
    // TODO: Implementar llamada al backend para obtener actividad reciente
    // Endpoint sugerido: GET /api/admin/recent-activity
    
    const activityList = document.getElementById('recentActivityList');
    if (activityList) {
        activityList.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <h4>No hay actividad reciente</h4>
                <p>La actividad se cargará desde el backend</p>
            </div>
        `;
    }
}

function getActivityIcon(type) {
    const icons = {
        'user': 'user-plus',
        'session': 'calendar-check',
        'system': 'cog',
        'materia': 'book'
    };
    return icons[type] || 'info';
}

function showAllActivity() {
    // Implementar vista completa de actividad
    console.log('Mostrar toda la actividad');
}

// FUNCIONES DE MATERIAS (CRUD) - Optimizadas para Backend
async function loadMaterias() {
    const tableBody = document.getElementById('materiasTableBody');
    if (!tableBody) return;
    
    // Mostrar loading
    showLoading(tableBody);
    
    try {
        // TODO: Reemplazar con llamada real al backend
        // Endpoint: GET /api/admin/materias
        const token = await getAuthToken();
        if (!token) {
            throw new Error('No se pudo obtener el token de autenticación');
        }
        
        const response = await fetch(`${BACKEND_CONFIG.BASE_URL}/admin/materias`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        const materias = result.materias || [];
        
        console.log('📊 Materias recibidas del backend:', materias);
        console.log('👨‍🏫 Información de tutores en materias:');
        if (materias) {
            materias.forEach((materia, index) => {
                console.log(`  ${index + 1}. ${materia.nombre}: tutor_id=${materia.tutor_id}, tutor_nombre=${materia.tutor_nombre}`);
            });
        }
        
        if (materias.length === 0) {
        tableBody.innerHTML = `
            <tr>
                    <td colspan="5" class="no-data">
                    <div class="no-data-icon">
                        <i class="fas fa-book"></i>
                    </div>
                    <h4>No hay materias registradas</h4>
                        <p>Haz clic en "Nueva Materia" para agregar la primera materia</p>
                </td>
            </tr>
        `;
        } else {
            renderMateriasTable(materias);
        }
        
    } catch (error) {
        console.error('Error cargando materias:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="error-data">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h4>Error al cargar materias</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="loadMaterias()">Reintentar</button>
                </td>
            </tr>
        `;
    }
}

function renderMateriasTable(materias) {
    const tableBody = document.getElementById('materiasTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = materias.map(materia => `
        <tr>
            <td>${materia.id}</td>
            <td><span class="clave-badge">${materia.clave}</span></td>
            <td>${materia.nombre}</td>
            <td>
                ${materia.tutor_nombre ? 
                    `<span class="tutor-badge">${materia.tutor_nombre}</span>` : 
                    '<span class="no-tutor">Sin tutor</span>'
                }
            </td>
            <td><span class="estado-badge estado-${materia.estado_nombre}">${capitalizeFirst(materia.estado_nombre)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline" onclick="editMateria(${materia.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMateria(${materia.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getEstadoName(estadoId) {
    const estados = {
        1: 'Activo',
        2: 'Inactivo'
    };
    return estados[estadoId] || 'Desconocido';
}

async function showAddMateriaForm() {
    const modal = document.getElementById('materiaModal');
    const form = document.getElementById('materiaForm');
    const title = document.getElementById('materiaModalTitle');
    
    if (modal && form && title) {
        title.textContent = 'Nueva Materia';
        form.reset();
        
        // Limpiar campo ID para nueva materia
        document.getElementById('materiaId').value = '';
        
        // Cargar tutores y poblar el select
        console.log('🚀 Iniciando carga de tutores para nueva materia...');
        const tutores = await loadTutores();
        console.log('📋 Tutores obtenidos:', tutores);
        await populateTutoresSelect(tutores);
        console.log('✅ Select de tutores poblado para nueva materia');
        
        // Restaurar campo clave a solo lectura para nueva materia
        const claveField = document.getElementById('materiaClave');
        claveField.setAttribute('readonly', 'readonly');
        claveField.style.backgroundColor = '#f8f9fa';
        claveField.placeholder = 'Se genera automáticamente';
        
        // Configurar generación automática de clave
        setupMateriaKeyGeneration();
        
        // Configurar event listener del formulario
        setupMateriaFormListener();
        
        // Enfocar campo de nombre
        document.getElementById('materiaNombre').focus();
        
        modal.style.display = 'block';
    }
}

function setupMateriaKeyGeneration() {
    const nombreField = document.getElementById('materiaNombre');
    const claveField = document.getElementById('materiaClave');
    const tutorField = document.getElementById('materiaTutor');
    
    if (nombreField && claveField && tutorField) {
        // Remover event listeners anteriores si existen
        nombreField.removeEventListener('input', generateMateriaKey);
        nombreField.removeEventListener('blur', validateMateriaNombreTutor);
        tutorField.removeEventListener('change', validateMateriaNombreTutor);
        
        // Agregar event listener para generar clave automáticamente
        nombreField.addEventListener('input', generateMateriaKey);
        // Agregar validación en tiempo real para nombre + tutor
        nombreField.addEventListener('blur', validateMateriaNombreTutor);
        tutorField.addEventListener('change', validateMateriaNombreTutor);
    }
}

// Función para validar el nombre + tutor de la materia en tiempo real
async function validateMateriaNombreTutor() {
    const nombreField = document.getElementById('materiaNombre');
    const tutorField = document.getElementById('materiaTutor');
    const materiaId = document.getElementById('materiaId')?.value;
    
    if (!nombreField || !tutorField) return;
    
    const nombre = nombreField.value.trim();
    const tutorId = tutorField.value;
    
    if (!nombre || !tutorId) {
        clearFieldError(nombreField);
        return;
    }
    
    try {
        const existe = await verificarNombreTutorExistente(nombre, tutorId, materiaId);
        
        if (existe) {
            showFieldError(nombreField, 'Este tutor ya tiene una materia con este nombre');
        } else {
            clearFieldError(nombreField);
        }
    } catch (error) {
        console.error('Error validando nombre+tutor:', error);
        clearFieldError(nombreField);
    }
}

async function generateMateriaKey() {
    const nombreField = document.getElementById('materiaNombre');
    const claveField = document.getElementById('materiaClave');
    
    if (!nombreField || !claveField) return;
    
    const nombre = nombreField.value.trim();
    
    if (nombre.length === 0) {
        claveField.value = '';
        return;
    }
    
    // Generar clave basada en el nombre
    let clave = generateClaveFromNombre(nombre);
    
    // Verificar si la clave ya existe y generar una nueva si es necesario
    let intentos = 0;
    const maxIntentos = 10;
    
    while (await verificarClaveExistente(clave) && intentos < maxIntentos) {
        console.log(`🔄 Clave ${clave} ya existe, generando nueva...`);
        clave = generateClaveFromNombre(nombre);
        intentos++;
    }
    
    if (intentos >= maxIntentos) {
        console.warn('⚠️ No se pudo generar una clave única después de varios intentos');
        clave = generateClaveFromNombre(nombre) + '_' + Date.now().toString().slice(-3);
    }
    
    claveField.value = clave;
    console.log(`✅ Clave generada: ${clave}`);
}

function generateClaveFromNombre(nombre) {
    // Mapeo de palabras comunes a abreviaciones
    const abreviaciones = {
        'matemáticas': 'MAT',
        'matematicas': 'MAT',
        'matematica': 'MAT',
        'física': 'FIS',
        'fisica': 'FIS',
        'química': 'QUI',
        'quimica': 'QUI',
        'biología': 'BIO',
        'biologia': 'BIO',
        'historia': 'HIS',
        'geografía': 'GEO',
        'geografia': 'GEO',
        'literatura': 'LIT',
        'español': 'ESP',
        'espanol': 'ESP',
        'inglés': 'ING',
        'ingles': 'ING',
        'programación': 'PRO',
        'programacion': 'PRO',
        'computación': 'COM',
        'computacion': 'COM',
        'estadística': 'EST',
        'estadistica': 'EST',
        'álgebra': 'ALG',
        'algebra': 'ALG',
        'geometría': 'GEO',
        'geometria': 'GEO',
        'trigonometría': 'TRI',
        'trigonometria': 'TRI',
        'cálculo': 'CAL',
        'calculo': 'CAL',
        'economía': 'ECO',
        'economia': 'ECO',
        'filosofía': 'FIL',
        'filosofia': 'FIL',
        'psicología': 'PSI',
        'psicologia': 'PSI',
        'sociología': 'SOC',
        'sociologia': 'SOC',
        'derecho': 'DER',
        'medicina': 'MED',
        'ingeniería': 'ING',
        'ingenieria': 'ING',
        'arquitectura': 'ARQ',
        'administración': 'ADM',
        'administracion': 'ADM',
        'contabilidad': 'CON',
        'marketing': 'MAR',
        'mercadotecnia': 'MER'
    };
    
    // Convertir a minúsculas y limpiar
    const nombreLimpio = nombre.toLowerCase()
        .replace(/[áàäâ]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/[ñ]/g, 'n')
        .replace(/[ç]/g, 'c');
    
    // Buscar abreviación en el mapeo
    for (const [palabra, abrev] of Object.entries(abreviaciones)) {
        if (nombreLimpio.includes(palabra)) {
            // Generar número secuencial (por ahora usar timestamp)
            const numero = Math.floor(Math.random() * 900) + 100; // Número de 3 dígitos
            return `${abrev}${numero}`;
        }
    }
    
    // Si no encuentra coincidencia, usar las primeras 3 letras del nombre
    const palabras = nombreLimpio.split(' ');
    let prefijo = '';
    
    if (palabras.length >= 2) {
        // Si hay múltiples palabras, usar primera letra de cada palabra
        prefijo = palabras.slice(0, 3).map(palabra => palabra.charAt(0)).join('').toUpperCase();
    } else {
        // Si es una sola palabra, usar las primeras 3 letras
        prefijo = palabras[0].substring(0, 3).toUpperCase();
    }
    
    // Asegurar que el prefijo tenga al menos 3 caracteres
    while (prefijo.length < 3) {
        prefijo += 'X';
    }
    
    const numero = Math.floor(Math.random() * 900) + 100;
    return `${prefijo}${numero}`;
}

// Función para verificar si una clave ya existe
async function verificarClaveExistente(clave, materiaIdExcluir = null) {
    try {
        const token = await getAuthToken();
        const response = await fetch(`${BACKEND_CONFIG.BASE_URL}/admin/materias`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        if (!result.ok || !result.materias) {
            return false; // Si no se pueden cargar, asumir que no existe
        }
        
        // Verificar si existe una materia con la misma clave
        const materiaExistente = result.materias.find(materia => 
            materia.clave === clave && materia.id != materiaIdExcluir
        );
        
        return !!materiaExistente;
    } catch (error) {
        console.error('Error verificando clave existente:', error);
        return false; // En caso de error, permitir continuar
    }
}

// Función para verificar si un nombre + tutor ya existe
async function verificarNombreTutorExistente(nombre, tutorId, materiaIdExcluir = null) {
    try {
        const token = await getAuthToken();
        const response = await fetch(`${BACKEND_CONFIG.BASE_URL}/admin/materias`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        if (!result.ok || !result.materias) {
            return false; // Si no se pueden cargar, asumir que no existe
        }
        
        // Verificar si existe una materia con el mismo nombre Y tutor
        const materiaExistente = result.materias.find(materia => 
            materia.nombre.toLowerCase() === nombre.toLowerCase() && 
            materia.tutor_id == tutorId && 
            materia.id != materiaIdExcluir
        );
        
        return !!materiaExistente;
    } catch (error) {
        console.error('Error verificando nombre+tutor existente:', error);
        return false; // En caso de error, permitir continuar
    }
}

async function loadTutores() {
    try {
        console.log('🔄 Cargando tutores...');
        const token = await getAuthToken();
        console.log('✅ Token obtenido:', token ? 'Sí' : 'No');
        
        const url = `${BACKEND_CONFIG.BASE_URL}/admin/tutores`;
        console.log('🌐 URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Respuesta recibida:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📋 Resultado completo:', result);
        
        if (!result.ok) {
            throw new Error(result.message || 'Error al obtener los tutores');
        }
        
        console.log('✅ Tutores cargados:', result.tutores.length, 'tutores encontrados');
        result.tutores.forEach(tutor => {
            console.log(`  - ${tutor.nombre_completo} (${tutor.email})`);
        });
        
        return result.tutores;
    } catch (error) {
        console.error('❌ Error cargando tutores:', error);
        return [];
    }
}

async function populateTutoresSelect(tutores, selectedTutorId = null) {
    console.log('🎯 Poblando select de tutores...');
    console.log('📊 Tutores recibidos:', tutores);
    console.log('🎯 Tutor seleccionado:', selectedTutorId);
    
    const select = document.getElementById('materiaTutor');
    if (!select) {
        console.error('❌ No se encontró el elemento materiaTutor');
        return;
    }
    
    console.log('✅ Elemento select encontrado:', select);
    
    // Limpiar opciones existentes (excepto la primera)
    select.innerHTML = '<option value="">Sin tutor asignado</option>';
    console.log('🧹 Select limpiado');
    
    // Agregar tutores
    tutores.forEach((tutor, index) => {
        const option = document.createElement('option');
        option.value = tutor.id;
        option.textContent = `${tutor.nombre_completo} (${tutor.email})`;
        if (selectedTutorId && tutor.id == selectedTutorId) {
            option.selected = true;
            console.log(`✅ Tutor seleccionado: ${tutor.nombre_completo}`);
        }
        select.appendChild(option);
        console.log(`➕ Tutor ${index + 1} agregado: ${tutor.nombre_completo}`);
    });
    
    console.log('🎉 Select poblado exitosamente con', tutores.length, 'tutores');
}

async function editMateria(id) {
    const modal = document.getElementById('materiaModal');
    const form = document.getElementById('materiaForm');
    const title = document.getElementById('materiaModalTitle');
    
    if (modal && form && title) {
        title.textContent = 'Editar Materia';
        
        try {
            const token = await getAuthToken();
            if (!token) {
                throw new Error('No se pudo obtener el token de autenticación');
            }
            
            const response = await fetch(`${BACKEND_CONFIG.BASE_URL}/admin/materias/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            const materia = result.materia || result;
            
            // Cargar tutores y poblar el select
            console.log('🚀 Iniciando carga de tutores para edición...');
            const tutores = await loadTutores();
            console.log('📋 Tutores obtenidos:', tutores);
            console.log('🎯 Tutor actual de la materia:', materia.tutor_id);
            await populateTutoresSelect(tutores, materia.tutor_id);
            console.log('✅ Select de tutores poblado para edición');
            
            // Cargar datos en el formulario
            document.getElementById('materiaId').value = materia.id;
            document.getElementById('materiaClave').value = materia.clave;
            document.getElementById('materiaNombre').value = materia.nombre;
            document.getElementById('materiaEstado').value = materia.estado_id;
            
            // Guardar datos originales para comparar cambios
            storeOriginalMateriaData(materia);
            
            // Para edición, mantener el campo clave de solo lectura
            const claveField = document.getElementById('materiaClave');
            claveField.setAttribute('readonly', 'readonly');
            claveField.style.backgroundColor = '#f8f9fa';
            claveField.placeholder = 'Clave de la materia';
            
            // Configurar event listener del formulario
            setupMateriaFormListener();
            
            modal.style.display = 'block';
            
        } catch (error) {
            console.error('Error cargando datos de la materia:', error);
            showNotification('Error al cargar los datos de la materia', 'error');
        }
    }
}

async function deleteMateria(id) {
    // Primero obtener los datos de la materia para mostrar información en la confirmación
    try {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('No se pudo obtener el token de autenticación');
        }
        
        const response = await fetch(`${BACKEND_CONFIG.BASE_URL}/admin/materias/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        const materia = result.materia || result;
        
        // Mostrar confirmación con detalles de la materia
        const confirmMessage = `¿Estás seguro de que quieres eliminar esta materia?\n\n` +
            `📚 Materia: ${materia.nombre}\n` +
            `🔑 Clave: ${materia.clave}\n` +
            `📊 Estado: ${materia.estado_nombre || 'Activo'}\n\n` +
            `⚠️ Esta acción NO se puede deshacer y eliminará permanentemente la materia de la base de datos.`;
        
        if (confirm(confirmMessage)) {
            // Proceder con la eliminación
            const deleteResponse = await fetch(`${BACKEND_CONFIG.BASE_URL}/admin/materias/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!deleteResponse.ok) {
                const errorData = await deleteResponse.json();
                throw new Error(errorData.message || `Error ${deleteResponse.status}: ${deleteResponse.statusText}`);
            }
            
            showNotification(`Materia "${materia.nombre}" eliminada correctamente`, 'success');
            loadMaterias(); // Recargar tabla
            
        }
        
    } catch (error) {
        console.error('Error eliminando materia:', error);
        showNotification(error.message || 'Error al eliminar la materia', 'error');
    }
}

function closeMateriaModal() {
    const modal = document.getElementById('materiaModal');
    const form = document.getElementById('materiaForm');
    const nombreField = document.getElementById('materiaNombre');
    
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Limpiar event listeners
    if (nombreField) {
        nombreField.removeEventListener('input', generateMateriaKey);
    }
    
    if (form) {
        form.reset();
        document.getElementById('materiaId').value = '';
        
        // Limpiar datos originales
        delete form.dataset.originalData;
    }
}

function searchMaterias() {
    const searchTerm = document.getElementById('materiaSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#materiasTableBody tr');
    
    rows.forEach(row => {
        // Saltar filas de no-data o error
        if (row.classList.contains('no-data') || row.classList.contains('error-data')) {
            return;
        }
        
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterMateriasByEstado() {
    const filter = document.getElementById('estadoFilter').value;
    const rows = document.querySelectorAll('#materiasTableBody tr');
    
    rows.forEach(row => {
        // Saltar filas de no-data o error
        if (row.classList.contains('no-data') || row.classList.contains('error-data')) {
            return;
        }
        
        const estadoCell = row.cells[3]; // La columna de estado es la 4ta (índice 3)
        if (estadoCell) {
            const estadoText = estadoCell.textContent.toLowerCase();
            const estadoNames = {
                '1': 'activo',
                '2': 'inactivo'
            };
            
            const filterText = estadoNames[filter] || filter.toLowerCase();
            row.style.display = !filter || estadoText.includes(filterText) ? '' : 'none';
        }
    });
}

function validateMateriaForm(formData) {
    const clave = formData.get('clave');
    const nombre = formData.get('nombre');
    const estado = formData.get('estado');
    
    // Validar clave (debe estar generada automáticamente)
    if (!clave || clave.trim().length === 0) {
        showNotification('La clave de la materia debe generarse automáticamente', 'error');
        return false;
    }
    
    if (clave.length > 10) {
        showNotification('La clave no puede exceder 10 caracteres', 'error');
        return false;
    }
    
    // Validar nombre
    if (!nombre || nombre.trim().length === 0) {
        showNotification('El nombre de la materia es requerido', 'error');
        return false;
    }
    
    if (nombre.length > 100) {
        showNotification('El nombre no puede exceder 100 caracteres', 'error');
        return false;
    }
    
    // Validar estado
    if (!estado || estado === '') {
        showNotification('Debe seleccionar un estado', 'error');
        return false;
    }
    
    return true;
}

// Manejar formulario de materia
function setupMateriaFormListener() {
    const materiaForm = document.getElementById('materiaForm');
    if (materiaForm) {
        // Remover event listeners anteriores si existen
        materiaForm.removeEventListener('submit', handleMateriaFormSubmit);
        
        // Agregar nuevo event listener
        materiaForm.addEventListener('submit', handleMateriaFormSubmit);
    }
}

function handleMateriaFormSubmit(e) {
    console.log('Formulario de materia enviado');
    e.preventDefault();
    saveMateria();
}

// Funciones para manejar datos originales de materia
function storeOriginalMateriaData(materia) {
    const originalData = {
        nombre: materia.nombre,
        estado_id: materia.estado_id,
        tutor_id: materia.tutor_id
    };
    console.log('Almacenando datos originales:', originalData);
    document.getElementById('materiaForm').dataset.originalData = JSON.stringify(originalData);
}

function getOriginalMateriaData() {
    const form = document.getElementById('materiaForm');
    const originalDataStr = form?.dataset.originalData;
    return originalDataStr ? JSON.parse(originalDataStr) : null;
}

function hasMateriaChanges() {
    const originalData = getOriginalMateriaData();
    if (!originalData) {
        console.log('No hay datos originales, asumiendo cambios');
        return true; // Si no hay datos originales, asumir que hay cambios
    }
    
    const currentData = {
        nombre: document.getElementById('materiaNombre').value.trim(),
        estado_id: document.getElementById('materiaEstado').value,
        tutor_id: document.getElementById('materiaTutor').value
    };
    
    console.log('Comparando datos:');
    console.log('Original:', originalData);
    console.log('Actual:', currentData);
    
    // Convertir valores a string para comparación consistente
    const originalEstado = String(originalData.estado_id);
    const currentEstado = String(currentData.estado_id);
    const originalTutor = String(originalData.tutor_id || '');
    const currentTutor = String(currentData.tutor_id || '');
    
    const nombreChanged = originalData.nombre !== currentData.nombre;
    const estadoChanged = originalEstado !== currentEstado;
    const tutorChanged = originalTutor !== currentTutor;
    
    console.log('Cambios detectados:');
    console.log('- Nombre cambió:', nombreChanged);
    console.log('- Estado cambió:', estadoChanged);
    console.log('- Tutor cambió:', tutorChanged);
    console.log('- Total cambios:', nombreChanged || estadoChanged || tutorChanged);
    
    return nombreChanged || estadoChanged || tutorChanged;
}

async function saveMateria() {
    console.log('Función saveMateria ejecutada');
    const form = document.getElementById('materiaForm');
    const formData = new FormData(form);
    
    // Validar datos del formulario
    console.log('Validando formulario...');
    if (!validateMateriaForm(formData)) {
        console.log('Validación falló');
        return;
    }
    console.log('Validación exitosa');
    
    // Convertir estado_id a nombre de estado
    const estadoId = formData.get('estado');
    const estadoNames = {
        '1': 'activo',
        '2': 'inactivo'
    };
    
    const materiaData = {
        clave: formData.get('clave').trim(),
        nombre: formData.get('nombre').trim(),
        estado: estadoNames[estadoId] || estadoId,
        tutor_id: formData.get('tutor_id') || null // Incluir tutor_id
    };
    
    console.log('💾 Datos de la materia a guardar:', materiaData);
    console.log('📊 Estado ID del formulario:', estadoId);
    console.log('🔄 Estado convertido:', estadoNames[estadoId] || estadoId);
    console.log('👨‍🏫 Tutor ID del formulario:', formData.get('tutor_id'));
    console.log('📝 Formulario encontrado:', !!form);
    console.log('🔍 Elementos del formulario:', {
        materiaId: document.getElementById('materiaId')?.value,
        materiaClave: document.getElementById('materiaClave')?.value,
        materiaNombre: document.getElementById('materiaNombre')?.value,
        materiaEstado: document.getElementById('materiaEstado')?.value,
        materiaTutor: document.getElementById('materiaTutor')?.value
    });
    
    try {
        const isEdit = document.getElementById('materiaId').value;
        console.log('Es edición:', !!isEdit);
        
        // Si es edición, verificar si hay cambios
        if (isEdit) {
            if (!hasMateriaChanges()) {
                showNotification('No se realizaron cambios en la materia', 'info');
                return; // No cerrar el modal, solo mostrar notificación
            }
        }
        const url = isEdit ? 
            `${BACKEND_CONFIG.BASE_URL}/admin/materias/${isEdit}` : 
            `${BACKEND_CONFIG.BASE_URL}/admin/materias`;
        
        const method = isEdit ? 'PUT' : 'POST';
        
        const token = await getAuthToken();
        if (!token) {
            throw new Error('No se pudo obtener el token de autenticación');
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(materiaData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            
            // Manejar errores específicos de duplicados
            if (errorData.message && (errorData.message.includes('Ya existe una materia') || errorData.message.includes('asignada a este tutor'))) {
                showNotification(errorData.message, 'error');
                return; // No cerrar el modal si hay error de duplicado
            }
            
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📥 Respuesta del servidor:', result);
        console.log('👨‍🏫 Datos de tutor en respuesta:', result.materia ? {
            tutor_id: result.materia.tutor_id,
            tutor_nombre: result.materia.tutor_nombre
        } : 'No hay datos de materia');
        
        showNotification(
            isEdit ? 'Materia actualizada correctamente' : 'Materia creada correctamente', 
            'success'
        );
        
        closeMateriaModal();
        
        // Esperar un poco para que el modal se cierre completamente
        setTimeout(() => {
            loadMaterias();
        }, 100);
        
    } catch (error) {
        console.error('Error guardando materia:', error);
        showNotification(error.message || 'Error al guardar la materia', 'error');
    }
}

// FUNCIONES DE SESIONES (CRUD)
async function loadSesiones() {
    console.log('🔄 Iniciando carga de sesiones...');
    const tableBody = document.getElementById('sesionesTableBody');
    if (!tableBody) {
        console.error('❌ No se encontró el elemento sesionesTableBody');
        return;
    }
    
    // Mostrar loading
    showLoading(tableBody, 'Cargando sesiones...');
    
    try {
        // Siempre hacer login fresco para evitar problemas de token
        console.log('🔑 Haciendo login fresco...');
        const loginResponse = await fetch(`${BACKEND_CONFIG.BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'emmanuelbasto10@gmail.com',
                password: 'admin123'
            })
        });
        
        if (!loginResponse.ok) {
            throw new Error(`Login falló: ${loginResponse.status}`);
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        
        if (!token) {
            throw new Error('No se recibió token del login');
        }
        
        console.log('✅ Login exitoso, token obtenido');
        
        // Guardar token en localStorage
        localStorage.setItem('authToken', token);
        
        const url = `${BACKEND_CONFIG.BASE_URL}/admin/sesiones`;
        console.log('🌐 URL de petición:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📡 Respuesta recibida:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', errorText);
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        const sesiones = result.sesiones || [];
        
        console.log('📊 Sesiones recibidas del backend:', sesiones);
        
        if (sesiones.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="11" class="no-data">
                        <div class="no-data-icon">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <h4>No hay sesiones registradas</h4>
                        <p>Las sesiones se crean desde el apartado de tutores</p>
                    </td>
                </tr>
            `;
        } else {
            renderSesionesTable(sesiones);
        }
        
    } catch (error) {
        console.error('Error cargando sesiones:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="11" class="error-data">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h4>Error al cargar sesiones</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="loadSesiones()">Reintentar</button>
                </td>
            </tr>
        `;
    }
}

function renderSesionesTable(sesiones) {
    const tableBody = document.getElementById('sesionesTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = sesiones.map(sesion => `
        <tr>
            <td>${sesion.id}</td>
            <td>
                <div class="user-info">
                    <strong>${sesion.alumno_nombre}</strong>
                    <small>${sesion.alumno_email}</small>
                </div>
            </td>
            <td>
                <div class="user-info">
                    <strong>${sesion.tutor_nombre}</strong>
                    <small>${sesion.tutor_email}</small>
                </div>
            </td>
            <td>
                <div class="materia-info">
                    <span class="clave-badge">${sesion.materia_clave}</span>
                    <strong>${sesion.materia_nombre}</strong>
                </div>
            </td>
            <td>${formatDate(sesion.fecha)}</td>
            <td>${formatTime(sesion.hora_inicio)}</td>
            <td>${formatTime(sesion.hora_fin)}</td>
            <td><span class="modalidad-badge modalidad-${sesion.modalidad_nombre}">${capitalizeFirst(sesion.modalidad_nombre)}</span></td>
            <td><span class="estado-badge estado-sesion-${sesion.estado_nombre}">${capitalizeFirst(sesion.estado_nombre)}</span></td>
            <td>
                ${sesion.motivo_cancelacion_nombre ? 
                    `<span class="motivo-badge">${sesion.motivo_cancelacion_nombre}</span>` : 
                    '<span class="no-motivo">No cancelada</span>'
                }
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-info" onclick="viewSesion(${sesion.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function formatTime(timeString) {
    if (!timeString) return 'N/A';
    return timeString.substring(0, 5); // HH:MM
}

function viewSesion(sesionId) {
    // Función para ver detalles de la sesión (solo lectura para admin)
    showNotification('Función de ver detalles próximamente', 'info');
}

// FUNCIONES DE USUARIOS (CRUD)
async function loadUsuarios() {
    const tableBody = document.getElementById('usuariosTableBody');
    if (!tableBody) return;
    
    // Mostrar loading
    showLoading(tableBody);
    
    try {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('No se pudo obtener token de autenticación');
        }
        
        const response = await fetch(`${BACKEND_CONFIG.BASE_URL}/admin/usuarios`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error del servidor:', errorText);
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const usuarios = data.usuarios || data; // Manejar diferentes formatos de respuesta
        
        if (usuarios.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">
                        <div class="no-data-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <h4>No hay usuarios registrados</h4>
                        <p>Haz clic en "Nuevo Usuario" para agregar el primer usuario</p>
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = usuarios.map(usuario => `
                <tr>
                    <td>${usuario.id}</td>
                    <td>${usuario.matricula}</td>
                    <td>${usuario.nombre_completo}</td>
                    <td>${usuario.email}</td>
                    <td><span class="rol-badge rol-${usuario.rol_nombre}">${capitalizeFirst(usuario.rol_nombre)}</span></td>
                    <td><span class="estado-badge estado-${usuario.estado_nombre}">${capitalizeFirst(usuario.estado_nombre)}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-outline" onclick="editUsuario(${usuario.id})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="resetUserPassword(${usuario.id}, '${usuario.email}')" title="Restablecer Contraseña">
                                <i class="fas fa-key"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteUsuario(${usuario.id})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
        
        // Actualizar estadísticas
        updateUserStats(usuarios);
        
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        showError(tableBody, `Error al cargar usuarios: ${error.message}`);
    }
}

function getRolName(rolId) {
    const roles = {
        1: 'Alumno',
        2: 'Tutor',
        3: 'Admin'
    };
    return roles[rolId] || 'Desconocido';
}

function getEstadoName(estadoId) {
    const estados = {
        1: 'Activo',
        0: 'Inactivo'
    };
    return estados[estadoId] || 'Desconocido';
}

function updateUserStats(usuarios) {
    const stats = {
        totalUsuarios: usuarios.length,
        tutoresActivos: usuarios.filter(u => u.rol_id === 2 && u.estado_id === 1).length,
        estudiantesActivos: usuarios.filter(u => u.rol_id === 1 && u.estado_id === 1).length,
        administradoresActivos: usuarios.filter(u => u.rol_id === 3 && u.estado_id === 1).length
    };
    
    // Actualizar elementos del dashboard si existen
    const totalUsuariosEl = document.getElementById('totalUsuarios');
    const tutoresActivosEl = document.getElementById('tutoresActivos');
    const estudiantesActivosEl = document.getElementById('estudiantesActivos');
    
    if (totalUsuariosEl) totalUsuariosEl.textContent = stats.totalUsuarios;
    if (tutoresActivosEl) tutoresActivosEl.textContent = stats.tutoresActivos;
    if (estudiantesActivosEl) estudiantesActivosEl.textContent = stats.estudiantesActivos;
}

function showAddUsuarioForm() {
    const modal = document.getElementById('usuarioModal');
    const form = document.getElementById('usuarioForm');
    const title = document.getElementById('usuarioModalTitle');
    
    if (modal && form && title) {
        title.textContent = 'Nuevo Usuario';
        form.reset();
        
        // Limpiar datos de edición
        delete form.dataset.userId;
        
        // Restaurar campo de contraseña para creación
        const passwordField = form.querySelector('input[name="password"]');
        const passwordLabel = form.querySelector('label[for="password"]');
        if (passwordField && passwordLabel) {
            passwordField.required = true;
            passwordField.placeholder = 'Mínimo 6 caracteres';
            passwordLabel.innerHTML = 'Contraseña *';
        }
        
        // Limpiar campo de matrícula si existe (ya no debería existir)
        const matriculaField = form.querySelector('input[name="matricula"]');
        if (matriculaField) {
            matriculaField.value = '';
        }
        
        // Agregar validación en tiempo real para contraseñas
        setupPasswordValidationForNewUser();
        
        // Agregar validación en tiempo real para email
        setupEmailValidation();
        
        modal.style.display = 'block';
    }
}

function editUsuario(id) {
    const modal = document.getElementById('usuarioModal');
    const form = document.getElementById('usuarioForm');
    const title = document.getElementById('usuarioModalTitle');
    
    if (modal && form && title) {
        title.textContent = 'Editar Usuario';
        loadUsuarioData(id);
        modal.style.display = 'block';
    }
}

async function loadUsuarioData(id) {
    try {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('No se pudo obtener token de autenticación');
        }
        
        const response = await fetch(`${BACKEND_CONFIG.BASE_URL}/admin/usuarios/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error del servidor:', errorText);
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const usuario = await response.json();
        
        const form = document.getElementById('usuarioForm');
        if (form) {
            // Llenar el formulario con los datos del usuario
            populateUsuarioForm(form, usuario);
        }
        
    } catch (error) {
        console.error('Error cargando datos del usuario:', error);
        showNotification(`Error cargando usuario: ${error.message}`, 'error');
    }
}

function populateUsuarioForm(form, usuario) {
    // Matrícula (solo lectura)
    const matriculaField = form.querySelector('input[name="matricula"]');
    if (matriculaField) {
        matriculaField.value = usuario.matricula;
        matriculaField.readOnly = true;
        matriculaField.style.backgroundColor = '#f8f9fa';
    }
    
    // Nombre completo (editable)
    const nombreField = form.querySelector('input[name="nombre_completo"]');
    if (nombreField) {
        nombreField.value = usuario.nombre_completo;
    }
    
    // Email (editable)
    const emailField = form.querySelector('input[name="email"]');
    if (emailField) {
        emailField.value = usuario.email;
    }
    
    // Rol (solo lectura, mostrar nombre actual)
    const rolField = form.querySelector('select[name="rol_id"]');
    if (rolField) {
        // Establecer el valor del rol actual
        rolField.value = usuario.rol_nombre;
        rolField.disabled = true;
        rolField.style.backgroundColor = '#f8f9fa';
        rolField.style.cursor = 'not-allowed';
        
        // Asegurar que el campo tenga un valor válido para la validación
        if (!rolField.value) {
            rolField.value = usuario.rol_nombre;
        }
        
        // Agregar texto descriptivo
        const rolLabel = form.querySelector('label[for="rol_id"]');
        if (rolLabel) {
            rolLabel.innerHTML = `Rol (${capitalizeFirst(usuario.rol_nombre)}) *`;
        }
    }
    
    // Estado (editable, mostrar estado actual)
    const estadoField = form.querySelector('select[name="estado"]');
    if (estadoField) {
        estadoField.value = usuario.estado_nombre;
        
        // Agregar texto descriptivo
        const estadoLabel = form.querySelector('label[for="estado"]');
        if (estadoLabel) {
            estadoLabel.innerHTML = `Estado (Actual: ${capitalizeFirst(usuario.estado_nombre)})`;
        }
    }
    
    // Almacenar datos originales para comparación
    storeOriginalData(form, usuario);
    
    // Agregar campo oculto con el ID del usuario
    let hiddenIdField = form.querySelector('input[name="usuario_id"]');
    if (!hiddenIdField) {
        hiddenIdField = document.createElement('input');
        hiddenIdField.type = 'hidden';
        hiddenIdField.name = 'usuario_id';
        form.appendChild(hiddenIdField);
    }
    hiddenIdField.value = usuario.id;
    
    // Cambiar el texto del botón de envío
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = 'Actualizar Usuario';
    }
}

async function deleteUsuario(id) {
    // Obtener información del usuario para mostrar en la confirmación
    try {
        const token = await getAuthToken();
        if (!token) {
            showNotification('No se pudo obtener token de autenticación', 'error');
            return;
        }
        
        const response = await fetch(`${BACKEND_CONFIG.BASE_URL}/admin/usuarios/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const usuario = await response.json();
        
        // Mostrar confirmación con información del usuario
        const confirmMessage = `¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE al usuario?\n\n` +
                             `👤 Nombre: ${usuario.nombre_completo}\n` +
                             `📧 Email: ${usuario.email}\n` +
                             `🎓 Rol: ${capitalizeFirst(usuario.rol_nombre)}\n\n` +
                             `⚠️ ADVERTENCIA: Esta acción eliminará TODOS los datos del usuario de forma permanente y NO se puede deshacer.\n\n` +
                             `¿Continuar con la eliminación?`;
        
        if (confirm(confirmMessage)) {
            // Proceder con la eliminación
            const deleteResponse = await fetch(`${BACKEND_CONFIG.BASE_URL}/admin/usuarios/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!deleteResponse.ok) {
                const errorData = await deleteResponse.json();
                throw new Error(errorData.message || `Error ${deleteResponse.status}: ${deleteResponse.statusText}`);
            }
            
            const result = await deleteResponse.json();
            showNotification(result.message || 'Usuario eliminado permanentemente de la base de datos', 'success');
            loadUsuarios(); // Recargar tabla
            
        }
        
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        showNotification(error.message || 'Error al eliminar el usuario', 'error');
    }
}

function resetUserPassword(id, email) {
    const modal = document.getElementById('resetPasswordModal');
    const emailField = document.getElementById('resetUserEmail');
    
    if (modal && emailField) {
        emailField.value = email;
        modal.dataset.userId = id; // Guardar ID del usuario
        modal.style.display = 'block';
        
        // Agregar event listeners para validación en tiempo real
        setupPasswordValidation();
    }
}

function setupPasswordValidation() {
    const form = document.getElementById('resetPasswordForm');
    if (!form) return;
    
    const passwordFields = form.querySelectorAll('input[type="password"]');
    passwordFields.forEach(field => {
        field.addEventListener('input', validatePasswordFields);
        field.addEventListener('blur', validatePasswordFields);
    });
}

function setupPasswordValidationForNewUser() {
    const form = document.getElementById('usuarioForm');
    if (!form) return;
    
    const passwordFields = form.querySelectorAll('input[type="password"]');
    passwordFields.forEach(field => {
        field.addEventListener('input', validateNewUserPasswordFields);
        field.addEventListener('blur', validateNewUserPasswordFields);
    });
}

function setupEmailValidation() {
    const form = document.getElementById('usuarioForm');
    if (!form) return;
    
    const emailField = form.querySelector('input[name="email"]');
    if (emailField) {
        emailField.addEventListener('blur', validateEmailExists);
    }
}

async function validateEmailExists(event) {
    const emailField = event.target;
    const email = emailField.value.trim();
    
    if (!email || !validateEmail(email)) {
        clearFieldError(emailField);
        return;
    }
    
    try {
        const token = await getAuthToken();
        if (!token) return;
        
        const response = await fetch(`${BACKEND_CONFIG.BASE_URL}/admin/usuarios`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const usuarios = data.usuarios || data;
            
            // Verificar email exacto
            const emailExists = usuarios.some(usuario => 
                usuario.email.toLowerCase() === email.toLowerCase()
            );
            
            if (emailExists) {
                showFieldError(emailField, 'Este correo electrónico ya está registrado');
                return;
            }
            
            // Verificar emails similares (mismo nombre de usuario, diferente dominio)
            const emailParts = email.split('@');
            if (emailParts.length === 2) {
                const username = emailParts[0];
                
                const similarEmailExists = usuarios.some(usuario => {
                    const userEmailParts = usuario.email.split('@');
                    return userEmailParts.length === 2 && 
                           userEmailParts[0].toLowerCase() === username.toLowerCase() &&
                           usuario.email.toLowerCase() !== email.toLowerCase();
                });
                
                if (similarEmailExists) {
                    showFieldError(emailField, 'Ya existe un usuario con un email similar');
                    return;
                }
            }
            
            clearFieldError(emailField);
        }
        
    } catch (error) {
        console.error('Error validando email:', error);
    }
}

function closeUsuarioModal() {
    const modal = document.getElementById('usuarioModal');
    const form = document.getElementById('usuarioForm');
    
    if (modal) {
        modal.style.display = 'none';
    }
    
    if (form) {
        form.reset();
        
        // Limpiar campos específicos
        const matriculaField = form.querySelector('input[name="matricula"]');
        if (matriculaField) {
            matriculaField.readOnly = false;
            matriculaField.style.backgroundColor = '';
            matriculaField.value = '';
        }
        
        const rolField = form.querySelector('select[name="rol_id"]');
        if (rolField) {
            rolField.disabled = false;
            rolField.style.backgroundColor = '';
            rolField.style.cursor = '';
            
            // Restaurar label original
            const rolLabel = form.querySelector('label[for="rol_id"]');
            if (rolLabel) {
                rolLabel.innerHTML = 'Rol *';
            }
        }
        
        const estadoField = form.querySelector('select[name="estado"]');
        if (estadoField) {
            // Restaurar label original
            const estadoLabel = form.querySelector('label[for="estado"]');
            if (estadoLabel) {
                estadoLabel.innerHTML = 'Estado';
            }
        }
        
        // Cambiar texto del botón
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Guardar';
        }
        
        // Eliminar campo oculto de ID
        const hiddenIdField = form.querySelector('input[name="usuario_id"]');
        if (hiddenIdField) {
            hiddenIdField.remove();
        }
        
        // Limpiar datos originales
        delete form.dataset.originalData;
        delete form.dataset.userId;
        
        // Limpiar campos de contraseña
        const passwordFields = form.querySelectorAll('input[type="password"]');
        passwordFields.forEach(field => {
            field.style.borderColor = '';
            const errorMsg = field.parentNode.querySelector('.field-error');
            if (errorMsg) {
                errorMsg.remove();
            }
        });
    }
}

function closeResetPasswordModal() {
    const modal = document.getElementById('resetPasswordModal');
    const form = document.getElementById('resetPasswordForm');
    
    if (modal) {
        modal.style.display = 'none';
        delete modal.dataset.userId;
    }
    
    if (form) {
        form.reset();
        
        // Limpiar mensajes de validación
        const passwordFields = form.querySelectorAll('input[type="password"]');
        passwordFields.forEach(field => {
            field.style.borderColor = '';
            const errorMsg = field.parentNode.querySelector('.field-error');
            if (errorMsg) {
                errorMsg.remove();
            }
        });
    }
}

// Función para validar contraseñas en tiempo real
function validatePasswordFields() {
    const form = document.getElementById('resetPasswordForm');
    if (!form) return;
    
    const currentPassword = form.querySelector('input[name="currentPassword"]');
    const newPassword = form.querySelector('input[name="newPassword"]');
    const confirmPassword = form.querySelector('input[name="confirmPassword"]');
    
    if (!currentPassword || !newPassword || !confirmPassword) return;
    
    // Validar nueva contraseña vs confirmación
    if (newPassword.value && confirmPassword.value) {
        if (newPassword.value !== confirmPassword.value) {
            showFieldError(confirmPassword, 'Las contraseñas no coinciden');
        } else {
            clearFieldError(confirmPassword);
        }
    }
    
    // Validar que nueva contraseña sea diferente a la actual
    if (currentPassword.value && newPassword.value) {
        if (currentPassword.value === newPassword.value) {
            showFieldError(newPassword, 'La nueva contraseña debe ser diferente a la actual');
        } else {
            clearFieldError(newPassword);
        }
    }
}

// Función para validar contraseñas en tiempo real en el formulario de nuevo usuario
function validateNewUserPasswordFields() {
    const form = document.getElementById('usuarioForm');
    if (!form) return;
    
    const password = form.querySelector('input[name="password"]');
    const confirmPassword = form.querySelector('input[name="confirmPassword"]');
    
    if (!password || !confirmPassword) return;
    
    // Validar longitud de contraseña
    if (password.value && password.value.length < 6) {
        showFieldError(password, 'La contraseña debe tener al menos 6 caracteres');
    } else {
        clearFieldError(password);
    }
    
    // Validar confirmación de contraseña
    if (password.value && confirmPassword.value) {
        if (password.value !== confirmPassword.value) {
            showFieldError(confirmPassword, 'Las contraseñas no coinciden');
        } else {
            clearFieldError(confirmPassword);
        }
    }
}

function showFieldError(field, message) {
    field.style.borderColor = '#dc3545';
    
    // Remover error anterior si existe
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Agregar nuevo mensaje de error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '0.8rem';
    errorDiv.style.marginTop = '0.25rem';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.style.borderColor = '';
    const errorMsg = field.parentNode.querySelector('.field-error');
    if (errorMsg) {
        errorMsg.remove();
    }
}

function filterUsuarios() {
    const filter = document.getElementById('rolFilter').value;
    const rows = document.querySelectorAll('#usuariosTableBody tr');
    
    rows.forEach(row => {
        // Saltar filas de no-data o error
        if (row.classList.contains('no-data') || row.classList.contains('error-data')) {
            return;
        }
        
        const rolCell = row.cells[4]; // La columna de rol es la 5ta (índice 4)
        if (rolCell) {
            const rolText = rolCell.textContent.toLowerCase();
            const rolNames = {
                '1': 'alumno',
                '2': 'tutor', 
                '3': 'admin'
            };
            
            const filterText = rolNames[filter] || filter.toLowerCase();
            row.style.display = !filter || rolText.includes(filterText) ? '' : 'none';
        }
    });
}

function searchUsuarios() {
    const searchTerm = document.getElementById('usuarioSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#usuariosTableBody tr');
    
    rows.forEach(row => {
        // Saltar filas de no-data o error
        if (row.classList.contains('no-data') || row.classList.contains('error-data')) {
            return;
        }
        
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function validateUsuarioForm(formData) {
    const nombreCompleto = formData.get('nombre_completo');
    const email = formData.get('email');
    const rolId = formData.get('rol_id');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const estado = formData.get('estado');
    
    // Validar nombre completo
    if (!nombreCompleto || nombreCompleto.trim().length === 0) {
        showNotification('El nombre completo es requerido', 'error');
        return false;
    }
    
    if (nombreCompleto.length > 100) {
        showNotification('El nombre completo no puede exceder 100 caracteres', 'error');
        return false;
    }
    
    // Validar email
    if (!email || email.trim().length === 0) {
        showNotification('El email es requerido', 'error');
        return false;
    }
    
    if (!validateEmail(email)) {
        showNotification('El formato del email no es válido', 'error');
        return false;
    }
    
    if (email.length > 100) {
        showNotification('El email no puede exceder 100 caracteres', 'error');
        return false;
    }
    
    // Validar rol solo si es creación nueva
    const form = document.getElementById('usuarioForm');
    const isEdit = form.querySelector('input[name="usuario_id"]')?.value;
    
    if (!isEdit && (!rolId || rolId === '')) {
        showNotification('Debe seleccionar un rol', 'error');
        return false;
    }
    
    // Validar estado
    if (!estado || estado === '') {
        showNotification('Debe seleccionar un estado', 'error');
        return false;
    }
    
    // Validar contraseña solo si es creación nueva
    if (!isEdit) {
        if (!password || password.length < 6) {
            showNotification('La contraseña es requerida y debe tener al menos 6 caracteres', 'error');
            return false;
        }
        
        if (!confirmPassword) {
            showNotification('Debe confirmar la contraseña', 'error');
            return false;
        }
        
        if (password !== confirmPassword) {
            showNotification('Las contraseñas no coinciden', 'error');
            return false;
        }
    }
    
    // Validar contraseña si se proporciona (para edición)
    if (password && password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return false;
    }
    
    return true;
}

// Manejar formularios de usuario
document.addEventListener('submit', function(e) {
    if (e.target.id === 'usuarioForm') {
        e.preventDefault();
        saveUsuario();
    } else if (e.target.id === 'resetPasswordForm') {
        e.preventDefault();
        resetPassword();
    }
});

// Función para detectar si hay cambios en el formulario
function hasChanges(form, originalData) {
    const formData = new FormData(form);
    
    // Comparar campos editables
    const currentData = {
        nombre_completo: formData.get('nombre_completo'),
        email: formData.get('email'),
        estado: formData.get('estado')
    };
    
    // Comparar con datos originales
    return (
        currentData.nombre_completo !== originalData.nombre_completo ||
        currentData.email !== originalData.email ||
        currentData.estado !== originalData.estado_nombre
    );
}

// Función para almacenar datos originales
function storeOriginalData(form, usuario) {
    form.dataset.originalData = JSON.stringify({
        nombre_completo: usuario.nombre_completo,
        email: usuario.email,
        estado_nombre: usuario.estado_nombre
    });
}

// Función para obtener datos originales
function getOriginalData(form) {
    const originalDataStr = form.dataset.originalData;
    return originalDataStr ? JSON.parse(originalDataStr) : null;
}

async function saveUsuario() {
    const form = document.getElementById('usuarioForm');
    const formData = new FormData(form);
    
    // Determinar si es edición o creación
    const usuarioId = form.querySelector('input[name="usuario_id"]')?.value;
    const isEdit = !!usuarioId;
    
    // Si es edición, verificar si hay cambios
    if (isEdit) {
        const originalData = getOriginalData(form);
        if (originalData && !hasChanges(form, originalData)) {
            showNotification('No se realizaron cambios', 'info');
            return;
        }
    }
    
    // Validar datos del formulario
    if (!validateUsuarioForm(formData)) {
        return;
    }
    
    const usuarioData = {
        nombre_completo: formData.get('nombre_completo'),
        email: formData.get('email'),
        estado: formData.get('estado')
    };
    
    // Solo incluir campos adicionales si es creación nueva
    if (!isEdit) {
        usuarioData.password = formData.get('password');
        usuarioData.rol_id = formData.get('rol_id'); // Ahora es el nombre del rol
        // La matrícula se generará automáticamente en el backend según el rol
    }
    
    try {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('No se pudo obtener token de autenticación');
        }
        
        const url = isEdit ? 
            `${BACKEND_CONFIG.BASE_URL}/admin/usuarios/${usuarioId}` : 
            `${BACKEND_CONFIG.BASE_URL}/admin/usuarios`;
        
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(usuarioData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            
            // Manejar error específico de email duplicado
            if (response.status === 400 && errorData.message && errorData.message.includes('email')) {
                showNotification('Este correo electrónico ya está registrado en el sistema', 'error');
                return;
            }
            
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        showNotification(
            isEdit ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente', 
            'success'
        );
        
        closeUsuarioModal();
        loadUsuarios();
        
    } catch (error) {
        console.error('Error guardando usuario:', error);
        showNotification(error.message || 'Error al guardar el usuario', 'error');
    }
}

async function resetPassword() {
    const form = document.getElementById('resetPasswordForm');
    const formData = new FormData(form);
    
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    const userEmail = document.getElementById('resetUserEmail').value;
    
    // Obtener el ID del usuario objetivo del modal
    const modal = document.getElementById('resetPasswordModal');
    const targetUserId = modal ? modal.dataset.userId : null;
    
    // Validaciones del frontend
    // Solo requerir contraseña actual si no hay usuario objetivo (no es admin cambiando contraseña de otro usuario)
    if (!targetUserId && !currentPassword) {
        showNotification('La contraseña actual es requerida', 'error');
        return;
    }
    
    if (!newPassword) {
        showNotification('La nueva contraseña es requerida', 'error');
        return;
    }
    
    if (!confirmPassword) {
        showNotification('Debe confirmar la nueva contraseña', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('La nueva contraseña debe tener al menos 6 dígitos', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('Las contraseñas nuevas no coinciden', 'error');
        return;
    }
    
    // Solo validar si es el propio usuario (no admin cambiando contraseña de otro usuario)
    if (!targetUserId && currentPassword === newPassword) {
        showNotification('La nueva contraseña debe ser diferente a la contraseña actual', 'error');
        return;
    }
    
    try {
        const token = await getAuthToken();
        if (!token) {
            throw new Error('No se pudo obtener token de autenticación');
        }
        
        // Obtener el ID del usuario objetivo del modal
        const modal = document.getElementById('resetPasswordModal');
        const targetUserId = modal ? modal.dataset.userId : null;
        
        const requestBody = {
            newPassword: newPassword
        };
        
        // Si hay un usuario objetivo (admin cambiando contraseña de otro usuario)
        if (targetUserId) {
            requestBody.targetUserId = targetUserId;
        } else {
            // Si es el propio usuario, incluir contraseña actual
            requestBody.currentPassword = currentPassword;
        }
        
        const response = await fetch(`${BACKEND_CONFIG.BASE_URL}/auth/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.ok) {
            showNotification('Contraseña cambiada exitosamente', 'success');
            closeResetPasswordModal();
        } else {
            showNotification(result.message || 'Error al cambiar la contraseña', 'error');
        }
        
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        showNotification(error.message || 'Error al cambiar la contraseña', 'error');
    }
}

// FUNCIONES DE PARÁMETROS DEL SISTEMA
function loadSystemParameters() {
    // TODO: Implementar llamada al backend para obtener parámetros del sistema
    // Endpoint sugerido: GET /api/admin/parametros
    
    const parameters = {
        duracionEstandar: 60,
        ventanaCancelacion: 2,
        limiteSesiones: 5,
        horarioInicio: '08:00',
        horarioFin: '20:00',
        email: true,
        sms: false,
        push: true,
        recordatorioSesion: 30,
        notificacionCancelacion: 'inmediata',
        tiempoSesion: 120,
        intentosMaximos: 5,
        bloqueoTemporal: 15
    };
    
    // Cargar parámetros en los formularios
    loadSessionParameters(parameters);
    loadNotificationParameters(parameters);
    loadSecurityParameters(parameters);
}

function loadSessionParameters(params) {
    const form = document.getElementById('sessionParametersForm');
    if (form) {
        form.duracionEstandar.value = params.duracionEstandar;
        form.ventanaCancelacion.value = params.ventanaCancelacion;
        form.limiteSesiones.value = params.limiteSesiones;
        form.horarioInicio.value = params.horarioInicio;
        form.horarioFin.value = params.horarioFin;
    }
}

function loadNotificationParameters(params) {
    const form = document.getElementById('notificationParametersForm');
    if (form) {
        form.email.checked = params.email;
        form.sms.checked = params.sms;
        form.push.checked = params.push;
        form.recordatorioSesion.value = params.recordatorioSesion;
        form.notificacionCancelacion.value = params.notificacionCancelacion;
    }
}

function loadSecurityParameters(params) {
    const form = document.getElementById('securityParametersForm');
    if (form) {
        form.tiempoSesion.value = params.tiempoSesion;
        form.intentosMaximos.value = params.intentosMaximos;
        form.bloqueoTemporal.value = params.bloqueoTemporal;
    }
}

function saveAllParameters() {
    const sessionParams = getSessionParameters();
    const notificationParams = getNotificationParameters();
    const securityParams = getSecurityParameters();
    
    const allParams = {
        ...sessionParams,
        ...notificationParams,
        ...securityParams
    };
    
    // TODO: Implementar llamada al backend para guardar parámetros
    // Endpoint sugerido: PUT /api/admin/parametros
    
    console.log('Guardando parámetros:', allParams);
    alert('Parámetros guardados correctamente');
}

function getSessionParameters() {
    const form = document.getElementById('sessionParametersForm');
    return {
        duracionEstandar: form.duracionEstandar.value,
        ventanaCancelacion: form.ventanaCancelacion.value,
        limiteSesiones: form.limiteSesiones.value,
        horarioInicio: form.horarioInicio.value,
        horarioFin: form.horarioFin.value
    };
}

function getNotificationParameters() {
    const form = document.getElementById('notificationParametersForm');
    return {
        email: form.email.checked,
        sms: form.sms.checked,
        push: form.push.checked,
        recordatorioSesion: form.recordatorioSesion.value,
        notificacionCancelacion: form.notificacionCancelacion.value
    };
}

function getSecurityParameters() {
    const form = document.getElementById('securityParametersForm');
    return {
        tiempoSesion: form.tiempoSesion.value,
        intentosMaximos: form.intentosMaximos.value,
        bloqueoTemporal: form.bloqueoTemporal.value
    };
}

function resetParameters() {
    if (confirm('¿Estás seguro de que quieres restaurar los valores por defecto?')) {
        loadSystemParameters(); // Recargar valores por defecto
        alert('Parámetros restaurados a valores por defecto');
    }
}

// FUNCIONES DE GESTIÓN DE SESIONES - Adaptadas a tu BD
// (Función duplicada eliminada - se usa la primera versión)

function renderSesionesTable(sesiones) {
    const tableBody = document.getElementById('sesionesTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = sesiones.map(sesion => `
        <tr>
            <td>${sesion.id}</td>
            <td>
                <div class="user-info">
                    <strong>${sesion.alumno_nombre || 'N/A'}</strong>
                    <small>${sesion.alumno_email || ''}</small>
                </div>
            </td>
            <td>
                <div class="user-info">
                    <strong>${sesion.tutor_nombre || 'N/A'}</strong>
                    <small>${sesion.tutor_email || ''}</small>
                </div>
            </td>
            <td>
                <div class="materia-info">
                    <strong>${sesion.materia_clave || ''} - ${sesion.materia_nombre || 'N/A'}</strong>
                </div>
            </td>
            <td>${formatDate(sesion.fecha)}</td>
            <td>${formatTime(sesion.hora_inicio)}</td>
            <td>${formatTime(sesion.hora_fin)}</td>
            <td><span class="modalidad-badge modalidad-${sesion.modalidad_nombre?.toLowerCase() || 'desconocido'}">${sesion.modalidad_nombre || 'Desconocido'}</span></td>
            <td><span class="estado-badge estado-${sesion.estado_nombre?.toLowerCase() || 'desconocido'}">${sesion.estado_nombre || 'Desconocido'}</span></td>
            <td>
                ${sesion.motivo_cancelacion_nombre ? 
                    `<span class="motivo-badge">${sesion.motivo_cancelacion_nombre}</span>` : 
                    '<span class="no-motivo">No cancelada</span>'
                }
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline" onclick="viewSesion(${sesion.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getModalidadName(modalidadId) {
    const modalidades = {
        1: 'Presencial',
        2: 'Online'
    };
    return modalidades[modalidadId] || 'N/A';
}

function getEstadoSesionName(estadoId) {
    const estados = {
        1: 'Pendiente',
        2: 'Completada',
        3: 'Cancelada'
    };
    return estados[estadoId] || 'Desconocido';
}

async function editSesion(id) {
    const modal = document.getElementById('sesionModal');
    
    if (modal) {
        try {
            // TODO: Reemplazar con llamada real al backend
            // Endpoint: GET /api/admin/sesiones/${id}
            const response = await fetch(`${BACKEND_CONFIG.BASE_URL}/admin/sesiones/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const sesion = await response.json();
            
            // Cargar datos en el modal
            document.getElementById('sesionId').value = sesion.id;
            document.getElementById('estudianteInfo').value = sesion.estudiante_nombre || 'N/A';
            document.getElementById('tutorInfo').value = sesion.tutor_nombre || 'N/A';
            document.getElementById('materiaInfo').value = sesion.materia_nombre || 'N/A';
            document.getElementById('fechaHoraInfo').value = `${formatDate(sesion.fecha)} ${formatTime(sesion.hora_inicio)} - ${formatTime(sesion.hora_fin)}`;
            document.getElementById('estadoSesion').value = sesion.estado_id;
            
            // Mostrar/ocultar motivo de cancelación según el estado
            toggleMotivoCancelacion(sesion.estado_id);
            
            modal.style.display = 'block';
            
        } catch (error) {
            console.error('Error cargando datos de la sesión:', error);
            showNotification('Error al cargar los datos de la sesión', 'error');
        }
    }
}

function toggleMotivoCancelacion(estadoId) {
    const motivoGroup = document.getElementById('motivoCancelacionGroup');
    if (motivoGroup) {
        motivoGroup.style.display = estadoId == 3 ? 'block' : 'none'; // 3 = Cancelada
    }
}

function closeSesionModal() {
    const modal = document.getElementById('sesionModal');
    const form = document.getElementById('sesionForm');
    
    if (modal) {
        modal.style.display = 'none';
    }
    
    if (form) {
        form.reset();
        document.getElementById('sesionId').value = '';
        document.getElementById('motivoCancelacionGroup').style.display = 'none';
    }
}

function filterSesionesByDate() {
    const fecha = document.getElementById('fechaFilter').value;
    const rows = document.querySelectorAll('#sesionesTableBody tr');
    
    rows.forEach(row => {
        // Saltar filas de no-data o error
        if (row.classList.contains('no-data') || row.classList.contains('error-data')) {
            return;
        }
        
        const fechaCell = row.cells[4]; // La columna de fecha es la 5ta (índice 4)
        if (fechaCell) {
            row.style.display = !fecha || fechaCell.textContent.includes(fecha) ? '' : 'none';
        }
    });
}

function searchSesiones() {
    const searchTerm = document.getElementById('sesionSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#sesionesTableBody tr');
    
    rows.forEach(row => {
        // Saltar filas de no-data o error
        if (row.classList.contains('no-data') || row.classList.contains('error-data')) {
            return;
        }
        
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Manejar formulario de sesión
document.addEventListener('submit', function(e) {
    if (e.target.id === 'sesionForm') {
        e.preventDefault();
        saveSesion();
    }
});

// Manejar cambio de estado para mostrar/ocultar motivo de cancelación
document.addEventListener('change', function(e) {
    if (e.target.id === 'estadoSesion') {
        toggleMotivoCancelacion(e.target.value);
    }
});

async function saveSesion() {
    const form = document.getElementById('sesionForm');
    const formData = new FormData(form);
    
    const sesionData = {
        estado_id: parseInt(formData.get('estado_id'))
    };
    
    // Si está cancelada, agregar motivo
    if (sesionData.estado_id === 3) {
        const motivoId = formData.get('motivo_cancelacion_id');
        if (motivoId) {
            sesionData.motivo_cancelacion_id = parseInt(motivoId);
        }
    }
    
    try {
        const sesionId = document.getElementById('sesionId').value;
        
        const response = await fetch(`${BACKEND_CONFIG.BASE_URL}/admin/sesiones/${sesionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(sesionData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }
        
        showNotification('Estado de sesión actualizado correctamente', 'success');
        closeSesionModal();
        loadSesiones();
        
    } catch (error) {
        console.error('Error actualizando sesión:', error);
        showNotification(error.message || 'Error al actualizar la sesión', 'error');
    }
}

// FUNCIONES DE REPORTES
function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const reportPeriod = document.getElementById('reportPeriod').value;
    const reportFormat = document.getElementById('reportFormat').value;
    
    // TODO: Implementar llamada al backend para generar reportes
    // Endpoint sugerido: POST /api/admin/reportes/generate
    // Body: { type: reportType, period: reportPeriod, format: reportFormat }
    
    console.log('Generando reporte:', { reportType, reportPeriod, reportFormat });
    
    // Mostrar loading
    showReportLoading();
    
    // Simular llamada al backend (remover cuando se implemente el backend)
    setTimeout(() => {
        showReportResults(reportType, reportPeriod);
    }, 1500);
}

function showReportLoading() {
    const resultsDiv = document.getElementById('reportResults');
    const contentDiv = document.getElementById('reportContent');
    
    if (resultsDiv && contentDiv) {
        resultsDiv.style.display = 'block';
        contentDiv.innerHTML = `
            <div class="loading-container">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Generando reporte...</p>
            </div>
        `;
    }
}

function showReportResults(type, period) {
    const contentDiv = document.getElementById('reportContent');
    
    if (contentDiv) {
        contentDiv.innerHTML = `
            <div class="report-preview">
                <h4>Vista Previa del Reporte</h4>
                <p><strong>Tipo:</strong> ${getReportTypeName(type)}</p>
                <p><strong>Período:</strong> ${getPeriodName(period)}</p>
                <div class="no-data">
                    <i class="fas fa-info-circle"></i>
                    <p>Los datos reales se cargarán desde el backend</p>
                </div>
            </div>
        `;
    }
}

function getReportTypeName(type) {
    const types = {
        'asistencia': 'Control de Asistencia',
        'usuarios': 'Usuarios Activos',
        'sesiones': 'Sesiones por Período',
        'tutores': 'Actividad de Tutores'
    };
    return types[type] || type;
}

function getPeriodName(period) {
    const periods = {
        'hoy': 'Hoy',
        'semana': 'Esta Semana',
        'mes': 'Este Mes',
        'año': 'Este Año'
    };
    return periods[period] || period;
}

function exportReport() {
    const reportType = document.getElementById('reportType').value;
    const reportFormat = document.getElementById('reportFormat').value;
    
    // TODO: Implementar llamada al backend para exportar reportes
    // Endpoint sugerido: GET /api/admin/reportes/export?type=${reportType}&format=${reportFormat}
    
    console.log('Exportando reporte:', { reportType, reportFormat });
    
    // Simular exportación exitosa sin mostrar notificación automática
    console.log('Reporte exportado exitosamente');
}

// FUNCIÓN PARA DESCARGAR PLANTILLA DE REPORTE
function downloadBlankReport() {
    // Crear contenido del reporte en blanco
    const reportContent = createBlankReport();
    
    // Crear y descargar el archivo
    downloadFile(reportContent, 'plantilla_reporte_tutorias.html', 'text/html');
    
    // Mostrar notificación de éxito
    showNotification('Plantilla de reporte descargada correctamente', 'success');
}

function createBlankReport() {
    const currentDate = new Date().toLocaleDateString('es-ES');
    
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Tutorías - ${currentDate}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .report-title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .report-date {
            font-size: 14px;
            color: #666;
            margin-top: 10px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .blank-field {
            border-bottom: 1px solid #333;
            min-height: 20px;
            margin: 5px 0;
        }
        .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            width: 200px;
            text-align: center;
        }
        .signature-line {
            border-bottom: 1px solid #333;
            height: 40px;
            margin-bottom: 5px;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="report-title">REPORTE DE TUTORÍAS</div>
        <div class="report-date">Fecha: ${currentDate}</div>
    </div>

    <div class="section">
        <div class="section-title">INFORMACIÓN GENERAL</div>
        <table>
            <tr>
                <td><strong>Período del Reporte:</strong></td>
                <td class="blank-field"></td>
            </tr>
            <tr>
                <td><strong>Generado por:</strong></td>
                <td class="blank-field"></td>
            </tr>
            <tr>
                <td><strong>Departamento/Área:</strong></td>
                <td class="blank-field"></td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">ESTADÍSTICAS DE SESIONES</div>
        <table>
                <thead>
                    <tr>
                    <th>Concepto</th>
                    <th>Cantidad</th>
                    <th>Observaciones</th>
                    </tr>
                </thead>
                <tbody>
                <tr>
                    <td>Total de sesiones programadas</td>
                    <td class="blank-field"></td>
                    <td class="blank-field"></td>
                </tr>
                <tr>
                    <td>Sesiones completadas</td>
                    <td class="blank-field"></td>
                    <td class="blank-field"></td>
                </tr>
                <tr>
                    <td>Sesiones canceladas</td>
                    <td class="blank-field"></td>
                    <td class="blank-field"></td>
                </tr>
                <tr>
                    <td>Promedio de asistencia</td>
                    <td class="blank-field"></td>
                    <td class="blank-field"></td>
                </tr>
                </tbody>
            </table>
                </div>

    <div class="section">
        <div class="section-title">ACTIVIDAD POR TUTOR</div>
        <table>
                <thead>
                    <tr>
                    <th>Nombre del Tutor</th>
                        <th>Sesiones Realizadas</th>
                        <th>Horas Totales</th>
                    <th>Calificación Promedio</th>
                    </tr>
                </thead>
                <tbody>
                <tr>
                    <td class="blank-field"></td>
                    <td class="blank-field"></td>
                    <td class="blank-field"></td>
                    <td class="blank-field"></td>
                </tr>
                <tr>
                    <td class="blank-field"></td>
                    <td class="blank-field"></td>
                    <td class="blank-field"></td>
                    <td class="blank-field"></td>
                </tr>
                <tr>
                    <td class="blank-field"></td>
                    <td class="blank-field"></td>
                    <td class="blank-field"></td>
                    <td class="blank-field"></td>
                </tr>
                </tbody>
            </table>
                </div>

    <div class="section">
        <div class="section-title">MATERIAS MÁS SOLICITADAS</div>
        <table>
                <thead>
                    <tr>
                    <th>Materia</th>
                    <th>Número de Sesiones</th>
                    <th>Porcentaje</th>
                    </tr>
                </thead>
                <tbody>
                <tr>
                    <td class="blank-field"></td>
                    <td class="blank-field"></td>
                    <td class="blank-field"></td>
                </tr>
                <tr>
                    <td class="blank-field"></td>
                    <td class="blank-field"></td>
                    <td class="blank-field"></td>
                </tr>
                <tr>
                    <td class="blank-field"></td>
                    <td class="blank-field"></td>
                    <td class="blank-field"></td>
                </tr>
                </tbody>
            </table>
    </div>

    <div class="section">
        <div class="section-title">OBSERVACIONES Y RECOMENDACIONES</div>
        <div class="blank-field" style="min-height: 100px;"></div>
        <div class="blank-field" style="min-height: 100px;"></div>
        <div class="blank-field" style="min-height: 100px;"></div>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div>Firma del Administrador</div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div>Fecha</div>
        </div>
    </div>

    <div class="no-print" style="margin-top: 30px; text-align: center; color: #666;">
        <p><em>Este es un reporte en blanco generado por el Sistema de Tutorías</em></p>
        <p><em>Complete los campos según sea necesario</em></p>
    </div>
</body>
</html>
    `;
}

function downloadFile(content, filename, contentType) {
    // Crear un blob con el contenido
    const blob = new Blob([content], { type: contentType });
    
    // Crear un enlace temporal para descargar
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Agregar al DOM, hacer clic y remover
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar el URL del objeto
    window.URL.revokeObjectURL(url);
}

// FUNCIONES DE UTILIDAD
function clearAuthToken() {
    localStorage.removeItem('authToken');
    console.log('🧹 Token de autenticación limpiado');
}

// Función global para debugging
window.clearAuthToken = clearAuthToken;
window.loadSesiones = loadSesiones;

// Función de debug completa
window.debugSesiones = async function() {
    console.log('🔍 === DEBUG COMPLETO DE SESIONES ===');
    
    // 1. Verificar BACKEND_CONFIG
    console.log('1. BACKEND_CONFIG:', BACKEND_CONFIG);
    
    // 2. Verificar localStorage
    const token = localStorage.getItem('authToken');
    console.log('2. Token en localStorage:', token ? 'Existe' : 'No existe');
    if (token) {
        console.log('   Token (primeros 50 chars):', token.substring(0, 50) + '...');
    }
    
    // 3. Probar login directo
    console.log('3. Probando login directo...');
    try {
        const loginResponse = await fetch(`${BACKEND_CONFIG.BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'emmanuelbasto10@gmail.com',
                password: 'admin123'
            })
        });
        
        console.log('   Login response status:', loginResponse.status);
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('   Login exitoso, token obtenido:', loginData.token ? 'Sí' : 'No');
            
            // 4. Probar API con el token
            console.log('4. Probando API con token...');
            const apiResponse = await fetch(`${BACKEND_CONFIG.BASE_URL}/admin/sesiones`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${loginData.token}`
                }
            });
            
            console.log('   API response status:', apiResponse.status);
            if (apiResponse.ok) {
                const apiData = await apiResponse.json();
                console.log('   ✅ API exitosa, sesiones encontradas:', apiData.sesiones?.length || 0);
                console.log('   Sesiones:', apiData.sesiones);
            } else {
                const errorText = await apiResponse.text();
                console.error('   ❌ API falló:', errorText);
            }
        } else {
            const errorText = await loginResponse.text();
            console.error('   ❌ Login falló:', errorText);
        }
    } catch (error) {
        console.error('   ❌ Error en debug:', error);
    }
    
    console.log('🔍 === FIN DEBUG ===');
};

async function getAuthToken() {
    // Primero intentar obtener del localStorage
    let token = localStorage.getItem('authToken');
    
    if (!token) {
        console.log('No hay token en localStorage, haciendo login automático...');
        try {
            // Hacer login automático con credenciales de admin
            const response = await fetch(`${BACKEND_CONFIG.BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'emmanuelbasto10@gmail.com',
                    password: 'admin123'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                token = data.token;
                localStorage.setItem('authToken', token);
                console.log('✅ Login automático exitoso, token guardado');
            } else {
                const errorText = await response.text();
                console.error('❌ Error en login automático:', response.status, errorText);
                throw new Error(`Login falló: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error obteniendo token:', error);
            throw new Error('No se pudo obtener token de autenticación');
        }
    } else {
        console.log('✅ Token encontrado en localStorage');
    }
    
    return token;
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getInitials(fullName) {
    if (!fullName) return 'AS';
    
    const words = fullName.trim().split(' ');
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    } else {
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }
}

function showLoading(element) {
    element.innerHTML = `
        <tr>
            <td colspan="7" class="loading">
                <div class="loading-spinner"></div>
                <span>Cargando usuarios...</span>
            </td>
        </tr>
    `;
}

function showError(element, message) {
    element.innerHTML = `
        <tr>
            <td colspan="7" class="error">
                <div class="error-icon">⚠️</div>
                <div class="error-message">${message}</div>
                <button class="btn btn-primary" onclick="loadUsuarios()">Reintentar</button>
            </td>
        </tr>
    `;
}

// FUNCIONES DE PERFIL DEL ADMINISTRADOR
function loadAdminProfile() {
    // Conectar con el backend para obtener datos del administrador
    if (typeof BackendAPI !== 'undefined' && BackendAPI.getStudentProfile) {
        BackendAPI.getStudentProfile()
            .then(profile => {
                updateAdminWelcomeMessage(profile);
                updateAdminAvatar(profile);
                
                // Guardar en localStorage para persistencia
                localStorage.setItem('adminData', JSON.stringify(profile));
            })
            .catch(error => {
                console.error('Error cargando perfil del administrador:', error);
                loadFallbackAdminData();
            });
    } else {
        loadFallbackAdminData();
    }
}

function loadFallbackAdminData() {
    const adminProfile = {
        firstName: 'Administrador',
        lastName: 'Sistema',
        email: '',
        role: 'admin'
    };
    
    updateAdminWelcomeMessage(adminProfile);
    updateAdminAvatar(adminProfile);
    localStorage.setItem('adminData', JSON.stringify(adminProfile));
}

function updateAdminWelcomeMessage(profile) {
    const welcomeEl = document.getElementById('adminWelcomeName');
    if (welcomeEl) {
        const fullName = profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
        welcomeEl.textContent = fullName || 'Administrador';
    }
}

function updateAdminAvatar(profile) {
    const avatarInitials = document.getElementById('adminInitials');
    if (avatarInitials) {
        const firstName = profile.firstName || '';
        const lastName = profile.lastName || '';
        const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'AD';
        avatarInitials.textContent = initials;
    }

    const userNameEl = document.querySelector('.user-name');
    if (userNameEl) {
        const fullName = profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
        userNameEl.textContent = fullName || 'Administrador';
    }
}

function loadAdminProfileData() {
    // TODO: Implementar llamada al backend para obtener datos detallados del perfil
    // Endpoint sugerido: GET /api/admin/profile/details
    
    const profileContent = document.querySelector('.profile-content');
    if (profileContent) {
        profileContent.innerHTML = '';
    }
}

function editProfile() {
    console.log('Editando perfil del administrador');
}

function changePassword() {
    console.log('Cambiando contraseña del administrador');
}

// FUNCIONES DE COMUNICACIÓN CON BACKEND
function setupCommunicationSystem() {
    // Configurar comunicación con el backend
    console.log('Sistema de comunicación configurado');
}

// FUNCIONES AUXILIARES
function showNotification(message, type = 'info') {
    // Crear elemento de notificación con estilo de barra de estado
    const notification = document.createElement('div');
    notification.className = `status-bar`;
    notification.innerHTML = `
        <div class="status-icon">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
        </div>
        <div class="status-text">${message}</div>
        <button class="status-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Verificar si hay un modal abierto para posicionar la notificación arriba
    const modal = document.querySelector('.modal[style*="block"]');
    if (modal) {
        // Agregar clase para notificación arriba del modal
        notification.classList.add('modal-notification');
        // Insertar arriba del modal
        modal.parentNode.insertBefore(notification, modal);
    } else {
        // Posición normal si no hay modal
        document.body.appendChild(notification);
    }
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
    
    console.log(`${type.toUpperCase()}: ${message}`);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function showLoading(element) {
    if (element) {
        element.innerHTML = `
            <tr>
                <td colspan="5" class="loading">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <span>Cargando materias...</span>
                </td>
            </tr>
        `;
    }
}

function hideLoading(element, content) {
    if (element) {
        element.innerHTML = content;
    }
}

// FUNCIONES DE UTILIDAD
function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES');
}

function formatTime(time) {
    return time.substring(0, 5);
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 8;
}

// Cerrar modales al hacer clic fuera (solo en el fondo, no en el contenido)
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        // Solo cerrar si se hace clic directamente en el modal (fondo), no en su contenido
        if (e.target === e.currentTarget) {
            e.target.style.display = 'none';
        }
    }
});

// Manejar tecla Escape para cerrar modales
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });
    }
});


