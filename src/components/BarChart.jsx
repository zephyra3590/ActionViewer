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
  
  // 计算得分（成功的动作数）
  const calculateScore = (actions) => {
    if (!actions || actions.length === 0) return 0;
    
    return actions.filter(action => 
      analyzeActionSuccess(action, actions) === 'success'
    ).length;
  };
  
  // 计算失误（失败的动作数）
  const calculateErrors = (actions) => {
    if (!actions || actions.length === 0) return 0;
    
    return actions.filter(action => 
      analyzeActionSuccess(action, actions) === 'fail'
    ).length;
  };
  
  // 计算总动作数
  const calculateTotalActions = (actions) => {
    return actions ? actions.length : 0;
  };
  
  // 计算成功率百分比
  const calculateSuccessRate = (actions) => {
    if (!actions || actions.length === 0) return 0;
    const successCount = calculateScore(actions);
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
  
  const player1Score = calculateScore(player1Actions);
  const player2Score = calculateScore(player2Actions);
  
  const player1Errors = calculateErrors(player1Actions);
  const player2Errors = calculateErrors(player2Actions);
  
  const player1TotalActions = calculateTotalActions(player1Actions);
  const player2TotalActions = calculateTotalActions(player2Actions);
  
  const player1SuccessRate = calculateSuccessRate(player1Actions);
  const player2SuccessRate = calculateSuccessRate(player2Actions);
  
  // 创建图表数据
  const chartData = [
    {
      label: 'サーブ成功率',
      player1Value: player1ServeStats.rate,
      player2Value: player2ServeStats.rate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: '全体成功率',
      player1Value: player1SuccessRate,
      player2Value: player2SuccessRate,
      maxValue: 100,
      showPercentage: true
    },
    {
      label: '成功動作数',
      player1Value: player1Score,
      player2Value: player2Score,
      maxValue: Math.max(player1Score, player2Score, 1),
      showPercentage: false
    },
    {
      label: '失敗動作数',
      player1Value: player1Errors,
      player2Value: player2Errors,
      maxValue: Math.max(player1Errors, player2Errors, 1),
      showPercentage: false
    },
    {
      label: '総動作数',
      player1Value: player1TotalActions,
      player2Value: player2TotalActions,
      maxValue: Math.max(player1TotalActions, player2TotalActions, 1),
      showPercentage: false
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
