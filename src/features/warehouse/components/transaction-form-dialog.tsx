import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { X, Loader2, ArrowLeftRight, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TransactionFormValues } from '../validation/warehouse-schemas';
import type { Warehouse, WarehouseItemOption, InventoryTransaction } from '@/features/warehouse/types';
import { useItemOptions } from '../hooks/use-stock-balances';

interface TransactionFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  warehouses: Warehouse[];
  transactionToEdit?: InventoryTransaction | null;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  isSubmitting: boolean;
}

function getFilteredItems(items: WarehouseItemOption[], category: string): WarehouseItemOption[] {
  if (category === 'all') return items;
  if (category === 'material') return items.filter((i) => i.item_type === 'material');
  if (category === 'semi_finished') return items.filter((i) => i.category === 'semi_finished');
  if (category === 'product' || category === 'finished_good') {
    return items.filter(
      (i) => i.category === 'finished_good' || (i.item_type === 'product' && i.category !== 'semi_finished' && i.category !== 'by_product'),
    );
  }
  if (category === 'byproduct' || category === 'by_product') {
    return items.filter((i) => i.category === 'by_product' || i.category === 'byproduct' || i.item_type === 'byproduct');
  }
  return items.filter((i) => i.category === category);
}

export const TransactionFormDialog: React.FC<TransactionFormDialogProps> = ({
  isOpen,
  onClose,
  warehouses,
  transactionToEdit,
  onSubmit,
  isSubmitting,
}) => {
  const { data: itemOptions = [] } = useItemOptions();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    defaultValues: {
      warehouse_id: '',
      destination_warehouse_id: '',
      item_type: 'material',
      item_id: '',
      transaction_type: 'inbound_receipt',
      quantity: 1,
      unit_cost: 0,
      notes: '',
    },
  });

  const selectedItemId = watch('item_id');
  const selectedTxType = watch('transaction_type');
  const selectedWarehouseId = watch('warehouse_id');

  // Filter items by selected granular category or broad type
  const filteredItems = useMemo(
    () => getFilteredItems(itemOptions, selectedCategory),
    [itemOptions, selectedCategory]
  );

  // When user changes category filter
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const newFiltered = getFilteredItems(itemOptions, category);
    const first = newFiltered[0];
    if (first) {
      setValue('item_id', first.id);
      setValue('item_type', first.item_type);
      setValue('unit_cost', first.cost);
    } else {
      setValue('item_id', '');
    }
  };

  // When item changes, set default unit_cost from item standard cost & set correct item_type
  useEffect(() => {
    if (selectedItemId) {
      const found = itemOptions.find((i) => i.id === selectedItemId);
      if (found) {
        setValue('item_type', found.item_type);
        if (found.cost) {
          setValue('unit_cost', found.cost);
        }
      }
    }
  }, [selectedItemId, itemOptions, setValue]);

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setSelectedCategory(transactionToEdit.category || transactionToEdit.item_type || 'all');
        reset({
          warehouse_id: transactionToEdit.warehouse_id,
          item_type: transactionToEdit.item_type,
          item_id: transactionToEdit.item_id,
          transaction_type: transactionToEdit.transaction_type,
          quantity: Math.abs(transactionToEdit.quantity),
          unit_cost: transactionToEdit.unit_cost,
          notes: transactionToEdit.notes || '',
        });
      } else {
        const defaultItem = itemOptions[0];
        setSelectedCategory('all');
        reset({
          warehouse_id: warehouses[0]?.id || '',
          item_type: defaultItem?.item_type || 'material',
          item_id: defaultItem?.id || '',
          transaction_type: 'inbound_receipt',
          quantity: 1,
          unit_cost: defaultItem?.cost || 0,
          notes: '',
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, transactionToEdit?.id]);

  const selectedItem = itemOptions.find((i) => i.id === selectedItemId);

  const handleFormSubmit = async (data: TransactionFormValues) => {
    const chosen = itemOptions.find((i) => i.id === data.item_id);
    const finalItemType = chosen ? chosen.item_type : data.item_type;
    await onSubmit({ ...data, item_type: finalItemType });
  };

  // Auto-align item category when transaction type changes
  const handleTransactionTypeChange = (txType: TransactionFormValues['transaction_type']) => {
    setValue('transaction_type', txType);
    if (txType === 'production_receipt' || txType === 'sales_dispatch') {
      const isProductCat = ['product', 'finished_good', 'semi_finished', 'by_product'].includes(selectedCategory);
      if (!isProductCat) {
        handleCategoryChange('product');
      }
    } else if (txType === 'production_issue') {
      const isMaterialCat = ['material', 'raw_material', 'chemical', 'spare_part', 'packaging', 'consumable', 'fuel_energy', 'other'].includes(selectedCategory);
      if (!isMaterialCat) {
        handleCategoryChange('raw_material');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <h2 id="tx-dialog-title" className="text-base font-bold text-foreground">
                {transactionToEdit
                  ? `Chỉnh sửa phiếu ${transactionToEdit.transaction_number}`
                  : 'Lập phiếu giao dịch kho'}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {transactionToEdit
                  ? 'Cập nhật thông tin phiếu và tự động đồng bộ số dư tồn kho'
                  : 'Tạo phiếu nhập / xuất kho cập nhật trực tiếp tồn kho'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Đóng"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          {/* Hidden item_type field for zod validation */}
          <input type="hidden" {...register('item_type')} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Transaction Type */}
            <div className="space-y-1">
              <label htmlFor="transaction_type" className="text-xs font-semibold text-foreground">
                Loại giao dịch <span className="text-destructive">*</span>
              </label>
              <select
                id="transaction_type"
                {...register('transaction_type')}
                onChange={(e) => {
                  const val = e.target.value as TransactionFormValues['transaction_type'];
                  handleTransactionTypeChange(val);
                }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              >
                <option value="inbound_receipt">Nhập mua hàng (+)</option>
                <option value="production_receipt">Nhập từ sản xuất (+)</option>
                <option value="production_issue">Xuất cho sản xuất (-)</option>
                <option value="sales_dispatch">Xuất bán hàng (-)</option>
                <option value="warehouse_transfer">🔄 Chuyển kho (Xuất kho A → Nhập kho B)</option>
                <option value="inventory_adjustment">Điều chỉnh kiểm kê (±)</option>
                <option value="scrap_disposal">Xuất hủy / phế liệu (-)</option>
              </select>
              {errors.transaction_type && (
                <p className="text-[11px] text-destructive">{errors.transaction_type.message}</p>
              )}
            </div>

            {/* Granular Item Classification */}
            <div className="space-y-1">
              <label htmlFor="item_category" className="text-xs font-semibold text-foreground">
                Phân loại mặt hàng <span className="text-destructive">*</span>
              </label>
              <select
                id="item_category"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              >
                <option value="all">-- Tất cả chủng loại mặt hàng ({itemOptions.length}) --</option>
                <optgroup label="📦 Nhóm Vật tư & Phụ tùng (Materials & Parts)">
                  <option value="raw_material">Nguyên vật liệu chính (Bauxite, Đá vôi, Quặng...)</option>
                  <option value="chemical">Hóa chất công nghiệp (Xút NaOH, Vôi sống, Axit...)</option>
                  <option value="spare_part">Phụ tùng & Linh kiện cơ điện (Vòng bi, Động cơ, Bơm...)</option>
                  <option value="packaging">Vật tư bao bì & Đóng gói (Bao Jumbo, Thùng, Màng PE...)</option>
                  <option value="consumable">Vật tư tiêu hao / BHLĐ (Găng tay, Khẩu trang, Que hàn...)</option>
                  <option value="fuel_energy">Nhiên liệu & Năng lượng (Than cám, Dầu DO, Gas...)</option>
                  <option value="other">Vật tư phụ trợ khác</option>
                </optgroup>
                <optgroup label="🏭 Nhóm Sản xuất & Phụ phẩm (Production Output)">
                  <option value="finished_good">Thành phẩm sản xuất (Alumina cát mịn...)</option>
                  <option value="semi_finished">Bán thành phẩm (Nhôm Hydroxit Al(OH)3...)</option>
                  <option value="by_product">Phụ phẩm thu hồi (Bùn đỏ lắng, Xỉ quặng...)</option>
                </optgroup>
                <optgroup label="🗂️ Phân loại tổng hợp (General Categories)">
                  <option value="material">Toàn bộ vật tư & phụ tùng (materials)</option>
                  <option value="product">Toàn bộ thành phẩm (finished goods)</option>
                  <option value="semi_finished">Toàn bộ bán thành phẩm (semi-finished goods)</option>
                  <option value="byproduct">Toàn bộ phụ phẩm thu hồi (byproducts)</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Warehouse Selection: Dual warehouses for transfer, Single warehouse for normal */}
          {selectedTxType === 'warehouse_transfer' ? (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <ArrowLeftRight className="h-4 w-4" />
                <span>Thiết lập tuyến chuyển kho đối ứng</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label htmlFor="warehouse_id" className="text-xs font-semibold text-foreground">
                    Kho xuất (Từ kho - Giảm tồn) <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="warehouse_id"
                    {...register('warehouse_id')}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Chọn kho xuất --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                  {errors.warehouse_id && (
                    <p className="text-[11px] text-destructive">{errors.warehouse_id.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="destination_warehouse_id" className="text-xs font-semibold text-foreground">
                    Kho nhận (Đến kho - Tăng tồn) <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="destination_warehouse_id"
                    {...register('destination_warehouse_id')}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Chọn kho nhận --</option>
                    {warehouses
                      .filter((w) => w.id !== selectedWarehouseId)
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </option>
                      ))}
                  </select>
                  {errors.destination_warehouse_id && (
                    <p className="text-[11px] text-destructive">
                      {errors.destination_warehouse_id.message}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground italic">
                * Hệ thống sẽ tự động tạo 2 phiếu giao dịch đối ứng: Xuất chuyển tại kho nguồn và Nhập chuyển tại kho đích.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <label htmlFor="warehouse_id" className="text-xs font-semibold text-foreground">
                Kho liên quan <span className="text-destructive">*</span>
              </label>
              <select
                id="warehouse_id"
                {...register('warehouse_id')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Chọn kho --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
              {errors.warehouse_id && (
                <p className="text-[11px] text-destructive">{errors.warehouse_id.message}</p>
              )}
            </div>
          )}

          {/* Item Select */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="item_id" className="text-xs font-semibold text-foreground">
                Mặt hàng thực hiện <span className="text-destructive">*</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                {filteredItems.length} mặt hàng phù hợp
              </span>
            </div>
            <select
              id="item_id"
              {...register('item_id')}
              onChange={(e) => {
                const itemId = e.target.value;
                setValue('item_id', itemId);
                const found = itemOptions.find((i) => i.id === itemId);
                if (found) {
                  setValue('item_type', found.item_type);
                  setValue('unit_cost', found.cost);
                }
              }}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">
                {filteredItems.length > 0
                  ? `-- Chọn mặt hàng (${filteredItems.length} mặt hàng) --`
                  : '-- Không có mặt hàng nào thuộc nhóm này --'}
              </option>
              {filteredItems.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.category_label}] {item.code} - {item.name} ({item.unit})
                </option>
              ))}
            </select>
            {errors.item_id && <p className="text-[11px] text-destructive">{errors.item_id.message}</p>}

            {/* Selected Item Detail Snapshot */}
            {selectedItem && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <PackageCheck className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted-foreground">Chủng loại:</span>
                  <span className="font-semibold text-foreground">{selectedItem.category_label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Đơn vị:</span>
                  <span className="font-mono font-medium text-foreground">{selectedItem.unit}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Giá chuẩn:</span>
                  <span className="font-mono font-bold text-foreground">
                    {selectedItem.cost.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quantity */}
            <div className="space-y-1">
              <label htmlFor="quantity" className="text-xs font-semibold text-foreground">
                Số lượng {selectedItem ? `(${selectedItem.unit})` : ''} <span className="text-destructive">*</span>
              </label>
              <input
                id="quantity"
                type="number"
                step="any"
                min="0.0001"
                placeholder="VD: 50"
                {...register('quantity', { valueAsNumber: true })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.quantity && <p className="text-[11px] text-destructive">{errors.quantity.message}</p>}
            </div>

            {/* Unit Cost */}
            <div className="space-y-1">
              <label htmlFor="unit_cost" className="text-xs font-semibold text-foreground">
                Đơn giá (VNĐ)
              </label>
              <input
                id="unit_cost"
                type="number"
                step="any"
                min="0"
                placeholder="VD: 650000"
                {...register('unit_cost', { valueAsNumber: true })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.unit_cost && <p className="text-[11px] text-destructive">{errors.unit_cost.message}</p>}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label htmlFor="notes" className="text-xs font-semibold text-foreground">
              Ghi chú / Diễn giải giao dịch
            </label>
            <textarea
              id="notes"
              rows={2}
              placeholder="VD: Nhập nguyên vật liệu theo hóa đơn số #12345..."
              {...register('notes')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{transactionToEdit ? 'Lưu thay đổi' : 'Tạo phiếu giao dịch'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

