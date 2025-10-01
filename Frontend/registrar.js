const API_BASE = 'http://localhost:4000'; // ajusta si tu backend está en otra URL/puerto

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const submitBtn = document.getElementById('submitBtn');
  const msgDiv = document.getElementById('msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMsg();

    const nombre_completo = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('newPassword').value;           // <-- OJO: ver nota abajo
    const confirmPassword = document.getElementById('confirmPassword').value;
    const rolSeleccionado = document.getElementById('rolSelect').value; // 'alumno' o 'tutor'

    // Validaciones básicas cliente
    if (!nombre_completo || !email || !password || !confirmPassword || !rolSeleccionado) {
      return showMsg('Por favor completa todos los campos.', true);
    }
    if (password !== confirmPassword) {
      return showMsg('Las contraseñas no coinciden.', true);
    }
    if (password.length < 6) {
      return showMsg('La contraseña debe tener al menos 6 caracteres.', true);
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Registrando...';

    try {
      // Enviar en texto plano (HTTPS) y que el backend haga bcrypt
      const payload = {
        nombre_completo,
        email,
        password,
        rol: rolSeleccionado,
        estado: 'activo'
      };

      console.log('[Frontend] Enviando payload de registro:', { ...payload, password: '***' });

      const resp = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await safeJson(resp);
      console.log('[Frontend] Respuesta registro:', resp.status, data);

      if (!resp.ok) {
        if (data && data.missing) {
          return showMsg('Datos incompletos. Faltan: ' + data.missing.join(', '), true);
        }
        const serverMsg = data?.message || `Error ${resp.status}`;
        return showMsg('Error: ' + serverMsg, true);
      }

      const user = data?.user;
      const matricula = user?.matricula || '---';
      showMsg(`✅ Usuario creado correctamente. Matrícula: ${matricula}`, false);
      form.reset();

    } catch (err) {
      console.error('[Frontend] Error en registro:', err);
      showMsg('Error inesperado. Revisa la consola y el servidor.', true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Registrarse';
    }
  });

  // Helpers
  function showMsg(text, isError = false) {
    msgDiv.textContent = text;
    msgDiv.style.color = isError ? 'crimson' : 'green';
  }
  function clearMsg() {
    msgDiv.textContent = '';
  }
  async function safeJson(response) {
    try { return await response.json(); } catch { return null; }
  }

  // ====== Ojitos para mostrar/ocultar contraseña ======
  // Edge (Chromium) ya trae un ojo nativo. Para evitar duplicado, ocultamos el personalizado solo en Edge.
  const isEdge = /\bEdg\//.test(navigator.userAgent);
  if (isEdge) {
    document.querySelectorAll('.toggle-eye').forEach(btn => { btn.style.display = 'none'; });
  } else {
    // Delegación: funciona aunque el botón se renderice después
    document.addEventListener('mousedown', (ev) => {
      const btn = ev.target.closest('.toggle-eye');
      if (btn) ev.preventDefault(); // no pierdas foco del input
    });
    document.addEventListener('click', (ev) => {
      const btn = ev.target.closest('.toggle-eye');
      if (!btn) return;
      const id = btn.getAttribute('data-target');
      const input = document.getElementById(id);
      if (!input) return;
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.classList.toggle('revealed', isHidden);
    });
  }
});
