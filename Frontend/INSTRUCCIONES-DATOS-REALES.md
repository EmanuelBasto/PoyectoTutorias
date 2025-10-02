# 🎯 Instrucciones para Probar con Datos Reales

## 🚀 Objetivo
Probar que cuando un **tutor logueado** configura su disponibilidad, cualquier **alumno logueado** puede encontrarlo usando los mismos datos.

## 📋 Pasos para Probar

### **Paso 1: Configurar Usuarios de Prueba**

1. **Abrir**: `Frontend/simular-login-usuarios.html`
2. **Hacer clic en**: "Crear Usuarios de Prueba"
3. **Verificar** que se crearon:
   - **Dr. Carlos Mendoza** (Tutor - Matemáticas)
   - **Dra. Ana López** (Tutor - Física)
   - **María González** (Alumna)
   - **Juan Pérez** (Alumno)

### **Paso 2: Simular Login del Tutor**

1. **En la misma página**, hacer clic en **"Iniciar Sesión"** para **Dr. Carlos Mendoza**
2. **Verificar** que aparece como "activo" (tarjeta verde)
3. **Abrir nueva pestaña**: `Frontend/Interfaces/tutores/Tutores.html`
4. **Verificar** que el tutor está logueado (debería mostrar "Dr. Carlos Mendoza")

### **Paso 3: Configurar Disponibilidad del Tutor**

1. **En la interfaz de tutores**, ir a **"Gestión de Horarios"**
2. **Hacer clic en**: "Configurar Disponibilidad"
3. **Completar el formulario** con datos específicos:
   - **Fecha**: Mañana (fecha futura)
   - **Materia**: Matemáticas
   - **Hora de Inicio**: 10:00
   - **Hora de Fin**: 11:00
   - **Modalidad**: Presencial
4. **Hacer clic en**: "Guardar Disponibilidad"
5. **Verificar** que aparece en "Disponibilidades Actuales"

### **Paso 4: Simular Login del Alumno**

1. **Volver a**: `Frontend/simular-login-usuarios.html`
2. **Hacer clic en**: "Iniciar Sesión" para **María González**
3. **Verificar** que aparece como "activa" (tarjeta verde)
4. **Abrir nueva pestaña**: `Frontend/Interfaces/alumnos/Alumnos.html`
5. **Verificar** que la alumna está logueada

### **Paso 5: Buscar Tutores como Alumno**

1. **En la interfaz de alumnos**, ir a **"Buscar Tutores"**
2. **Completar el formulario** con **exactamente los mismos datos** que configuró el tutor:
   - **Fecha**: La misma fecha que configuró el tutor
   - **Materia**: Matemáticas (la misma materia)
   - **Hora de Inicio**: 10:00 (la misma hora)
   - **Hora de Fin**: 11:00 (la misma hora)
   - **Modalidad**: Presencial (la misma modalidad)
3. **Hacer clic en**: "Buscar Tutores Disponibles"

### **Paso 6: Verificar Resultados**

✅ **Resultado Esperado:**
- Debe aparecer **Dr. Carlos Mendoza** en los resultados
- Debe mostrar la información correcta del tutor
- Debe tener botones "Solicitar Sesión" y "Ver Horarios"

❌ **Si no aparece:**
- Verificar que los datos coincidan exactamente
- Revisar la consola del navegador
- Verificar que el tutor está logueado

## 🔧 Datos de Prueba Creados

### **Usuarios:**
- **Dr. Carlos Mendoza** (Tutor - Matemáticas)
- **Dra. Ana López** (Tutor - Física)
- **María González** (Alumna)
- **Juan Pérez** (Alumno)

### **Disponibilidades Pre-configuradas:**
- **Dr. Carlos Mendoza**: Mañana 10:00-11:00 (Matemáticas, Presencial)
- **Dr. Carlos Mendoza**: Mañana 14:00-15:30 (Matemáticas, Virtual)
- **Dra. Ana López**: Mañana 16:00-17:00 (Física, Presencial)

## 🧪 Casos de Prueba

### **Caso 1: Búsqueda Exacta**
- **Tutor configura**: Fecha mañana, Matemáticas, 10:00-11:00, Presencial
- **Alumno busca**: Fecha mañana, Matemáticas, 10:00-11:00, Presencial
- **Resultado**: ✅ Debe encontrar al tutor

### **Caso 2: Búsqueda con Datos Diferentes**
- **Tutor configura**: Fecha mañana, Matemáticas, 10:00-11:00, Presencial
- **Alumno busca**: Fecha mañana, Matemáticas, 14:00-15:00, Presencial
- **Resultado**: ❌ No debe encontrar al tutor (horarios diferentes)

### **Caso 3: Búsqueda con Materia Diferente**
- **Tutor configura**: Fecha mañana, Matemáticas, 10:00-11:00, Presencial
- **Alumno busca**: Fecha mañana, Física, 10:00-11:00, Presencial
- **Resultado**: ❌ No debe encontrar al tutor (materia diferente)

## 🔍 Verificación de Datos

Para verificar que los datos están correctos:

1. **Abrir consola del navegador** (F12)
2. **Ejecutar estos comandos**:

```javascript
// Ver usuarios creados
console.log('Usuarios:', JSON.parse(localStorage.getItem('usuarios') || '[]'));

// Ver disponibilidades creadas
console.log('Disponibilidades:', JSON.parse(localStorage.getItem('tutorAvailability') || '[]'));

// Ver usuario logueado
console.log('Usuario logueado:', JSON.parse(localStorage.getItem('userSession') || '{}'));
```

## 🎯 Flujo Completo

1. **Tutor logueado** → Configura disponibilidad → Datos se guardan con su información real
2. **Alumno logueado** → Busca tutores → Encuentra disponibilidades de tutores reales
3. **Sistema** → Coincide datos exactos → Muestra resultados correctos

## ✅ Criterios de Éxito

La integración funciona correctamente si:

1. ✅ **Tutor logueado** puede configurar disponibilidad
2. ✅ **Datos se guardan** con información real del tutor
3. ✅ **Alumno logueado** puede buscar tutores
4. ✅ **Búsqueda encuentra** tutores con disponibilidades exactas
5. ✅ **Formulario se pre-llena** con datos del tutor seleccionado
6. ✅ **Sistema funciona** con usuarios reales logueados

## 🚀 Resultado Final

Con esta implementación:

- **Tutores reales** configuran disponibilidad con sus datos
- **Alumnos reales** buscan tutores usando los mismos campos
- **Sistema** encuentra coincidencias exactas automáticamente
- **Experiencia** es fluida con usuarios logueados

¡La integración con datos reales está completa y lista para usar! 🎉

