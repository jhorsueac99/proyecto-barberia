import { cancelReservationWithFlag, findHourBlocked, getAllReservations, getReservationById, updateReservationStatus } from './db.js';

export async function confirmReservation(id: number) {
  const reservation = await getReservationById(id);
  if (!reservation) {
    throw new Error('Reserva no encontrada');
  }

  if (reservation.status === 'cancelled') {
    throw new Error('No se puede confirmar una reserva cancelada.');
  }

  const sameHour = await findHourBlocked(reservation.start_iso);
  const others = sameHour.filter((item) => item.id !== reservation.id);
  if (others.length > 0) {
    throw new Error('Ya existe otra cita en esta hora. No se puede confirmar.');
  }

  return updateReservationStatus(id, 'confirmed');
}

export async function cancelReservation(id: number) {
  const reservation = await getReservationById(id);
  if (!reservation) {
    throw new Error('Reserva no encontrada');
  }

  const startTime = new Date(reservation.start_iso).getTime();
  const diffMs = startTime - Date.now();
  const late = diffMs < 60 * 60 * 1000;
  const cancellationType = reservation.short_notice || late ? 'late' : 'normal';

  if (reservation.short_notice) {
    console.warn(`⚠️ ALERTA ADMINISTRADOR: Se canceló una cita con aviso corto (short notice). ID: ${reservation.id}, Cliente: ${reservation.customer_name}`);
  }

  const updated = await cancelReservationWithFlag(id, late);
  if (!updated) {
    throw new Error('No se pudo cancelar la reserva');
  }

  return { reservation: updated, late, cancellationType };
}

export async function cancelReservationByTelegramId(telegramId: string | number): Promise<boolean> {
  const chatId = String(telegramId);
  const reservations = await getAllReservations();
  const upcoming = reservations.find(
    (reservation) =>
      reservation.chat_id === chatId &&
      (reservation.status === 'pending' || reservation.status === 'confirmed') &&
      new Date(reservation.start_iso).getTime() > Date.now()
  );

  if (!upcoming) {
    return false;
  }

  const startTime = new Date(upcoming.start_iso).getTime();
  const diffMs = startTime - Date.now();
  const late = diffMs < 60 * 60 * 1000;

  if (upcoming.short_notice) {
    console.warn(`⚠️ ALERTA ADMINISTRADOR: Se canceló una cita con aviso corto (short notice) desde el bot. ID: ${upcoming.id}, Cliente: ${upcoming.customer_name}`);
  }

  const cancelled = await cancelReservationWithFlag(upcoming.id, late);
  if (!cancelled) {
    return false;
  }

  return true;
}
