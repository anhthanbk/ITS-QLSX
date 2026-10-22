import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Truck,
  Building2,
  Warehouse as WarehouseIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import type { SalesOrder, Customer, PurchaseOrder, Supplier } from '../types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SalesDispatchCalendarProps {
  // Sales orders (kế hoạch xuất)
  salesOrders?: SalesOrder[];
  orders?: SalesOrder[]; // Backward compatibility
  customers?: Customer[];

  // Purchase orders (kế hoạch nhập)
  purchaseOrders?: PurchaseOrder[];
  suppliers?: Supplier[];

  // General controls
  isLoading?: boolean;
  canManage?: boolean; // Backward compatibility
  canManageSales?: boolean;
  canManagePurchase?: boolean;

  // Actions for Sales
  onViewDetail?: (order: SalesOrder) => void; // Backward compatibility
  onViewSalesOrder?: (order: SalesOrder) => void;
  onDispatch?: (order: SalesOrder) => void; // Backward compatibility
  onDispatchSalesOrder?: (order: SalesOrder) => void;

  // Actions for Purchase
  onViewPurchaseOrder?: (order: PurchaseOrder) => void;
  onReceivePurchaseOrder?: (order: PurchaseOrder) => void;
}

type ScheduleType = 'all' | 'dispatch' | 'receipt';

interface CalendarDayEvent {
  id: string;
  type: 'dispatch' | 'receipt';
  code: string;
  partnerName: string;
  status: string;
  carrierName?: string | null;
  vehiclePlate?: string | null;
  totalQuantity: number;
  itemCount: number;
  salesOrder?: SalesOrder;
  purchaseOrder?: PurchaseOrder;
}

export const SalesDispatchCalendar: React.FC<SalesDispatchCalendarProps> = ({
  salesOrders: propSalesOrders,
  orders: legacyOrders,
  customers = [],
  purchaseOrders = [],
  suppliers = [],
  isLoading = false,
  canManage = false,
  canManageSales: propCanManageSales,
  canManagePurchase = false,
  onViewDetail,
  onViewSalesOrder,
  onDispatch,
  onDispatchSalesOrder,
  onViewPurchaseOrder,
  onReceivePurchaseOrder,
}) => {
  // Normalize props for backward compatibility
  const effectiveSalesOrders = useMemo(
    () => propSalesOrders || legacyOrders || [],
    [propSalesOrders, legacyOrders],
  );
  const effectiveCanManageSales = propCanManageSales ?? canManage;
  const effectiveOnViewSales = onViewSalesOrder || onViewDetail;
  const effectiveOnDispatchSales = onDispatchSalesOrder || onDispatch;

  // Current month reference date
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Filter state
  const [filterType, setFilterType] = useState<ScheduleType>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [selectedCarrier, setSelectedCarrier] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Extract unique carriers from sales orders
  const carrierOptions = useMemo(() => {
    const set = new Set<string>();
    effectiveSalesOrders.forEach((o) => {
      if (o.carrier_name?.trim()) set.add(o.carrier_name.trim());
    });
    return Array.from(set);
  }, [effectiveSalesOrders]);

  // Calendar dates computation for current month grid (7 days x 5-6 weeks)
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Day of week: 0 = Sun, 1 = Mon ... Adjust for Mon = 0
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6

    const daysInMonth = lastDayOfMonth.getDate();

    // Previous month tail days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevDays: Array<{ date: Date; isCurrentMonth: boolean; key: string }> = [];
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      prevDays.push({
        date: d,
        isCurrentMonth: false,
        key: `prev-${prevMonthLastDay - i}`,
      });
    }

    // Current month days
    const currentMonthDays: Array<{ date: Date; isCurrentMonth: boolean; key: string }> = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      currentMonthDays.push({
        date: d,
        isCurrentMonth: true,
        key: `curr-${i}`,
      });
    }

    // Next month head days to fill complete 7-day rows (total 35 or 42)
    const totalFilled = prevDays.length + currentMonthDays.length;
    const totalCells = totalFilled <= 35 ? 35 : 42;
    const nextDays: Array<{ date: Date; isCurrentMonth: boolean; key: string }> = [];
    for (let i = 1; i <= totalCells - totalFilled; i++) {
      const d = new Date(year, month + 1, i);
      nextDays.push({
        date: d,
        isCurrentMonth: false,
        key: `next-${i}`,
      });
    }

    return [...prevDays, ...currentMonthDays, ...nextDays];
  }, [currentDate]);

  // Map events by target date: key is YYYY-MM-DD
  const eventsByDateMap = useMemo(() => {
    const map = new Map<string, CalendarDayEvent[]>();

    // 1. Process Sales Orders (Xuất hàng)
    if (filterType === 'all' || filterType === 'dispatch') {
      effectiveSalesOrders.forEach((so) => {
        // Filter checks
        if (selectedCustomerId !== 'all' && so.customer_id !== selectedCustomerId) return;
        if (selectedCarrier !== 'all' && so.carrier_name !== selectedCarrier) return;
        if (selectedStatus !== 'all' && so.status !== selectedStatus) return;

        const targetDateStr = so.promised_delivery_date || so.order_date;
        if (!targetDateStr) return;

        const dateKey = targetDateStr.slice(0, 10);
        const totalQty = (so.items || []).reduce(
          (acc, it) => acc + (Number(it.quantity) || 0),
          0,
        );

        const event: CalendarDayEvent = {
          id: `so-${so.id}`,
          type: 'dispatch',
          code: so.order_code,
          partnerName: so.customer?.name || 'Khách hàng',
          status: so.status,
          carrierName: so.carrier_name,
          vehiclePlate: so.vehicle_plate,
          totalQuantity: totalQty,
          itemCount: so.items?.length || 0,
          salesOrder: so,
        };

        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, event]);
      });
    }

    // 2. Process Purchase Orders (Nhập hàng)
    if (filterType === 'all' || filterType === 'receipt') {
      purchaseOrders.forEach((po) => {
        // Filter checks
        if (selectedSupplierId !== 'all' && po.supplier_id !== selectedSupplierId) return;
        if (selectedStatus !== 'all' && po.status !== selectedStatus) return;

        const targetDateStr = po.expected_delivery_date || po.order_date;
        if (!targetDateStr) return;

        const dateKey = targetDateStr.slice(0, 10);
        const totalQty = (po.items || []).reduce(
          (acc, it) => acc + (Number(it.quantity) || 0),
          0,
        );

        const event: CalendarDayEvent = {
          id: `po-${po.id}`,
          type: 'receipt',
          code: po.po_code,
          partnerName: po.supplier?.name || 'Nhà cung cấp',
          status: po.status,
          totalQuantity: totalQty,
          itemCount: po.items?.length || 0,
          purchaseOrder: po,
        };

        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, event]);
      });
    }

    return map;
  }, [
    effectiveSalesOrders,
    purchaseOrders,
    filterType,
    selectedCustomerId,
    selectedSupplierId,
    selectedCarrier,
    selectedStatus,
  ]);

  // Statistics for current selected month
  const currentMonthStats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const prefix = `${year}-${String(month).padStart(2, '0')}`;

    let dispatchCount = 0;
    let receiptCount = 0;

    eventsByDateMap.forEach((events, dateKey) => {
      if (dateKey.startsWith(prefix)) {
        events.forEach((e) => {
          if (e.type === 'dispatch') dispatchCount++;
          if (e.type === 'receipt') receiptCount++;
        });
      }
    });

    return { dispatchCount, receiptCount, totalCount: dispatchCount + receiptCount };
  }, [eventsByDateMap, currentDate]);

  const monthYearTitle = useMemo(() => {
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    return `Tháng ${month} / ${year}`;
  }, [currentDate]);

  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const getEventBadgeStyle = (event: CalendarDayEvent) => {
    if (event.type === 'dispatch') {
      // Sales Order dispatch styles
      switch (event.status) {
        case 'delivered':
        case 'shipped':
          return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
        case 'ready_to_ship':
          return 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400';
        case 'in_production':
          return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400';
        case 'confirmed':
          return 'border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400';
        case 'cancelled':
          return 'border-destructive/30 bg-destructive/10 text-destructive line-through';
        default:
          return 'border-border bg-muted/40 text-muted-foreground';
      }
    } else {
      // Purchase Order receipt styles
      switch (event.status) {
        case 'received':
          return 'border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-400';
        case 'receiving':
        case 'confirmed':
          return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400';
        case 'pending_approval':
          return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400';
        case 'cancelled':
          return 'border-destructive/30 bg-destructive/10 text-destructive line-through';
        default:
          return 'border-border bg-muted/40 text-muted-foreground';
      }
    }
  };

  const dayHeaders = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  const hasActiveFilters =
    filterType !== 'all' ||
    selectedCustomerId !== 'all' ||
    selectedSupplierId !== 'all' ||
    selectedCarrier !== 'all' ||
    selectedStatus !== 'all';

  return (
    <div className="space-y-4">
      {/* Calendar Filter & Control Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        {/* Navigation & Title */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={prevMonth}
              className="h-8 w-8 p-0"
              title="Tháng trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextMonth}
              className="h-8 w-8 p-0"
              title="Tháng sau"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={goToToday} className="h-8 text-xs font-semibold">
            Hôm nay
          </Button>

          <h3 className="text-base font-bold text-foreground capitalize flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <span>{monthYearTitle}</span>
            {isLoading && (
              <span className="text-xs text-muted-foreground font-normal animate-pulse">
                (Đang tải...)
              </span>
            )}
          </h3>

          {/* Monthly Badges */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold border border-blue-500/20">
              <ArrowUpRight className="h-3 w-3" />
              <span>{currentMonthStats.dispatchCount} xuất</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400 font-semibold border border-teal-500/20">
              <ArrowDownLeft className="h-3 w-3" />
              <span>{currentMonthStats.receiptCount} nhập</span>
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Plan Type Selector */}
          <div className="inline-flex rounded-lg border border-input p-0.5 bg-muted/40">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors',
                filterType === 'all'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setFilterType('dispatch')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1',
                filterType === 'dispatch'
                  ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <ArrowUpRight className="h-3 w-3" />
              <span>Xuất hàng (SO)</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('receipt')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1',
                filterType === 'receipt'
                  ? 'bg-teal-600 text-white shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <ArrowDownLeft className="h-3 w-3" />
              <span>Nhập hàng (PO)</span>
            </button>
          </div>

          {/* Customer filter (shown if 'all' or 'dispatch') */}
          {(filterType === 'all' || filterType === 'dispatch') && (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[150px]"
              >
                <option value="all">Tất cả Khách hàng</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Supplier filter (shown if 'all' or 'receipt') */}
          {(filterType === 'all' || filterType === 'receipt') && (
            <div className="flex items-center gap-1.5">
              <WarehouseIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[150px]"
              >
                <option value="all">Tất cả Nhà cung cấp</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Carrier filter (for sales orders) */}
          {(filterType === 'all' || filterType === 'dispatch') && (
            <div className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={selectedCarrier}
                onChange={(e) => setSelectedCarrier(e.target.value)}
                className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[150px]"
              >
                <option value="all">Tất cả ĐV Vận tải</option>
                {carrierOptions.map((carrier) => (
                  <option key={carrier} value={carrier}>
                    {carrier}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tất cả Trạng thái</option>
              <option value="confirmed">Đã duyệt / Xác nhận</option>
              <option value="in_production">Đang sản xuất</option>
              <option value="ready_to_ship">Sẵn sàng xuất giao</option>
              <option value="shipped">Đang vận chuyển</option>
              <option value="receiving">Đang nhập kho</option>
              <option value="delivered">Đã giao / Nhập đủ</option>
            </select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterType('all');
                setSelectedCustomerId('all');
                setSelectedSupplierId('all');
                setSelectedCarrier('all');
                setSelectedStatus('all');
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Đặt lại</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {dayHeaders.map((day, idx) => (
            <div key={day} className={cn('py-2.5', idx >= 5 && 'text-amber-600 dark:text-amber-400')}>
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border/60">
          {calendarGrid.map((item) => {
            const dateStr = item.date.toISOString().slice(0, 10);
            const dayEvents = eventsByDateMap.get(dateStr) || [];
            const isCurrentDate = isToday(item.date);

            return (
              <div
                key={item.key}
                className={cn(
                  'min-h-[135px] p-1.5 transition-colors flex flex-col',
                  !item.isCurrentMonth && 'bg-muted/15 text-muted-foreground/50',
                  item.isCurrentMonth && 'bg-card hover:bg-muted/10',
                  isCurrentDate && 'bg-primary/5 ring-1 ring-inset ring-primary/40',
                )}
              >
                {/* Date header */}
                <div className="flex items-center justify-between px-1 pb-1">
                  <span
                    className={cn(
                      'text-xs font-semibold rounded-full h-6 w-6 flex items-center justify-center',
                      isCurrentDate && 'bg-primary text-primary-foreground font-bold shadow-xs',
                      !item.isCurrentMonth && 'text-muted-foreground/40',
                      item.isCurrentMonth && !isCurrentDate && 'text-foreground',
                    )}
                  >
                    {item.date.getDate()}
                  </span>

                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-bold text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted">
                      {dayEvents.length} kế hoạch
                    </span>
                  )}
                </div>

                {/* Event items container */}
                <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[155px] pr-0.5">
                  {dayEvents.map((event) => {
                    const isDispatch = event.type === 'dispatch';

                    return (
                      <div
                        key={event.id}
                        onClick={() => {
                          if (isDispatch && event.salesOrder && effectiveOnViewSales) {
                            effectiveOnViewSales(event.salesOrder);
                          } else if (!isDispatch && event.purchaseOrder && onViewPurchaseOrder) {
                            onViewPurchaseOrder(event.purchaseOrder);
                          }
                        }}
                        className={cn(
                          'group cursor-pointer rounded-lg border p-1.5 text-[11px] shadow-2xs transition-all hover:shadow-xs hover:border-primary/60 text-left',
                          getEventBadgeStyle(event),
                        )}
                        title={`${isDispatch ? 'Xuất hàng (SO)' : 'Nhập hàng (PO)'}: ${event.code}\nĐối tác: ${event.partnerName}${isDispatch && event.carrierName ? `\nVận tải: ${event.carrierName}` : ''}${isDispatch && event.vehiclePlate ? `\nBiển số: ${event.vehiclePlate}` : ''}\nTổng KL: ${event.totalQuantity.toLocaleString('vi-VN')} đơn vị`}
                      >
                        {/* Row 1: Type badge, Code & Quick Action */}
                        <div className="flex items-center justify-between font-bold gap-1">
                          <div className="flex items-center gap-1 truncate">
                            <span
                              className={cn(
                                'text-[9px] font-extrabold px-1 rounded uppercase tracking-wider shrink-0',
                                isDispatch
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-teal-600 text-white',
                              )}
                            >
                              {isDispatch ? 'XUẤT' : 'NHẬP'}
                            </span>
                            <span className="truncate">{event.code}</span>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            {isDispatch &&
                              effectiveCanManageSales &&
                              event.salesOrder &&
                              event.status !== 'cancelled' &&
                              effectiveOnDispatchSales && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    effectiveOnDispatchSales(event.salesOrder!);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                                  title="Xuất kho giao hàng"
                                >
                                  <Truck className="h-3 w-3" />
                                </button>
                              )}

                            {!isDispatch &&
                              canManagePurchase &&
                              event.purchaseOrder &&
                              (event.status === 'confirmed' || event.status === 'receiving') &&
                              onReceivePurchaseOrder && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onReceivePurchaseOrder(event.purchaseOrder!);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-teal-500/20 text-teal-700 dark:text-teal-300"
                                  title="Nhập kho từ PO"
                                >
                                  <WarehouseIcon className="h-3 w-3" />
                                </button>
                              )}
                          </div>
                        </div>

                        {/* Row 2: Partner (Customer or Supplier) */}
                        <div className="truncate font-semibold text-foreground/90 pt-0.5">
                          {event.partnerName}
                        </div>

                        {/* Row 3: Carrier & Vehicle (if SO) or Items info (if PO) */}
                        {isDispatch ? (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate pt-0.5">
                            <Truck className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {event.vehiclePlate
                                ? `${event.vehiclePlate}${event.carrierName ? ` (${event.carrierName})` : ''}`
                                : event.carrierName || 'Chưa điều xe'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate pt-0.5">
                            <WarehouseIcon className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {event.itemCount} mặt hàng nguyên phụ liệu
                            </span>
                          </div>
                        )}

                        {/* Row 4: Total quantity */}
                        {event.totalQuantity > 0 && (
                          <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-foreground/80">
                            <span>Khối lượng:</span>
                            <span className="font-mono">{event.totalQuantity.toLocaleString('vi-VN')}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/80 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-foreground">Phân loại kế hoạch:</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            <span className="font-medium text-foreground">Xuất hàng (SO)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-600" />
            <span className="font-medium text-foreground">Nhập hàng (PO)</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-500" />
            <span>Đang xử lý / Đang sản xuất</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span>Sẵn sàng / Đã hoàn tất</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-destructive" />
            <span>Đã hủy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
