import React, { useState } from 'react';
import Game from './components/Game';
import { RacingGame } from './racing/RacingGame';

type GameMode = 'main-menu' | 'action' | 'racing';

// メインメニューコンポーネント
const MainMenu: React.FC<{
  onSelectMode: (mode: GameMode) => void;
}> = ({ onSelectMode }) => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(180deg, #1a1a4a 0%, #4a1a4a 50%, #1a1a2a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Press Start 2P", monospace',
      overflow: 'hidden',
    }}>
      {/* タイトル */}
      <div style={{
        marginBottom: '60px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: 'clamp(24px, 6vw, 48px)',
          color: '#FFD700',
          textShadow: '4px 4px 8px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.5)',
          marginBottom: '10px',
          animation: 'titleBounce 2s ease-in-out infinite',
        }}>
          🐵 ピポサルGET! 🐵
        </h1>
        <p style={{
          fontSize: 'clamp(12px, 3vw, 20px)',
          color: '#00BFFF',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.6)',
        }}>
          ~ モンキーアドベンチャー ~
        </p>
      </div>

      {/* モード選択 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%',
        maxWidth: '400px',
        padding: '0 20px',
      }}>
        {/* アクションモード */}
        <button
          onClick={() => onSelectMode('action')}
          style={{
            padding: '25px 30px',
            background: 'linear-gradient(135deg, rgba(255, 100, 50, 0.8), rgba(255, 50, 50, 0.6))',
            border: '4px solid #FF6B35',
            borderRadius: '20px',
            cursor: 'pointer',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 100, 50, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '48px' }}>🎯</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontSize: 'clamp(14px, 4vw, 20px)',
              color: '#FFFFFF',
              fontFamily: 'inherit',
              marginBottom: '5px',
            }}>
              アクションモード
            </div>
            <div style={{
              fontSize: 'clamp(10px, 2.5vw, 12px)',
              color: '#FFCCCC',
              fontFamily: 'inherit',
            }}>
              サルをつかまえろ！
            </div>
          </div>
        </button>

        {/* レースモード */}
        <button
          onClick={() => onSelectMode('racing')}
          style={{
            padding: '25px 30px',
            background: 'linear-gradient(135deg, rgba(50, 150, 255, 0.8), rgba(50, 100, 200, 0.6))',
            border: '4px solid #00BFFF',
            borderRadius: '20px',
            cursor: 'pointer',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(50, 150, 255, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '48px' }}>🏎️</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontSize: 'clamp(14px, 4vw, 20px)',
              color: '#FFFFFF',
              fontFamily: 'inherit',
              marginBottom: '5px',
            }}>
              レースモード
            </div>
            <div style={{
              fontSize: 'clamp(10px, 2.5vw, 12px)',
              color: '#CCCCFF',
              fontFamily: 'inherit',
            }}>
              ピポサルレーサー！
            </div>
          </div>
        </button>
      </div>

      {/* フッター */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.5)',
      }}>
        © 2024 ピポサルGET!
      </div>

      {/* アニメーション用スタイル */}
      <style>{`
        @keyframes titleBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      `}</style>
    </div>
  );
};

function App() {
  const [gameMode, setGameMode] = useState<GameMode>('main-menu');

  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode);
  };

  const handleBackToMenu = () => {
    setGameMode('main-menu');
  };

  return (
    <>
      {gameMode === 'main-menu' && (
        <MainMenu onSelectMode={handleSelectMode} />
      )}
      {gameMode === 'action' && (
        <Game />
      )}
      {gameMode === 'racing' && (
        <RacingGame onBack={handleBackToMenu} />
      )}
    </>
  );
}

export default App;
