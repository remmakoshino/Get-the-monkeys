import React, { useEffect, useState } from 'react';

interface BossBattleIntroProps {
  show: boolean;
  bossName: string;
  onComplete: () => void;
}

export const BossBattleIntro: React.FC<BossBattleIntroProps> = ({ show, bossName, onComplete }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        pointerEvents: 'none',
      }}
    >
      {/* WARNING表示 */}
      <div
        style={{
          fontSize: '60px',
          fontWeight: 'bold',
          color: '#FF0000',
          textShadow: '0 0 20px #FF0000, 4px 4px 8px rgba(0, 0, 0, 0.8)',
          marginBottom: '40px',
          animation: 'warningFlash 0.5s ease-in-out infinite',
        }}
      >
        ⚠️ WARNING ⚠️
      </div>

      {/* BOSS BATTLE */}
      <div
        style={{
          fontSize: '80px',
          fontWeight: 'bold',
          color: '#FFD700',
          textShadow: '4px 4px 8px rgba(0, 0, 0, 0.8), 0 0 30px #FFA500',
          marginBottom: '20px',
          animation: 'bossSlideIn 1s ease-out',
          letterSpacing: '10px',
        }}
      >
        BOSS BATTLE
      </div>

      {/* ボス名 */}
      <div
        style={{
          fontSize: '50px',
          fontWeight: 'bold',
          color: '#FFFFFF',
          textShadow: '3px 3px 6px rgba(0, 0, 0, 0.8)',
          animation: 'bossFadeIn 1.5s ease-out',
        }}
      >
        {bossName}
      </div>

      {/* 雷エフェクト */}
      <div style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'hidden' }}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${20 + i * 20}%`,
              top: 0,
              width: '4px',
              height: '100%',
              background: 'linear-gradient(to bottom, transparent, #FFD700, transparent)',
              animation: `lightning 0.3s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>
        {`
          @keyframes warningFlash {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          @keyframes bossSlideIn {
            0% {
              transform: translateX(-100%);
              opacity: 0;
            }
            100% {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes bossFadeIn {
            0% {
              transform: scale(0.5);
              opacity: 0;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          
          @keyframes lightning {
            0%, 100% {
              opacity: 0;
            }
            50% {
              opacity: 0.8;
            }
          }
        `}
      </style>
    </div>
  );
};

export default BossBattleIntro;
