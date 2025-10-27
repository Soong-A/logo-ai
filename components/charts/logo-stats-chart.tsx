// components/admin/charts/logo-stats-chart.tsx
"use client";

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface LogoStyleStats {
  name: string;
  value: number;
}

interface DailyLogoStats {
  date: string;
  count: number;
}

interface LogoStatsChartProps {
  styleStats: LogoStyleStats[];
  dailyStats: DailyLogoStats[];
}

export default function LogoStatsChart({ styleStats, dailyStats }: LogoStatsChartProps) {
  const styleChartRef = useRef<HTMLDivElement>(null);
  const dailyChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!styleChartRef.current || !dailyChartRef.current) return;

    // 现代配色方案
    const colorPalette = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ];

    // 初始化风格统计图表（圆环图 + 柱状图）
    const styleChart = echarts.init(styleChartRef.current);
    const styleOption = {
      title: {
        text: '风格分布',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: '600',
          color: '#1F2937'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        textStyle: {
          color: '#374151'
        }
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: 10,
        top: 20,
        bottom: 20,
        textStyle: {
          color: '#6B7280',
          fontSize: 12
        }
      },
      series: [
        {
          name: '风格分布',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: styleStats.map((item, index) => ({
            ...item,
            itemStyle: {
              color: colorPalette[index % colorPalette.length]
            }
          }))
        }
      ]
    };

    // 初始化每日统计图表（面积图）
    const dailyChart = echarts.init(dailyChartRef.current);
    const dailyOption = {
      title: {
        text: '生成趋势',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: '600',
          color: '#1F2937'
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        textStyle: {
          color: '#374151'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dailyStats.map(item => {
          const date = new Date(item.date);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        axisLine: {
          lineStyle: {
            color: '#E5E7EB'
          }
        },
        axisLabel: {
          color: '#6B7280',
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#6B7280',
          fontSize: 11
        },
        splitLine: {
          lineStyle: {
            color: '#F3F4F6',
            type: 'dashed'
          }
        }
      },
      series: [
        {
          name: '生成数量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3,
            color: '#3B82F6'
          },
          itemStyle: {
            color: '#3B82F6',
            borderColor: '#fff',
            borderWidth: 2
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.1)' }
            ])
          },
          emphasis: {
            scale: true,
            itemStyle: {
              borderColor: '#3B82F6',
              borderWidth: 3,
              shadowBlur: 10,
              shadowColor: 'rgba(59, 130, 246, 0.5)'
            }
          },
          data: dailyStats.map(item => item.count)
        }
      ]
    };

    styleChart.setOption(styleOption);
    dailyChart.setOption(dailyOption);

    // 响应式调整
    const handleResize = () => {
      styleChart.resize();
      dailyChart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      styleChart.dispose();
      dailyChart.dispose();
    };
  }, [styleStats, dailyStats]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Logo 风格分布 - 圆环图 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div ref={styleChartRef} style={{ height: '320px', width: '100%' }} />
      </div>

      {/* 每日生成趋势 - 面积图 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div ref={dailyChartRef} style={{ height: '320px', width: '100%' }} />
      </div>
    </div>
  );
}