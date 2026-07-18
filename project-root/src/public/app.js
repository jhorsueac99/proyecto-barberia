async function loadServices() {
  // simple: fetch from server? we didn't expose endpoint for services; show sample
  document.getElementById('services').innerText = '1: Corte clásico (30m) - 2: Corte + Barba (45m)';
}
loadServices();

document.getElementById('bookingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const serviceId = Number(document.getElementById('serviceId').value);
  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const startLocal = document.getElementById('start').value; // "YYYY-MM-DDTHH:MM"
  if (!startLocal) return alert('Selecciona fecha/hora');
  // convert local datetime to ISO
  const iso = new Date(startLocal).toISOString();
  const res = await fetch('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serviceId, customerName: name, phone, startIso: iso })
  });
  const data = await res.json();
  if (res.ok) {
    alert('Reserva creada. ID: ' + data.reservation.id);
  } else {
    alert('Error: ' + (data.error || ''));
  }
});


async function loadReservations() {
  const res = await fetch('/api/reservations');
  const data = await res.json();
  const div = document.getElementById('reservationsList');
  div.innerHTML = '';
  if (!data.reservations || data.reservations.length === 0) {
    div.textContent = 'No hay reservas registradas.';
    return;
  }
  const ul = document.createElement('ul');
  data.reservations.forEach(r => {
    const li = document.createElement('li');
    li.textContent = `ID: ${r.id} | Cliente: ${r.customer_name} | Servicio: ${r.service_id} | Inicio: ${r.start_iso} | Estado: ${r.status}`;
    ul.appendChild(li);
  });
  div.appendChild(ul);
}

// recargar reservas después de crear una nueva
document.getElementById('reserveBtn').addEventListener('click', async () => {
  // ... tu código de creación de reserva ...
  await loadReservations();
});

// cargar reservas al inicio
window.addEventListener('load', () => {
  loadServices();
  loadReservations();
});
