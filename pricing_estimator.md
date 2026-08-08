# Estimador de costos Twilio WhatsApp Business

Los costos dependen de la categoría de mensaje y del país (Perú).  
Tarifas aproximadas (USD por mensaje):
- Utility (confirmaciones, recordatorios): 0.0200
- Marketing (promociones): 0.0703
- Authentication (OTP): 0.0200
- Servicio iniciado por cliente: 0.0200

---

## Escenario 1: Una barbería, 500 reservas/mes
- Mensajes de confirmación: 500 × 0.0200 = USD 10 (~38 soles)
- Mensajes de cancelación: 100 × 0.0200 = USD 2 (~8 soles)
- Total: USD 12 (~46 soles)

---

## Escenario 2: Tres barberías, 1,500 reservas/mes
- Confirmaciones: 1,500 × 0.0200 = USD 30 (~115 soles)
- Cancelaciones: 300 × 0.0200 = USD 6 (~23 soles)
- Total: USD 36 (~138 soles)

---

## Escenario 3: Una barbería con marketing
- Confirmaciones: 500 × 0.0200 = USD 10 (~38 soles)
- Promociones: 200 × 0.0703 = USD 14 (~54 soles)
- Total: USD 24 (~92 soles)

---

## Escenario 4: Tres barberías con marketing
- Confirmaciones: 1,500 × 0.0200 = USD 30 (~115 soles)
- Promociones: 600 × 0.0703 = USD 42 (~161 soles)
- Total: USD 72 (~276 soles)

---

## Notas
- Los costos se calculan por mensaje enviado, no por conversación.
