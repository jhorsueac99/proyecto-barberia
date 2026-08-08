import React from 'react';

interface ContactButtonsProps {
  phoneNumber: string;
  telegramId?: string;
}

const ContactButtons: React.FC<ContactButtonsProps> = ({ phoneNumber, telegramId }) => {
  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      {/* Botón WhatsApp */}
      {phoneNumber ? (
        <a
          href={`https://wa.me/${phoneNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: 'green', color: 'white', padding: '5px 10px', borderRadius: '5px', textDecoration: 'none' }}
        >
          WhatsApp
        </a>
      ) : (
        <span>Teléfono no disponible</span>
      )}

      {/* Botón Telegram */}
      {telegramId ? (
        <a
          href={`https://t.me/${telegramId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: '#0088cc', color: 'white', padding: '5px 10px', borderRadius: '5px', textDecoration: 'none' }}
        >
          Telegram
        </a>
      ) : (
        <span>Telegram no disponible</span>
      )}

      {/* Botón Llamada directa */}
      {phoneNumber ? (
        <a
          href={`tel:${phoneNumber}`}
          style={{ backgroundColor: 'blue', color: 'white', padding: '5px 10px', borderRadius: '5px', textDecoration: 'none' }}
        >
          Llamar
        </a>
      ) : (
        <span>Teléfono no disponible</span>
      )}
    </div>
  );
};

export default ContactButtons;
