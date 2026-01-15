import React from 'react';
import { useGameStore } from '../../hooks/useGameState';
import { formatTime } from '../../utils/constants';

export const Result: React.FC = () => {
  const { gameState, setGameState, result, saveGame, currentStage, setCurrentStage, stages } = useGameStore();

  if (gameState !== 'result' || !result) return null;

  const handleRetry = () => {
    saveGame();
    window.location.reload();
  };

  const handleNextStage = () => {
    saveGame();
    if (currentStage < 5) {
      setCurrentStage((currentStage + 1) as 1 | 2 | 3 | 4 | 5);
      window.location.reload();
    } else {
      setGameState('menu');
    }
  };

  const handleBackToMenu = () => {
    saveGame();
    setGameState('menu');
  };

  const getRankColor = (rank: string): string => {
    switch (rank) {
      case 'S':
        return 'rank-s';
      case 'A':
        return 'rank-a';
      case 'B':
        return 'rank-b';
      default:
        return 'rank-c';
    }
  };

  const getRankMessage = (rank: string): string => {
    switch (rank) {
      case 'S':
        return '🏆 パーフェクト！素晴らしい！ 🏆';
      case 'A':
        return '⭐ グレート！よくやった！ ⭐';
      case 'B':
        return '👍 グッド！その調子！ 👍';
      default:
        return '✅ クリア！おめでとう！ ✅';
    }
  };

  const nextStageAvailable = currentStage < 5 && stages.find((s) => s.id === currentStage + 1)?.unlocked;

  return (
    <div className="result-overlay">
      <h1 className="result-title">
        {result.cleared ? 'ステージクリア！' : 'ゲームオーバー'}
      </h1>

      {result.cleared && (
        <>
          <div className={`result-rank ${getRankColor(result.rank)}`}>
            {result.rank}
          </div>
          <p style={{ color: 'white', fontSize: '20px', marginBottom: '20px' }}>
            {getRankMessage(result.rank)}
          </p>
        </>
      )}

      <div className="result-stats">
        🐵 捕獲数: {result.capturedCount} / {result.totalMonkeys}
      </div>
      <div className="result-stats">
        ⏱️ クリアタイム: {formatTime(result.clearTime)}
      </div>
      <div className="result-stats">
        💔 受けたダメージ: {result.damageTaken}
      </div>

      <div style={{ marginTop: '40px', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {result.cleared && nextStageAvailable && (
          <button className="menu-button" onClick={handleNextStage}>
            次のステージへ
          </button>
        )}
        
        <button
          className="menu-button secondary"
          onClick={handleRetry}
        >
          もう一度
        </button>
        
        <button
          className="menu-button secondary"
          onClick={handleBackToMenu}
        >
          タイトルへ
        </button>
      </div>

      {/* ランク評価基準 */}
      <div
        style={{
          marginTop: '40px',
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '10px',
          color: 'white',
        }}
      >
        <h3 style={{ marginBottom: '10px' }}>ランク評価基準</h3>
        <p>🏆 S: 3分以内 & ノーダメージ</p>
        <p>⭐ A: 5分以内 & ダメージ30以下</p>
        <p>👍 B: 10分以内</p>
        <p>✅ C: クリア</p>
      </div>
    </div>
  );
};

// 通知コンポーネント
export const Notification: React.FC = () => {
  const { notification, setNotification } = useGameStore();

  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification, setNotification]);

  if (!notification) return null;

  return <div className="notification">{notification}</div>;
};

// ダメージフラッシュ
export const DamageFlash: React.FC = () => {
  const { showDamageFlash, setShowDamageFlash } = useGameStore();

  React.useEffect(() => {
    if (showDamageFlash) {
      const timer = setTimeout(() => {
        setShowDamageFlash(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [showDamageFlash, setShowDamageFlash]);

  if (!showDamageFlash) return null;

  return <div className="damage-flash" />;
};

// ローディング画面
export const LoadingScreen: React.FC = () => {
  const { gameState } = useGameStore();

  if (gameState !== 'loading') return null;

  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <div className="loading-text">Loading...</div>
    </div>
  );
};

export default Result;
