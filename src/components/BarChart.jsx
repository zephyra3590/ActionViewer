import React, { useState } from 'react';
import styles from './BarChart.module.css';
import { analyzeActionSuccess } from '../utils/ActionAnalyzer';

const BarChart = ({ gts, onActionClick, fps }) => {
  const [actionPanel, setActionPanel] = useState({
    visible: false,
    content: null,
    chartId: null,
    isHovered: false, // 区分是悬停还是点击
    position: { x: 0, y: 0 }, // 鼠标位置
    isFixed: false // 标识浮窗是否已被固定
  });

  // 获取某个动作类型的所有动作详情
  const getActionDetails = (actionType, actions, playerSide) => {
    if (!actions || actions.length === 0) return [];
    
    let filteredActions = [];
    
    if (actionType === '全体') {
      filteredActions = actions;
    } else if (actionType === 'サーブ') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        action.label_names[0].includes('サーブ')
      );
    } else if (actionType === 'ロブ') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        action.label_names[0].includes('ロブ')
      );
    } else if (actionType === 'ネット/ヘアピン') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        (action.label_names[0].includes('ネット') || action.label_names[0].includes('ヘアピン'))
      );
    } else if (actionType === 'プッシュ') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        action.label_names[0].includes('プッシュ')
      );
    } else if (actionType === 'ドライブ') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        action.label_names[0].includes('ドライブ')
      );
    } else if (actionType === 'スマッシュレシーブ') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        action.label_names[0].includes('スマッシュレシーブ')
      );
    } else if (actionType === 'クリアー') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        action.label_names[0].includes('クリアー')
      );
    } else if (actionType === 'スマッシュ') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        action.label_names[0].includes('スマッシュ') &&
        !action.label_names[0].includes('スマッシュレシーブ')
      );
    } else if (actionType === 'ドロップ/カット') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        (action.label_names[0].includes('ドロップ') || action.label_names[0].includes('カット'))
      );
    } else if (actionType === 'ディフェンス') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        action.label_names[0].includes('ディフェンス')
      );
    } else if (actionType === 'ジャッジ') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        action.label_names[0].includes('ジャッジ')
      );
    }
    
    return filteredActions.map(action => ({
      ...action,
      timeInSeconds: action.start_id ? Math.round(action.start_id * 10) / 10 : 0,
      fullName: action.label_names && action.label_names[0] ? action.label_names[0] : 'Unknown',
      success: analyzeActionSuccess(action, actions)
    }));
  };

  // 关闭面板的处理函数
  const handlePanelClose = () => {
    setActionPanel({
      visible: false,
      content: null,
      chartId: null,
      isHovered: false,
      position: { x: 0, y: 0 },
      isFixed: false
    });
  };

  // ESC键关闭面板
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && actionPanel.visible) {
        handlePanelClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [actionPanel.visible]);

  // 动作项点击处理函数
  const handleActionItemClick = (action, event) => {
    event.stopPropagation();
    if (onActionClick) {
      onActionClick(action.start_id);
    }
  };

  // 柱状图悬停处理
  const handleBarMouseEnter = (actionType, playerSide, event) => {
    if (actionPanel.isFixed) return;
    
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    const playerActions = playerSide === 'player1' ? gts[0].actions : gts[1].actions;
    const actionDetails = getActionDetails(actionType, playerActions, playerSide);
    
    // 计算成功率统计
    const totalActions = actionDetails.length;
    const successfulActions = actionDetails.filter(action => action.success === 'success').length;
    const successRate = totalActions > 0 ? Math.round((successfulActions / totalActions) * 100) : 0;
    
    setActionPanel({
      visible: true,
      content: {
        actionType: actionType,
        actions: actionDetails,
        playerTitle: playerSide === 'player1' ? '手前の選手' : '奥の選手',
        summary: {
          total: totalActions,
          successful: successfulActions,
          successRate: successRate
        }
      },
      chartId: `${playerSide}-${actionType}`,
      isHovered: true,
      position: { x: mouseX, y: mouseY },
      isFixed: false
    });
  };

  const handleBarMouseMove = (event) => {
    if (actionPanel.isFixed) return;
    
    if (actionPanel.isHovered && actionPanel.visible && !actionPanel.isFixed) {
      const mouseX = event.clientX;
      const mouseY = event.clientY;
      
      setActionPanel(prev => ({
        ...prev,
        position: { x: mouseX, y: mouseY }
      }));
    }
  };

  const handleBarMouseLeave = () => {
    if (actionPanel.isFixed) return;
    
    if (actionPanel.isHovered && !actionPanel.isFixed) {
      setActionPanel({
        visible: false,
        content: null,
        chartId: null,
        isHovered: false,
        position: { x: 0, y: 0 },
        isFixed: false
      });
    }
  };

  const handleBarClick = (actionType, playerSide, event) => {
    event.stopPropagation();
    
    const playerActions = playerSide === 'player1' ? gts[0].actions : gts[1].actions;
    const actionDetails = getActionDetails(actionType, playerActions, playerSide);
    
    const totalActions = actionDetails.length;
    const successfulActions = actionDetails.filter(action => action.success === 'success').length;
    const successRate = totalActions > 0 ? Math.round((successfulActions / totalActions) * 100) : 0;
    
    setActionPanel({
      visible: true,
      content: {
        actionType: actionType,
        actions: actionDetails,
        playerTitle: playerSide === 'player1' ? '手前の選手' : '奥の選手',
        summary: {
          total: totalActions,
          successful: successfulActions,
          successRate: successRate
        }
      },
      chartId: `${playerSide}-${actionType}`,
      isHovered: false,
      position: { x: 0, y: 0 },
      isFixed: true
    });
  };
  
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
      <div className={styles['bar-chart']}>
        <h2>選手データ比較</h2>
        <div className={styles['empty-state']}>
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
      label: '全体',
      player1Value: player1SuccessRate,
      player2Value: player2SuccessRate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'サーブ',
      player1Value: player1ServeStats.rate,
      player2Value: player2ServeStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'ロブ',
      player1Value: player1LobStats.rate,
      player2Value: player2LobStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'ネット/ヘアピン',
      player1Value: player1NetHairpinStats.rate,
      player2Value: player2NetHairpinStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'プッシュ',
      player1Value: player1PushStats.rate,
      player2Value: player2PushStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'ドライブ',
      player1Value: player1DriveStats.rate,
      player2Value: player2DriveStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'スマッシュレシーブ',
      player1Value: player1SmashReceiveStats.rate,
      player2Value: player2SmashReceiveStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'クリアー',
      player1Value: player1ClearStats.rate,
      player2Value: player2ClearStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'スマッシュ',
      player1Value: player1SmashStats.rate,
      player2Value: player2SmashStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'ドロップ/カット',
      player1Value: player1DropCutStats.rate,
      player2Value: player2DropCutStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'ディフェンス',
      player1Value: player1DefenseStats.rate,
      player2Value: player2DefenseStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: 'ジャッジ',
      player1Value: player1JudgeStats.rate,
      player2Value: player2JudgeStats.rate,
      maxValue: 100,
      showPercentage: true
    }
  ];
  
  return (
    <div className={styles['bar-chart']} onClick={() => {
      // 点击外部区域关闭动作面板（仅当不是悬停状态时）
      if (!actionPanel.isHovered) {
        setActionPanel({
          visible: false,
          content: null,
          chartId: null,
          isHovered: false,
          position: { x: 0, y: 0 },
          isFixed: false
        });
      }
    }}>
      <h2>選手データ比較 (成功率)</h2>
      
      {/* 使用说明 */}
      <div className={styles['usage-instructions']}>
        柱にマウスを合わせると詳細表示 | 
        クリックすると固定表示 | 
        Escキーまたは×ボタンで閉じる
      </div>
      
      {/* 选手头部信息 */}
      <div className={styles['chart-header']}>
        <div className={styles['player-header']}>
          <div className={styles['player-name']}>手前の選手</div>
          <div className={styles['player-description']}>
            近い位置にいる選手の<br />
            パフォーマンス統計
          </div>
        </div>
        
        <div className={styles['vs-divider']}>VS</div>
        
        <div className={styles['player-header']}>
          <div className={styles['player-name']}>奥の選手</div>
          <div className={styles['player-description']}>
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
          <div key={index} className={styles['chart-row']}>
            <div className={styles['chart-row-label']}>{data.label}</div>
            <div className={styles['chart-container']}>
              <div className={styles['chart-left']}>
                <div 
                  className={styles['bar-left']} 
                  style={{ 
                    width: `${player1Width}%`,
                    '--target-width': `${player1Width}%`
                  }}
                  onMouseEnter={(e) => handleBarMouseEnter(data.label, 'player1', e)}
                  onMouseMove={handleBarMouseMove}
                  onMouseLeave={handleBarMouseLeave}
                  onClick={(e) => handleBarClick(data.label, 'player1', e)}
                >
                  {data.player1Value > 0 && (
                    <span>
                      {data.player1Value}
                      {data.showPercentage ? '%' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles['chart-right']}>
                <div 
                  className={styles['bar-right']} 
                  style={{ 
                    width: `${player2Width}%`,
                    '--target-width': `${player2Width}%`
                  }}
                  onMouseEnter={(e) => handleBarMouseEnter(data.label, 'player2', e)}
                  onMouseMove={handleBarMouseMove}
                  onMouseLeave={handleBarMouseLeave}
                  onClick={(e) => handleBarClick(data.label, 'player2', e)}
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

      {/* 动态位置的面板 */}
      {actionPanel.visible && actionPanel.content && (
        <div 
          className={actionPanel.isHovered ? styles['action-panel-hover'] : styles['action-panel-fixed']}
          style={actionPanel.isHovered ? {
            position: 'fixed',
            left: `${Math.min(actionPanel.position.x + 10, window.innerWidth - 320)}px`,
            top: `${Math.min(actionPanel.position.y + 10, window.innerHeight - 400)}px`,
            zIndex: 1002
          } : {}}
        >
          <div className={styles['action-panel-header']}>
            <h4>{actionPanel.content.playerTitle} - {actionPanel.content.actionType}</h4>
            <button className={styles['close-btn']} onClick={handlePanelClose}>×</button>
          </div>
          
          <div className={styles['action-panel-summary']}>
            <div className={styles['summary-stats']}>
              <span>総数: {actionPanel.content.summary.total}回</span>
              <span>成功: {actionPanel.content.summary.successful}回</span>
              <span>成功率: {actionPanel.content.summary.successRate}%</span>
            </div>
            {actionPanel.isHovered && !actionPanel.isFixed && (
              <div className={styles['hover-hint']}>クリックで固定表示</div>
            )}
          </div>
          
          <div className={styles['action-panel-content']}>
            {actionPanel.content.actions.length > 0 ? (
              <div className={styles['action-list']}>
                {actionPanel.content.actions.map((action, index) => (
                  <div 
                    key={index}
                    className={styles['action-item']}
                    onClick={(e) => handleActionItemClick(action, e)}
                  >
                    <div className={styles['action-time']}>
                      {Math.floor(action.timeInSeconds / 60)}:
                      {String(Math.floor(action.timeInSeconds % 60)).padStart(2, '0')}
                    </div>
                    <div className={styles['action-name']}>
                      {action.fullName}
                      <span className={`${styles['action-status']} ${styles[action.success]}`}>
                        {action.success === 'success' ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles['no-actions']}>この動作のデータがありません</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BarChart;
