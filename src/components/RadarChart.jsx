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
      
      // 检查是否是最后一个动作
      const isLastAction = index === sortedActions.length - 1;
      
      // 如果是最后一个动作，完全不计入统计
      if (isLastAction) {
        return;
      }
      
      // 只有非最后一个动作才计入总数和成功数统计
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
    const radius = Math.min(centerX, centerY) - 120; // 增加边距为标签留出更多空间
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 获取成功率数据
    const successRates = calculateSuccessRates(actions);
    const actionKeys = Object.keys(actionLabels);
    const angleStep = (2 * Math.PI) / actionKeys.length;
    
    // 绘制背景网格
    drawGrid(ctx, centerX, centerY, radius, actionKeys.length);
    
    // 绘制改进的标签
    drawImprovedLabels(ctx, centerX, centerY, radius, actionKeys, angleStep, successRates);
    
    // 绘制数据
    drawData(ctx, centerX, centerY, radius, successRates, actionKeys, angleStep);
    
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
  
  const drawImprovedLabels = (ctx, centerX, centerY, radius, actionKeys, angleStep, successRates) => {
    actionKeys.forEach((key, index) => {
      const angle = index * angleStep - Math.PI / 2;
      
      // 动态调整标签距离，避免重叠
      let labelRadius = radius + 60;
      
      // 对于顶部和底部的标签，增加更多距离
      if (Math.abs(Math.sin(angle)) > 0.7) {
        labelRadius = radius + 80;
      }
      
      // 对于左右两侧的标签，稍微增加距离
      if (Math.abs(Math.cos(angle)) > 0.7) {
        labelRadius = radius + 70;
      }
      
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      
      // 获取该动作的总次数
      const totalCount = successRates[key] ? successRates[key].total : 0;
      
      // 动作名称和次数
      const actionName = actionLabels[key];
      const countText = `(${totalCount})`;
      
      // 智能对齐方式，根据标签位置调整
      let textAlign = 'center';
      let textBaseline = 'middle';
      let xOffset = 0;
      let yOffset = 0;
      
      // 根据角度调整对齐方式和偏移
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      
      if (cosAngle > 0.5) {
        // 右侧标签
        textAlign = 'left';
        xOffset = 5;
      } else if (cosAngle < -0.5) {
        // 左侧标签
        textAlign = 'right';
        xOffset = -5;
      }
      
      if (sinAngle > 0.5) {
        // 下方标签
        textBaseline = 'top';
        yOffset = 5;
      } else if (sinAngle < -0.5) {
        // 上方标签
        textBaseline = 'bottom';
        yOffset = -5;
      }
      
      // 设置文本对齐
      ctx.textAlign = textAlign;
      ctx.textBaseline = textBaseline;
      
      // 先测量完整文本的宽度来绘制背景
      ctx.font = 'bold 13px Arial';
      const actionNameMetrics = ctx.measureText(actionName);
      ctx.font = '11px Arial';
      const countMetrics = ctx.measureText(countText);
      
      // 计算总宽度（动作名称 + 空格 + 括号）
      const totalWidth = actionNameMetrics.width + 3 + countMetrics.width;
      const textHeight = 16;
      
      // 计算背景矩形的位置
      let bgX = x + xOffset;
      let bgY = y + yOffset;
      
      if (textAlign === 'center') {
        bgX = bgX - totalWidth / 2;
      } else if (textAlign === 'right') {
        bgX = bgX - totalWidth;
      }
      
      if (textBaseline === 'middle') {
        bgY = bgY - textHeight / 2;
      } else if (textBaseline === 'bottom') {
        bgY = bgY - textHeight;
      }
      
      // 绘制白色半透明背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(bgX - 4, bgY - 2, totalWidth + 8, textHeight + 4);
      
      // 绘制边框
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bgX - 4, bgY - 2, totalWidth + 8, textHeight + 4);
      
      // 计算动作名称的起始位置
      let actionNameX = x + xOffset;
      if (textAlign === 'center') {
        actionNameX = x + xOffset - totalWidth / 2;
      } else if (textAlign === 'right') {
        actionNameX = x + xOffset - totalWidth;
      }
      
      // 绘制动作名称
      ctx.fillStyle = '#333';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'left'; // 强制左对齐来精确控制位置
      ctx.fillText(actionName, actionNameX, y + yOffset);
      
      // 绘制次数（紧跟在动作名称后面）
      ctx.fillStyle = '#666';
      ctx.font = '11px Arial';
      const countX = actionNameX + actionNameMetrics.width + 3;
      ctx.fillText(countText, countX, y + yOffset);
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
    
    // 绘制数据点和数值
    ctx.fillStyle = '#4CAF50';
    actionKeys.forEach((key, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const rate = successRates[key] ? successRates[key].rate : 0;
      const dataRadius = (radius * rate) / 100;
      const x = centerX + dataRadius * Math.cos(angle);
      const y = centerY + dataRadius * Math.sin(angle);
      
      // 绘制数据点
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // 显示数值（只有当数值大于0时才显示）
      if (rate > 0) {
        // 为数值添加背景以提高可读性
        const valueText = rate.toFixed(1) + '%';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const valueMetrics = ctx.measureText(valueText);
        const valueWidth = valueMetrics.width;
        const valueHeight = 12;
        
        // 计算数值标签的位置，避免与轴线重叠
        let valueX = x;
        let valueY = y - 15;
        
        // 如果数据点靠近中心，将标签向外移动
        if (dataRadius < radius * 0.3) {
          const labelOffset = 20;
          valueX = x + labelOffset * Math.cos(angle);
          valueY = y + labelOffset * Math.sin(angle);
        }
        
        // 绘制数值背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(valueX - valueWidth/2 - 3, valueY - valueHeight/2 - 1, valueWidth + 6, valueHeight + 2);
        
        // 绘制数值边框
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(valueX - valueWidth/2 - 3, valueY - valueHeight/2 - 1, valueWidth + 6, valueHeight + 2);
        
        // 绘制数值文本
        ctx.fillStyle = '#2E7D32';
        ctx.fillText(valueText, valueX, valueY);
        
        // 恢复样式
        ctx.fillStyle = '#4CAF50';
      }
    });
  };
  
  return (
    <div className="radar-chart">
      <h2>動作成功率の分析</h2>
      <canvas 
        ref={canvasRef} 
        width={700} 
        height={600}
        className="radar-canvas"
      />
    </div>
  );
};

export default RadarChart;
