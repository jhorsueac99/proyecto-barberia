export const BARBERSHOP_TIME_ZONE = 'America/Lima';

function localParts(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BARBERSHOP_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);

  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
}

export function isBusinessHours(startIso: string, endIso: string) {
  const start = localParts(startIso);
  const end = localParts(endIso);
  const day = start.weekday;
  const startMinutes = Number(start.hour) * 60 + Number(start.minute);
  const endMinutes = Number(end.hour) * 60 + Number(end.minute);

  return day !== 'Sun' && startMinutes >= 9 * 60 && endMinutes <= 20 * 60;
}

export function formatAppointment(iso: string) {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: BARBERSHOP_TIME_ZONE,
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(new Date(iso));
}
