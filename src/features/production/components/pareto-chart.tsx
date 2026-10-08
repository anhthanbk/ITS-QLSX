import React, { useState } from 'react';
import type { ParetoItem } from '../types';
import { cn } from '@/lib/utils';

interface ParetoChartProps {
  title: string;
  subtitle: string;
  items: ParetoItem[];
  metricType: 'count' | 'hours';
  unitLabel: string;
}

export const ParetoChart: React.FC<ParetoChartProps> = ({
  title,
  subtitle,
  items,
  metricType,
  unitLabel,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (items.length === 0) {
    return (
      <div className="flex h-80 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <p className="text-sm font-medium text-foreground">Chưa có dữ liệu sự cố</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Chọn khoảng thời gian khác hoặc ghi nhận thêm nhật ký ca sản xuất.
        </p>
      </div>
    );
  }

  // Display top 10 items for maximum clarity, grouping remaining as "Khác" if needed
  const displayItems = items.slice(0, 10);
  const maxVal = Math.max(...displayItems.map((it) => (metricType === 'count' ? it.count : it.duration_hours)), 1);

  // SVG Chart Dimensions
  const svgWidth = 650;
  const svgHeight = 280;
  const paddingLeft = 50;
  const paddingRight = 45;
  const paddingTop = 30;
  const paddingBottom = 65;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const barCount = displayItems.length;
  const barGap = 12;
  const availableWidthForBars = chartWidth - (barCount - 1) * barGap;
  const barWidth = Math.max(16, Math.min(48, availableWidthForBars / barCount));

  // Compute nice Y scale for left axis
  const niceMaxVal = Math.ceil(maxVal * 1.15);

  const getYValue = (val: number) => {
    return paddingTop + chartHeight - (val / (niceMaxVal || 1)) * chartHeight;
  };

  const getYPercent = (pct: number) => {
    return paddingTop + chartHeight - (pct / 100) * chartHeight;
  };

  const getBarX = (idx: number) => {
    const totalContentWidth = barCount * barWidth + (barCount - 1) * barGap;
    const startX = paddingLeft + (chartWidth - totalContentWidth) / 2;
    return startX + idx * (barWidth + barGap);
  };

  // 80% line Y coordinate
  const y80 = getYPercent(80);

  // Cumulative line points
  const linePoints = displayItems.map((it, idx) => {
    const x = getBarX(idx) + barWidth / 2;
    const y = getYPercent(it.cumulative_percentage);
    return { x, y, item: it };
  });

  const pathD = linePoints
    .map((pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`))
    .join(' ');

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <span className="h-2.5 w-2.5 rounded bg-primary" />
            {unitLabel}
          </span>
          <span className="flex items-center gap-1.5 font-medium text-amber-500">
            <span className="h-0.5 w-3.5 bg-amber-500 rounded" />
            % Tích lũy (Pareto)
          </span>
          <span className="flex items-center gap-1.5 text-rose-500 font-medium">
            <span className="h-0.5 w-3.5 border-t border-dashed border-rose-500" />
            Mốc 80%
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative mt-3 w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full min-w-[540px] select-none"
        >
          {/* Background Grid Lines (0%, 20%, 40%, 60%, 80%, 100%) */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = getYPercent(pct);
            return (
              <g key={pct}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeWidth="1"
                />
                {/* Right Axis Tick Labels (% Cumulative) */}
                <text
                  x={svgWidth - paddingRight + 6}
                  y={y + 3}
                  fontSize="9"
                  fill="currentColor"
                  opacity="0.5"
                  className="font-mono"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Left Axis Ticks (Absolute value) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const val = Math.round(niceMaxVal * ratio);
            const y = getYValue(val);
            return (
              <text
                key={ratio}
                x={paddingLeft - 8}
                y={y + 3}
                fontSize="9"
                textAnchor="end"
                fill="currentColor"
                opacity="0.6"
                className="font-mono font-medium"
              >
                {val}
              </text>
            );
          })}

          {/* 80% Pareto Reference Line */}
          <line
            x1={paddingLeft}
            y1={y80}
            x2={svgWidth - paddingRight}
            y2={y80}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text
            x={paddingLeft + 6}
            y={y80 - 4}
            fontSize="9"
            fill="#ef4444"
            fontWeight="bold"
          >
            Đường Pareto 80/20
          </text>

          {/* Bars */}
          {displayItems.map((it, idx) => {
            const val = metricType === 'count' ? it.count : it.duration_hours;
            const barX = getBarX(idx);
            const barY = getYValue(val);
            const height = Math.max(2, paddingTop + chartHeight - barY);
            const isHovered = hoveredIdx === idx;
            const isVital = it.is_in_vital_few;

            return (
              <g
                key={it.key}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-opacity"
              >
                {/* Bar */}
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={height}
                  rx="3"
                  className={cn(
                    'transition-all',
                    isVital
                      ? isHovered
                        ? 'fill-rose-500'
                        : 'fill-rose-500/80 dark:fill-rose-500/70'
                      : isHovered
                      ? 'fill-primary'
                      : 'fill-primary/60 dark:fill-primary/40',
                  )}
                />

                {/* Top value on bar */}
                <text
                  x={barX + barWidth / 2}
                  y={barY - 4}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="bold"
                  fill="currentColor"
                  className={cn(
                    'transition-colors',
                    isVital ? 'text-rose-600 dark:text-rose-400' : 'text-foreground',
                  )}
                >
                  {val}
                </text>

                {/* X Axis Label (Truncated with rotation if needed) */}
                <text
                  x={barX + barWidth / 2}
                  y={paddingTop + chartHeight + 14}
                  textAnchor="end"
                  transform={`rotate(-35, ${barX + barWidth / 2}, ${paddingTop + chartHeight + 14})`}
                  fontSize="9"
                  fill="currentColor"
                  opacity={isHovered ? 1 : 0.75}
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {it.label.length > 18 ? `${it.label.slice(0, 16)}...` : it.label}
                </text>
              </g>
            );
          })}

          {/* Cumulative Percentage Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Cumulative Line Dots */}
          {linePoints.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#ffffff"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  className="transition-all"
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIdx !== null && displayItems[hoveredIdx] && (
          <div
            className="pointer-events-none absolute z-20 rounded-lg border border-border bg-popover/95 p-2.5 text-xs shadow-lg backdrop-blur-xs transition-all"
            style={{
              left: `${Math.min(
                80,
                Math.max(
                  15,
                  (getBarX(hoveredIdx) / svgWidth) * 100,
                ),
              )}%`,
              top: '10px',
            }}
          >
            <div className="font-bold text-foreground">
              {displayItems[hoveredIdx].label}
            </div>
            <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-muted-foreground">
              <div className="flex justify-between gap-4">
                <span>Số lượng / Thời gian:</span>
                <span className="font-bold text-foreground">
                  {metricType === 'count'
                    ? `${displayItems[hoveredIdx].count} lần`
                    : `${displayItems[hoveredIdx].duration_hours} giờ`}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Tỷ lệ đóng góp:</span>
                <span className="font-semibold text-primary">
                  {displayItems[hoveredIdx].percentage}%
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Tỷ lệ tích lũy:</span>
                <span className="font-semibold text-amber-500">
                  {displayItems[hoveredIdx].cumulative_percentage}%
                </span>
              </div>
              <div className="mt-1 pt-1 border-t border-border">
                {displayItems[hoveredIdx].is_in_vital_few ? (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-500">
                    ⚠ Thuộc 80% nguyên nhân cốt lõi (Vital Few)
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Nguyên nhân thứ yếu (Trivial Many)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
