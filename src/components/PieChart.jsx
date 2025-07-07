import { useEffect, useRef } from 'react';
import './PieChart.css';

const PieChart = ({ actions }) => {
  const canvasRef = useRef(null);
  
  // 动作类型映射（与 RadarChart 中相同）
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

  // 检查动作是否成功（与 RadarChart 中相同的逻辑）
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

  // 计算失误组合统计
  const calculateFailureCombinations = (actions) => {
    if (!actions || actions.length === 0) return {};
    
    // 按时间排序动作
    const sortedActions = [...actions].sort((a, b) => a.start_id - b.start_id);
    
    const failureCombinations = {};
    
    // 分析每个动作
    sortedActions.forEach((action, index) => {
      // 获取动作标签名称
      const currentActionName = action.label_names && action.label_names[0];
      if (!currentActionName) return;
      
      // 检查当前动作是否失误
      const isSuccess = checkActionSuccess(action, sortedActions, index);
      
      if (!isSuccess) {
        // 当前动作是失误，查找之前最近的成功动作
        let previousSuccessAction = null;
        
        // 从当前动作往前查找最近的成功动作
        for (let i = index - 1; i >= 0; i--) {
          const prevAction = sortedActions[i];
          const prevActionSuccess = checkActionSuccess(prevAction, sortedActions, i);
          
          if (prevActionSuccess) {
            previousSuccessAction = prevAction;
            break;
          }
        }
        
        // 如果找到了之前的成功动作，创建组合
        if (previousSuccessAction) {
          const prevActionName = previousSuccessAction.label_names && previousSuccessAction.label_names[0];
          const combinationKey = `${prevActionName} → ${currentActionName}`;
          
          failureCombinations[combinationKey] = (failureCombinations[combinationKey] || 0) + 1;
        }
        // 如果没有找到之前的成功动作，则不统计（按照要求）
      }
    });
    
    return failureCombinations;
  };

  // 处理数据，合并小于5%的组合为【その他】
  const processDataForPieChart = (failureCombinations) => {
    const totalFailures = Object.values(failureCombinations).reduce((sum, count) => sum + count, 0);
    
    if (totalFailures === 0) return [];
    
    const processedData = [];
    let othersCount = 0;
    
    Object.entries(failureCombinations).forEach(([combination, count]) => {
      const percentage = (count / totalFailures) * 100;
      
      if (percentage >= 5) {
        processedData.push({
          label: combination,
          count: count,
          percentage: percentage
        });
      } else {
        othersCount += count;
      }
    });
    
    // 如果有小于5%的组合，添加【その他】
    if (othersCount > 0) {
      const othersPercentage = (othersCount / totalFailures) * 100;
      processedData.push({
        label: 'その他',
        count: othersCount,
        percentage: othersPercentage
      });
    }
    
    // 按百分比排序
    return processedData.sort((a, b) => b.percentage - a.percentage);
  };

  // 生成颜色
  const generateColors = (count) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7DBDD'
    ];
    
    return colors.slice(0, count);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 使用更大的画布尺寸，调整布局
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const centerX = canvasWidth * 0.35; // 将饼图向左移动
    const centerY = canvasHeight / 2;
    const radius = Math.min(centerX * 0.8, centerY * 0.8); // 减小半径避免重叠
    
    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 获取失误组合数据
    const failureCombinations = calculateFailureCombinations(actions);
    const pieData = processDataForPieChart(failureCombinations);
    
    if (pieData.length === 0) {
      // 没有失误数据时显示提示
      ctx.fillStyle = '#666';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('失误データがありません', centerX, centerY);
      return;
    }
    
    const colors = generateColors(pieData.length);
    
    // 绘制饼图
    let currentAngle = -Math.PI / 2; // 从顶部开始
    
    pieData.forEach((data, index) => {
      const sliceAngle = (data.percentage / 100) * 2 * Math.PI;
      
      // 绘制扇形
      ctx.fillStyle = colors[index];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      // 绘制边框
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // 只有当百分比大于10%时才显示百分比标签
      if (data.percentage >= 10) {
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelRadius = radius * 0.65;
        const labelX = centerX + labelRadius * Math.cos(labelAngle);
        const labelY = centerY + labelRadius * Math.sin(labelAngle);
        
        // 添加文字背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const text = `${data.percentage.toFixed(1)}%`;
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        const textHeight = 16;
        
        // 绘制背景矩形
        ctx.fillRect(labelX - textWidth/2 - 4, labelY - textHeight/2 - 2, textWidth + 8, textHeight + 4);
        
        // 绘制白色文字
        ctx.fillStyle = '#fff';
        ctx.fillText(text, labelX, labelY);
      }
      
      currentAngle += sliceAngle;
    });
    
    // 绘制改进的图例
    drawImprovedLegend(ctx, pieData, colors, canvasWidth, canvasHeight);
    
  }, [actions]);

  const drawImprovedLegend = (ctx, pieData, colors, canvasWidth, canvasHeight) => {
    const legendStartX = canvasWidth * 0.65; // 图例位置向右移动
    const legendStartY = 40;
    const lineHeight = 28;
    const maxWidth = canvasWidth - legendStartX - 20;
    
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    // 绘制图例标题
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('失误組合', legendStartX, legendStartY - 10);
    
    ctx.font = 'bold 13px Arial';
    
    pieData.forEach((data, index) => {
      const y = legendStartY + 20 + index * lineHeight;
      
      // 绘制颜色方块 - 使用更大的方块
      ctx.fillStyle = colors[index];
      ctx.fillRect(legendStartX, y - 8, 16, 16);
      
      // 绘制方块边框
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.strokeRect(legendStartX, y - 8, 16, 16);
      
      // 准备文本
      const percentage = `${data.percentage.toFixed(1)}%`;
      const count = `(${data.count}回)`;
      let labelText = data.label;
      
      // 如果标签太长，进行换行处理
      const textX = legendStartX + 25;
      ctx.fillStyle = '#333';
      
      // 测量文本宽度
      const fullText = `${labelText} ${percentage} ${count}`;
      const fullTextWidth = ctx.measureText(fullText).width;
      
      if (fullTextWidth <= maxWidth) {
        // 一行可以放下
        ctx.fillText(fullText, textX, y);
      } else {
        // 需要分行显示
        ctx.fillText(labelText, textX, y - 6);
        
        ctx.font = '11px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText(`${percentage} ${count}`, textX, y + 8);
        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = '#333';
      }
    });
    
    // 绘制总计信息
    const totalFailures = pieData.reduce((sum, data) => sum + data.count, 0);
    const totalY = legendStartY + 30 + pieData.length * lineHeight;
    
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.fillText(`総失误数: ${totalFailures}回`, legendStartX, totalY);
  };

  return (
    <div className="pie-chart">
      <h2>失误組合の分析</h2>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={500}
        className="pie-canvas"
      />
    </div>
  );
};

export default PieChart;
