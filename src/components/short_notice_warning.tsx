import React from 'react';

interface ShortNoticeWarningProps {
  hoursDifference: number;
  onAccept: (accepted: boolean) => void;
}

const ShortNoticeWarning: React.FC<ShortNoticeWarningProps> = ({ hoursDifference, onAccept }) => {
  if (hoursDifference >= 2) return null;

  return (
    <div style={{ border: '1px solid red', padding: '10px', marginTop: '10px', backgroundColor: '#ffe5e5' }}>
      <p style={{ color: 'red', fontWeight: 'bold' }}>
        ⚠️ Aviso: Las citas reservadas con menos de 2 horas de anticipación no pueden cancelarse sin penalización.
      </p>
      <label>
        <input
          type="checkbox"
          onChange={(e) => onAccept(e.target.checked)}
        />
        Acepto la política de aviso corto
      </label>
    </div>
  );
};

export default ShortNoticeWarning;
