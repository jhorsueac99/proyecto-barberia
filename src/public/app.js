const form = document.getElementById('reservationForm');
const serviceSelect = document.getElementById('serviceId');
const statusBox = document.getElementById('status');
const reservationsList = document.getElementById('reservationsList');
const adminPanel = document.getElementById('adminPanel');
const adminButton = document.getElementById('adminButton');
const downloadCsvButton = document.getElementById('downloadCsvButton');
let adminPin = '';

function renderStatus(message, ok = true) {
  statusBox.textContent = message;
  statusBox.className = `rounded-2xl px-4 py-3 text-sm font-medium ${ok ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`;
  statusBox.classList.remove('hidden');
}

function adminHeaders() {
  return adminPin ? { 'x-admin-pin': adminPin } : {};
}

function formatDate(value) {
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' }).format(new Date(value));
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
  const response = await fetch('/api/reservations', { headers: adminHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudieron cargar las reservas.');
  reservationsList.innerHTML = '';
  if (!data.reservations.length) {
    reservationsList.innerHTML = '<p class="rounded-2xl bg-slate-800/80 px-4 py-6 text-sm text-slate-300">No hay reservas registradas.</p>';
    return;
  }
  const table = document.createElement('table');
  table.className = 'min-w-full divide-y divide-white/10 text-left text-sm text-slate-200';
  table.innerHTML = '<thead class="bg-slate-800/90 text-xs uppercase tracking-[0.2em] text-slate-400"><tr><th class="px-4 py-3">ID</th><th class="px-4 py-3">Cliente</th><th class="px-4 py-3">Servicio</th><th class="px-4 py-3">Inicio</th><th class="px-4 py-3">Estado</th><th class="px-4 py-3 text-right">Acción</th></tr></thead><tbody class="divide-y divide-white/10 bg-slate-900/60"></tbody>';
  const tbody = table.querySelector('tbody');
  data.reservations.forEach((reservation) => {
    const row = document.createElement('tr');
    const isCancelled = reservation.status === 'cancelled';
    const isConfirmed = reservation.status === 'confirmed';
    row.className = 'hover:bg-white/5';
    row.innerHTML = `<td class="px-4 py-3 font-medium text-slate-100">${reservation.id}</td><td class="px-4 py-3">${reservation.customer_name}</td><td class="px-4 py-3">${reservation.service_name}</td><td class="px-4 py-3">${formatDate(reservation.start_iso)}</td><td class="px-4 py-3"><span class="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold ${isCancelled ? 'text-rose-300' : isConfirmed ? 'text-emerald-300' : 'text-amber-300'}">${reservation.status}</span></td><td class="px-4 py-3"><div class="flex justify-end gap-2">${!isConfirmed && !isCancelled ? `<button data-id="${reservation.id}" data-action="confirm" class="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300">Confirmar</button>` : ''}${!isCancelled ? `<button data-id="${reservation.id}" data-action="cancel" class="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300">Cancelar</button>` : ''}</div></td>`;
    tbody.appendChild(row);
  });
  reservationsList.appendChild(table);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const customerName = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const localDateTime = document.getElementById('startIso').value;
  const startIso = localDateTime ? new Date(localDateTime).toISOString() : '';
  const response = await fetch('/api/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerName, phone, serviceId: Number(serviceSelect.value), startIso }) });
  const data = await response.json();
  if (!response.ok) return renderStatus(data.error || 'No se pudo crear la reserva.', false);
  renderStatus(`Reserva creada con ID ${data.reservation.id}.`);
  form.reset();
  if (!adminPanel.classList.contains('hidden')) await loadReservations();
});

adminButton.addEventListener('click', async () => {
  adminPin = window.prompt('Ingresa el PIN de administrador:') || '';
  try {
    await loadReservations();
    adminPanel.classList.remove('hidden');
    adminButton.textContent = 'Panel abierto';
    adminButton.disabled = true;
  } catch (error) {
    renderStatus(error.message, false);
  }
});

reservationsList.addEventListener('click', async (event) => {
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

document.getElementById('startIso').min = new Date().toISOString().slice(0, 16);
document.addEventListener('DOMContentLoaded', () => loadServices().catch(() => renderStatus('No se pudieron cargar los servicios.', false)));
