import React, { useState } from 'react';
import styles from './PieChart.module.css';

const PieChart = ({ gts, onActionClick, fps }) => {
  const [actionPanel, setActionPanel] = useState({
    visible: false,
    content: null,
    chartId: null,
    isHovered: false, // 区分是悬停还是点击
    position: { x: 0, y: 0 }, // 鼠标位置
    isFixed: false // 新增：标识浮窗是否已被固定
  });
  
  // 提取动作名称的主要部分（括号前的部分）
  const extractActionType = (actionName) => {
    if (!actionName) return 'その他';
    
    // 移除括号及其内容
    const cleanName = actionName.split('(')[0].trim();
    return cleanName || 'その他';
  };
  
  // 检查一个动作是否是得分动作（下一个动作是发球）
  const isWinningAction = (action, allActions) => {
    if (!action || !allActions) return false;
    
    // 找到当前动作的索引
    const currentIndex = allActions.findIndex(a => 
      a.start_id === action.start_id && a.end_id === action.end_id
    );
    
    if (currentIndex === -1 || currentIndex >= allActions.length - 1) return false;
    
    // 检查下一个动作是否是发球
    const nextAction = allActions[currentIndex + 1];
    return nextAction && 
           nextAction.label_names && 
           nextAction.label_names[0] && 
           nextAction.label_names[0].includes('サーブ');
  };
  
  // 获取某个动作类型的所有得分动作详情
  const getWinningActionDetails = (actionType, actions) => {
    if (!actions || actions.length === 0) return [];
    
    // 找出所有得分动作
    const winningActions = actions.filter(action => {
      if (!isWinningAction(action, actions)) return false;
      if (!action.label_names || !action.label_names[0]) return false;
      
      const currentActionType = extractActionType(action.label_names[0]);
      return currentActionType === actionType;
    });
    
    return winningActions.map(action => ({
      ...action,
      timeInSeconds: action.start_id ? Math.round(action.start_id * 10) / 10 : 0,
      fullName: action.label_names[0]
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
      isFixed: false // 重置固定状态
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
    event.stopPropagation(); // 阻止事件冒泡
    if (onActionClick) {
      onActionClick(action.start_id);
    }
    // 移除 handlePanelClose() 调用，保持浮窗打开
  };
  
  // 计算选手的得分动作分布
  const calculateWinningActionDistribution = (actions) => {
    if (!actions || actions.length === 0) return [];
    
    // 找出所有得分动作
    const winningActions = actions.filter(action => isWinningAction(action, actions));
    
    if (winningActions.length === 0) return [];
    
    // 按动作类型分组统计
    const actionCounts = {};
    winningActions.forEach(action => {
      if (action.label_names && action.label_names[0]) {
        const actionType = extractActionType(action.label_names[0]);
        actionCounts[actionType] = (actionCounts[actionType] || 0) + 1;
      }
    });
    
    // 转换为饼图数据格式
    const total = winningActions.length;
    const pieData = Object.entries(actionCounts).map(([actionType, count]) => ({
      label: actionType,
      value: count,
      percentage: Math.round((count / total) * 100)
    }));
    
    // 按数量排序
    return pieData.sort((a, b) => b.value - a.value);
  };
  
  // 生成饼图颜色
  const generateColors = (count) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
      '#A55EEA', '#26DE81', '#FD79A8', '#FDCB6E', '#6C5CE7'
    ];
    return colors.slice(0, count);
  };
  
  // 创建SVG路径
  const createPieSlice = (centerX, centerY, radius, startAngle, endAngle, color) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    const d = [
      "M", centerX, centerY,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
    
    return d;
  };
  
  // 极坐标转笛卡尔坐标
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };
  
  // 如果没有数据，显示空状态
  if (!gts || gts.length < 2) {
    return (
      <div className={styles['pie-charts']}>
        <h2>得点動作分布</h2>
        <div className={styles['empty-state']}>
          データがありません
        </div>
      </div>
    );
  }
  
  const player1Actions = gts[0].actions || [];
  const player2Actions = gts[1].actions || [];
  
  const player1WinningData = calculateWinningActionDistribution(player1Actions);
  const player2WinningData = calculateWinningActionDistribution(player2Actions);
  
  const renderPieChart = (data, title, playerId) => {
    if (!data || data.length === 0) {
      return (
        <div className={styles['pie-chart-container']}>
          <h3>{title}</h3>
          <div className={styles['no-data']}>得点データなし</div>
        </div>
      );
    }
    
    const colors = generateColors(data.length);
    const centerX = 213; // 320 * 2/3 ≈ 213
    const centerY = 213; // 320 * 2/3 ≈ 213
    const radius = 160;  // 240 * 2/3 = 160
    
    let currentAngle = 0;
    
    const handleMouseEnter = (item, event) => {
      // 如果浮窗已被固定，则不响应鼠标悬停
      if (actionPanel.isFixed) return;
      
      // 获取鼠标位置
      const rect = event.currentTarget.getBoundingClientRect();
      const mouseX = event.clientX;
      const mouseY = event.clientY;
      
      // 获取该动作类型的所有得分动作
      const playerActions = playerId === 'player1' ? gts[0].actions : gts[1].actions;
      const actionDetails = getWinningActionDetails(item.label, playerActions);
      
      setActionPanel({
        visible: true,
        content: {
          actionType: item.label,
          actions: actionDetails,
          playerTitle: playerId === 'player1' ? '手前の選手' : '奥の選手',
          summary: {
            value: item.value,
            percentage: item.percentage,
            total: data.reduce((sum, d) => sum + d.value, 0)
          }
        },
        chartId: playerId,
        isHovered: true,
        position: { x: mouseX, y: mouseY },
        isFixed: false // 悬停状态下不是固定的
      });
    };

    const handleMouseMove = (item, event) => {
      // 如果浮窗已被固定，则不响应鼠标移动
      if (actionPanel.isFixed) return;
      
      // 只有在悬停状态下才更新位置
      if (actionPanel.isHovered && actionPanel.visible && !actionPanel.isFixed) {
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        
        setActionPanel(prev => ({
          ...prev,
          position: { x: mouseX, y: mouseY }
        }));
      }
    };
    
    const handleMouseLeave = () => {
      // 如果浮窗已被固定，则不响应鼠标离开
      if (actionPanel.isFixed) return;
      
      // 只有在悬停状态下才隐藏面板
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
    
    const handleSliceClick = (item, event) => {
      event.stopPropagation();
      
      // 获取该动作类型的所有得分动作
      const playerActions = playerId === 'player1' ? gts[0].actions : gts[1].actions;
      const actionDetails = getWinningActionDetails(item.label, playerActions);
      
      setActionPanel({
        visible: true,
        content: {
          actionType: item.label,
          actions: actionDetails,
          playerTitle: playerId === 'player1' ? '手前の選手' : '奥の選手',
          summary: {
            value: item.value,
            percentage: item.percentage,
            total: data.reduce((sum, d) => sum + d.value, 0)
          }
        },
        chartId: playerId,
        isHovered: false, // 点击状态
        position: { x: 0, y: 0 }, // 点击时使用固定位置
        isFixed: true // 点击后设置为固定状态
      });
    };
    
    return (
      <div className={styles['pie-chart-container']}>
        <h3>{title}</h3>
        <div className={styles['pie-chart-content']}>
          <div className={styles['pie-chart-wrapper']}>
            <svg width="427" height="427" className={styles['pie-chart-svg']}>
              {data.map((item, index) => {
                const sliceAngle = (item.percentage / 100) * 360;
                const startAngle = currentAngle;
                const endAngle = currentAngle + sliceAngle;
                
                const path = createPieSlice(
                  centerX, centerY, radius, 
                  startAngle, endAngle, colors[index]
                );
                
                currentAngle += sliceAngle;
                
                return (
                  <path
                    key={index}
                    d={path}
                    fill={colors[index]}
                    stroke="#fff"
                    strokeWidth="3"
                    className={styles['pie-slice']}
                    onMouseEnter={(e) => handleMouseEnter(item, e)}
                    onMouseMove={(e) => handleMouseMove(item, e)}
                    onMouseLeave={handleMouseLeave}
                    onClick={(e) => handleSliceClick(item, e)}
                  />
                );
              })}
            </svg>
          </div>
          
          <div className={styles['total-wins']}>
            総得点: {data.reduce((sum, item) => sum + item.value, 0)}回
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className={styles['pie-charts']} onClick={() => {
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
      <h2>得点動作分布</h2>
      <div className={styles['usage-instructions']}>
        切片にマウスを合わせると詳細表示 | 
        クリックすると固定表示 | 
        Escキーまたは×ボタンで閉じる
      </div>
      <div className={styles['charts-container']}>
        {renderPieChart(player1WinningData, "手前の選手", "player1")}
        {renderPieChart(player2WinningData, "奥の選手", "player2")}
      </div>
      
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
              <span>得点回数: {actionPanel.content.summary.value}回</span>
              <span>割合: {actionPanel.content.summary.percentage}%</span>
              <span>総得点: {actionPanel.content.summary.total}回</span>
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
                    <div className={styles['action-time']}>{Math.floor(action.timeInSeconds / 60)}:{String(Math.floor(action.timeInSeconds % 60)).padStart(2, '0')}</div>
                    <div className={styles['action-name']}>{action.fullName}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles['no-actions']}>この動作の得点データがありません</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PieChart;
