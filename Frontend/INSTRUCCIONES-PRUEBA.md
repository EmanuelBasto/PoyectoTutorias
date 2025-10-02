# 🧪 Instrucciones para Probar la Integración Tutor-Alumno

## 🎯 Objetivo
Verificar que cuando un **tutor** configure su disponibilidad, esa información aparezca automáticamente cuando un **alumno** busque tutores usando los **mismos campos**.

## 📋 Campos que Deben Coincidir

### **Tutor (Configurar Disponibilidad):**
- ✅ Fecha *
- ✅ Materia *
- ✅ Hora de Inicio *
- ✅ Hora de Fin *
- ✅ Modalidad *
- ✅ Duración de Sesión (calculada automáticamente)

### **Alumno (Buscar Tutores):**
- ✅ Fecha *
- ✅ Materia *
- ✅ Hora de Inicio *
- ✅ Hora de Fin *
- ✅ Modalidad *
- ✅ Duración de Sesión (calculada automáticamente)

## 🚀 Pasos para Probar

### **Paso 1: Configurar Disponibilidad del Tutor**

1. **Abrir interfaz de Tutor**: `Frontend/Interfaces/tutores/Tutores.html`
2. **Ir a "Gestión de Horarios"** en el menú lateral
3. **Hacer clic en "Configurar Disponibilidad"**
4. **Completar el formulario** con estos datos de ejemplo:
   - **Fecha**: Mañana (fecha futura)
   - **Materia**: Matemáticas
   - **Hora de Inicio**: 10:00
   - **Hora de Fin**: 11:00
   - **Modalidad**: Presencial
5. **Hacer clic en "Guardar Disponibilidad"**
6. **Verificar** que aparece en la lista de "Disponibilidades Actuales"

### **Paso 2: Buscar Tutores como Alumno**

1. **Abrir interfaz de Alumno**: `Frontend/Interfaces/alumnos/Alumnos.html`
2. **Ir a "Buscar Tutores"** en el menú lateral
3. **Completar el formulario** con los **mismos datos** que configuró el tutor:
   - **Fecha**: La misma fecha que configuró el tutor
   - **Materia**: Matemáticas (la misma materia)
   - **Hora de Inicio**: 10:00 (la misma hora)
   - **Hora de Fin**: 11:00 (la misma hora)
   - **Modalidad**: Presencial (la misma modalidad)
4. **Hacer clic en "Buscar Tutores Disponibles"**

### **Paso 3: Verificar Resultados**

✅ **Resultado Esperado:**
- Debe aparecer el tutor que configuró la disponibilidad
- Debe mostrar la información correcta (nombre, materia, horario)
- Debe tener botones "Solicitar Sesión" y "Ver Horarios"

❌ **Si no aparece ningún tutor:**
- Verificar que los datos coincidan exactamente
- Revisar la consola del navegador para errores
- Verificar que se crearon los datos de ejemplo

## 🔧 Datos de Ejemplo Automáticos

El sistema crea automáticamente datos de ejemplo si no existen:

### **Tutores Creados:**
- **Dr. Carlos Mendoza** (Matemáticas)
- **Dra. Ana López** (Física)  
- **Prof. María García** (Química)

### **Disponibilidades Creadas:**
- **Dr. Carlos Mendoza**: Mañana 10:00-11:00 (Matemáticas, Presencial)
- **Dr. Carlos Mendoza**: Mañana 14:00-15:30 (Matemáticas, Virtual)
- **Dra. Ana López**: Mañana 16:00-17:00 (Física, Presencial)
- **Prof. María García**: Mañana 09:00-10:00 (Química, Virtual)

## 🧪 Casos de Prueba

### **Caso 1: Búsqueda Exacta**
- **Configurar**: Tutor con fecha mañana, Matemáticas, 10:00-11:00, Presencial
- **Buscar**: Alumno con fecha mañana, Matemáticas, 10:00-11:00, Presencial
- **Resultado**: ✅ Debe encontrar el tutor

### **Caso 2: Búsqueda con Filtros Diferentes**
- **Configurar**: Tutor con fecha mañana, Matemáticas, 10:00-11:00, Presencial
- **Buscar**: Alumno con fecha mañana, Matemáticas, 14:00-15:00, Presencial
- **Resultado**: ❌ No debe encontrar el tutor (horarios diferentes)

### **Caso 3: Búsqueda con Materia Diferente**
- **Configurar**: Tutor con fecha mañana, Matemáticas, 10:00-11:00, Presencial
- **Buscar**: Alumno con fecha mañana, Física, 10:00-11:00, Presencial
- **Resultado**: ❌ No debe encontrar el tutor (materia diferente)

## 🐛 Solución de Problemas

### **Problema**: No aparecen tutores
**Solución**: 
1. Abrir consola del navegador (F12)
2. Verificar que se crearon los datos de ejemplo
3. Verificar que los filtros coinciden exactamente

### **Problema**: Error en cálculo de duración
**Solución**:
1. Verificar que la hora de fin sea mayor que la de inicio
2. El sistema calcula automáticamente la duración

### **Problema**: Datos no se sincronizan
**Solución**:
1. Recargar la página del alumno
2. Verificar que localStorage tiene los datos correctos

## 📊 Verificación de Datos

Para verificar que los datos están correctos:

1. **Abrir consola del navegador** (F12)
2. **Ejecutar estos comandos**:

```javascript
// Ver tutores creados
console.log('Tutores:', JSON.parse(localStorage.getItem('usuarios') || '[]'));

// Ver disponibilidades creadas
console.log('Disponibilidades:', JSON.parse(localStorage.getItem('tutorAvailability') || '[]'));
```

## ✅ Criterios de Éxito

La integración funciona correctamente si:

1. ✅ **Los campos coinciden**: Tutor y alumno usan los mismos campos
2. ✅ **Búsqueda funciona**: Alumno encuentra tutores con disponibilidades exactas
3. ✅ **Datos se sincronizan**: Cambios del tutor aparecen en búsqueda del alumno
4. ✅ **Formulario se pre-llena**: Al seleccionar tutor, el formulario se completa automáticamente
5. ✅ **Validaciones funcionan**: Sistema valida campos requeridos y horarios lógicos

## 🎉 Resultado Final

Con esta integración, el sistema ahora funciona como una plataforma unificada donde:

- **Tutores** configuran disponibilidad con campos específicos
- **Alumnos** buscan tutores usando los mismos campos
- **Sistema** encuentra coincidencias exactas automáticamente
- **Experiencia** es fluida y sin errores

¡La integración está completa y lista para usar! 🚀

