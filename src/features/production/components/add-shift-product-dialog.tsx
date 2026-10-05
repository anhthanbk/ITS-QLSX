import React, { useState } from 'react';
import { X, Plus, Package, Sparkles } from 'lucide-react';
import { useProductsCatalog, useCreateProduct } from '@/features/warehouse/hooks/use-products-catalog';
import type { ShiftProductOutput } from '../types';

interface AddShiftProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: ShiftProductOutput) => void;
  existingProductIds?: string[];
}

export const AddShiftProductDialog: React.FC<AddShiftProductDialogProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingProductIds = [],
}) => {
  const [tab, setTab] = useState<'existing' | 'new'>('existing');

  // Existing products from catalog
  const { data: productsData, isLoading } = useProductsCatalog({ page: 1, pageSize: 100 });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [existingQty, setExistingQty] = useState<number>(0);

  // New product inputs
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('tấn');
  const [newQty, setNewQty] = useState<number>(0);
  const [createError, setCreateError] = useState('');

  const createProductMutation = useCreateProduct();

  if (!isOpen) return null;

  const catalogProducts = productsData?.data || [];
  const availableProducts = catalogProducts.filter(
    (p) => !existingProductIds.includes(p.id),
  );

  const handleAddExisting = () => {
    const found = catalogProducts.find((p) => p.id === selectedProductId);
    if (!found) return;

    onAdd({
      product_id: found.id,
      product_name: found.name,
      product_sku: found.sku,
      unit_of_measure: found.unit_of_measure || 'tấn',
      is_out_of_plan: true,
      quantity_tons: Number(existingQty) || 0,
    });
    onClose();
  };

  const handleCreateNew = async () => {
    setCreateError('');
    if (!newSku.trim()) {
      setCreateError('Vui lòng nhập mã SKU sản phẩm');
      return;
    }
    if (!newName.trim()) {
      setCreateError('Vui lòng nhập tên sản phẩm');
      return;
    }

    try {
      const created = await createProductMutation.mutateAsync({
        sku: newSku.trim().toUpperCase(),
        name: newName.trim(),
        product_type: 'finished_good',
        unit_of_measure: newUnit.trim() || 'tấn',
        status: 'active',
        base_sales_price: 0,
        standard_cycle_time_mins: 0,
        standard_labor_cost: 0,
      });

      onAdd({
        product_id: created.id,
        product_name: created.name,
        product_sku: created.sku,
        unit_of_measure: created.unit_of_measure || 'tấn',
        is_out_of_plan: true,
        quantity_tons: Number(newQty) || 0,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tạo sản phẩm mới';
      setCreateError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Thêm sản phẩm ngoài kế hoạch</h3>
              <p className="text-[11px] text-muted-foreground">
                Ghi nhận sản lượng cho sản phẩm phát sinh trong ca
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="mt-3 flex rounded-lg bg-muted p-1 text-xs">
          <button
            type="button"
            onClick={() => setTab('existing')}
            className={`flex-1 rounded-md py-1.5 font-medium transition-all ${
              tab === 'existing'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Chọn từ danh mục kho
          </button>
          <button
            type="button"
            onClick={() => setTab('new')}
            className={`flex-1 rounded-md py-1.5 font-medium transition-all ${
              tab === 'new'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="mr-1 inline-block h-3 w-3 text-amber-500" />
            Tạo sản phẩm mới
          </button>
        </div>

        {/* Tab 1: Existing Catalog */}
        {tab === 'existing' && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-foreground">
                Chọn sản phẩm trong kho *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              >
                <option value="">-- Chọn sản phẩm --</option>
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.sku}] {p.name} ({p.unit_of_measure})
                  </option>
                ))}
              </select>
              {availableProducts.length === 0 && !isLoading && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Tất cả sản phẩm đã được thêm hoặc danh mục trống. Bạn có thể chuyển sang tab &quot;Tạo sản phẩm mới&quot;.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">
                Sản lượng ca (Tấn)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={existingQty || ''}
                onChange={(e) => setExistingQty(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground hover:bg-muted"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddExisting}
                disabled={!selectedProductId}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm vào ca
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Create New Product */}
        {tab === 'new' && (
          <div className="mt-4 space-y-3">
            {createError && (
              <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                {createError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-foreground">Mã SKU *</label>
                <input
                  type="text"
                  placeholder="VD: CAT-SPECIAL-01"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono text-foreground uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground">Đơn vị tính</label>
                <select
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
                >
                  <option value="tấn">Tấn</option>
                  <option value="kg">Kg</option>
                  <option value="bao">Bao</option>
                  <option value="m3">m³</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">Tên sản phẩm *</label>
              <input
                type="text"
                placeholder="VD: Cát sấy khô đặc chủng..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">
                Sản lượng ca (Tấn)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newQty || ''}
                onChange={(e) => setNewQty(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground hover:bg-muted"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateNew}
                disabled={createProductMutation.isPending || !newSku.trim() || !newName.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                {createProductMutation.isPending ? 'Đang tạo...' : 'Tạo & Thêm vào ca'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
