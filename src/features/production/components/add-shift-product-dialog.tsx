import React, { useState } from 'react';
import { X, Plus, Package, Warehouse as WarehouseIcon, MapPin } from 'lucide-react';
import { useProductsCatalog } from '@/features/warehouse/hooks/use-products-catalog';
import { useWarehouses } from '@/features/warehouse/hooks/use-warehouses';
import {
  type ShiftProductOutput,
  isByProduct,
  isSemiFinishedProduct,
  normalizeProductType,
} from '../types';

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
  // Existing products from catalog
  const { data: productsData, isLoading } = useProductsCatalog({ page: 1, pageSize: 100 });
  const { data: warehousesData } = useWarehouses({ page: 1, pageSize: 50 });
  const warehousesList = warehousesData?.data || [];

  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [existingQty, setExistingQty] = useState<number>(0);

  if (!isOpen) return null;

  const catalogProducts = productsData?.data || [];
  const availableProducts = catalogProducts.filter(
    (p) => !existingProductIds.includes(p.id),
  );

  const selectedProduct = catalogProducts.find((p) => p.id === selectedProductId);

  const handleAddExisting = () => {
    if (!selectedProduct) return;

    const wh = warehousesList.find((w) => w.id === selectedWarehouseId);

    // Ưu tiên cao nhất là product_type khai báo từ danh mục kho/sản phẩm
    let finalProductType: 'finished_good' | 'semi_finished' | 'by_product' = 'finished_good';
    if (selectedProduct.product_type) {
      finalProductType = normalizeProductType(selectedProduct.product_type);
    } else if (isByProduct({ product_sku: selectedProduct.sku, product_name: selectedProduct.name })) {
      finalProductType = 'by_product';
    } else if (isSemiFinishedProduct({ product_sku: selectedProduct.sku, product_name: selectedProduct.name })) {
      finalProductType = 'semi_finished';
    }

    onAdd({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      product_sku: selectedProduct.sku,
      product_type: finalProductType,
      unit_of_measure: selectedProduct.unit_of_measure || 'tấn',
      is_out_of_plan: true,
      quantity_tons: Number(existingQty) || 0,
      warehouse_id: selectedWarehouseId || null,
      warehouse_name: wh?.name || null,
      storage_location: storageLocation.trim() || null,
    });
    onClose();
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
              <h3 className="text-sm font-bold text-foreground">Chọn sản phẩm ngoài kế hoạch</h3>
              <p className="text-[11px] text-muted-foreground">
                Chọn sản phẩm từ danh mục hệ thống để ghi nhận sản lượng trong ca
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

        {/* Existing Catalog Selection Form */}
        <div className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-foreground">
              Chọn sản phẩm từ danh mục *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="">-- Chọn sản phẩm --</option>
              {availableProducts.map((p) => {
                const isSemi =
                  p.product_type === 'semi_finished' ||
                  p.name?.toLowerCase().includes('bán thành phẩm') ||
                  p.sku?.toLowerCase().includes('btp');
                const isBy =
                  p.product_type === 'by_product' ||
                  p.name?.toLowerCase().includes('phụ phẩm');
                const typeLabel = isSemi ? 'Bán thành phẩm' : isBy ? 'Phụ phẩm' : 'Thành phẩm';
                return (
                  <option key={p.id} value={p.id}>
                    [{p.sku}] {p.name} ({p.unit_of_measure}) — {typeLabel}
                  </option>
                );
              })}
            </select>
            {availableProducts.length === 0 && !isLoading && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Tất cả sản phẩm trong danh mục đã được thêm vào ca.
              </p>
            )}
          </div>

          {selectedProduct && (() => {
            const finalType: 'finished_good' | 'semi_finished' | 'by_product' = selectedProduct.product_type
              ? normalizeProductType(selectedProduct.product_type)
              : isByProduct({ product_sku: selectedProduct.sku, product_name: selectedProduct.name })
              ? 'by_product'
              : isSemiFinishedProduct({ product_sku: selectedProduct.sku, product_name: selectedProduct.name })
              ? 'semi_finished'
              : 'finished_good';
            const isSemi = finalType === 'semi_finished';
            const isBy = finalType === 'by_product';
            return (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Loại sản phẩm:</span>
                  <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                    isSemi
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : !isBy
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                  }`}>
                    {isSemi
                      ? 'Bán thành phẩm (Tính thu hồi riêng)'
                      : !isBy
                      ? 'Thành phẩm (Tính thu hồi thành phẩm)'
                      : 'Phụ phẩm (Không tính vào thành phẩm)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Đơn vị tính:</span>
                  <span className="font-semibold text-foreground">{selectedProduct.unit_of_measure || 'Tấn'}</span>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground flex items-center gap-1">
                <WarehouseIcon className="h-3 w-3 text-muted-foreground" />
                Kho nhập hàng
              </label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Chọn kho nhập --</option>
                {warehousesList.map((w) => (
                  <option key={w.id} value={w.id}>
                    [{w.code}] {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                Vị trí nhập / Bãi
              </label>
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="VD: Bãi 4K, Silo 1..."
                className="mt-1 w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">
              Sản lượng ca (Tấn) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={existingQty || ''}
              onChange={(e) => setExistingQty(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input bg-background px-3.5 py-1.5 text-xs text-foreground hover:bg-muted"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleAddExisting}
              disabled={!selectedProductId}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm vào ca
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
