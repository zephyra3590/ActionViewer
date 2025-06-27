import { useEffect, useRef } from 'react';
import './RadarChart.css';

const RadarChart = ({ actions }) => {
  const canvasRef = useRef(null);
  
  // 动作类型映射
  const actionLabels = {
    "0": "サーブ",
    "1": "ロブ", 
    "2": "ネット",
    "3": "ヘアピン",
    "4": "プッシュ",
    "5": "ドライブ",
    "6": "スマッシュレシーブ",
    "7": "ドロップ",
    "8": "スマッシュ",
    "9": "クリアー",
    "10": "ディフェンス"
  };

  // 计算动作成功率
  const calculateSuccessRates = (actions) => {
    if (!actions || actions.length === 0) return {};
    
    // 按时间排序动作
    const sortedActions = [...actions].sort((a, b) => a.start_id - b.start_id);
    
    const actionStats = {};
    
    // 初始化统计
    Object.keys(actionLabels).forEach(key => {
      actionStats[key] = { total: 0, success: 0, rate: 0 };
    });
    
    // 分析每个动作
    sortedActions.forEach((action, index) => {
      // 获取动作标签ID
      let labelId = null;
      if (action.label_names && action.label_names[0]) {
        // 通过标签名称找到对应的ID
        labelId = Object.keys(actionLabels).find(key => 
          actionLabels[key] === action.label_names[0]
        );
      }
      
      if (!labelId) return;
      
      actionStats[labelId].total++;
      
      // 检查是否成功
      const isSuccess = checkActionSuccess(action, sortedActions, index);
      if (isSuccess) {
        actionStats[labelId].success++;
      }
    });
    
    // 计算成功率
    Object.keys(actionStats).forEach(key => {
      if (actionStats[key].total > 0) {
        actionStats[key].rate = (actionStats[key].success / actionStats[key].total) * 100;
      }
    });
    
    return actionStats;
  };
  
  // 检查动作是否成功
  const checkActionSuccess = (currentAction, allActions, currentIndex) => {
    const currentEndTime = currentAction.end_id;
    const twoSecondsLater = currentEndTime + 2;
    
    // 查找2秒内的下一个动作
    const nextActionWithin2Sec = allActions.find((action, index) => 
      index > currentIndex && action.start_id <= twoSecondsLater
    );
    
    if (nextActionWithin2Sec) {
      // 2秒内有下一个动作，认为成功
      return true;
    }
    
    // 2秒内没有动作，查找2秒后的下一个动作
    const nextActionAfter2Sec = allActions.find((action, index) => 
      index > currentIndex && action.start_id > twoSecondsLater
    );
    
    if (nextActionAfter2Sec) {
      // 检查是否是サーブ动作
      const nextActionLabelId = Object.keys(actionLabels).find(key => 
        actionLabels[key] === nextActionAfter2Sec.label_names[0]
      );
      return nextActionLabelId === "0"; // "0" 对应 "サーブ"
    }
    
    // 没有后续动作，认为失败
    return false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 80;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 获取成功率数据
    const successRates = calculateSuccessRates(actions);
    const actionKeys = Object.keys(actionLabels);
    const angleStep = (2 * Math.PI) / actionKeys.length;
    
    // 绘制背景网格
    drawGrid(ctx, centerX, centerY, radius, actionKeys.length);
    
    // 绘制标签
    drawLabels(ctx, centerX, centerY, radius, actionKeys, angleStep);
    
    // 绘制数据
    drawData(ctx, centerX, centerY, radius, successRates, actionKeys, angleStep);
    
    // 绘制图例
    drawLegend(ctx, successRates);
    
  }, [actions]);
  
  const drawGrid = (ctx, centerX, centerY, radius, numAxes) => {
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    
    // 绘制同心圆
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius * i) / 5, 0, 2 * Math.PI);
      ctx.stroke();
    }
    
    // 绘制轴线
    const angleStep = (2 * Math.PI) / numAxes;
    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    
    // 绘制百分比标记
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    for (let i = 1; i <= 5; i++) {
      const percentage = (i * 20) + '%';
      ctx.fillText(percentage, centerX + 5, centerY - (radius * i) / 5 + 3);
    }
  };
  
  const drawLabels = (ctx, centerX, centerY, radius, actionKeys, angleStep) => {
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    
    actionKeys.forEach((key, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const labelRadius = radius + 30;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(actionLabels[key], x, y);
    });
  };
  
  const drawData = (ctx, centerX, centerY, radius, successRates, actionKeys, angleStep) => {
    // 绘制数据多边形
    ctx.strokeStyle = '#4CAF50';
    ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    actionKeys.forEach((key, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const rate = successRates[key] ? successRates[key].rate : 0;
      const dataRadius = (radius * rate) / 100;
      const x = centerX + dataRadius * Math.cos(angle);
      const y = centerY + dataRadius * Math.sin(angle);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // 绘制数据点
    ctx.fillStyle = '#4CAF50';
    actionKeys.forEach((key, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const rate = successRates[key] ? successRates[key].rate : 0;
      const dataRadius = (radius * rate) / 100;
      const x = centerX + dataRadius * Math.cos(angle);
      const y = centerY + dataRadius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // 显示数值
      if (rate > 0) {
        ctx.fillStyle = '#333';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(rate.toFixed(1) + '%', x, y - 10);
        ctx.fillStyle = '#4CAF50';
      }
    });
  };
  
  const drawLegend = (ctx, successRates) => {
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    let legendY = 20;
    ctx.fillText('动作成功率统计:', 20, legendY);
    
    Object.keys(actionLabels).forEach((key, index) => {
      if (successRates[key] && successRates[key].total > 0) {
        legendY += 20;
        const stats = successRates[key];
        const text = `${actionLabels[key]}: ${stats.success}/${stats.total} (${stats.rate.toFixed(1)}%)`;
        ctx.fillText(text, 20, legendY);
      }
    });
  };

  return (
    <div className="radar-chart">
      <h2>动作成功率分析</h2>
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={500}
        className="radar-canvas"
      />
    </div>
  );
};

export default RadarChart;
