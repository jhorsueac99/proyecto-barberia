function setFieldIcon(iconId, valid, isEmpty) {
  const icon = document.getElementById(iconId);
  if (isEmpty) {
    icon.textContent = '';
    icon.className = 'field-icon';
    return;
  }
  icon.textContent = valid ? '✅' : '❌';
  icon.className = valid ? 'field-icon valid-icon' : 'field-icon invalid-icon';
}

function validateName() {
  const value = document.getElementById('nombre').value.trim();
  setFieldIcon('nombre-icon', value.length >= 3, value.length === 0);
}

function validatePhone() {
  const value = document.getElementById('telefono').value.trim();
  setFieldIcon('telefono-icon', /^\d{9,}$/.test(value), value.length === 0);
}

function validateTelegram() {
  const value = document.getElementById('telegramUsername').value.trim();
  setFieldIcon('telegramUsername-icon', /^@[A-Za-z0-9_]{4,}$/.test(value), value.length === 0);
}

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
  const telegramUsernameInput = document.getElementById('telegramUsername');
  let adminPin = '';
  let isAdmin = false;

  async function loadTelegramConfig() {
    try {
      const res = await fetch('/api/telegram/config');
      const data = await res.json();
      const username = (data.username || 'Charapita_bot').replace(/^@/, '');
      const link = document.getElementById('telegramBotLink');
      if (link) link.href = `https://t.me/${username}`;
    } catch (err) {
      console.error('Error cargando configuración de Telegram', err);
    }
  }

  loadTelegramConfig();

  function currentTelegramUsername() {
    return telegramUsernameInput ? telegramUsernameInput.value.trim() : '';
  }

  function renderStatus(message, ok = true) {
    statusBox.textContent = message;
    statusBox.className = `status-msg ${ok ? 'ok' : 'err'}`;
  }

  const fechaHoraInput = document.getElementById('fechaHora');
  const shortNoticePolicy = document.getElementById('shortNoticePolicy');
  const shortNoticeAccepted = document.getElementById('shortNoticeAccepted');

  function updateShortNoticeWarning() {
    if (!fechaHoraInput.value) return;
    const diffMs = new Date(fechaHoraInput.value).getTime() - Date.now();
    const isShortNotice = diffMs < 2 * 60 * 60 * 1000;
    shortNoticePolicy.style.display = isShortNotice ? 'block' : 'none';
    if (!isShortNotice) shortNoticeAccepted.checked = false;
  }

  fechaHoraInput.addEventListener('input', updateShortNoticeWarning);
  fechaHoraInput.addEventListener('change', updateShortNoticeWarning);

  function authHeaders() {
    if (adminPin) return { 'x-admin-pin': adminPin };
    const telegramUsername = currentTelegramUsername();
    return telegramUsername ? { 'x-telegram-username': telegramUsername } : {};
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
    const response = await fetch('/api/reservations', { headers: authHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudieron cargar las reservas.');
    reservationsList.innerHTML = '';
    if (!data.reservations.length) {
      reservationsList.innerHTML = '<p class="empty-msg">No hay reservas registradas.</p>';
      return;
    }
    const table = document.createElement('table');
    table.innerHTML = '<thead><tr><th>ID</th><th>Cliente</th>' + (isAdmin ? '<th>Teléfono</th>' : '') + '<th>Servicio</th><th>Inicio</th><th>Estado</th>' + (isAdmin ? '<th>Acción</th><th>Acciones</th>' : '') + '</tr></thead><tbody></tbody>';
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
      let contactActionsHtml = '';
      if (isAdmin) {
        const phone = reservation.phone || '';
        const phoneValid = /^\d{9,}$/.test(phone);
        const telegramUsername = reservation.telegram_username || '';
        if (phoneValid) {
          contactActionsHtml += `<a href="https://wa.me/${phone}" target="_blank" rel="noopener noreferrer" class="contact-btn contact-whatsapp" title="Contactar por WhatsApp">📱 WhatsApp</a>`;
          contactActionsHtml += `<a href="tel:${phone}" class="contact-btn contact-call" title="Llamar al cliente">📞 Llamar</a>`;
        } else {
          contactActionsHtml = '<span style="font-size:0.8rem;color:#94a3b8">Teléfono no disponible</span>';
        }
        if (telegramUsername) {
          const telegramLink = telegramUsername.replace(/^@/, '');
          contactActionsHtml += `<a href="https://t.me/${telegramLink}" target="_blank" rel="noopener noreferrer" class="contact-btn contact-telegram" title="Contactar por Telegram">💬 Telegram</a>`;
        } else {
          contactActionsHtml += '<span style="font-size:0.8rem;color:#94a3b8">Telegram no disponible</span>';
        }
      }
      row.innerHTML = `<td>${reservation.id}</td><td>${reservation.customer_name}</td>${isAdmin ? `<td>${reservation.phone || ''}</td>` : ''}<td>${reservation.service_name}${reservation.service_description ? '<br><span style="font-size:0.75rem;color:#94a3b8">' + reservation.service_description + '</span>' : ''}</td><td>${formatDate(reservation.start_iso)}</td><td><span class="badge ${badgeClass}">${reservation.status}</span></td>${isAdmin ? `<td>${actionsHtml}</td><td>${contactActionsHtml}</td>` : ''}`;
      tbody.appendChild(row);
    });
    reservationsList.appendChild(table);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const customerName = document.getElementById('nombre').value.trim();
    const phone = document.getElementById('telefono').value.trim();
    const telegramUsername = currentTelegramUsername();
    const servicio = document.getElementById('servicio').value;
    const localDateTime = document.getElementById('fechaHora').value;
    const startIso = localDateTime ? new Date(localDateTime).toISOString() : '';
    if (telegramUsername && !/^@[A-Za-z0-9_]{4,}$/.test(telegramUsername)) {
      return renderStatus('El username de Telegram debe comenzar con @ (ej. @usuario).', false);
    }
    const isShortNotice = startIso && new Date(startIso).getTime() - Date.now() < 2 * 60 * 60 * 1000;
    if (isShortNotice && !shortNoticeAccepted.checked) {
      return renderStatus('Debes aceptar la política de aviso corto para continuar con la reserva.', false);
    }
    const response = await fetch('/api/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerName, phone, serviceId: servicio, startIso, telegramUsername, shortNoticeAccepted: shortNoticeAccepted.checked }) });
    const data = await response.json();
    if (!response.ok) return renderStatus(data.error || 'No se pudo crear la reserva.', false);
    renderStatus(`Reserva creada con ID ${data.reservation.id}.${data.warning ? ' ' + data.warning : ''}`);
    form.reset();
    setFieldIcon('nombre-icon', false, true);
    setFieldIcon('telefono-icon', false, true);
    setFieldIcon('telegramUsername-icon', false, true);
    shortNoticePolicy.style.display = 'none';
    shortNoticeAccepted.checked = false;
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

  function toLocalInputValue(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function nextAvailableSlot() {
    const slot = new Date(Date.now() + 60 * 60 * 1000);
    slot.setMinutes(0, 0, 0);
    while (true) {
      const day = slot.getDay();
      const hour = slot.getHours();
      const endHour = hour + 1;
      if (day === 0) {
        slot.setDate(slot.getDate() + 1);
        slot.setHours(9, 0, 0, 0);
        continue;
      }
      if (hour < 9) {
        slot.setHours(9, 0, 0, 0);
        continue;
      }
      if (endHour > 20) {
        slot.setDate(slot.getDate() + 1);
        slot.setHours(9, 0, 0, 0);
        continue;
      }
      break;
    }
    return toLocalInputValue(slot);
  }

  fechaHoraInput.min = toLocalInputValue(new Date());
  fechaHoraInput.value = nextAvailableSlot();
  updateShortNoticeWarning();
  loadServices();
  loadReservations().catch(() => {});
  setInterval(() => { loadReservations().catch(() => {}); }, 5000);
});
