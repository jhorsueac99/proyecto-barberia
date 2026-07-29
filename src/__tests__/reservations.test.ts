import { jest } from '@jest/globals';

jest.unstable_mockModule('../services/telegramService.js', () => ({
  sendTelegramMessage: jest.fn()
}));

jest.unstable_mockModule('../services/notifications.js', () => ({
  sendEmail: jest.fn()
}));

jest.unstable_mockModule('../services/db.js', () => ({
  getServices: jest.fn(),
  findOverlaps: jest.fn(),
  addReservation: jest.fn(),
  getAllReservations: jest.fn(),
  getReservationById: jest.fn(),
  getReservationByCancelToken: jest.fn(),
  updateReservationStatus: jest.fn()
}));

const { default: reservations } = await import('../controllers/reservations.js');
const db = await import('../services/db.js');
const telegramService = await import('../services/telegramService.js');
const notifications = await import('../services/notifications.js');

const mockRequest = (body: any = {}) => ({ body }) as any;
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Reservations - create', () => {
  const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(db.getServices).mockResolvedValue([
      { id: 'corte_clasico', name: 'Servicio corte clásico', price: 12, duration_minutes: 30 }
    ]);
    jest.mocked(db.findOverlaps).mockResolvedValue([]);
    jest.mocked(db.addReservation).mockResolvedValue({
      id: 1,
      service_id: 'corte_clasico',
      service_name: 'Servicio corte clásico',
      service_price: 12,
      customer_name: 'Alexander',
      phone: '999888777',
      email: 'alex@test.com',
      start_iso: futureDate,
      end_iso: futureDate,
      status: 'pending',
      cancel_token: 'abc-123',
      chat_id: '12345'
    });
    process.env.TELEGRAM_CHAT_ID = '12345';
    process.env.BASE_URL = 'http://localhost:3000';
  });

  it('debería llamar a sendTelegramMessage con los datos correctos', async () => {
    jest.mocked(telegramService.sendTelegramMessage).mockResolvedValue(undefined);
    jest.mocked(notifications.sendEmail).mockResolvedValue(undefined);

    const req = mockRequest({
      serviceId: 1,
      customerName: 'Alexander',
      phone: '999888777',
      startIso: futureDate,
      email: 'alex@test.com'
    });
    const res = mockResponse();

    await reservations.create(req, res);

    expect(telegramService.sendTelegramMessage).toHaveBeenCalledTimes(1);
    expect(telegramService.sendTelegramMessage).toHaveBeenCalledWith(
      '12345',
      expect.stringContaining('Alexander')
    );
  });

  it('debería llamar a sendEmail con el email del cliente', async () => {
    jest.mocked(telegramService.sendTelegramMessage).mockResolvedValue(undefined);
    jest.mocked(notifications.sendEmail).mockResolvedValue(undefined);

    const req = mockRequest({
      serviceId: 1,
      customerName: 'Alexander',
      phone: '999888777',
      startIso: futureDate,
      email: 'alex@test.com'
    });
    const res = mockResponse();

    await reservations.create(req, res);

    expect(notifications.sendEmail).toHaveBeenCalledTimes(1);
    expect(notifications.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'alex@test.com' })
    );
  });

  it('debería fallar si sendTelegramMessage no se ejecuta', async () => {
    jest.mocked(notifications.sendEmail).mockResolvedValue(undefined);

    const req = mockRequest({
      serviceId: 1,
      customerName: 'Alexander',
      phone: '999888777',
      startIso: futureDate,
      email: 'alex@test.com'
    });
    const res = mockResponse();

    await reservations.create(req, res);

    expect(telegramService.sendTelegramMessage).toHaveBeenCalled();
  });

  it('debería fallar si sendEmail no se ejecuta', async () => {
    jest.mocked(telegramService.sendTelegramMessage).mockResolvedValue(undefined);

    const req = mockRequest({
      serviceId: 1,
      customerName: 'Alexander',
      phone: '999888777',
      startIso: futureDate,
      email: 'alex@test.com'
    });
    const res = mockResponse();

    await reservations.create(req, res);

    expect(notifications.sendEmail).toHaveBeenCalled();
  });
});
