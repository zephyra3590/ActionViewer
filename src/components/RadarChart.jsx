import React, { useState, useRef, useEffect } from 'react';
import styles from './RadarChart.module.css';
import { analyzeActionSuccess } from '../utils/ActionAnalyzer';

const RadarChart = ({ gts, onActionClick, fps }) => {
  const svgRef = useRef(null);
  const [actionPanel, setActionPanel] = useState({
    visible: false,
    content: null,
    chartId: null,
    isHovered: false,
    position: { x: 0, y: 0 },
    isFixed: false
  });

  // 悬停提示框状态
  const [hoverTooltip, setHoverTooltip] = useState({
    visible: false,
    content: null,
    position: { x: 0, y: 0 }
  });

  // 添加点击状态标志，防止点击时的悬停闪现
  const [isClicking, setIsClicking] = useState(false);

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

  // 计算各种动作的成功率
  const calculateActionStats = (actions, actionType) => {
    if (!actions || actions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    let filteredActions = [];
    
    if (actionType === 'serve') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        action.label_names[0].includes('サーブ')
      );
    } else if (actionType === 'lob') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        action.label_names[0].includes('ロブ')
      );
    } else if (actionType === 'netHairpin') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        (action.label_names[0].includes('ネット') || action.label_names[0].includes('ヘアピン'))
      );
    } else if (actionType === 'push') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        action.label_names[0].includes('プッシュ')
      );
    } else if (actionType === 'drive') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        action.label_names[0].includes('ドライブ')
      );
    } else if (actionType === 'smashReceive') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        action.label_names[0].includes('スマッシュレシーブ')
      );
    } else if (actionType === 'clear') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        action.label_names[0].includes('クリアー')
      );
    } else if (actionType === 'smash') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        action.label_names[0].includes('スマッシュ') &&
        !action.label_names[0].includes('スマッシュレシーブ')
      );
    } else if (actionType === 'dropCut') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        (action.label_names[0].includes('ドロップ') || action.label_names[0].includes('カット'))
      );
    } else if (actionType === 'defense') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        action.label_names[0].includes('ディフェンス')
      );
    } else if (actionType === 'judge') {
      filteredActions = actions.filter(action => 
        action.label_names && action.label_names[0] && 
        action.label_names[0].includes('ジャッジ')
      );
    } else if (actionType === 'overall') {
      filteredActions = actions;
    }
    
    if (filteredActions.length === 0) return { total: 0, success: 0, rate: 0 };
    
    const successfulActions = filteredActions.filter(action => 
      analyzeActionSuccess(action, actions) === 'success'
    );
    
    return {
      total: filteredActions.length,
      success: successfulActions.length,
      rate: Math.round((successfulActions.length / filteredActions.length) * 100)
    };
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
  useEffect(() => {
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

  // 鼠标悬停处理函数
  const handlePointMouseEnter = (actionType, playerSide, event) => {
    // 如果详情面板已经固定显示或正在点击，则不显示悬停提示
    if (actionPanel.isFixed || isClicking) return;

    const playerActions = playerSide === 'player1' ? gts[0].actions : gts[1].actions;
    const stats = calculateActionStats(playerActions, 
      actionType === '全体' ? 'overall' :
      actionType === 'サーブ' ? 'serve' :
      actionType === 'ロブ' ? 'lob' :
      actionType === 'ネット/ヘアピン' ? 'netHairpin' :
      actionType === 'プッシュ' ? 'push' :
      actionType === 'ドライブ' ? 'drive' :
      actionType === 'スマッシュレシーブ' ? 'smashReceive' :
      actionType === 'クリアー' ? 'clear' :
      actionType === 'スマッシュ' ? 'smash' :
      actionType === 'ドロップ/カット' ? 'dropCut' :
      actionType === 'ディフェンス' ? 'defense' :
      actionType === 'ジャッジ' ? 'judge' : 'overall'
    );

    // 使用鼠标位置
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    // 延迟显示悬停提示，避免点击时的闪现
    setTimeout(() => {
      // 再次检查是否应该显示提示框
      if (!actionPanel.isFixed && !isClicking) {
        setHoverTooltip({
          visible: true,
          content: {
            actionType: actionType,
            playerTitle: playerSide === 'player1' ? '手前の選手' : '奥の選手',
            stats: stats
          },
          position: {
            x: mouseX,
            y: mouseY
          }
        });
      }
    }, 150); // 增加延迟到150ms
  };

  // 鼠标离开处理函数
  const handlePointMouseLeave = () => {
    if (!isClicking) {
      setHoverTooltip({
        visible: false,
        content: null,
        position: { x: 0, y: 0 }
      });
    }
  };

  // 鼠标按下处理函数
  const handlePointMouseDown = () => {
    setIsClicking(true);
    // 立即隐藏悬停提示
    setHoverTooltip({
      visible: false,
      content: null,
      position: { x: 0, y: 0 }
    });
  };

  // 点击处理函数
  const handlePointClick = (actionType, playerSide, event) => {
    event.stopPropagation();
    
    // 确保悬停提示被隐藏
    setHoverTooltip({
      visible: false,
      content: null,
      position: { x: 0, y: 0 }
    });
    
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

    // 延迟重置点击状态
    setTimeout(() => {
      setIsClicking(false);
    }, 300);
  };

  // 如果没有数据，显示空状态
  if (!gts || gts.length < 2) {
    return (
      <div className={styles['radar-chart']}>
        <h2>選手データ比較 (レーダーチャート)</h2>
        <div className={styles['empty-state']}>
          データがありません
        </div>
      </div>
    );
  }

  const player1Actions = gts[0].actions || [];
  const player2Actions = gts[1].actions || [];

  // 定义雷达图的维度
  const dimensions = [
    { key: 'overall', label: '全体', jpLabel: '全体' },
    { key: 'serve', label: 'サーブ', jpLabel: 'サーブ' },
    { key: 'smash', label: 'スマッシュ', jpLabel: 'スマッシュ' },
    { key: 'clear', label: 'クリアー', jpLabel: 'クリアー' },
    { key: 'dropCut', label: 'ドロップ/カット', jpLabel: 'ドロップ/カット' },
    { key: 'drive', label: 'ドライブ', jpLabel: 'ドライブ' },
    { key: 'netHairpin', label: 'ネット/ヘアピン', jpLabel: 'ネット/ヘアピン' },
    { key: 'push', label: 'プッシュ', jpLabel: 'プッシュ' },
    { key: 'smashReceive', label: 'スマッシュレシーブ', jpLabel: 'スマッシュレシーブ' },
    { key: 'defense', label: 'ディフェンス', jpLabel: 'ディフェンス' },
    { key: 'lob', label: 'ロブ', jpLabel: 'ロブ' },
    { key: 'judge', label: 'ジャッジ', jpLabel: 'ジャッジ' }
  ];

  // 计算每个维度的数据
  const player1Data = dimensions.map(dim => calculateActionStats(player1Actions, dim.key));
  const player2Data = dimensions.map(dim => calculateActionStats(player2Actions, dim.key));

  // SVG 配置 - 放大1.5倍
  const size = 600; // 从400增加到600
  const center = size / 2; // 300
  const maxRadius = 225; // 从150增加到225
  const levels = 5; // 5个同心圆

  // 计算多边形的点
  const calculatePoint = (index, value, total) => {
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { x, y, angle, radius };
  };

  // 生成雷达图路径
  const generatePath = (data) => {
    const points = data.map((item, index) => 
      calculatePoint(index, item.rate, dimensions.length)
    );
    
    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x},${point.y}`
    ).join(' ') + ' Z';
    
    return { pathData, points };
  };

  const player1Path = generatePath(player1Data);
  const player2Path = generatePath(player2Data);

  return (
    <div className={styles['radar-chart']} onClick={() => {
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
      <h2>選手データ比較 (レーダーチャート)</h2>
      
      <div className={styles['usage-instructions']}>
        各点にマウスを合わせると概要表示 | クリックで詳細表示 | Escキーまたは×ボタンで閉じる
      </div>
      
      <div className={styles['chart-container']}>
        <div className={styles.legend}>
          <div className={styles['legend-item']}>
            <div className={`${styles['legend-color']} ${styles.player1}`}></div>
            <span>手前の選手</span>
          </div>
          <div className={styles['legend-item']}>
            <div className={`${styles['legend-color']} ${styles.player2}`}></div>
            <span>奥の選手</span>
          </div>
        </div>
        
        <svg ref={svgRef} width={size} height={size} className={styles['radar-svg']}>
          {/* 背景网格 */}
          <g className={styles.grid}>
            {/* 同心圆 */}
            {Array.from({ length: levels }, (_, i) => (
              <circle
                key={i}
                cx={center}
                cy={center}
                r={(maxRadius * (i + 1)) / levels}
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="1"
              />
            ))}
            
            {/* 轴线 */}
            {dimensions.map((_, index) => {
              const point = calculatePoint(index, 100, dimensions.length);
              return (
                <line
                  key={index}
                  x1={center}
                  y1={center}
                  x2={point.x}
                  y2={point.y}
                  stroke="#e0e0e0"
                  strokeWidth="1"
                />
              );
            })}
            
            {/* 百分比标签 */}
            {Array.from({ length: levels }, (_, i) => {
              const value = ((i + 1) * 100) / levels;
              return (
                <text
                  key={i}
                  x={center + 5}
                  y={center - ((maxRadius * (i + 1)) / levels)}
                  fontSize="12" // 从10增加到12
                  fill="#999"
                  textAnchor="start"
                >
                  {value}%
                </text>
              );
            })}
          </g>
          
          {/* 先绘制多边形路径 */}
          <g className={styles['player1-path']}>
            <path
              d={player1Path.pathData}
              fill="rgba(74, 144, 226, 0.3)"
              stroke="#4a90e2"
              strokeWidth="3" // 从2增加到3
            />
          </g>
          
          <g className={styles['player2-path']}>
            <path
              d={player2Path.pathData}
              fill="rgba(231, 76, 60, 0.3)"
              stroke="#e74c3c"
              strokeWidth="3" // 从2增加到3
            />
          </g>
          
          {/* 然后绘制所有数据点，使用更大的点击区域 */}
          <g className={styles['data-points']}>
            {/* Player 1 数据点 */}
            {player1Path.points.map((point, index) => (
              <g key={`p1-${index}`}>
                {/* 透明的较大圆形作为点击区域 */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="18" // 从12增加到18
                  fill="transparent"
                  stroke="none"
                  style={{ cursor: 'pointer' }}
                  onMouseDown={handlePointMouseDown}
                  onMouseEnter={(e) => handlePointMouseEnter(dimensions[index].jpLabel, 'player1', e)}
                  onMouseLeave={handlePointMouseLeave}
                  onClick={(e) => handlePointClick(dimensions[index].jpLabel, 'player1', e)}
                />
                {/* 可视的数据点 */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="9" // 从6增加到9
                  fill="#4a90e2"
                  stroke="#fff"
                  strokeWidth="3" // 从2增加到3
                  className={styles['data-point-visual']}
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            ))}
            
            {/* Player 2 数据点 */}
            {player2Path.points.map((point, index) => (
              <g key={`p2-${index}`}>
                {/* 透明的较大圆形作为点击区域 */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="18" // 从12增加到18
                  fill="transparent"
                  stroke="none"
                  style={{ cursor: 'pointer' }}
                  onMouseDown={handlePointMouseDown}
                  onMouseEnter={(e) => handlePointMouseEnter(dimensions[index].jpLabel, 'player2', e)}
                  onMouseLeave={handlePointMouseLeave}
                  onClick={(e) => handlePointClick(dimensions[index].jpLabel, 'player2', e)}
                />
                {/* 可视的数据点 */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="9" // 从6增加到9
                  fill="#e74c3c"
                  stroke="#fff"
                  strokeWidth="3" // 从2增加到3
                  className={styles['data-point-visual']}
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            ))}
          </g>
          
          {/* 维度标签 */}
          {dimensions.map((dim, index) => {
            const labelPoint = calculatePoint(index, 110, dimensions.length);
            return (
              <text
                key={index}
                x={labelPoint.x}
                y={labelPoint.y}
                fontSize="14" // 从12增加到14
                fill="#333"
                textAnchor="middle"
                dominantBaseline="middle"
                className={styles['dimension-label']}
              >
                {dim.jpLabel}
              </text>
            );
          })}
        </svg>
      </div>

      {/* 悬停提示框 - 使用简化样式 */}
      {hoverTooltip.visible && hoverTooltip.content && (
        <div 
          className={styles['hover-tooltip-simple']}
          style={{
            position: 'fixed',
            left: `${hoverTooltip.position.x}px`,
            top: `${hoverTooltip.position.y - 10}px`,
            transform: 'translateX(-50%) translateY(-100%)',
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            zIndex: 1000,
            minWidth: '180px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px', textAlign: 'center' }}>
            {hoverTooltip.content.playerTitle}
          </div>
          <div style={{ color: '#ffd700', marginBottom: '4px', textAlign: 'center' }}>
            {hoverTooltip.content.actionType}
          </div>
          <div style={{ fontSize: '12px' }}>
            <div>総数: {hoverTooltip.content.stats.total}回</div>
            <div>成功: {hoverTooltip.content.stats.success}回</div>
            <div>成功率: {hoverTooltip.content.stats.rate}%</div>
          </div>
          {/* 小三角箭头 */}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid rgba(0, 0, 0, 0.9)'
          }}></div>
        </div>
      )}

      {/* 动作详情面板 */}
      {actionPanel.visible && actionPanel.content && (
        <div className={styles['action-panel-fixed']}>
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

export default RadarChart;
