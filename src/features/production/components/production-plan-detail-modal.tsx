import React from 'react';
import { X, Calendar, CheckCircle2, Clock, Zap } from 'lucide-react';
import type { ProductionMonthlyPlan } from '../types';
import { useProductionPlanDetail } from '../hooks/use-production-plans';
import { PlanStatusBadge } from './production-status-badge';

interface ProductionPlanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: ProductionMonthlyPlan | null;
  onApprove?: (plan: ProductionMonthlyPlan) => void;
  canApprove?: boolean;
}

export const ProductionPlanDetailModal: React.FC<ProductionPlanDetailModalProps> = ({
  isOpen,
  onClose,
  plan,
  onApprove,
  canApprove,
}) => {
  const { data: detailData, isLoading } = useProductionPlanDetail(plan ? plan.id : null);

  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">{plan.plan_code}</h2>
                <PlanStatusBadge status={plan.status} />
              </div>
              <p className="text-xs text-muted-foreground">
                Kế hoạch sản xuất Tháng {plan.month}/{plan.year} • {plan.line_name} (
                {plan.line_code})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-5">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <span className="text-[11px] text-muted-foreground">Công suất kế hoạch</span>
              <div className="mt-1 text-base font-bold text-foreground">
                {plan.planned_capacity_tph} TPH
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <span className="text-[11px] text-muted-foreground">Tỷ lệ thu hồi mục tiêu</span>
              <div className="mt-1 text-base font-bold text-primary">
                {plan.planned_recovery_rate_pct}%
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <span className="text-[11px] text-muted-foreground">Quặng cấp vào</span>
              <div className="mt-1 text-base font-bold text-foreground">
                {plan.planned_input_material_tons.toLocaleString()} Tấn
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <span className="text-[11px] text-muted-foreground">Thành phẩm thu hồi</span>
              <div className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
                {plan.planned_output_product_tons.toLocaleString()} Tấn
              </div>
            </div>
          </div>

          {/* Time & Hours Breakdown */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Cơ cấu thời gian vận hành trong tháng
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div>
                <span className="text-muted-foreground">Tổng giờ lịch tháng:</span>
                <p className="font-semibold text-foreground">{plan.total_calendar_hours}h</p>
              </div>
              <div>
                <span className="text-muted-foreground">Giờ dừng sự cố dự kiến:</span>
                <p className="font-semibold text-rose-500">{plan.planned_breakdown_hours}h</p>
              </div>
              <div>
                <span className="text-muted-foreground">Giờ bảo dưỡng định kỳ:</span>
                <p className="font-semibold text-amber-500">{plan.planned_maintenance_hours}h</p>
              </div>
              <div>
                <span className="text-muted-foreground">Giờ chạy máy thực tế:</span>
                <p className="font-semibold text-primary">
                  {plan.planned_operating_hours ?? plan.total_calendar_hours}h
                </p>
              </div>
            </div>
          </div>

          {/* Notes & Description */}
          {plan.notes && (
            <div className="rounded-lg border border-border bg-muted/10 p-3 text-xs">
              <span className="font-semibold text-foreground">Ghi chú điều hành: </span>
              <span className="text-muted-foreground">{plan.notes}</span>
            </div>
          )}

          {/* Additional details if available */}
          {isLoading ? (
            <div className="py-4 text-center text-xs text-muted-foreground">
              Đang tải danh mục phân bổ sản phẩm và tiêu hao...
            </div>
          ) : (
            <>
              {/* Product allocations */}
              {detailData?.products && detailData.products.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground">
                    Sản phẩm kế hoạch phân bổ ({detailData.products.length})
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2">Sản phẩm</th>
                          <th className="px-3 py-2 text-right">Tỷ trọng (%)</th>
                          <th className="px-3 py-2 text-right">Sản lượng (Tấn)</th>
                          <th className="px-3 py-2">Tiêu chuẩn chất lượng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {detailData.products.map((p) => (
                          <tr key={p.id}>
                            <td className="px-3 py-2 font-medium">{p.product_name}</td>
                            <td className="px-3 py-2 text-right">{p.allocation_pct}%</td>
                            <td className="px-3 py-2 text-right font-semibold">
                              {p.planned_quantity_tons.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {p.target_quality_standard || 'Theo quy chuẩn cơ sở'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* By-products */}
              {detailData?.byproducts && detailData.byproducts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground">
                    Phụ phẩm dự kiến ({detailData.byproducts.length})
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2">Tên phụ phẩm</th>
                          <th className="px-3 py-2 text-right">Tỷ lệ (%)</th>
                          <th className="px-3 py-2 text-right">Sản lượng (Tấn)</th>
                          <th className="px-3 py-2">Nơi lưu kho</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {detailData.byproducts.map((b) => (
                          <tr key={b.id}>
                            <td className="px-3 py-2 font-medium">{b.byproduct_name}</td>
                            <td className="px-3 py-2 text-right">{b.ratio_pct}%</td>
                            <td className="px-3 py-2 text-right font-semibold">
                              {b.planned_quantity_tons.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {b.destination_storage || 'Kho bãi phụ phẩm'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Consumptions estimation */}
              {detailData?.consumptions && detailData.consumptions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Dự toán tiêu hao năng lượng & vật tư ({detailData.consumptions.length})
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2">Tài nguyên / Vật tư</th>
                          <th className="px-3 py-2 text-right">Định mức</th>
                          <th className="px-3 py-2 text-right">Dự kiến tiêu thụ</th>
                          <th className="px-3 py-2 text-right">Chi phí ước tính (VNĐ)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {detailData.consumptions.map((c) => (
                          <tr key={c.id}>
                            <td className="px-3 py-2 font-medium">{c.resource_name}</td>
                            <td className="px-3 py-2 text-right">
                              {c.norm_rate} {c.unit_of_measure}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold">
                              {c.planned_total_consumption.toLocaleString()} {c.unit_of_measure}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-muted-foreground">
                              {c.estimated_total_cost
                                ? `${c.estimated_total_cost.toLocaleString()} đ`
                                : '---'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <div className="text-xs text-muted-foreground">
            {plan.approved_at && (
              <span>Đã phê duyệt vào ngày {new Date(plan.approved_at).toLocaleDateString()}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canApprove && plan.status === 'draft' && onApprove && (
              <button
                type="button"
                onClick={() => {
                  onApprove(plan);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Phê duyệt kế hoạch
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
