import React, { useEffect, useState } from 'react';

interface CaptureEffectProps {
  show: boolean;
  onComplete: () => void;
}

export const CaptureEffect: React.FC<CaptureEffectProps> = ({ show, onComplete }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      {/* メインテキスト */}
      <div
        className="capture-text"
        style={{
          fontSize: '80px',
          fontWeight: 'bold',
          color: '#FFD700',
          textShadow: '4px 4px 8px rgba(0, 0, 0, 0.8), 0 0 20px #FFA500',
          animation: 'capturePopIn 0.5s ease-out, capturePulse 1s ease-in-out infinite',
          textAlign: 'center',
        }}
      >
        GET!
      </div>
      
      {/* キラキラエフェクト */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '20px',
              height: '20px',
              background: 'radial-gradient(circle, #FFD700 0%, transparent 70%)',
              borderRadius: '50%',
              animation: `sparkle 1s ease-out ${i * 0.1}s`,
              transform: `rotate(${i * 45}deg) translateY(-80px)`,
            }}
          />
        ))}
      </div>

      <style>
        {`
          @keyframes capturePopIn {
            0% {
              transform: translate(-50%, -50%) scale(0);
              opacity: 0;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.3);
            }
            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
          }
          
          @keyframes capturePulse {
            0%, 100% {
              transform: translate(-50%, -50%) scale(1);
            }
            50% {
              transform: translate(-50%, -50%) scale(1.1);
            }
          }
          
          @keyframes sparkle {
            0% {
              opacity: 1;
              transform: rotate(calc(var(--rotation, 0deg))) translateY(-40px) scale(0);
            }
            50% {
              opacity: 1;
              transform: rotate(calc(var(--rotation, 0deg))) translateY(-120px) scale(1);
            }
            100% {
              opacity: 0;
              transform: rotate(calc(var(--rotation, 0deg))) translateY(-160px) scale(0.5);
            }
          }
        `}
      </style>
    </div>
  );
};

export default CaptureEffect;
