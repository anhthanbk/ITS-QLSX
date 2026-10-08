import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  Wrench,
  CheckCircle2,
  TrendingDown,
  Cpu,
} from 'lucide-react';
import type { IncidentAIInsight, ParetoItem } from '../types';
import { cn } from '@/lib/utils';

interface IncidentAIInsightsProps {
  insights: IncidentAIInsight;
  frequencyPareto: ParetoItem[];
  durationPareto: ParetoItem[];
  totalIncidents: number;
  totalHours: number;
  dimension: 'incident_category' | 'equipment_code';
}

export const IncidentAIInsights: React.FC<IncidentAIInsightsProps> = ({
  insights,
  frequencyPareto,
  durationPareto,
  totalIncidents,
  totalHours,
  dimension,
}) => {
  const topDurationItems = durationPareto.filter((p) => p.is_in_vital_few);
  const topFrequencyItems = frequencyPareto.filter((p) => p.is_in_vital_few);

  return (
    <div className="rounded-xl border border-primary/20 bg-linear-to-br from-card via-card to-primary/5 p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              AI Phân Tích Sự Cố & Quy Luật Pareto 80/20
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Smart Diagnostics
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Phân tích tương quan giữa tần suất dừng và thời gian tê liệt chuyền để xác định điểm nghẽn trọng yếu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-md bg-muted px-2.5 py-1 text-muted-foreground font-mono">
            Tổng: <strong className="text-foreground">{totalIncidents}</strong> vụ /{' '}
            <strong className="text-foreground">{totalHours}</strong>h
          </span>
        </div>
      </div>

      {/* Main Analysis Insights */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Card 1: Quy luật 80/20 */}
        <div className="rounded-lg border border-rose-200/60 bg-rose-50/20 p-3.5 dark:border-rose-900/40 dark:bg-rose-950/10">
          <div className="flex items-center gap-2 font-bold text-xs text-rose-700 dark:text-rose-400">
            <TrendingDown className="h-4 w-4" />
            Nhóm 20% Nguyên Nhân Cốt Lõi (Vital Few)
          </div>
          <p className="mt-2 text-xs text-foreground leading-relaxed">
            {insights.vitalFewSummary}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {topDurationItems.slice(0, 3).map((item) => (
              <span
                key={item.key}
                className="inline-flex items-center gap-1 rounded bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 text-[11px] font-semibold text-rose-800 dark:text-rose-200"
              >
                {item.label} ({item.percentage}%)
              </span>
            ))}
          </div>
        </div>

        {/* Card 2: So sánh Tần suất vs Thời gian */}
        <div className="rounded-lg border border-amber-200/60 bg-amber-50/20 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/10">
          <div className="flex items-center gap-2 font-bold text-xs text-amber-700 dark:text-amber-400">
            <Clock className="h-4 w-4" />
            Tần Suất (Lần Dừng) vs Thời Gian (Giờ Dừng)
          </div>
          <p className="mt-2 text-xs text-foreground leading-relaxed">
            {insights.frequencyVsDurationComment}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-amber-200/40 dark:border-amber-900/40">
            <span>
              Top tần suất: <strong className="text-foreground">{topFrequencyItems[0]?.label || '---'}</strong>
            </span>
            <span>
              Top thời gian: <strong className="text-foreground">{topDurationItems[0]?.label || '---'}</strong>
            </span>
          </div>
        </div>

        {/* Card 3: Thiết bị / Điểm nghẽn cần tập trung */}
        <div className="rounded-lg border border-blue-200/60 bg-blue-50/20 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/10">
          <div className="flex items-center gap-2 font-bold text-xs text-blue-700 dark:text-blue-400">
            <Cpu className="h-4 w-4" />
            Điểm Nghẽn Trọng Tâm ({dimension === 'equipment_code' ? 'Thiết Bị' : 'Phân Loại'})
          </div>
          <div className="mt-2">
            <div className="text-base font-bold text-foreground">
              {insights.topBottleneckEquipment}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Đối tượng ưu tiên số 1 cần lập hồ sơ theo dõi chuyên biệt và kiểm tra bảo dưỡng định kỳ trước mỗi ca làm việc.
            </p>
          </div>
        </div>
      </div>

      {/* Preventive Recommendations */}
      {insights.recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/60">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2.5">
            <Wrench className="h-3.5 w-3.5 text-primary" />
            Khuyến Nghị Hành Động Phòng Ngừa (Actionable TPM Recommendations)
          </h4>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {insights.recommendations.map((rec, idx) => {
              const isUrgent = rec.priority === 'urgent';
              const isMedium = rec.priority === 'medium';

              return (
                <div
                  key={idx}
                  className={cn(
                    'rounded-lg border p-3 text-xs transition-colors',
                    isUrgent
                      ? 'border-rose-300 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20'
                      : isMedium
                      ? 'border-amber-300 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20'
                      : 'border-emerald-300 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                        isUrgent
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                          : isMedium
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
                      )}
                    >
                      {isUrgent ? 'Khẩn cấp' : isMedium ? 'Cải tiến' : 'Phòng ngừa'}
                    </span>
                    {isUrgent ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                  </div>
                  <div className="mt-1.5 font-bold text-foreground">
                    {rec.title}
                  </div>
                  <p className="mt-1 text-muted-foreground text-[11px] leading-relaxed">
                    {rec.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
