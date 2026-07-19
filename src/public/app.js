const form = document.getElementById('reservationForm');
const serviceSelect = document.getElementById('serviceId');
const statusBox = document.getElementById('status');
const reservationsList = document.getElementById('reservationsList');
const downloadCsvButton = document.getElementById('downloadCsvButton');

function renderStatus(message, ok = true) {
  statusBox.textContent = message;
  statusBox.className = `rounded-2xl px-4 py-3 text-sm font-medium ${ok ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`;
  statusBox.classList.remove('hidden');
}

async function loadServices() {
  const response = await fetch('/api/services');
  const data = await response.json();
  serviceSelect.innerHTML = '';

  data.services.forEach((service) => {
    const option = document.createElement('option');
    option.value = service.id;
    option.textContent = `${service.name} (${service.duration_minutes} min)`;
    serviceSelect.appendChild(option);
  });
}

async function loadReservations() {
  const response = await fetch('/api/reservations');
  const data = await response.json();
  reservationsList.innerHTML = '';

  if (!data.reservations.length) {
    reservationsList.innerHTML = '<p class="rounded-2xl bg-slate-800/80 px-4 py-6 text-sm text-slate-300">No hay reservas registradas.</p>';
    return;
  }

  const table = document.createElement('table');
  table.className = 'min-w-full divide-y divide-white/10 text-left text-sm text-slate-200';
  table.innerHTML = `
    <thead class="bg-slate-800/90 text-xs uppercase tracking-[0.2em] text-slate-400">
      <tr>
        <th class="px-4 py-3">ID</th>
        <th class="px-4 py-3">Cliente</th>
        <th class="px-4 py-3">Servicio</th>
        <th class="px-4 py-3">Inicio</th>
        <th class="px-4 py-3">Estado</th>
        <th class="px-4 py-3 text-right">Acción</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-white/10 bg-slate-900/60"></tbody>
  `;

  const tbody = table.querySelector('tbody');

  data.reservations.forEach((reservation) => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-white/5';
    row.innerHTML = `
      <td class="px-4 py-3 font-medium text-slate-100">${reservation.id}</td>
      <td class="px-4 py-3 text-slate-200">${reservation.customer_name}</td>
      <td class="px-4 py-3 text-slate-300">${reservation.service_id}</td>
      <td class="px-4 py-3 text-slate-300">${reservation.start_iso}</td>
      <td class="px-4 py-3">
        <span class="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-amber-300">${reservation.status}</span>
      </td>
      <td class="px-4 py-3">
        <div class="flex justify-end gap-2">
          <button data-id="${reservation.id}" data-action="confirm" class="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/30">Confirmar</button>
          <button data-id="${reservation.id}" data-action="cancel" class="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/30">Cancelar</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });

  reservationsList.appendChild(table);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const customerName = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const serviceId = Number(serviceSelect.value);
  const startIso = document.getElementById('startIso').value;

  if (!customerName || !serviceId || !startIso) {
    renderStatus('Completa nombre, servicio y fecha.', false);
    return;
  }

  if (customerName.length < 3) {
    renderStatus('El nombre debe tener al menos 3 caracteres.', false);
    return;
  }

  if (!/^\d{9,}$/.test(phone)) {
    renderStatus('El teléfono debe ser numérico y tener al menos 9 dígitos.', false);
    return;
  }

  const selectedDate = new Date(startIso);
  if (Number.isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
    renderStatus('La fecha debe ser futura y válida.', false);
    return;
  }

  const response = await fetch('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerName, phone, serviceId, startIso })
  });

  const data = await response.json();

  if (!response.ok) {
    renderStatus(data.error || 'No se pudo crear la reserva.', false);
    return;
  }

  renderStatus(`Reserva creada con ID ${data.reservation.id}.`);
  form.reset();
  await loadReservations();
});

reservationsList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-id]');
  if (!button) {
    return;
  }

  const id = button.getAttribute('data-id');
  const action = button.getAttribute('data-action');

  if (action === 'confirm') {
    const response = await fetch(`/api/reservations/${id}`, {
      method: 'PATCH'
    });
    const data = await response.json();

    if (!response.ok) {
      renderStatus(data.error || 'No se pudo confirmar la reserva.', false);
      return;
    }

    renderStatus(`Reserva ${id} confirmada.`);
    await loadReservations();
    return;
  }

  const confirmed = window.confirm(`¿Deseas cancelar la reserva ${id}?`);
  if (!confirmed) {
    return;
  }

  const response = await fetch(`/api/reservations/${id}`, {
    method: 'DELETE'
  });

  const data = await response.json();

  if (!response.ok) {
    renderStatus(data.error || 'No se pudo cancelar la reserva.', false);
    return;
  }

  renderStatus(`Reserva ${id} cancelada.`);
  await loadReservations();
});

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadServices();
    await loadReservations();
  } catch (error) {
    console.error('Error inicializando frontend - app.js:175', error);
    renderStatus('No se pudo cargar la interfaz.', false);
  }
});

window.downloadCsv = async function downloadCsv() {
  const response = await fetch('/api/reservations/export');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'reservations.csv';
  link.click();
  window.URL.revokeObjectURL(url);
};

downloadCsvButton.addEventListener('click', async () => {
  await window.downloadCsv();
});
