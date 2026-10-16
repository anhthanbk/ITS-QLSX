import React, { useState } from 'react';
import {
  FileQuestion,
  Plus,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import type { MaterialOption, Supplier, ProcurementRequest } from '../types';
import { INITIAL_REQUESTS } from '../types';
import { Button } from '@/components/ui/button';
import { useDepartments } from '@/features/hr/hooks/use-departments';

export type { ProcurementRequest };

export interface ProcurementRequestPanelProps {
  canManage: boolean;
  canApprove: boolean;
  isAdmin?: boolean;
  materials: MaterialOption[];
  suppliers: Supplier[];
  onConvertToPO: (pr: ProcurementRequest) => void;
  requests?: ProcurementRequest[];
  onUpdateRequestStatus?: (id: string, newStatus: ProcurementRequest['status']) => void;
  onCreateRequest?: (pr: ProcurementRequest) => void;
  onEditRequest?: (pr: ProcurementRequest) => void;
  onDeleteRequest?: (id: string) => void;
}

export const ProcurementRequestPanel: React.FC<ProcurementRequestPanelProps> = ({
  canManage,
  canApprove,
  isAdmin = false,
  materials,
  onConvertToPO,
  requests: propRequests,
  onUpdateRequestStatus,
  onCreateRequest,
  onEditRequest,
  onDeleteRequest,
}) => {
  const [internalRequests, setInternalRequests] = useState<ProcurementRequest[]>(INITIAL_REQUESTS);
  const requests = propRequests ?? internalRequests;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ProcurementRequest | null>(null);
  const [deletingRequest, setDeletingRequest] = useState<ProcurementRequest | null>(null);

  // Departments from HR module
  const { data: hrDepartments } = useDepartments();

  // Form states for new PR
  const [newDepartment, setNewDepartment] = useState('');
  const [newMaterialId, setNewMaterialId] = useState('');
  const [newCustomMaterial, setNewCustomMaterial] = useState('');
  const [newQuantity, setNewQuantity] = useState(100);
  const [newUnit, setNewUnit] = useState('Tấn');
  const [newEstPrice, setNewEstPrice] = useState(250000);
  const [newRequiredDate, setNewRequiredDate] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0] ?? '',
  );
  const [newPriority, setNewPriority] = useState<ProcurementRequest['priority']>('normal');
  const [editingStatus, setEditingStatus] = useState<ProcurementRequest['status']>('pending_approval');
  const [newReason, setNewReason] = useState('');

  // Default department to first HR department when available
  React.useEffect(() => {
    if (hrDepartments && hrDepartments.length > 0 && !newDepartment) {
      setNewDepartment(hrDepartments[0]?.name || '');
    }
  }, [hrDepartments, newDepartment]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleOpenCreate = () => {
    setEditingRequest(null);
    setNewDepartment(hrDepartments?.[0]?.name || 'Xưởng Tuyển Khoáng Cam Ranh');
    setNewMaterialId('');
    setNewCustomMaterial('');
    setNewQuantity(100);
    setNewUnit('Tấn');
    setNewEstPrice(250000);
    setNewRequiredDate(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0] ?? '');
    setNewPriority('normal');
    setEditingStatus('pending_approval');
    setNewReason('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (pr: ProcurementRequest) => {
    setEditingRequest(pr);
    setNewDepartment(pr.department);
    setNewMaterialId(pr.material_id || '');
    setNewCustomMaterial(pr.material_id ? '' : pr.material_name);
    setNewQuantity(pr.quantity);
    setNewUnit(pr.unit_of_measure);
    setNewEstPrice(pr.quantity > 0 ? Math.round(pr.estimated_cost / pr.quantity) : 0);
    setNewRequiredDate(pr.required_date);
    setNewPriority(pr.priority);
    setEditingStatus(pr.status);
    setNewReason(pr.reason);
    setIsDialogOpen(true);
  };

  const handleSavePR = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedMat = materials.find((m) => m.id === newMaterialId);
    const matName = selectedMat ? selectedMat.name : (newCustomMaterial.trim() || 'Vật tư đề xuất');
    if (!matName) return;
    const unit = selectedMat ? (selectedMat.unit_of_measure || newUnit) : (newUnit.trim() || 'Cái');

    if (editingRequest) {
      const updatedPr: ProcurementRequest = {
        ...editingRequest,
        department: newDepartment || editingRequest.department,
        material_name: matName,
        material_id: selectedMat ? selectedMat.id : undefined,
        quantity: Number(newQuantity) || 1,
        unit_of_measure: unit,
        estimated_cost: (Number(newQuantity) || 1) * (Number(newEstPrice) || 0),
        required_date: newRequiredDate,
        priority: newPriority,
        status: editingStatus,
        reason: newReason,
      };

      if (onEditRequest) {
        onEditRequest(updatedPr);
      } else {
        setInternalRequests((prev) =>
          prev.map((r) => (r.id === updatedPr.id ? updatedPr : r)),
        );
      }
    } else {
      const newPr: ProcurementRequest = {
        id: `pr-${Date.now()}`,
        pr_code: `PR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        department: newDepartment || (hrDepartments && hrDepartments[0]?.name) || 'Xưởng Tuyển Khoáng Cam Ranh',
        material_name: matName,
        material_id: selectedMat ? selectedMat.id : undefined,
        quantity: Number(newQuantity) || 1,
        unit_of_measure: unit,
        estimated_cost: (Number(newQuantity) || 1) * (Number(newEstPrice) || 0),
        required_date: newRequiredDate,
        priority: newPriority,
        status: 'pending_approval',
        requested_by: 'Người dùng hiện tại',
        reason: newReason || 'Yêu cầu phục vụ bảo trì và sản xuất ca',
        created_at: new Date().toISOString(),
      };

      if (onCreateRequest) {
        onCreateRequest(newPr);
      } else {
        setInternalRequests([newPr, ...internalRequests]);
      }
    }

    setIsDialogOpen(false);
    setEditingRequest(null);
    setNewReason('');
    setNewMaterialId('');
    setNewCustomMaterial('');
  };

  const handleConfirmDelete = () => {
    if (!deletingRequest) return;
    if (onDeleteRequest) {
      onDeleteRequest(deletingRequest.id);
    } else {
      setInternalRequests((prev) => prev.filter((r) => r.id !== deletingRequest.id));
    }
    setDeletingRequest(null);
  };

  const handleUpdateStatus = (id: string, newStatus: ProcurementRequest['status']) => {
    if (onUpdateRequestStatus) {
      onUpdateRequestStatus(id, newStatus);
    } else {
      setInternalRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
      );
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.pr_code.toLowerCase().includes(search.toLowerCase()) ||
      r.material_name.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPriorityBadge = (p: ProcurementRequest['priority']) => {
    switch (p) {
      case 'urgent':
        return <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-600">Khẩn cấp</span>;
      case 'high':
        return <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600">Ưu tiên cao</span>;
      case 'normal':
        return <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600">Bình thường</span>;
      case 'low':
        return <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Thấp</span>;
    }
  };

  const getStatusBadge = (s: ProcurementRequest['status']) => {
    switch (s) {
      case 'draft':
        return <span className="rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-medium text-slate-600">Bản nháp</span>;
      case 'pending_approval':
        return <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600">Chờ phê duyệt</span>;
      case 'approved':
        return <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">Đã phê duyệt</span>;
      case 'converted_to_po':
        return <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-600">Đã lập PO</span>;
      case 'rejected':
        return <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-600">Từ chối</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo mã phiếu PR, tên vật tư, bộ phận đề xuất..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending_approval">Chờ phê duyệt</option>
            <option value="approved">Đã phê duyệt</option>
            <option value="converted_to_po">Đã lập PO</option>
            <option value="rejected">Từ chối</option>
          </select>

          {canManage && (
            <Button size="sm" onClick={handleOpenCreate} className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span>Lập phiếu PR</span>
            </Button>
          )}
        </div>
      </div>

      {/* Table list */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Mã phiếu (PR)</th>
                <th className="px-4 py-3">Vật tư yêu cầu</th>
                <th className="px-4 py-3">Bộ phận đề xuất</th>
                <th className="px-4 py-3 text-right">Số lượng</th>
                <th className="px-4 py-3 text-right">Dự toán</th>
                <th className="px-4 py-3">Hạn cần</th>
                <th className="px-4 py-3">Mức độ</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-center">Xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    <FileQuestion className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-base font-medium text-foreground">Không có phiếu đề xuất nào</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Không tìm thấy phiếu đề xuất mua sắm PR phù hợp với bộ lọc.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((pr) => (
                  <tr key={pr.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3.5 font-semibold text-primary">
                      {pr.pr_code}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-foreground">{pr.material_name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={pr.reason}>
                        {pr.reason}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground text-xs">
                      <div>{pr.department}</div>
                      <div className="text-[11px] text-muted-foreground">{pr.requested_by}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-foreground">
                      {pr.quantity.toLocaleString('vi-VN')} {pr.unit_of_measure}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-foreground">
                      {formatCurrency(pr.estimated_cost)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      {pr.required_date}
                    </td>
                    <td className="px-4 py-3.5">
                      {getPriorityBadge(pr.priority)}
                    </td>
                    <td className="px-4 py-3.5">
                      {getStatusBadge(pr.status)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {canApprove && pr.status === 'pending_approval' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(pr.id, 'approved')}
                              className="h-8 gap-1 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              title="Phê duyệt phiếu PR"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Duyệt</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(pr.id, 'rejected')}
                              className="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10"
                              title="Từ chối phê duyệt"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}

                        {pr.status === 'approved' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => onConvertToPO(pr)}
                            className="h-8 gap-1 text-xs"
                            title="Tạo đơn mua hàng PO từ đề xuất này"
                          >
                            <span>Lập PO</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {pr.status === 'converted_to_po' && (
                          <span className="text-xs text-muted-foreground italic">Đã gắn PO</span>
                        )}
                        {pr.status === 'rejected' && (
                          <span className="text-xs text-destructive">Không duyệt</span>
                        )}

                        {/* Admin actions: Edit & Delete */}
                        {isAdmin && (
                          <div className="flex items-center border-l border-border pl-1.5 ml-1 gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(pr)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-muted"
                              title="Sửa phiếu đề xuất (Admin)"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingRequest(pr)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Xóa phiếu đề xuất (Admin)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PR Create / Edit Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-base font-bold text-foreground">
                {editingRequest
                  ? `Chỉnh sửa phiếu đề xuất mua sắm (${editingRequest.pr_code})`
                  : 'Lập phiếu đề xuất mua sắm vật tư (PR)'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingRequest(null);
                }}
                className="h-8 w-8 p-0 text-muted-foreground"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSavePR} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Bộ phận đề xuất</label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {hrDepartments && hrDepartments.length > 0 ? (
                    hrDepartments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.code})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Xưởng Tuyển Khoáng">Xưởng Tuyển Khoáng</option>
                      <option value="Xưởng Nghiền & Sấy">Xưởng Nghiền & Sấy</option>
                      <option value="Phòng Cơ Điện & Bảo Trì">Phòng Cơ Điện & Bảo Trì</option>
                      <option value="Phòng KCS / QC">Phòng KCS / QC</option>
                      <option value="Kho & Hậu Cần">Kho & Hậu Cần</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Vật tư yêu cầu</label>
                <select
                  value={newMaterialId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewMaterialId(val);
                    const mat = materials.find((m) => m.id === val);
                    if (mat) {
                      setNewEstPrice(mat.standard_cost || 0);
                      setNewUnit(mat.unit_of_measure || 'Tấn');
                      setNewCustomMaterial('');
                    }
                  }}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">-- Chọn danh mục vật tư hoặc tự nhập --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name} ({m.unit_of_measure})
                    </option>
                  ))}
                </select>
                {!newMaterialId && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      required={!newMaterialId}
                      placeholder="Hoặc nhập tên vật tư / thiết bị mới cần mua..."
                      value={newCustomMaterial}
                      onChange={(e) => setNewCustomMaterial(e.target.value)}
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <input
                      type="text"
                      placeholder="ĐVT (Tấn, Cái...)"
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      className="w-28 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground">Số lượng</label>
                  <input
                    type="number"
                    min="1"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Đơn giá dự toán (₫)</label>
                  <input
                    type="number"
                    min="0"
                    value={newEstPrice}
                    onChange={(e) => setNewEstPrice(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground">Hạn cần vật tư</label>
                  <input
                    type="date"
                    value={newRequiredDate}
                    onChange={(e) => setNewRequiredDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Mức độ ưu tiên</label>
                  <select
                    value={newPriority}
                    onChange={(e) =>
                      setNewPriority(e.target.value as ProcurementRequest['priority'])
                    }
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="normal">Bình thường</option>
                    <option value="high">Ưu tiên cao</option>
                    <option value="urgent">Khẩn cấp</option>
                    <option value="low">Thấp</option>
                  </select>
                </div>
              </div>

              {editingRequest && isAdmin && (
                <div>
                  <label className="text-xs font-semibold text-foreground">Trạng thái phiếu PR (Admin)</label>
                  <select
                    value={editingStatus}
                    onChange={(e) =>
                      setEditingStatus(e.target.value as ProcurementRequest['status'])
                    }
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="draft">Bản nháp</option>
                    <option value="pending_approval">Chờ phê duyệt</option>
                    <option value="approved">Đã phê duyệt</option>
                    <option value="converted_to_po">Đã lập PO</option>
                    <option value="rejected">Từ chối</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-foreground">Lý do & Mục đích sử dụng</label>
                <textarea
                  rows={2}
                  placeholder="Mục đích sử dụng, vị trí máy móc hoặc kế hoạch ca sản xuất..."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingRequest(null);
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit" size="sm">
                  {editingRequest ? 'Lưu thay đổi' : 'Gửi đề xuất PR'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete PR Confirmation Modal */}
      {deletingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Xác nhận xóa phiếu đề xuất (PR)</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bạn có chắc chắn muốn xóa phiếu đề xuất{' '}
                  <strong className="text-foreground">{deletingRequest.pr_code}</strong> ({deletingRequest.material_name}) của bộ phận{' '}
                  <strong className="text-foreground">{deletingRequest.department}</strong> không?
                </p>
                <p className="mt-2 text-xs text-destructive">
                  Hành động này sẽ xóa vĩnh viễn phiếu đề xuất này khỏi hệ thống và không thể khôi phục.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingRequest(null)}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
