document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = window.API_BASE || 'http://localhost:4000';

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const tokenField = document.getElementById('tokenField');
  const msg = document.getElementById('msg');
  const form = document.getElementById('resetForm');
  const submitBtn = form?.querySelector('button[type="submit"]') || form?.querySelector('button');

  if (!msg) {
    console.error('[reset] No existe <div id="msg"> en el HTML.');
  }

  if (!token) {
    if (msg) { msg.style.color = 'crimson'; msg.textContent = 'Token no proporcionado. Revisa el enlace del correo.'; }
    console.warn('[reset] No token param in URL');
    return;
  }
  if (tokenField) tokenField.value = token;

  // ---- Validación previa del token ----
  (async () => {
    try {
      const url = `${API_BASE}/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`;
      console.log('[reset] Validating token:', url);
      const res = await fetch(url, { method: 'GET' });

      let data = null;
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('application/json')) data = await res.json();
      else {
        const raw = await res.text();
        try { data = JSON.parse(raw); } catch { data = { raw }; }
      }

      console.log('[reset] validate response', res.status, data);

      if (!res.ok || !data?.ok) {
        if (msg) { msg.style.color = 'crimson'; msg.textContent = data?.message || 'Token inválido o expirado.'; }
        if (submitBtn) submitBtn.disabled = true;
      }
    } catch (e) {
      console.error('[reset] Error validating token (frontend pre-check):', e);
      // No bloqueamos aquí; el submit vuelve a validar en backend
    }
  })();

  // ---- Submit para cambiar contraseña ----
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword')?.value?.trim() || '';
    const confirm = document.getElementById('confirmPassword')?.value?.trim() || '';

    if (!newPassword || !confirm) {
      if (msg) { msg.style.color = 'crimson'; msg.textContent = 'Completa ambos campos.'; }
      return;
    }
    if (newPassword !== confirm) {
      if (msg) { msg.style.color = 'crimson'; msg.textContent = 'Contraseñas no coinciden'; }
      return;
    }

    try {
      const url = `${API_BASE}/api/auth/reset-password`;
      console.log('[reset] POST', url);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword })
      });

      let data = null;
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('application/json')) data = await res.json();
      else {
        const raw = await res.text();
        try { data = JSON.parse(raw); } catch { data = { raw }; }
      }

      console.log('[reset] reset-password response', res.status, data);

      if (!res.ok) {
        if (msg) { msg.style.color = 'crimson'; msg.textContent = data?.message || `Error ${res.status}`; }
      } else {
        if (msg) { msg.style.color = 'green'; msg.textContent = 'Contraseña actualizada correctamente.'; }
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
      }
    } catch (err) {
      console.error('[reset] Network/Fetch error:', err);
      if (msg) { msg.style.color = 'crimson'; msg.textContent = 'Error de conexión'; }
    }
  });

  // ---- Ojitos mostrar/ocultar ----
  document.addEventListener('mousedown', (ev) => {
    const btn = ev.target.closest('.toggle-eye');
    if (btn) ev.preventDefault(); // mantener foco en input
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
    btn.setAttribute('aria-pressed', String(isHidden));
  });
});








