import React from 'react';
import './BarChart.css';
import { analyzeActionSuccess } from '../utils/ActionAnalyzer';

const BarChart = ({ gts }) => {
  // 计算发球成功率
  const calculateServeStats = (actions) => {
    if (!actions || actions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const serveActions = actions.filter(action => 
      action.label_names && action.label_names[0] && 
      action.label_names[0].includes('サーブ')
    );
    
    if (serveActions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const successfulServes = serveActions.filter(action => 
      analyzeActionSuccess(action, actions) === 'success'
    );
    
    return {
      total: serveActions.length,
      success: successfulServes.length,
      rate: Math.round((successfulServes.length / serveActions.length) * 100)
    };
  };
  
  // 计算ロブ成功率
  const calculateLobStats = (actions) => {
    if (!actions || actions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const lobActions = actions.filter(action => 
      action.label_names && action.label_names[0] && 
      action.label_names[0].includes('ロブ')
    );
    
    if (lobActions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const successfulLobs = lobActions.filter(action => 
      analyzeActionSuccess(action, actions) === 'success'
    );
    
    return {
      total: lobActions.length,
      success: successfulLobs.length,
      rate: Math.round((successfulLobs.length / lobActions.length) * 100)
    };
  };
  
  // 计算ネット/ヘアピン成功率
  const calculateNetHairpinStats = (actions) => {
    if (!actions || actions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const netHairpinActions = actions.filter(action => 
      action.label_names && action.label_names[0] && 
      (action.label_names[0].includes('ネット') || action.label_names[0].includes('ヘアピン'))
    );
    
    if (netHairpinActions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const successfulNetHairpins = netHairpinActions.filter(action => 
      analyzeActionSuccess(action, actions) === 'success'
    );
    
    return {
      total: netHairpinActions.length,
      success: successfulNetHairpins.length,
      rate: Math.round((successfulNetHairpins.length / netHairpinActions.length) * 100)
    };
  };
  
  // 计算プッシュ成功率
  const calculatePushStats = (actions) => {
    if (!actions || actions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const pushActions = actions.filter(action => 
      action.label_names && action.label_names[0] && 
      action.label_names[0].includes('プッシュ')
    );
    
    if (pushActions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const successfulPushs = pushActions.filter(action => 
      analyzeActionSuccess(action, actions) === 'success'
    );
    
    return {
      total: pushActions.length,
      success: successfulPushs.length,
      rate: Math.round((successfulPushs.length / pushActions.length) * 100)
    };
  };
  
  // 计算ドライブ成功率
  const calculateDriveStats = (actions) => {
    if (!actions || actions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const driveActions = actions.filter(action => 
      action.label_names && action.label_names[0] && 
      action.label_names[0].includes('ドライブ')
    );
    
    if (driveActions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const successfulDrives = driveActions.filter(action => 
      analyzeActionSuccess(action, actions) === 'success'
    );
    
    return {
      total: driveActions.length,
      success: successfulDrives.length,
      rate: Math.round((successfulDrives.length / driveActions.length) * 100)
    };
  };
  
  // 计算スマッシュレシーブ成功率
  const calculateSmashReceiveStats = (actions) => {
    if (!actions || actions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const smashReceiveActions = actions.filter(action => 
      action.label_names && action.label_names[0] && 
      action.label_names[0].includes('スマッシュレシーブ')
    );
    
    if (smashReceiveActions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const successfulSmashReceives = smashReceiveActions.filter(action => 
      analyzeActionSuccess(action, actions) === 'success'
    );
    
    return {
      total: smashReceiveActions.length,
      success: successfulSmashReceives.length,
      rate: Math.round((successfulSmashReceives.length / smashReceiveActions.length) * 100)
    };
  };
  
  // 计算クリアー成功率
  const calculateClearStats = (actions) => {
    if (!actions || actions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const clearActions = actions.filter(action => 
      action.label_names && action.label_names[0] && 
      action.label_names[0].includes('クリアー')
    );
    
    if (clearActions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const successfulClears = clearActions.filter(action => 
      analyzeActionSuccess(action, actions) === 'success'
    );
    
    return {
      total: clearActions.length,
      success: successfulClears.length,
      rate: Math.round((successfulClears.length / clearActions.length) * 100)
    };
  };
  
  // 计算スマッシュ成功率
  const calculateSmashStats = (actions) => {
    if (!actions || actions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const smashActions = actions.filter(action => 
      action.label_names && action.label_names[0] && 
      action.label_names[0].includes('スマッシュ') &&
      !action.label_names[0].includes('スマッシュレシーブ') // 排除スマッシュレシーブ
    );
    
    if (smashActions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const successfulSmashs = smashActions.filter(action => 
      analyzeActionSuccess(action, actions) === 'success'
    );
    
    return {
      total: smashActions.length,
      success: successfulSmashs.length,
      rate: Math.round((successfulSmashs.length / smashActions.length) * 100)
    };
  };
  
  // 计算ドロップ/カット成功率
  const calculateDropCutStats = (actions) => {
    if (!actions || actions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const dropCutActions = actions.filter(action => 
      action.label_names && action.label_names[0] && 
      (action.label_names[0].includes('ドロップ') || action.label_names[0].includes('カット'))
    );
    
    if (dropCutActions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const successfulDropCuts = dropCutActions.filter(action => 
      analyzeActionSuccess(action, actions) === 'success'
    );
    
    return {
      total: dropCutActions.length,
      success: successfulDropCuts.length,
      rate: Math.round((successfulDropCuts.length / dropCutActions.length) * 100)
    };
  };
  
  // 计算ディフェンス成功率
  const calculateDefenseStats = (actions) => {
    if (!actions || actions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const defenseActions = actions.filter(action => 
      action.label_names && action.label_names[0] && 
      action.label_names[0].includes('ディフェンス')
    );
    
    if (defenseActions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const successfulDefenses = defenseActions.filter(action => 
      analyzeActionSuccess(action, actions) === 'success'
    );
    
    return {
      total: defenseActions.length,
      success: successfulDefenses.length,
      rate: Math.round((successfulDefenses.length / defenseActions.length) * 100)
    };
  };
  
  // 计算ジャッジ成功率
  const calculateJudgeStats = (actions) => {
    if (!actions || actions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const judgeActions = actions.filter(action => 
      action.label_names && action.label_names[0] && 
      action.label_names[0].includes('ジャッジ')
    );
    
    if (judgeActions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const successfulJudges = judgeActions.filter(action => 
      analyzeActionSuccess(action, actions) === 'success'
    );
    
    return {
      total: judgeActions.length,
      success: successfulJudges.length,
      rate: Math.round((successfulJudges.length / judgeActions.length) * 100)
    };
  };
  
  // 计算成功率百分比
  const calculateSuccessRate = (actions) => {
    if (!actions || actions.length === 0) return 0;
    const successCount = actions.filter(action => 
      analyzeActionSuccess(action, actions) === 'success'
    ).length;
    return Math.round((successCount / actions.length) * 100);
  };
  
  // 如果没有数据，显示空状态
  if (!gts || gts.length < 2) {
    return (
      <div className="bar-chart">
        <h2>選手データ比較</h2>
        <div className="empty-state">
          データがありません
        </div>
      </div>
    );
  }
  
  const player1Actions = gts[0].actions || [];
  const player2Actions = gts[1].actions || [];
  
  // 计算各项统计数据
  const player1ServeStats = calculateServeStats(player1Actions);
  const player2ServeStats = calculateServeStats(player2Actions);
  
  const player1LobStats = calculateLobStats(player1Actions);
  const player2LobStats = calculateLobStats(player2Actions);
  
  const player1NetHairpinStats = calculateNetHairpinStats(player1Actions);
  const player2NetHairpinStats = calculateNetHairpinStats(player2Actions);
  
  const player1PushStats = calculatePushStats(player1Actions);
  const player2PushStats = calculatePushStats(player2Actions);
  
  const player1DriveStats = calculateDriveStats(player1Actions);
  const player2DriveStats = calculateDriveStats(player2Actions);
  
  const player1SmashReceiveStats = calculateSmashReceiveStats(player1Actions);
  const player2SmashReceiveStats = calculateSmashReceiveStats(player2Actions);
  
  const player1ClearStats = calculateClearStats(player1Actions);
  const player2ClearStats = calculateClearStats(player2Actions);
  
  const player1SmashStats = calculateSmashStats(player1Actions);
  const player2SmashStats = calculateSmashStats(player2Actions);
  
  const player1DropCutStats = calculateDropCutStats(player1Actions);
  const player2DropCutStats = calculateDropCutStats(player2Actions);
  
  const player1DefenseStats = calculateDefenseStats(player1Actions);
  const player2DefenseStats = calculateDefenseStats(player2Actions);
  
  const player1JudgeStats = calculateJudgeStats(player1Actions);
  const player2JudgeStats = calculateJudgeStats(player2Actions);
  
  const player1SuccessRate = calculateSuccessRate(player1Actions);
  const player2SuccessRate = calculateSuccessRate(player2Actions);
  
  // 创建图表数据
  const chartData = [
    {
      label: '全体成功率',
      player1Value: player1SuccessRate,
      player2Value: player2SuccessRate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'サーブ成功率',
      player1Value: player1ServeStats.rate,
      player2Value: player2ServeStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'ロブ成功率',
      player1Value: player1LobStats.rate,
      player2Value: player2LobStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'ネット/ヘアピン成功率',
      player1Value: player1NetHairpinStats.rate,
      player2Value: player2NetHairpinStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'プッシュ成功率',
      player1Value: player1PushStats.rate,
      player2Value: player2PushStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'ドライブ成功率',
      player1Value: player1DriveStats.rate,
      player2Value: player2DriveStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'スマッシュレシーブ成功率',
      player1Value: player1SmashReceiveStats.rate,
      player2Value: player2SmashReceiveStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'クリアー成功率',
      player1Value: player1ClearStats.rate,
      player2Value: player2ClearStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'スマッシュ成功率',
      player1Value: player1SmashStats.rate,
      player2Value: player2SmashStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'ドロップ/カット成功率',
      player1Value: player1DropCutStats.rate,
      player2Value: player2DropCutStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'ディフェンス成功率',
      player1Value: player1DefenseStats.rate,
      player2Value: player2DefenseStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'ジャッジ成功率',
      player1Value: player1JudgeStats.rate,
      player2Value: player2JudgeStats.rate,
      maxValue: 100,
      showPercentage: true
    }
  ];
  
  return (
    <div className="bar-chart">
      <h2>選手データ比較</h2>
      
      {/* 选手头部信息 */}
      <div className="chart-header">
        <div className="player-header">
          <div className="player-name">手前の選手</div>
          <div className="player-description">
            近い位置にいる選手の<br />
            パフォーマンス統計
          </div>
        </div>
        
        <div className="vs-divider">VS</div>
        
        <div className="player-header">
          <div className="player-name">奥の選手</div>
          <div className="player-description">
            遠い位置にいる選手の<br />
            パフォーマンス統計
          </div>
        </div>
      </div>
      
      {/* 图表行 */}
      {chartData.map((data, index) => {
        // 计算条形宽度百分比（相对于最大值）
        const player1Width = Math.min((data.player1Value / data.maxValue) * 100, 100);
        const player2Width = Math.min((data.player2Value / data.maxValue) * 100, 100);
        
        return (
          <div key={index} className="chart-row">
            <div className="chart-row-label">{data.label}</div>
            <div className="chart-container">
              <div className="chart-left">
                <div 
                  className="bar-left" 
                  style={{ 
                    width: `${player1Width}%`,
                    '--target-width': `${player1Width}%`
                  }}
                >
                  {data.player1Value > 0 && (
                    <span>
                      {data.player1Value}
                      {data.showPercentage ? '%' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="chart-right">
                <div 
                  className="bar-right" 
                  style={{ 
                    width: `${player2Width}%`,
                    '--target-width': `${player2Width}%`
                  }}
                >
                  {data.player2Value > 0 && (
                    <span>
                      {data.player2Value}
                      {data.showPercentage ? '%' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BarChart;
