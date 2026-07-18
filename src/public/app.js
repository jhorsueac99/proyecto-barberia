const form = document.getElementById('reservationForm');
const serviceSelect = document.getElementById('serviceId');
const statusBox = document.getElementById('status');
const reservationsList = document.getElementById('reservationsList');

function renderStatus(message, ok = true) {
  statusBox.textContent = message;
  statusBox.style.color = ok ? 'green' : 'red';
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
    reservationsList.innerHTML = '<p>No hay reservas registradas.</p>';
    return;
  }

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>ID</th>
        <th>Cliente</th>
        <th>Servicio</th>
        <th>Inicio</th>
        <th>Estado</th>
        <th>Acción</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');

  data.reservations.forEach((reservation) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${reservation.id}</td>
      <td>${reservation.customer_name}</td>
      <td>${reservation.service_id}</td>
      <td>${reservation.start_iso}</td>
      <td>${reservation.status}</td>
      <td>
        <button data-id="${reservation.id}" data-action="confirm">Confirmar</button>
        <button data-id="${reservation.id}" data-action="cancel">Cancelar</button>
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
    console.error('Error inicializando frontend', error);
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
