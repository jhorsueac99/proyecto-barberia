document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('reservaForm');
  const statusBox = document.getElementById('status');
  const reservationsList = document.getElementById('reservationsList');
  const adminButton = document.getElementById('adminButton');
  const downloadCsvButton = document.getElementById('downloadCsvButton');
  const loginModal = document.getElementById('loginModal');
  const loginForm = document.getElementById('loginForm');
  const loginCancel = document.getElementById('loginCancel');
  const loginError = document.getElementById('loginError');
  let adminPin = '';
  let isAdmin = false;

  function renderStatus(message, ok = true) {
    statusBox.textContent = message;
    statusBox.className = `status-msg ${ok ? 'ok' : 'err'}`;
  }

  function adminHeaders() {
    return adminPin ? { 'x-admin-pin': adminPin } : {};
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' }).format(new Date(value));
  }

  async function loadServices() {
    try {
      const res = await fetch('/api/services');
      const services = await res.json();
      const select = document.getElementById('servicio');
      select.innerHTML = '<option value="">-- Selecciona un servicio --</option>';
      if (Array.isArray(services)) {
        services.forEach(s => {
          const opt = document.createElement('option');
          opt.value = s.id;
          opt.textContent = `${s.name} (S/${s.price}) - ${s.description || ''}`;
          select.appendChild(opt);
        });
      } else {
        console.error('Respuesta inválida de /api/services:', services);
      }
    } catch (err) {
      console.error('Error cargando servicios', err);
    }
  }

  async function loadReservations() {
    const response = await fetch('/api/reservations', { headers: adminHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudieron cargar las reservas.');
    reservationsList.innerHTML = '';
    if (!data.reservations.length) {
      reservationsList.innerHTML = '<p class="empty-msg">No hay reservas registradas.</p>';
      return;
    }
    const table = document.createElement('table');
    table.innerHTML = '<thead><tr><th>ID</th><th>Cliente</th><th>Servicio</th><th>Inicio</th><th>Estado</th>' + (isAdmin ? '<th>Acción</th>' : '') + '</tr></thead><tbody></tbody>';
    const tbody = table.querySelector('tbody');
    data.reservations.forEach((reservation) => {
      const row = document.createElement('tr');
      const isCancelled = reservation.status === 'cancelled';
      const isConfirmed = reservation.status === 'confirmed';
      const badgeClass = isCancelled ? 'cancelled' : isConfirmed ? 'confirmed' : 'pending';
      let actionsHtml = '';
      if (isAdmin) {
        if (!isConfirmed && !isCancelled) actionsHtml += `<button data-id="${reservation.id}" data-action="confirm" class="action-btn confirm">Confirmar</button>`;
        if (!isCancelled) actionsHtml += `<button data-id="${reservation.id}" data-action="cancel" class="action-btn cancel">Cancelar</button>`;
      }
      row.innerHTML = `<td>${reservation.id}</td><td>${reservation.customer_name}</td><td>${reservation.service_name}${reservation.service_description ? '<br><span style="font-size:0.75rem;color:#94a3b8">' + reservation.service_description + '</span>' : ''}</td><td>${formatDate(reservation.start_iso)}</td><td><span class="badge ${badgeClass}">${reservation.status}</span></td>${isAdmin ? `<td>${actionsHtml}</td>` : ''}`;
      tbody.appendChild(row);
    });
    reservationsList.appendChild(table);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const customerName = document.getElementById('nombre').value.trim();
    const phone = document.getElementById('telefono').value.trim();
    const email = document.getElementById('correo').value.trim();
    const servicio = document.getElementById('servicio').value;
    const localDateTime = document.getElementById('fechaHora').value;
    const startIso = localDateTime ? new Date(localDateTime).toISOString() : '';
    const response = await fetch('/api/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerName, phone, email, serviceId: servicio, startIso }) });
    const data = await response.json();
    if (!response.ok) return renderStatus(data.error || 'No se pudo crear la reserva.', false);
    renderStatus(`Reserva creada con ID ${data.reservation.id}.`);
    form.reset();
    await loadReservations();
  });

  adminButton.addEventListener('click', () => {
    loginError.classList.remove('show');
    loginForm.reset();
    loginModal.classList.add('active');
    document.getElementById('username').focus();
  });

  loginCancel.addEventListener('click', () => {
    loginModal.classList.remove('active');
  });

  loginModal.addEventListener('click', (event) => {
    if (event.target === loginModal) loginModal.classList.remove('active');
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!data.success) {
        loginError.textContent = 'Credenciales incorrectas.';
        loginError.classList.add('show');
        return;
      }
      adminPin = password;
      isAdmin = true;
      loginModal.classList.remove('active');
      downloadCsvButton.style.display = '';
      adminButton.textContent = 'Administrador autenticado';
      adminButton.disabled = true;
      await loadReservations();
    } catch (error) {
      loginError.textContent = 'Error al conectar con el servidor.';
      loginError.classList.add('show');
    }
  });

  reservationsList.addEventListener('click', async (event) => {
    if (!isAdmin) return;
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    const id = button.dataset.id;
    const action = button.dataset.action;
    if (action === 'cancel' && !window.confirm(`¿Deseas cancelar la reserva ${id}?`)) return;
    const response = await fetch(`/api/reservations/${id}`, { method: action === 'confirm' ? 'PATCH' : 'DELETE', headers: adminHeaders() });
    const data = await response.json();
    if (!response.ok) return renderStatus(data.error || 'No se pudo actualizar la reserva.', false);
    renderStatus(action === 'confirm' ? `Reserva ${id} confirmada.` : `Reserva ${id} cancelada.`);
    await loadReservations();
  });

  downloadCsvButton.addEventListener('click', async () => {
    const response = await fetch('/api/reservations/export', { headers: adminHeaders() });
    if (!response.ok) return renderStatus('No se pudo descargar el CSV.', false);
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url; link.download = 'reservations.csv'; link.click(); URL.revokeObjectURL(url);
  });

  document.getElementById('fechaHora').min = new Date().toISOString().slice(0, 16);
  loadServices();
  loadReservations().catch(() => {});
  setInterval(() => { loadReservations().catch(() => {}); }, 5000);
});
