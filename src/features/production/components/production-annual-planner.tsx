import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Save,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Plus,
  Trash2,
  Edit3,
  Clock,
  Sparkles,
  BarChart3,
  Layers,
  Fuel,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Settings2,
  SlidersHorizontal,
  RotateCcw,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
  type ProductionLine,
  type AnnualPlanData,
  type AnnualPlanProductRow,
  type AnnualPlanMaterialRow,
  type MaterialCategoryGroup,
  type PlanStatus,
  normalizeProductType,
} from '../types';
import {
  useAnnualProductionPlan,
  useSaveAnnualProductionPlan,
  useApproveAnnualProductionPlan,
  useDeleteAnnualProductionPlan,
  ALL_LINES_PLAN_KEY,
} from '../hooks/use-production-plans';
import { useDeleteProductionLine } from '../hooks/use-production-lines';
import {
  getCalendarHours,
  calculateOperatingHours,
  computeMonthKPI,
  computeAnnualSummary,
  createDefaultTimePlan,
  computeItemNorm,
  sumMonthProductsByType,
} from '../utils/annual-plan-calc';
import { ProductionLineDialog } from './production-line-dialog';
import { PlanStatusBadge } from './production-status-badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/feedback/use-toast';

interface ProductionAnnualPlannerProps {
  lines: ProductionLine[];
  canManage?: boolean;
  canApprove?: boolean;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  unit_of_measure: string;
  product_type?: 'finished_good' | 'semi_finished' | 'by_product' | string;
}

interface MaterialOption {
  id: string;
  name: string;
  code: string;
  category: string;
  unit_of_measure: string;
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const formatNum = (val: number | null | undefined, decimals = 1): string => {
  if (val === null || val === undefined || isNaN(val) || val === 0) return '-';
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(val);
};

const getClassificationBadge = (type?: string) => {
  if (type === 'semi_finished') {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
        Bán TP
      </span>
    );
  }
  if (type === 'by_product') {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
        Phụ phẩm
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
      Thành phẩm
    </span>
  );
};

export const ProductionAnnualPlanner: React.FC<ProductionAnnualPlannerProps> = ({
  lines,
  canManage = true,
  canApprove = false,
}) => {
  const { warning, success } = useToast();
  const currentYear = new Date().getFullYear();

  // Selected filters
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedLineId, setSelectedLineId] = useState<string>(() => lines[0]?.id || '');
  const [activeLineTab, setActiveLineTab] = useState<string>(() => lines[0]?.id || 'aggregate');

  // Keep selected line updated if lines change
  useEffect(() => {
    if (!selectedLineId && lines.length > 0 && lines[0]) {
      setSelectedLineId(lines[0].id);
      if (activeLineTab !== 'aggregate') {
        setActiveLineTab(lines[0].id);
      }
    }
  }, [lines, selectedLineId, activeLineTab]);

  // Line setup & delete dialog states
  const [isLineDialogOpen, setIsLineDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<ProductionLine | null>(null);
  const [isDeleteLineDialogOpen, setIsDeleteLineDialogOpen] = useState(false);

  // Delete plan dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Unlocked edit state (allows editing even if approved)
  const [isUnlockedForEdit, setIsUnlockedForEdit] = useState(false);

  // Mutations
  const saveMutation = useSaveAnnualProductionPlan();
  const approveMutation = useApproveAnnualProductionPlan();
  const deletePlanMutation = useDeleteAnnualProductionPlan();
  const deleteLineMutation = useDeleteProductionLine();

  // Load annual plan for single line from backend
  const { data: planData, isLoading } = useAnnualProductionPlan(
    selectedYear,
    selectedLineId,
  );

  // Load comprehensive year data across ALL lines for multi-line aggregate view
  const { data: allYearData, isLoading: isLoadingAllYear } = useQuery({
    queryKey: [ALL_LINES_PLAN_KEY, selectedYear],
    queryFn: async () => {
      // 1. Fetch all monthly plans for the year
      const { data: plansData, error: plansErr } = await supabase
        .from('production_monthly_plans')
        .select(`
          id, line_id, year, month, planned_capacity_tph, planned_recovery_rate_pct,
          total_calendar_hours, planned_breakdown_hours, planned_maintenance_hours, planned_shutdown_hours,
          planned_operating_hours, target_quality_rate_pct, planned_input_material_tons,
          planned_output_product_tons, planned_byproduct_tons, status,
          production_lines ( id, code, name, designed_capacity_tph )
        `)
        .eq('year', selectedYear);

      if (plansErr) throw plansErr;
      const plans = plansData || [];
      const planIds = plans.map((p) => p.id);

      if (planIds.length === 0) {
        return {
          plans: [],
          products: [] as Array<{
            id: string;
            plan_id: string;
            product_id: string;
            planned_quantity_tons: number;
            products?: {
              id: string;
              name: string;
              sku: string;
              unit_of_measure: string;
              product_type?: string | null;
            } | null;
          }>,
          consumptions: [] as Array<{
            id: string;
            plan_id: string;
            resource_type: string;
            resource_name: string;
            unit_of_measure: string;
            planned_total_consumption: number;
          }>,
        };
      }

      // 2. Fetch products and consumptions in parallel.
      // Supabase caps responses at 1000 rows by default, so page through results
      // to make sure every line's data is included in the aggregate view.
      const PAGE_SIZE = 1000;

      const fetchAllProducts = async () => {
        const rows: unknown[] = [];
        for (let from = 0; ; from += PAGE_SIZE) {
          const { data, error } = await supabase
            .from('production_plan_products')
            .select(`
              id, plan_id, product_id, planned_quantity_tons,
              products ( id, name, sku, unit_of_measure, product_type )
            `)
            .in('plan_id', planIds)
            .order('id', { ascending: true })
            .range(from, from + PAGE_SIZE - 1);
          if (error) return { data: null, error };
          rows.push(...(data || []));
          if (!data || data.length < PAGE_SIZE) break;
        }
        return { data: rows, error: null };
      };

      const fetchAllConsumptions = async () => {
        const rows: unknown[] = [];
        for (let from = 0; ; from += PAGE_SIZE) {
          const { data, error } = await supabase
            .from('production_plan_consumptions')
            .select(`
              id, plan_id, resource_type, resource_name, unit_of_measure, planned_total_consumption
            `)
            .in('plan_id', planIds)
            .order('id', { ascending: true })
            .range(from, from + PAGE_SIZE - 1);
          if (error) return { data: null, error };
          rows.push(...(data || []));
          if (!data || data.length < PAGE_SIZE) break;
        }
        return { data: rows, error: null };
      };

      const [prodsRes, consRes] = await Promise.all([fetchAllProducts(), fetchAllConsumptions()]);

      if (prodsRes.error) throw prodsRes.error;
      if (consRes.error) throw consRes.error;

      return {
        plans,
        products: (prodsRes.data || []) as unknown as Array<{
          id: string;
          plan_id: string;
          product_id: string;
          planned_quantity_tons: number;
          products?: {
            id: string;
            name: string;
            sku: string;
            unit_of_measure: string;
            product_type?: string | null;
          } | null;
        }>,
        consumptions: (consRes.data || []) as unknown as Array<{
          id: string;
          plan_id: string;
          resource_type: string;
          resource_name: string;
          unit_of_measure: string;
          planned_total_consumption: number;
        }>,
      };
    },
    staleTime: 30 * 1000,
  });

  // Local state for single line editing
  const [products, setProducts] = useState<AnnualPlanProductRow[]>([]);
  const [materials, setMaterials] = useState<AnnualPlanMaterialRow[]>([]);
  const [timePlan, setTimePlan] = useState<Record<number, ReturnType<typeof createDefaultTimePlan>[number]>>(() =>
    createDefaultTimePlan(currentYear),
  );
  const [targetQualityPct, setTargetQualityPct] = useState<Record<number, number>>(() => {
    const q: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) q[m] = 99.0;
    return q;
  });
  const [planStatus, setPlanStatus] = useState<AnnualPlanData['status']>('draft');

  // Modals for adding products and materials
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<ProductOption[]>([]);
  const [catalogMaterials, setCatalogMaterials] = useState<MaterialOption[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState<'all' | MaterialCategoryGroup>('all');

  // Sync server data into local state when fetched
  useEffect(() => {
    const ensureElectricity = (matList: AnnualPlanMaterialRow[]): AnnualPlanMaterialRow[] => {
      const list = [...matList];
      const hasElec = list.some(
        (m) => m.materialName.toLowerCase().includes('điện') || m.materialCode === 'ELEC-POWER',
      );
      if (!hasElec) {
        const elecMonths: Record<number, number> = {};
        for (let m = 1; m <= 12; m++) elecMonths[m] = 0;
        list.push({
          materialId: 'default-electricity',
          materialName: 'Điện năng tiêu thụ (Điện sản xuất)',
          materialCode: 'ELEC-POWER',
          category: 'fuel_energy',
          categoryGroup: 'fuel',
          unitOfMeasure: 'kWh',
          months: elecMonths,
        });
      }
      return list;
    };

    if (planData) {
      setProducts(planData.products || []);
      setMaterials(ensureElectricity(planData.materials || []));
      setTimePlan(planData.timePlan || createDefaultTimePlan(selectedYear));
      setTargetQualityPct(planData.targetQualityPct || {});
      setPlanStatus(planData.status || 'draft');
      setIsUnlockedForEdit(false);
    } else {
      setTimePlan(createDefaultTimePlan(selectedYear));
      setProducts([]);
      setMaterials(ensureElectricity([]));
      setPlanStatus('draft');
      setIsUnlockedForEdit(false);
    }
  }, [planData, selectedYear, selectedLineId]);

  // Is read-only when user lacks permission OR plan is approved and not unlocked
  const isReadOnly = !canManage || (planStatus === 'approved' && !isUnlockedForEdit);

  // Load catalog options when opening modals
  const loadProductCatalog = async () => {
    setCatalogLoading(true);
    try {
      const { data } = await supabase
        .from('products')
        .select('id, name, sku, unit_of_measure, product_type')
        .eq('status', 'active')
        .order('sku');
      setCatalogProducts((data || []) as ProductOption[]);
    } catch {
      // silently fallback
    } finally {
      setCatalogLoading(false);
    }
  };

  const loadMaterialCatalog = async () => {
    setCatalogLoading(true);
    try {
      const { data } = await supabase
        .from('materials')
        .select('id, name, code, category, unit_of_measure')
        .eq('status', 'active')
        .order('code');
      setCatalogMaterials((data || []) as MaterialOption[]);
    } catch {
      // silently fallback
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleSave = () => {
    if (!selectedLineId) {
      warning('Vui lòng chọn dây chuyền sản xuất.', 'Chưa chọn dây chuyền');
      return;
    }

    const payload: AnnualPlanData = {
      year: selectedYear,
      lineId: selectedLineId,
      status: planStatus,
      products,
      materials,
      timePlan,
      targetQualityPct,
    };

    saveMutation.mutate(payload, {
      onSuccess: () => {
        setIsUnlockedForEdit(false);
      },
    });
  };

  const handleApprove = () => {
    if (!selectedLineId) return;
    approveMutation.mutate(
      { year: selectedYear, lineId: selectedLineId },
      {
        onSuccess: () => {
          setPlanStatus('approved');
          setIsUnlockedForEdit(false);
        },
      },
    );
  };

  const handleDeletePlan = async () => {
    if (!selectedLineId) return;
    await deletePlanMutation.mutateAsync({ year: selectedYear, lineId: selectedLineId });
    setIsDeleteDialogOpen(false);
    setProducts([]);
    setMaterials([]);
    setTimePlan(createDefaultTimePlan(selectedYear));
    setPlanStatus('draft');
    setIsUnlockedForEdit(false);
  };

  const handleDeleteSelectedLine = async () => {
    if (!selectedLineId) return;
    try {
      await deleteLineMutation.mutateAsync(selectedLineId);
      setIsDeleteLineDialogOpen(false);
      setActiveLineTab('aggregate');
      const remaining = lines.filter((l) => l.id !== selectedLineId);
      if (remaining.length > 0 && remaining[0]) {
        setSelectedLineId(remaining[0].id);
      } else {
        setSelectedLineId('');
      }
    } catch {
      // Handled by toast in mutation
    }
  };

  const handleResetForm = () => {
    if (planData) {
      setProducts(planData.products || []);
      setMaterials(planData.materials || []);
      setTimePlan(planData.timePlan || createDefaultTimePlan(selectedYear));
      setTargetQualityPct(planData.targetQualityPct || {});
      setPlanStatus(planData.status || 'draft');
    } else {
      setProducts([]);
      setMaterials([]);
      setTimePlan(createDefaultTimePlan(selectedYear));
      setPlanStatus('draft');
    }
    setIsUnlockedForEdit(false);
    success('Đã hoàn tác các thay đổi chưa lưu.', 'Làm mới');
  };

  // Handlers for product changes
  const handleProductMonthChange = (productId: string, month: number, value: string) => {
    const num = parseFloat(value) || 0;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.productId !== productId) return p;
        return {
          ...p,
          months: {
            ...p.months,
            [month]: num,
          },
        };
      }),
    );
  };

  const handleAddProduct = (prod: ProductOption) => {
    if (products.some((p) => p.productId === prod.id)) {
      setIsProductModalOpen(false);
      return;
    }
    const monthsInit: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) monthsInit[m] = 0;
    setProducts((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        productType: prod.product_type || 'finished_good',
        unitOfMeasure: prod.unit_of_measure || 'tấn',
        months: monthsInit,
      },
    ]);
    setIsProductModalOpen(false);
  };

  const handleRemoveProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.productId !== productId));
  };

  // Handlers for material changes
  const handleMaterialMonthChange = (materialId: string, month: number, value: string) => {
    const num = parseFloat(value) || 0;
    setMaterials((prev) =>
      prev.map((m) => {
        if (m.materialId !== materialId) return m;
        return {
          ...m,
          months: {
            ...m.months,
            [month]: num,
          },
        };
      }),
    );
  };

  const handleAddMaterial = (mat: MaterialOption) => {
    if (materials.some((m) => m.materialId === mat.id)) {
      setIsMaterialModalOpen(false);
      return;
    }
    let categoryGroup: MaterialCategoryGroup = 'material';
    if (mat.category === 'fuel_energy' || mat.category === 'fuel') {
      categoryGroup = 'fuel';
    } else if (
      ['spare_part', 'chemical', 'consumable', 'other', 'supply'].includes(mat.category)
    ) {
      categoryGroup = 'supply';
    }

    const monthsInit: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) monthsInit[m] = 0;
    setMaterials((prev) => [
      ...prev,
      {
        materialId: mat.id,
        materialName: mat.name,
        materialCode: mat.code,
        category: mat.category,
        categoryGroup,
        unitOfMeasure: mat.unit_of_measure || 'tấn',
        months: monthsInit,
      },
    ]);
    setIsMaterialModalOpen(false);
  };

  const handleRemoveMaterial = (materialId: string) => {
    setMaterials((prev) => prev.filter((m) => m.materialId !== materialId));
  };

  // Handlers for Time plan
  const handleTimeFieldChange = (
    month: number,
    field: 'maintenanceHours' | 'incidentHours' | 'plannedShutdownHours',
    val: string,
  ) => {
    const num = parseFloat(val) || 0;
    setTimePlan((prev) => {
      const current = prev[month] || {
        month,
        calendarHours: getCalendarHours(selectedYear, month),
        maintenanceHours: 0,
        incidentHours: 0,
        plannedShutdownHours: 0,
        operatingHours: getCalendarHours(selectedYear, month),
      };
      const updated = {
        ...current,
        [field]: num,
      };
      updated.operatingHours = calculateOperatingHours(
        updated.calendarHours,
        updated.maintenanceHours,
        updated.incidentHours,
        updated.plannedShutdownHours,
      );
      return {
        ...prev,
        [month]: updated,
      };
    });
  };

  // Handlers for Target Quality %
  const handleQualityChange = (month: number, val: string) => {
    const num = Math.min(100, Math.max(0, parseFloat(val) || 0));
    setTargetQualityPct((prev) => ({
      ...prev,
      [month]: num,
    }));
  };

  // Filtered catalog options
  const filteredCatalogProducts = useMemo(() => {
    if (!productSearch.trim()) return catalogProducts;
    const term = productSearch.toLowerCase().trim();
    return catalogProducts.filter(
      (p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term),
    );
  }, [catalogProducts, productSearch]);

  const filteredCatalogMaterials = useMemo(() => {
    return catalogMaterials.filter((m) => {
      if (materialSearch.trim()) {
        const term = materialSearch.toLowerCase().trim();
        if (!m.name.toLowerCase().includes(term) && !m.code.toLowerCase().includes(term)) {
          return false;
        }
      }
      if (materialCategoryFilter === 'material') {
        return m.category === 'raw_material' || m.category === 'material';
      }
      if (materialCategoryFilter === 'fuel') {
        return m.category === 'fuel_energy' || m.category === 'fuel';
      }
      if (materialCategoryFilter === 'supply') {
        return ['spare_part', 'chemical', 'consumable', 'other', 'supply'].includes(m.category);
      }
      return true;
    });
  }, [catalogMaterials, materialSearch, materialCategoryFilter]);

  // Derived Calculations for all 12 Months for single line
  const monthlyCalculations = useMemo(() => {
    return MONTHS.map((m) => {
      const t = timePlan[m] || {
        month: m,
        calendarHours: getCalendarHours(selectedYear, m),
        maintenanceHours: 0,
        incidentHours: 0,
        plannedShutdownHours: 0,
        operatingHours: getCalendarHours(selectedYear, m),
      };

      const totalProductTons = products.reduce((sum, p) => sum + (Number(p.months[m]) || 0), 0);
      const finishedProductTons = sumMonthProductsByType(products, m, 'finished_good');
      const semiFinishedTons = sumMonthProductsByType(products, m, 'semi_finished');
      const byproductTons = sumMonthProductsByType(products, m, 'by_product');

      const rawMaterialTons = materials
        .filter((mat) => mat.categoryGroup === 'material')
        .reduce((sum, mat) => sum + (Number(mat.months[m]) || 0), 0);

      const fuelConsumption = materials
        .filter((mat) => mat.categoryGroup === 'fuel')
        .reduce((sum, mat) => sum + (Number(mat.months[m]) || 0), 0);

      const supplyConsumption = materials
        .filter((mat) => mat.categoryGroup === 'supply')
        .reduce((sum, mat) => sum + (Number(mat.months[m]) || 0), 0);

      const elecMat = materials.find(
        (mat) => mat.materialCode === 'ELEC-POWER' || mat.materialName.toLowerCase().includes('điện'),
      );
      const electricityKwh = elecMat ? Number(elecMat.months[m]) || 0 : 0;

      const kpis = computeMonthKPI({
        month: m,
        calendarHours: t.calendarHours,
        maintenanceHours: t.maintenanceHours,
        incidentHours: t.incidentHours,
        plannedShutdownHours: t.plannedShutdownHours,
        operatingHours: t.operatingHours,
        rawMaterialTons,
        fuelConsumption,
        supplyConsumption,
        totalProductTons,
        finishedProductTons,
        byproductTons,
        electricityKwh,
      });

      return {
        month: m,
        time: t,
        totalProductTons,
        finishedProductTons,
        semiFinishedTons,
        byproductTons,
        rawMaterialTons,
        fuelConsumption,
        supplyConsumption,
        kpis,
      };
    });
  }, [selectedYear, products, materials, timePlan]);

  // Annual Totals and KPIs for single line
  const annualSummary = useMemo(() => {
    return computeAnnualSummary({
      products,
      materials,
      timePlan,
      targetQualityPct,
    });
  }, [products, materials, timePlan, targetQualityPct]);

  // =========================================================================
  // MULTI-LINE AGGREGATE CALCULATIONS
  // 1. Sản lượng: Cùng loại SP cộng lại, khác loại tách ra
  // 2. Thời gian: Lấy TRUNG BÌNH các chuyền
  // 3. Chất lượng: Lấy TRUNG BÌNH các chuyền
  // 4. Định mức KT-KT: Cùng loại nguyên liệu/vật tư thì TÍNH CHUNG
  // =========================================================================
  const aggregateCalculations = useMemo(() => {
    const plans = allYearData?.plans || [];
    const rawProds = allYearData?.products || [];
    const rawCons = allYearData?.consumptions || [];

    const planIdToInfo = new Map<string, { month: number; lineId: string }>();
    plans.forEach((p) => {
      planIdToInfo.set(p.id, { month: p.month, lineId: p.line_id });
    });

    // 1. Sản lượng theo loại sản phẩm: Cùng loại cộng lại, khác loại tách ra
    const productMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        productSku: string;
        productType?: string;
        unitOfMeasure: string;
        months: Record<number, number>;
        annualTotal: number;
      }
    >();

    rawProds.forEach((item) => {
      const info = planIdToInfo.get(item.plan_id);
      if (!info) return;
      const m = info.month;
      const pId = item.product_id;
      if (!productMap.has(pId)) {
        const monthsInit: Record<number, number> = {};
        MONTHS.forEach((mon) => {
          monthsInit[mon] = 0;
        });
        productMap.set(pId, {
          productId: pId,
          productName: item.products?.name || 'Sản phẩm',
          productSku: item.products?.sku || '',
          productType: normalizeProductType(item.products?.product_type),
          unitOfMeasure: item.products?.unit_of_measure || 'tấn',
          months: monthsInit,
          annualTotal: 0,
        });
      }
      const entry = productMap.get(pId)!;
      const qty = Number(item.planned_quantity_tons) || 0;
      entry.months[m] = (entry.months[m] || 0) + qty;
      entry.annualTotal += qty;
    });

    const aggregateProducts = Array.from(productMap.values());

    // Monthly & Annual Factory Total Output (tấn) by product classification
    const factoryMonthlyProductTotal: Record<number, number> = {};
    const factoryMonthlyFinishedTotal: Record<number, number> = {};
    const factoryMonthlySemiFinishedTotal: Record<number, number> = {};
    const factoryMonthlyByproductTotal: Record<number, number> = {};
    let factoryAnnualProductTotal = 0;
    let factoryAnnualFinishedTotal = 0;
    let factoryAnnualSemiFinishedTotal = 0;
    let factoryAnnualByproductTotal = 0;

    MONTHS.forEach((m) => {
      const mSum = aggregateProducts.reduce((sum, p) => sum + (p.months[m] || 0), 0);
      const mFinished = aggregateProducts
        .filter((p) => p.productType === 'finished_good')
        .reduce((sum, p) => sum + (p.months[m] || 0), 0);
      const mSemi = aggregateProducts
        .filter((p) => p.productType === 'semi_finished')
        .reduce((sum, p) => sum + (p.months[m] || 0), 0);
      const mBy = aggregateProducts
        .filter((p) => p.productType === 'by_product')
        .reduce((sum, p) => sum + (p.months[m] || 0), 0);

      factoryMonthlyProductTotal[m] = mSum;
      factoryMonthlyFinishedTotal[m] = mFinished;
      factoryMonthlySemiFinishedTotal[m] = mSemi;
      factoryMonthlyByproductTotal[m] = mBy;

      factoryAnnualProductTotal += mSum;
      factoryAnnualFinishedTotal += mFinished;
      factoryAnnualSemiFinishedTotal += mSemi;
      factoryAnnualByproductTotal += mBy;
    });

    // 2. Thời gian & Chất lượng: LẤY TRUNG BÌNH CÁC CHUYỀN
    const activeLineCount = lines.length > 0 ? lines.length : 1;
    const timeSummary = {
      calendarHours: {} as Record<number, number>,
      avgOperatingHours: {} as Record<number, number>,
      avgMaintenanceHours: {} as Record<number, number>,
      avgIncidentHours: {} as Record<number, number>,
      avgShutdownHours: {} as Record<number, number>,
      totalCalendarHours: 0,
      annualAvgOperatingHours: 0,
      annualAvgMaintenanceHours: 0,
      annualAvgIncidentHours: 0,
      annualAvgShutdownHours: 0,
    };

    const qualitySummary = {
      avgQualityPct: {} as Record<number, number>,
      annualAvgQualityPct: 0,
    };

    MONTHS.forEach((m) => {
      timeSummary.calendarHours[m] = getCalendarHours(selectedYear, m);
      timeSummary.totalCalendarHours += timeSummary.calendarHours[m];

      const monthPlans = plans.filter((p) => p.month === m);
      const count = monthPlans.length > 0 ? monthPlans.length : activeLineCount;

      const sumOp = monthPlans.reduce((sum, p) => sum + (Number(p.planned_operating_hours) || 0), 0);
      const sumMaint = monthPlans.reduce((sum, p) => sum + (Number(p.planned_maintenance_hours) || 0), 0);
      const sumInc = monthPlans.reduce((sum, p) => sum + (Number(p.planned_breakdown_hours) || 0), 0);
      const sumShut = monthPlans.reduce((sum, p) => sum + (Number(p.planned_shutdown_hours) || 0), 0);
      const sumQual = monthPlans.reduce((sum, p) => sum + (Number(p.target_quality_rate_pct) || 99), 0);

      timeSummary.avgOperatingHours[m] = sumOp / count;
      timeSummary.avgMaintenanceHours[m] = sumMaint / count;
      timeSummary.avgIncidentHours[m] = sumInc / count;
      timeSummary.avgShutdownHours[m] = sumShut / count;
      qualitySummary.avgQualityPct[m] = sumQual / count;

      timeSummary.annualAvgOperatingHours += timeSummary.avgOperatingHours[m];
      timeSummary.annualAvgMaintenanceHours += timeSummary.avgMaintenanceHours[m];
      timeSummary.annualAvgIncidentHours += timeSummary.avgIncidentHours[m];
      timeSummary.annualAvgShutdownHours += timeSummary.avgShutdownHours[m];
    });

    const qualSum = Object.values(qualitySummary.avgQualityPct).reduce((a, b) => a + b, 0);
    qualitySummary.annualAvgQualityPct = qualSum / 12;

    // 3. Vật tư & Định mức KT-KT: CÙNG LOẠI NGUYÊN LIỆU THÌ TÍNH CHUNG
    const materialMap = new Map<
      string,
      {
        materialKey: string;
        materialName: string;
        categoryGroup: MaterialCategoryGroup;
        unitOfMeasure: string;
        months: Record<number, number>;
        annualTotal: number;
      }
    >();

    const elecKey = 'fuel:điện năng tiêu thụ (điện sản xuất)';
    const elecMonthsInit: Record<number, number> = {};
    MONTHS.forEach((mon) => {
      elecMonthsInit[mon] = 0;
    });
    materialMap.set(elecKey, {
      materialKey: elecKey,
      materialName: 'Điện năng tiêu thụ (Điện sản xuất)',
      categoryGroup: 'fuel',
      unitOfMeasure: 'kWh',
      months: elecMonthsInit,
      annualTotal: 0,
    });

    rawCons.forEach((item) => {
      const info = planIdToInfo.get(item.plan_id);
      if (!info) return;
      const m = info.month;
      const isElec =
        item.resource_name.toLowerCase().includes('điện') ||
        item.resource_name.toLowerCase().includes('elec') ||
        item.resource_type === 'fuel_energy';
      const key = isElec ? elecKey : `${item.resource_type}:${item.resource_name.trim().toLowerCase()}`;

      if (!materialMap.has(key)) {
        const monthsInit: Record<number, number> = {};
        MONTHS.forEach((mon) => {
          monthsInit[mon] = 0;
        });
        let categoryGroup: MaterialCategoryGroup = 'material';
        if (item.resource_type === 'fuel' || item.resource_type === 'fuel_energy' || isElec) {
          categoryGroup = 'fuel';
        } else if (
          ['supply', 'spare_part', 'chemical', 'consumable'].includes(item.resource_type)
        ) {
          categoryGroup = 'supply';
        }

        materialMap.set(key, {
          materialKey: key,
          materialName: isElec ? 'Điện năng tiêu thụ (Điện sản xuất)' : item.resource_name,
          categoryGroup,
          unitOfMeasure: isElec ? 'kWh' : item.unit_of_measure || 'đv',
          months: monthsInit,
          annualTotal: 0,
        });
      }

      const entry = materialMap.get(key)!;
      const qty = Number(item.planned_total_consumption) || 0;
      entry.months[m] = (entry.months[m] || 0) + qty;
      entry.annualTotal += qty;
    });

    const aggregateMaterials = Array.from(materialMap.values());

    // 4. Bảng chỉ số KT-KT toàn nhà máy:
    const factoryMonthlyRawMaterial: Record<number, number> = {};
    let factoryAnnualRawMaterial = 0;
    MONTHS.forEach((m) => {
      const rawSum = aggregateMaterials
        .filter((mat) => mat.categoryGroup === 'material')
        .reduce((sum, mat) => sum + (mat.months[m] || 0), 0);
      factoryMonthlyRawMaterial[m] = rawSum;
      factoryAnnualRawMaterial += rawSum;
    });

    const factoryMonthlyElectricity: Record<number, number> = {};
    let factoryAnnualElectricity = 0;
    const elecEntry = materialMap.get(elecKey);
    MONTHS.forEach((m) => {
      const eVal = elecEntry ? (elecEntry.months[m] ?? 0) : 0;
      factoryMonthlyElectricity[m] = eVal;
      factoryAnnualElectricity += eVal;
    });

    const factoryKpis = MONTHS.map((m) => {
      const rawMat = factoryMonthlyRawMaterial[m] ?? 0;
      const finishedProd = factoryMonthlyFinishedTotal[m] ?? 0;
      const byproductProd = factoryMonthlyByproductTotal[m] ?? 0;
      const elecKwh = factoryMonthlyElectricity[m] ?? 0;
      const avgOpHours = timeSummary.avgOperatingHours[m] ?? 0;
      const calHours = timeSummary.calendarHours[m] ?? 720;
      const avgMaint = timeSummary.avgMaintenanceHours[m] ?? 0;
      const avgInc = timeSummary.avgIncidentHours[m] ?? 0;
      const avgShut = timeSummary.avgShutdownHours[m] ?? 0;

      const capacityTph = avgOpHours > 0 ? rawMat / avgOpHours : 0;
      const productivityTph = avgOpHours > 0 ? finishedProd / avgOpHours : 0;
      const recoveryPct =
        rawMat > 0 ? (finishedProd / rawMat) * 100 : 0;
      const byproductRecoveryPct =
        rawMat > 0 ? (byproductProd / rawMat) * 100 : 0;
      const electricityNorm =
        finishedProd > 0 ? elecKwh / finishedProd : 0;

      const pctOperatingHours = calHours > 0 ? (avgOpHours / calHours) * 100 : 0;
      const pctMaintenanceHours = calHours > 0 ? (avgMaint / calHours) * 100 : 0;
      const pctIncidentHours = calHours > 0 ? (avgInc / calHours) * 100 : 0;
      const pctShutdownHours = calHours > 0 ? (avgShut / calHours) * 100 : 0;

      return {
        month: m,
        capacityTph,
        productivityTph,
        recoveryPct,
        byproductRecoveryPct,
        electricityNorm,
        pctOperatingHours,
        pctMaintenanceHours,
        pctIncidentHours,
        pctShutdownHours,
      };
    });

    // Annual Factory Overall KPIs
    const annualAvgOpHours = timeSummary.annualAvgOperatingHours;
    const annualCapacityTph =
      annualAvgOpHours > 0 ? factoryAnnualRawMaterial / annualAvgOpHours : 0;
    const annualProductivityTph =
      annualAvgOpHours > 0 ? factoryAnnualFinishedTotal / annualAvgOpHours : 0;
    const annualRecoveryPct =
      factoryAnnualRawMaterial > 0
        ? (factoryAnnualFinishedTotal / factoryAnnualRawMaterial) * 100
        : 0;
    const annualByproductRecoveryPct =
      factoryAnnualRawMaterial > 0
        ? (factoryAnnualByproductTotal / factoryAnnualRawMaterial) * 100
        : 0;
    const annualElectricityNorm =
      factoryAnnualFinishedTotal > 0
        ? factoryAnnualElectricity / factoryAnnualFinishedTotal
        : 0;
    const annualPctOperatingHours =
      timeSummary.totalCalendarHours > 0
        ? (annualAvgOpHours / timeSummary.totalCalendarHours) * 100
        : 0;
    const annualPctMaintenanceHours =
      timeSummary.totalCalendarHours > 0
        ? (timeSummary.annualAvgMaintenanceHours / timeSummary.totalCalendarHours) * 100
        : 0;
    const annualPctIncidentHours =
      timeSummary.totalCalendarHours > 0
        ? (timeSummary.annualAvgIncidentHours / timeSummary.totalCalendarHours) * 100
        : 0;
    const annualPctShutdownHours =
      timeSummary.totalCalendarHours > 0
        ? (timeSummary.annualAvgShutdownHours / timeSummary.totalCalendarHours) * 100
        : 0;

    // Per-line overview comparison table
    const lineStats = lines.map((l) => {
      const plansForLine = plans.filter((p) => p.line_id === l.id);
      const linePlanIds = new Set(plansForLine.map((p) => p.id));
      const isCurrentLine = l.id === selectedLineId;
      const hasCurrentState = isCurrentLine && (products.length > 0 || materials.length > 0);

      // 1. Sản lượng thành phẩm (tấn)
      const finishedFromProds = rawProds
        .filter(
          (item) =>
            linePlanIds.has(item.plan_id) &&
            normalizeProductType(item.products?.product_type) === 'finished_good',
        )
        .reduce((sum, item) => sum + (Number(item.planned_quantity_tons) || 0), 0);

      const totalOutputTons = hasCurrentState
        ? annualSummary.annualFinishedProductTons
        : finishedFromProds > 0
          ? finishedFromProds
          : plansForLine.reduce((acc, p) => acc + (Number(p.planned_output_product_tons) || 0), 0);

      // 2. Sản lượng phụ phẩm (tấn)
      const byproductFromProds = rawProds
        .filter(
          (item) =>
            linePlanIds.has(item.plan_id) &&
            normalizeProductType(item.products?.product_type) === 'by_product',
        )
        .reduce((sum, item) => sum + (Number(item.planned_quantity_tons) || 0), 0);

      const totalByproductTons = hasCurrentState
        ? annualSummary.annualByproductTons
        : byproductFromProds > 0
          ? byproductFromProds
          : plansForLine.reduce((acc, p) => acc + (Number(p.planned_byproduct_tons) || 0), 0);

      // 3. Nguyên liệu kế hoạch (tấn)
      const rawMatFromCons = rawCons
        .filter((c) => linePlanIds.has(c.plan_id) && c.resource_type === 'material')
        .reduce((s, c) => s + (Number(c.planned_total_consumption) || 0), 0);

      const planInputTons = plansForLine.reduce(
        (acc, p) => acc + (Number(p.planned_input_material_tons) || 0),
        0,
      );

      const totalInputTons = hasCurrentState
        ? annualSummary.annualRawMaterialTons
        : planInputTons > 0
          ? planInputTons
          : rawMatFromCons;

      // 4. Giờ vận hành (h)
      const planOperatingHours = plansForLine.reduce(
        (acc, p) => acc + (Number(p.planned_operating_hours) || 0),
        0,
      );

      const totalOperatingHours = hasCurrentState
        ? annualSummary.totalOperatingHours
        : planOperatingHours;

      // 5. Thu hồi thành phẩm BQ (%): TP / Nguyên liệu * 100%
      const avgRecoveryPct =
        totalInputTons > 0 ? (totalOutputTons / totalInputTons) * 100 : 0;

      // 6. Thu hồi phụ phẩm BQ (%): Phụ phẩm / Nguyên liệu * 100%
      const byproductRecoveryPct =
        totalInputTons > 0 ? (totalByproductTons / totalInputTons) * 100 : 0;

      // 7. Năng suất BQ (t/h): TP / Giờ vận hành
      const avgProductivityTph =
        totalOperatingHours > 0 ? totalOutputTons / totalOperatingHours : 0;

      // 8. Công suất thực tế BQ (t/h): Nguyên liệu / Giờ vận hành
      const avgCapacityTph =
        totalOperatingHours > 0 ? totalInputTons / totalOperatingHours : 0;

      const status: PlanStatus | 'not_created' = plansForLine.some((p) => p.status === 'approved')
        ? 'approved'
        : plansForLine.length > 0
          ? ((plansForLine[0]?.status as PlanStatus) || 'draft')
          : hasCurrentState
            ? planStatus
            : 'not_created';

      return {
        line: l,
        totalOutputTons,
        totalByproductTons,
        totalInputTons,
        totalOperatingHours,
        avgRecoveryPct,
        byproductRecoveryPct,
        avgProductivityTph,
        avgCapacityTph,
        status,
      };
    });

    return {
      aggregateProducts,
      factoryMonthlyProductTotal,
      factoryMonthlyFinishedTotal,
      factoryMonthlySemiFinishedTotal,
      factoryMonthlyByproductTotal,
      factoryAnnualProductTotal,
      factoryAnnualFinishedTotal,
      factoryAnnualSemiFinishedTotal,
      factoryAnnualByproductTotal,
      timeSummary,
      qualitySummary,
      aggregateMaterials,
      factoryMonthlyRawMaterial,
      factoryAnnualRawMaterial,
      factoryMonthlyElectricity,
      factoryAnnualElectricity,
      factoryKpis,
      lineStats,
      annualFactoryKPI: {
        capacityTph: annualCapacityTph,
        productivityTph: annualProductivityTph,
        recoveryPct: annualRecoveryPct,
        byproductRecoveryPct: annualByproductRecoveryPct,
        electricityNorm: annualElectricityNorm,
        pctOperatingHours: annualPctOperatingHours,
        pctMaintenanceHours: annualPctMaintenanceHours,
        pctIncidentHours: annualPctIncidentHours,
        pctShutdownHours: annualPctShutdownHours,
      },
    };
  }, [allYearData, lines, selectedYear, selectedLineId, annualSummary, planStatus, products.length, materials.length]);

  // Export to CSV
  const handleExportCSV = () => {
    const selectedLine = lines.find((l) => l.id === selectedLineId);
    let csv = `BẢNG KẾ HOẠCH SẢN XUẤT NĂM ${selectedYear}\n`;
    csv += `Dây chuyền: ${selectedLine?.name || selectedLineId}\n\n`;

    // 1. Kế hoạch sản lượng
    csv += `1. KẾ HOẠCH SẢN LƯỢNG (TẤN)\n`;
    csv += `Mã SP,Tên sản phẩm,Phân loại,ĐVT,${MONTHS.map((m) => `Tháng ${m}`).join(',')},Cả năm\n`;
    products.forEach((p) => {
      const rowSum = Object.values(p.months).reduce((s, v) => s + (Number(v) || 0), 0);
      const typeLabel =
        p.productType === 'semi_finished'
          ? 'Bán thành phẩm'
          : p.productType === 'by_product'
            ? 'Phụ phẩm'
            : 'Thành phẩm';
      csv += `"${p.productSku}","${p.productName}","${typeLabel}","${p.unitOfMeasure}",${MONTHS.map((m) => p.months[m] || 0).join(',')},${rowSum}\n`;
    });
    const monthlyFinishedTotals = MONTHS.map((m) =>
      sumMonthProductsByType(products, m, 'finished_good'),
    );
    const monthlySemiTotals = MONTHS.map((m) =>
      sumMonthProductsByType(products, m, 'semi_finished'),
    );
    const monthlyByTotals = MONTHS.map((m) =>
      sumMonthProductsByType(products, m, 'by_product'),
    );
    csv += `Tổng sản lượng thành phẩm,-,-,tấn,${monthlyFinishedTotals.join(',')},${annualSummary.annualFinishedProductTons}\n`;
    csv += `Tổng sản lượng bán thành phẩm,-,-,tấn,${monthlySemiTotals.join(',')},${annualSummary.annualSemiFinishedProductTons}\n`;
    csv += `Tổng sản lượng phụ phẩm,-,-,tấn,${monthlyByTotals.join(',')},${annualSummary.annualByproductTons}\n\n`;

    // 2. Kế hoạch vật tư nguyên nhiên liệu (Không gộp tổng)
    csv += `2. KẾ HOẠCH VẬT TƯ NGUYÊN NHIÊN LIỆU\n`;
    csv += `Mã VT,Tên vật tư,Phân nhóm,ĐVT,${MONTHS.map((m) => `Tháng ${m}`).join(',')},Cả năm\n`;
    materials.forEach((m) => {
      const rowSum = Object.values(m.months).reduce((s, v) => s + (Number(v) || 0), 0);
      csv += `"${m.materialCode || ''}","${m.materialName}","${m.categoryGroup}","${m.unitOfMeasure}",${MONTHS.map((mon) => m.months[mon] || 0).join(',')},${rowSum}\n`;
    });
    csv += `\n`;

    // 3. Kế hoạch thời gian
    csv += `3. KẾ HOẠCH THỜI GIAN VẬN HÀNH (GIỜ)\n`;
    csv += `Chỉ tiêu,ĐVT,${MONTHS.map((m) => `Tháng ${m}`).join(',')},Cả năm\n`;
    csv += `Số giờ trong tháng (giờ lịch),h,${MONTHS.map((m) => timePlan[m]?.calendarHours || getCalendarHours(selectedYear, m)).join(',')},${annualSummary.totalCalendarHours}\n`;
    csv += `Giờ bảo trì,h,${MONTHS.map((m) => timePlan[m]?.maintenanceHours || 0).join(',')},${annualSummary.totalMaintenanceHours}\n`;
    csv += `Giờ sự cố,h,${MONTHS.map((m) => timePlan[m]?.incidentHours || 0).join(',')},${annualSummary.totalIncidentHours}\n`;
    csv += `Giờ nghỉ trong kế hoạch,h,${MONTHS.map((m) => timePlan[m]?.plannedShutdownHours || 0).join(',')},${annualSummary.totalShutdownHours}\n`;
    csv += `Giờ vận hành (tự tính),h,${MONTHS.map((m) => timePlan[m]?.operatingHours || 0).join(',')},${annualSummary.totalOperatingHours}\n\n`;

    // 4. Dự kiến chất lượng
    csv += `4. DỰ KIẾN CHẤT LƯỢNG (% THÀNH PHẨM)\n`;
    csv += `Chỉ tiêu,ĐVT,${MONTHS.map((m) => `Tháng ${m}`).join(',')},Cả năm\n`;
    csv += `Tỷ lệ % thành phẩm,%,${MONTHS.map((m) => (targetQualityPct[m] ?? 99).toFixed(1)).join(',')},${annualSummary.avgQualityPct.toFixed(2)}%\n\n`;

    // 5. Bảng chỉ số theo dõi kế hoạch năm & Định mức KT-KT
    csv += `5. BẢNG CHỈ SỐ THEO DÕI KẾ HOẠCH NĂM & ĐỊNH MỨC KT-KT\n`;
    csv += `Chỉ tiêu theo dõi,ĐVT,${MONTHS.map((m) => `Tháng ${m}`).join(',')},Cả năm\n`;
    csv += `Công suất,tấn/h,${monthlyCalculations.map((c) => c.kpis.capacityTph.toFixed(2)).join(',')},${annualSummary.annualKPI.capacityTph.toFixed(2)}\n`;
    csv += `Năng suất (thành phẩm),tấn/h,${monthlyCalculations.map((c) => c.kpis.productivityTph.toFixed(2)).join(',')},${annualSummary.annualKPI.productivityTph.toFixed(2)}\n`;
    csv += `Tỷ lệ thu hồi thành phẩm (%),%,${monthlyCalculations.map((c) => c.kpis.recoveryPct.toFixed(1) + '%').join(',')},${annualSummary.annualKPI.recoveryPct.toFixed(1)}%\n`;
    csv += `Tỷ lệ thu hồi phụ phẩm (%),%,${monthlyCalculations.map((c) => c.kpis.byproductRecoveryPct.toFixed(1) + '%').join(',')},${annualSummary.annualKPI.byproductRecoveryPct.toFixed(1)}%\n`;
    csv += `% Giờ vận hành,%,${monthlyCalculations.map((c) => c.kpis.pctOperatingHours.toFixed(1) + '%').join(',')},${annualSummary.annualKPI.pctOperatingHours.toFixed(1)}%\n`;
    csv += `% Giờ bảo trì,%,${monthlyCalculations.map((c) => c.kpis.pctMaintenanceHours.toFixed(1) + '%').join(',')},${annualSummary.annualKPI.pctMaintenanceHours.toFixed(1)}%\n`;
    csv += `% Giờ sự cố,%,${monthlyCalculations.map((c) => c.kpis.pctIncidentHours.toFixed(1) + '%').join(',')},${annualSummary.annualKPI.pctIncidentHours.toFixed(1)}%\n`;
    csv += `% Giờ nghỉ kế hoạch,%,${monthlyCalculations.map((c) => c.kpis.pctShutdownHours.toFixed(1) + '%').join(',')},${annualSummary.annualKPI.pctShutdownHours.toFixed(1)}%\n`;

    // Dynamic Material Norms in CSV
    const effectiveFinishedYear = annualSummary.annualFinishedProductTons;

    materials.forEach((mat) => {
      const isMat = mat.categoryGroup === 'material';
      const annualMatTotal = Object.values(mat.months).reduce((s, v) => s + (Number(v) || 0), 0);
      const annualNorm = computeItemNorm(
        annualMatTotal,
        mat.categoryGroup,
        effectiveFinishedYear,
      );
      const mNorms = MONTHS.map((m) => {
        const mQty = Number(mat.months[m]) || 0;
        const mProdTons = sumMonthProductsByType(products, m, 'finished_good');
        return computeItemNorm(mQty, mat.categoryGroup, mProdTons).toFixed(isMat ? 3 : 2);
      });
      const isElec =
        mat.materialName.toLowerCase().includes('điện') || mat.materialCode === 'ELEC-POWER';
      const label = isElec ? 'Định mức tiêu hao điện' : `Định mức ${mat.materialName}`;
      csv += `"${label}","${mat.unitOfMeasure}/tấn TP",${mNorms.join(',')},${annualNorm.toFixed(isMat ? 3 : 2)}\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Ke_hoach_san_xuat_${selectedLine?.code || 'LINE'}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedLine = lines.find((l) => l.id === selectedLineId);

  return (
    <div className="space-y-6">
      {/* 1. Header & Main Toolbar */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">
              {activeLineTab === 'aggregate'
                ? `Kế hoạch sản xuất năm ${selectedYear} - Tất cả dây chuyền (Tổng hợp)`
                : `Kế hoạch sản xuất năm ${selectedYear} - ${selectedLine?.name || 'Dây chuyền'}`}
            </h2>
            {activeLineTab !== 'aggregate' && <PlanStatusBadge status={planStatus} />}
            {canManage ? (
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                Quyền lập kế hoạch (Trưởng phòng SX / Admin)
              </span>
            ) : (
              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                Chế độ chỉ xem
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {activeLineTab === 'aggregate'
              ? 'Tổng hợp sản lượng (cộng dồn theo loại SP), thời gian & chất lượng bình quân và định mức KT-KT toàn nhà máy'
              : 'Cấp độ Trưởng phòng sản xuất / Quản trị viên nhập kế hoạch sản lượng, vật tư nguyên nhiên liệu, thời gian vận hành và chất lượng từng tháng'}
          </p>
        </div>

        {/* Filter Controls: Year & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year selector */}
          <div className="flex items-center rounded-lg border border-border bg-background px-2 py-1 shadow-sm">
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y - 1)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              title="Năm trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-sm font-semibold text-foreground">{selectedYear}</span>
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y + 1)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              title="Năm sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Action buttons for single line */}
          {activeLineTab !== 'aggregate' && (
            <>
              {/* Unlock edit button if approved */}
              {canManage && planStatus === 'approved' && !isUnlockedForEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setIsUnlockedForEdit(true);
                    success(`Đã mở khóa chỉnh sửa kế hoạch năm ${selectedYear}.`, 'Sửa kế hoạch');
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors shadow-sm"
                  title="Mở khóa để chỉnh sửa kế hoạch đã duyệt"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Sửa kế hoạch</span>
                </button>
              )}

              {/* Reset button */}
              {canManage && isUnlockedForEdit && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors shadow-sm"
                  title="Hủy các thay đổi và làm mới"
                >
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                  <span className="hidden sm:inline">Hủy sửa</span>
                </button>
              )}

              {/* Delete Plan Button */}
              {canManage && (
                <button
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors shadow-sm"
                  title="Xóa toàn bộ kế hoạch năm này"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Xóa kế hoạch</span>
                </button>
              )}

              {/* Export CSV */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors shadow-sm"
                title="Xuất file CSV"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span className="hidden sm:inline">Xuất CSV</span>
              </button>

              {/* Print */}
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors shadow-sm"
                title="In kế hoạch"
              >
                <Printer className="h-4 w-4 text-muted-foreground" />
                <span className="hidden sm:inline">In</span>
              </button>

              {/* Approve button */}
              {canApprove && planStatus !== 'approved' && (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Phê duyệt</span>
                </button>
              )}

              {/* Save button */}
              {canManage && (!isReadOnly || isUnlockedForEdit) && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{saveMutation.isPending ? 'Đang lưu...' : 'Lưu kế hoạch'}</span>
                </button>
              )}
            </>
          )}

          {/* Action buttons for Aggregate tab */}
          {activeLineTab === 'aggregate' && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors shadow-sm"
              title="In bảng tổng hợp"
            >
              <Printer className="h-4 w-4 text-muted-foreground" />
              <span>In tổng hợp</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Line Multi-Selection & Line Configuration Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-border bg-muted/30 p-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Dây chuyền:
          </span>

          {/* All lines (Aggregate) tab */}
          <button
            type="button"
            onClick={() => setActiveLineTab('aggregate')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
              activeLineTab === 'aggregate'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-background border border-border text-foreground hover:bg-muted',
            )}
          >
            Tất cả dây chuyền (Tổng hợp)
          </button>

          {/* Individual line buttons */}
          {lines.map((l) => {
            const isActive = activeLineTab === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  setSelectedLineId(l.id);
                  setActiveLineTab(l.id);
                }}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-background border border-border text-foreground hover:bg-muted',
                )}
              >
                <span>{l.code} - {l.name}</span>
              </button>
            );
          })}
        </div>

        {/* Line Setup & Delete Line Actions */}
        {canManage && (
          <div className="flex items-center gap-2">
            {activeLineTab !== 'aggregate' && selectedLine && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingLine(selectedLine);
                    setIsLineDialogOpen(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
                  title="Chỉnh sửa thông số công suất / ca của dây chuyền hiện tại"
                >
                  <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Sửa thông số line</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDeleteLineDialogOpen(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-destructive/20 bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors shadow-sm"
                  title="Xóa dây chuyền sản xuất này"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Xóa line</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setEditingLine(null);
                setIsLineDialogOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors shadow-sm"
              title="Tự thiết lập thêm dây chuyền sản xuất mới"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thiết lập line mới</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW TẤT CẢ DÂY CHUYỀN (TỔNG HỢP) */}
      {activeLineTab === 'aggregate' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {isLoadingAllYear ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
              <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-xs text-muted-foreground">Đang tổng hợp dữ liệu các dây chuyền...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Metric Overview Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Tổng sản lượng toàn nhà máy</span>
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-primary">
                    {formatNum(aggregateCalculations.factoryAnnualFinishedTotal, 1)}{' '}
                    <span className="text-sm font-normal">tấn</span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Chỉ tính thành phẩm các dây chuyền
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Tổng nguyên liệu tiêu thụ</span>
                    <Fuel className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-amber-600">
                    {formatNum(aggregateCalculations.factoryAnnualRawMaterial, 1)}{' '}
                    <span className="text-sm font-normal">tấn</span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Tổng nhu cầu nguyên liệu toàn nhà máy
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Giờ vận hành bình quân/line</span>
                    <Clock className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-emerald-600">
                    {formatNum(aggregateCalculations.timeSummary.annualAvgOperatingHours, 0)}{' '}
                    <span className="text-sm font-normal">h</span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Trung bình các dây chuyền trong năm
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Chất lượng bình quân</span>
                    <Sparkles className="h-4 w-4 text-teal-600" />
                  </div>
                  <div className="mt-2 text-2xl font-black text-teal-600">
                    {aggregateCalculations.qualitySummary.annualAvgQualityPct.toFixed(2)}%
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Trung bình tỷ lệ thành phẩm đạt chuẩn
                  </div>
                </div>
              </div>

              {/* 1. KẾ HOẠCH SẢN LƯỢNG TOÀN NHÀ MÁY (CÙNG LOẠI CỘNG LẠI, KHÁC LOẠI TÁCH RA) */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border bg-muted/40 p-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">
                      1. Tổng hợp Kế hoạch Sản lượng toàn nhà máy năm {selectedYear}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sản lượng từng tháng của các chuyền cộng lại nếu cùng loại sản phẩm, tách riêng từng dòng nếu khác loại sản phẩm
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-muted-foreground">
                        <th className="sticky left-0 z-10 bg-muted/95 px-3 py-2.5 font-semibold min-w-[200px]">
                          Loại sản phẩm
                        </th>
                        <th className="px-2 py-2 font-medium text-center w-14">ĐVT</th>
                        <th className="px-3 py-2 font-bold text-right min-w-[84px] bg-primary/10 text-primary">
                          Cả năm
                        </th>
                        {MONTHS.map((m) => (
                          <th key={m} className="px-1.5 py-2 font-medium text-center min-w-[56px]">
                            T{m}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {aggregateCalculations.aggregateProducts.length === 0 ? (
                        <tr>
                          <td colSpan={15} className="py-8 text-center text-xs text-muted-foreground italic">
                            Chưa có sản lượng nào được lập trên các dây chuyền trong năm {selectedYear}.
                          </td>
                        </tr>
                      ) : (
                        aggregateCalculations.aggregateProducts.map((p) => (
                          <tr key={p.productId} className="hover:bg-muted/10 transition-colors">
                            <td className="sticky left-0 z-10 bg-card px-3 py-2 font-semibold text-foreground">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{p.productSku || p.productName}</span>
                                {getClassificationBadge(p.productType)}
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center text-muted-foreground">{p.unitOfMeasure}</td>
                            <td className="px-3 py-2 text-right font-black text-foreground bg-primary/5">
                              {formatNum(p.annualTotal)}
                            </td>
                            {MONTHS.map((m) => (
                              <td key={m} className="px-1.5 py-2 text-center font-medium text-foreground">
                                {formatNum(p.months[m])}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}

                      {/* 1. Tổng sản lượng Thành phẩm */}
                      <tr className="border-t-2 border-border bg-emerald-500/10 font-bold text-emerald-800 dark:text-emerald-300">
                        <td className="sticky left-0 z-10 bg-emerald-500/15 px-3 py-2">
                          TỔNG THÀNH PHẨM TOÀN NHÀ MÁY
                        </td>
                        <td className="px-2 py-2 text-center">tấn</td>
                        <td className="px-3 py-2 text-right font-black bg-emerald-500/20">
                          {formatNum(aggregateCalculations.factoryAnnualFinishedTotal)}
                        </td>
                        {MONTHS.map((m) => (
                          <td key={m} className="px-1.5 py-2 text-center font-black">
                            {formatNum(aggregateCalculations.factoryMonthlyFinishedTotal[m])}
                          </td>
                        ))}
                      </tr>

                      {/* 2. Tổng sản lượng Bán thành phẩm */}
                      <tr className="bg-amber-500/10 font-bold text-amber-800 dark:text-amber-300">
                        <td className="sticky left-0 z-10 bg-amber-500/15 px-3 py-2">
                          TỔNG BÁN THÀNH PHẨM TOÀN NHÀ MÁY
                        </td>
                        <td className="px-2 py-2 text-center">tấn</td>
                        <td className="px-3 py-2 text-right font-black bg-amber-500/20">
                          {formatNum(aggregateCalculations.factoryAnnualSemiFinishedTotal)}
                        </td>
                        {MONTHS.map((m) => (
                          <td key={m} className="px-1.5 py-2 text-center font-black">
                            {formatNum(aggregateCalculations.factoryMonthlySemiFinishedTotal[m])}
                          </td>
                        ))}
                      </tr>

                      {/* 3. Tổng sản lượng Phụ phẩm */}
                      <tr className="bg-purple-500/10 font-bold text-purple-800 dark:text-purple-300">
                        <td className="sticky left-0 z-10 bg-purple-500/15 px-3 py-2">
                          TỔNG PHỤ PHẨM TOÀN NHÀ MÁY
                        </td>
                        <td className="px-2 py-2 text-center">tấn</td>
                        <td className="px-3 py-2 text-right font-black bg-purple-500/20">
                          {formatNum(aggregateCalculations.factoryAnnualByproductTotal)}
                        </td>
                        {MONTHS.map((m) => (
                          <td key={m} className="px-1.5 py-2 text-center font-black">
                            {formatNum(aggregateCalculations.factoryMonthlyByproductTotal[m])}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. KẾ HOẠCH VẬT TƯ NGUYÊN NHIÊN LIỆU TOÀN NHÀ MÁY (KHÔNG GỘP TỔNG) */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border bg-muted/40 p-4">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-foreground">
                      2. Tổng hợp Kế hoạch Vật tư & Nguyên nhiên liệu toàn nhà máy năm {selectedYear}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tổng hợp nhu cầu từng loại vật tư, nguyên liệu và nhiên liệu cộng dồn từ tất cả các dây chuyền
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-muted-foreground">
                        <th className="sticky left-0 z-10 bg-muted/95 px-3 py-2.5 font-semibold min-w-[200px]">
                          Vật tư / Nguyên liệu
                        </th>
                        <th className="px-2 py-2 font-medium text-center w-20">Phân nhóm</th>
                        <th className="px-2 py-2 font-medium text-center w-14">ĐVT</th>
                        <th className="px-3 py-2 font-bold text-right min-w-[84px] bg-amber-500/10 text-amber-700 dark:text-amber-400">
                          Cả năm
                        </th>
                        {MONTHS.map((m) => (
                          <th key={m} className="px-1.5 py-2 font-medium text-center min-w-[56px]">
                            T{m}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {aggregateCalculations.aggregateMaterials.length === 0 ? (
                        <tr>
                          <td colSpan={16} className="py-8 text-center text-xs text-muted-foreground italic">
                            Chưa có vật tư nguyên nhiên liệu nào được khai báo trên các dây chuyền trong năm {selectedYear}.
                          </td>
                        </tr>
                      ) : (
                        aggregateCalculations.aggregateMaterials.map((mat) => {
                          const groupLabel =
                            mat.categoryGroup === 'material'
                              ? 'Nguyên liệu'
                              : mat.categoryGroup === 'fuel'
                                ? 'Nhiên liệu'
                                : 'Vật tư phụ';
                          const badgeClass =
                            mat.categoryGroup === 'material'
                              ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                              : mat.categoryGroup === 'fuel'
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';

                          return (
                            <tr key={mat.materialKey} className="hover:bg-muted/10 transition-colors">
                              <td className="sticky left-0 z-10 bg-card px-3 py-2.5 font-semibold text-foreground">
                                {mat.materialName}
                              </td>
                              <td className="px-2 py-2 text-center">
                                <span className={cn('inline-block rounded px-1.5 py-0.5 text-[10px] font-medium', badgeClass)}>
                                  {groupLabel}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center text-muted-foreground">{mat.unitOfMeasure}</td>
                              <td className="px-3 py-2 text-right font-black text-amber-600 dark:text-amber-400 bg-amber-500/5">
                                {formatNum(mat.annualTotal)}
                              </td>
                              {MONTHS.map((m) => (
                                <td key={m} className="px-1.5 py-2 text-center font-medium text-foreground">
                                  {formatNum(mat.months[m])}
                                </td>
                              ))}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. KẾ HOẠCH THỜI GIAN (LẤY TRUNG BÌNH CÁC CHUYỀN) */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border bg-muted/40 p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-foreground">
                      3. Kế hoạch thời gian (Lấy trung bình các dây chuyền)
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Số giờ vận hành, sự cố, bảo dưỡng, nghỉ trong kế hoạch được tính trung bình các chuyền cho từng tháng
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-muted-foreground">
                        <th className="sticky left-0 z-10 bg-muted/95 px-3 py-2 font-medium min-w-[200px]">
                          Chỉ tiêu thời gian bình quân
                        </th>
                        <th className="px-2 py-2 font-medium text-center w-14">ĐVT</th>
                        <th className="px-3 py-2 font-bold text-right min-w-[84px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          Cả năm
                        </th>
                        {MONTHS.map((m) => (
                          <th key={m} className="px-1.5 py-2 font-medium text-center min-w-[56px]">
                            T{m}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {/* Giờ lịch */}
                      <tr className="bg-muted/10 font-medium">
                        <td className="sticky left-0 z-10 bg-muted/40 px-3 py-2 text-foreground">
                          Số giờ trong tháng (giờ lịch)
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">h</td>
                        <td className="px-3 py-2 text-right font-bold bg-indigo-500/5">
                          {aggregateCalculations.timeSummary.totalCalendarHours}
                        </td>
                        {MONTHS.map((m) => (
                          <td key={m} className="px-1.5 py-2 text-center font-semibold">
                            {aggregateCalculations.timeSummary.calendarHours[m]}
                          </td>
                        ))}
                      </tr>

                      {/* Giờ bảo trì bình quân */}
                      <tr>
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 text-foreground">
                          Giờ bảo trì (trung bình các chuyền)
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">h</td>
                        <td className="px-3 py-2 text-right font-bold bg-indigo-500/5">
                          {formatNum(aggregateCalculations.timeSummary.annualAvgMaintenanceHours, 1)}
                        </td>
                        {MONTHS.map((m) => (
                          <td key={m} className="px-1.5 py-2 text-center text-foreground font-medium">
                            {formatNum(aggregateCalculations.timeSummary.avgMaintenanceHours[m], 1)}
                          </td>
                        ))}
                      </tr>

                      {/* Giờ sự cố bình quân */}
                      <tr>
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 text-foreground">
                          Giờ sự cố (trung bình các chuyền)
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">h</td>
                        <td className="px-3 py-2 text-right font-bold bg-indigo-500/5">
                          {formatNum(aggregateCalculations.timeSummary.annualAvgIncidentHours, 1)}
                        </td>
                        {MONTHS.map((m) => (
                          <td key={m} className="px-1.5 py-2 text-center text-foreground font-medium">
                            {formatNum(aggregateCalculations.timeSummary.avgIncidentHours[m], 1)}
                          </td>
                        ))}
                      </tr>

                      {/* Giờ nghỉ bình quân */}
                      <tr>
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 text-foreground">
                          Giờ nghỉ trong KH (trung bình các chuyền)
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">h</td>
                        <td className="px-3 py-2 text-right font-bold bg-indigo-500/5">
                          {formatNum(aggregateCalculations.timeSummary.annualAvgShutdownHours, 1)}
                        </td>
                        {MONTHS.map((m) => (
                          <td key={m} className="px-1.5 py-2 text-center text-foreground font-medium">
                            {formatNum(aggregateCalculations.timeSummary.avgShutdownHours[m], 1)}
                          </td>
                        ))}
                      </tr>

                      {/* Giờ vận hành bình quân */}
                      <tr className="border-t-2 border-border bg-emerald-500/10 font-bold text-emerald-900 dark:text-emerald-200">
                        <td className="sticky left-0 z-10 bg-emerald-500/20 px-3 py-2.5">
                          Giờ vận hành (trung bình các chuyền)
                        </td>
                        <td className="px-2 py-2 text-center">h</td>
                        <td className="px-3 py-2 text-right font-black text-emerald-700 dark:text-emerald-300 bg-emerald-500/20">
                          {formatNum(aggregateCalculations.timeSummary.annualAvgOperatingHours, 1)}
                        </td>
                        {MONTHS.map((m) => (
                          <td key={m} className="px-1.5 py-2 text-center text-emerald-700 dark:text-emerald-300 font-bold">
                            {formatNum(aggregateCalculations.timeSummary.avgOperatingHours[m], 1)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. DỰ KIẾN CHẤT LƯỢNG (BẢNG NẰM NGANG NGAY DƯỚI BẢNG THỜI GIAN) */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border bg-muted/40 p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <h3 className="text-sm font-bold text-foreground">
                      4. Dự kiến chất lượng (% thành phẩm - Trung bình các dây chuyền)
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tỷ lệ % thành phẩm đạt chất lượng trung bình của các dây chuyền trong từng tháng
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-muted-foreground">
                        <th className="sticky left-0 z-10 bg-muted/95 px-3 py-2 font-medium min-w-[200px]">
                          Chỉ tiêu chất lượng
                        </th>
                        <th className="px-2 py-2 font-medium text-center w-14">ĐVT</th>
                        <th className="px-3 py-2 font-bold text-right min-w-[84px] bg-teal-500/10 text-teal-700 dark:text-teal-300">
                          Cả năm
                        </th>
                        {MONTHS.map((m) => (
                          <th key={m} className="px-1.5 py-2 font-medium text-center min-w-[56px]">
                            T{m}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-muted/10 transition-colors">
                        <td className="sticky left-0 z-10 bg-card px-3 py-2.5 font-semibold text-foreground">
                          Tỷ lệ thành phẩm đạt chuẩn bình quân
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground font-medium">%</td>
                        <td className="px-3 py-2 text-right font-black text-teal-700 dark:text-teal-300 bg-teal-500/10">
                          {aggregateCalculations.qualitySummary.annualAvgQualityPct > 0
                            ? `${aggregateCalculations.qualitySummary.annualAvgQualityPct.toFixed(2)}%`
                            : '-'}
                        </td>
                        {MONTHS.map((m) => {
                          const val = aggregateCalculations.qualitySummary.avgQualityPct[m] ?? 0;
                          return (
                            <td key={m} className="px-1.5 py-2 text-center font-bold text-foreground">
                              {val > 0 ? `${val.toFixed(1)}%` : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. BẢNG CHỈ SỐ THEO DÕI & ĐỊNH MỨC KT-KT TÍNH CHUNG TOÀN NHÀ MÁY */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex flex-col gap-1 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">
                      5. Bảng chỉ số theo dõi & Định mức Kinh tế - Kỹ thuật toàn nhà máy năm {selectedYear}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Định mức = (Tổng tiêu hao vật tư * hệ số) / (Tổng thành phẩm toàn nhà máy * 0.955)
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                        <th className="sticky left-0 z-10 bg-muted/95 px-3 py-2.5 font-semibold min-w-[200px]">
                          Chỉ tiêu theo dõi & Định mức
                        </th>
                        <th className="px-2 py-2 font-medium text-center w-20">ĐVT</th>
                        <th className="px-3 py-2 font-bold text-right min-w-[84px] bg-primary/10 text-primary">
                          Cả năm
                        </th>
                        {MONTHS.map((m) => (
                          <th key={m} className="px-1.5 py-2 font-medium text-center min-w-[56px]">
                            T{m}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {/* A. Năng lực & Thu hồi */}
                      <tr className="bg-muted/40 font-semibold text-foreground">
                        <td colSpan={15} className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-primary">
                          A. Nhóm chỉ tiêu Năng lực & Thu hồi toàn nhà máy
                        </td>
                      </tr>

                      {/* Công suất */}
                      <tr className="hover:bg-muted/10 transition-colors">
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 font-semibold text-foreground">
                          Công suất (toàn nhà máy)
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">tấn/h</td>
                        <td className="px-3 py-2 text-right font-black text-primary bg-primary/5">
                          {formatNum(aggregateCalculations.annualFactoryKPI.capacityTph, 2)}
                        </td>
                        {aggregateCalculations.factoryKpis.map((kpi) => (
                          <td key={kpi.month} className="px-1.5 py-2 text-center font-semibold text-foreground">
                            {formatNum(kpi.capacityTph, 2)}
                          </td>
                        ))}
                      </tr>

                      {/* Năng suất */}
                      <tr className="hover:bg-muted/10 transition-colors">
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 font-semibold text-foreground">
                          Năng suất (toàn nhà máy)
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">tấn/h</td>
                        <td className="px-3 py-2 text-right font-black text-primary bg-primary/5">
                          {formatNum(aggregateCalculations.annualFactoryKPI.productivityTph, 2)}
                        </td>
                        {aggregateCalculations.factoryKpis.map((kpi) => (
                          <td key={kpi.month} className="px-1.5 py-2 text-center font-semibold text-foreground">
                            {formatNum(kpi.productivityTph, 2)}
                          </td>
                        ))}
                      </tr>

                      {/* Tỷ lệ thu hồi thành phẩm */}
                      <tr className="hover:bg-muted/10 transition-colors bg-primary/5">
                        <td className="sticky left-0 z-10 bg-primary/10 px-3 py-2 font-semibold text-primary">
                          Tỷ lệ thu hồi thành phẩm (%)
                        </td>
                        <td className="px-2 py-2 text-center text-primary font-bold">%</td>
                        <td className="px-3 py-2 text-right font-black text-primary bg-primary/15">
                          {aggregateCalculations.annualFactoryKPI.recoveryPct > 0
                            ? `${aggregateCalculations.annualFactoryKPI.recoveryPct.toFixed(1)}%`
                            : '-'}
                        </td>
                        {aggregateCalculations.factoryKpis.map((kpi) => (
                          <td key={kpi.month} className="px-1.5 py-2 text-center font-bold text-primary">
                            {kpi.recoveryPct > 0 ? `${kpi.recoveryPct.toFixed(1)}%` : '-'}
                          </td>
                        ))}
                      </tr>

                      {/* Tỷ lệ thu hồi phụ phẩm */}
                      <tr className="hover:bg-muted/10 transition-colors bg-purple-500/5">
                        <td className="sticky left-0 z-10 bg-purple-500/10 px-3 py-2 font-semibold text-purple-800 dark:text-purple-300">
                          Tỷ lệ thu hồi phụ phẩm (%)
                        </td>
                        <td className="px-2 py-2 text-center text-purple-700 dark:text-purple-300 font-bold">%</td>
                        <td className="px-3 py-2 text-right font-black text-purple-700 dark:text-purple-300 bg-purple-500/15">
                          {aggregateCalculations.annualFactoryKPI.byproductRecoveryPct > 0
                            ? `${aggregateCalculations.annualFactoryKPI.byproductRecoveryPct.toFixed(1)}%`
                            : '-'}
                        </td>
                        {aggregateCalculations.factoryKpis.map((kpi) => (
                          <td key={kpi.month} className="px-1.5 py-2 text-center font-bold text-purple-700 dark:text-purple-300">
                            {kpi.byproductRecoveryPct > 0 ? `${kpi.byproductRecoveryPct.toFixed(1)}%` : '-'}
                          </td>
                        ))}
                      </tr>

                      {/* B. Cơ cấu thời gian */}
                      <tr className="bg-muted/40 font-semibold text-foreground">
                        <td colSpan={15} className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                          B. Cơ cấu thời gian bình quân đối với tổng giờ tháng
                        </td>
                      </tr>

                      {/* % Giờ vận hành */}
                      <tr className="hover:bg-muted/10 transition-colors">
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 text-foreground font-medium">
                          % Giờ vận hành bình quân
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">%</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-primary/5">
                          {aggregateCalculations.annualFactoryKPI.pctOperatingHours.toFixed(1)}%
                        </td>
                        {aggregateCalculations.factoryKpis.map((kpi) => (
                          <td key={kpi.month} className="px-1.5 py-2 text-center font-medium text-emerald-600 dark:text-emerald-400">
                            {kpi.pctOperatingHours > 0 ? `${kpi.pctOperatingHours.toFixed(1)}%` : '-'}
                          </td>
                        ))}
                      </tr>

                      {/* % Giờ bảo trì */}
                      <tr className="hover:bg-muted/10 transition-colors">
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 text-foreground font-medium">
                          % Giờ bảo trì bình quân
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">%</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground bg-primary/5">
                          {aggregateCalculations.annualFactoryKPI.pctMaintenanceHours.toFixed(1)}%
                        </td>
                        {aggregateCalculations.factoryKpis.map((kpi) => (
                          <td key={kpi.month} className="px-1.5 py-2 text-center font-medium text-muted-foreground">
                            {kpi.pctMaintenanceHours > 0 ? `${kpi.pctMaintenanceHours.toFixed(1)}%` : '-'}
                          </td>
                        ))}
                      </tr>

                      {/* % Giờ sự cố */}
                      <tr className="hover:bg-muted/10 transition-colors">
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 text-foreground font-medium">
                          % Giờ sự cố bình quân
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">%</td>
                        <td className="px-3 py-2 text-right font-bold text-amber-600 bg-primary/5">
                          {aggregateCalculations.annualFactoryKPI.pctIncidentHours.toFixed(1)}%
                        </td>
                        {aggregateCalculations.factoryKpis.map((kpi) => (
                          <td key={kpi.month} className="px-1.5 py-2 text-center font-medium text-amber-600">
                            {kpi.pctIncidentHours > 0 ? `${kpi.pctIncidentHours.toFixed(1)}%` : '-'}
                          </td>
                        ))}
                      </tr>

                      {/* C. Định mức Kinh tế - Kỹ thuật */}
                      <tr className="bg-muted/40 font-semibold text-foreground">
                        <td colSpan={15} className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-amber-600 dark:text-amber-400">
                          C. Định mức Kinh tế - Kỹ thuật
                        </td>
                      </tr>

                      {aggregateCalculations.aggregateMaterials.length === 0 ? (
                        <tr>
                          <td colSpan={15} className="py-4 text-center text-xs text-muted-foreground italic">
                            Chưa có dữ liệu vật tư để tính định mức kinh tế kỹ thuật chung toàn nhà máy.
                          </td>
                        </tr>
                      ) : (
                        aggregateCalculations.aggregateMaterials.map((mat) => {
                          const isMaterial = mat.categoryGroup === 'material';
                          const isElec =
                            mat.materialName.toLowerCase().includes('điện') ||
                            mat.materialKey.includes('fuel:điện');
                          const normLabel = isElec
                            ? 'Định mức tiêu hao điện'
                            : `Định mức ${mat.materialName}`;
                          const normUnit = isElec ? 'kWh/tấn TP' : `${mat.unitOfMeasure}/tấn TP`;
                          const annualNorm = computeItemNorm(
                            mat.annualTotal,
                            mat.categoryGroup,
                            aggregateCalculations.factoryAnnualFinishedTotal,
                          );

                          return (
                            <tr key={`agg-norm-${mat.materialKey}`} className="hover:bg-muted/10 transition-colors">
                              <td className="sticky left-0 z-10 bg-card px-3 py-2 font-semibold text-foreground">
                                <div className="flex items-center gap-2">
                                  <span>{normLabel}</span>
                                  <span
                                    className={cn(
                                      'rounded px-1.5 py-0.5 text-[9px] font-semibold',
                                      mat.categoryGroup === 'material'
                                        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                        : mat.categoryGroup === 'fuel'
                                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                                    )}
                                  >
                                    {mat.categoryGroup === 'material'
                                      ? 'Nguyên liệu'
                                      : mat.categoryGroup === 'fuel'
                                        ? 'Nhiên liệu'
                                        : 'Vật tư phụ'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center text-muted-foreground text-[11px] font-medium">
                                {normUnit}
                              </td>
                              <td className="px-3 py-2 text-right font-black text-amber-600 dark:text-amber-400 bg-primary/5">
                                {formatNum(annualNorm, isMaterial ? 3 : 2)}
                              </td>
                              {MONTHS.map((m) => {
                                const mQty = mat.months[m] || 0;
                                const mFinishedTons = aggregateCalculations.factoryMonthlyFinishedTotal[m] ?? 0;
                                const mNorm = computeItemNorm(mQty, mat.categoryGroup, mFinishedTons);
                                return (
                                  <td key={m} className="px-1.5 py-2 text-center font-semibold text-foreground">
                                    {formatNum(mNorm, isMaterial ? 3 : 2)}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* FORMULAS & NOTES CARD */}
                <div className="border-t border-border bg-muted/20 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Công thức xác định các chỉ tiêu theo dõi & Định mức Kinh tế - Kỹ thuật tính chung
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                      <div className="font-semibold text-primary text-[11px] uppercase tracking-wide">
                        A. Năng lực & Thu hồi (Toàn nhà máy)
                      </div>
                      <ul className="space-y-1.5 text-muted-foreground text-[11px]">
                        <li>
                          <strong className="text-foreground">Công suất (tấn/h):</strong>{' '}
                          <code>Tổng nguyên liệu / Giờ vận hành BQ</code>
                        </li>
                        <li>
                          <strong className="text-foreground">Năng suất (tấn/h):</strong>{' '}
                          <code>Tổng thành phẩm / Giờ vận hành BQ</code>
                        </li>
                        <li>
                          <strong className="text-foreground">Tỷ lệ thu hồi TP (%):</strong>{' '}
                          <code>(Tổng thành phẩm / Tổng nguyên liệu) * 100%</code>
                        </li>
                        <li>
                          <strong className="text-foreground">Tỷ lệ thu hồi phụ phẩm (%):</strong>{' '}
                          <code>(Tổng phụ phẩm / Tổng nguyên liệu) * 100%</code>
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                      <div className="font-semibold text-indigo-600 dark:text-indigo-400 text-[11px] uppercase tracking-wide">
                        B. Cơ cấu thời gian (Trung bình các chuyền)
                      </div>
                      <ul className="space-y-1.5 text-muted-foreground text-[11px]">
                        <li>
                          <strong className="text-foreground">% Giờ vận hành:</strong>{' '}
                          <code>(Giờ vận hành BQ / Giờ lịch) * 100%</code>
                        </li>
                        <li>
                          <strong className="text-foreground">% Giờ bảo trì:</strong>{' '}
                          <code>(Giờ bảo trì BQ / Giờ lịch) * 100%</code>
                        </li>
                        <li>
                          <strong className="text-foreground">% Giờ sự cố:</strong>{' '}
                          <code>(Giờ sự cố BQ / Giờ lịch) * 100%</code>
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                      <div className="font-semibold text-amber-600 dark:text-amber-400 text-[11px] uppercase tracking-wide">
                        C. Định mức Kinh tế - Kỹ thuật
                      </div>
                      <ul className="space-y-1.5 text-muted-foreground text-[11px]">
                        <li>
                          <strong className="text-foreground">Định mức tiêu hao điện:</strong>{' '}
                          <code>Tổng tiêu hao điện (kWh) / Tổng TP toàn nhà máy</code>
                        </li>
                        <li>
                          <strong className="text-foreground">Định mức nguyên liệu:</strong>{' '}
                          <code>Tổng tiêu hao / Tổng TP toàn nhà máy</code>
                        </li>
                        <li>
                          <strong className="text-foreground">Định mức nhiên liệu & vật tư:</strong>{' '}
                          <code>Tổng tiêu hao / Tổng TP toàn nhà máy</code>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table: So sánh tiến độ & chỉ số giữa các Dây chuyền */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="border-b border-border bg-muted/40 p-4">
                  <h3 className="text-sm font-bold text-foreground">
                    Bảng so sánh Kế hoạch & Trạng thái giữa các Dây chuyền năm {selectedYear}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-muted-foreground">
                        <th className="px-3 py-2.5 font-semibold">Dây chuyền</th>
                        <th className="px-2 py-2 font-semibold text-center" title="Công suất thực tế bình quân (tấn nguyên liệu / giờ vận hành)">
                          Công suất TT (t/h)
                        </th>
                        <th className="px-2 py-2 font-semibold text-right">Sản lượng TP (tấn)</th>
                        <th className="px-2 py-2 font-semibold text-right">Nguyên liệu KH (tấn)</th>
                        <th className="px-2 py-2 font-semibold text-right">Giờ vận hành (h)</th>
                        <th className="px-2 py-2 font-semibold text-center">Năng suất BQ (t/h)</th>
                        <th className="px-2 py-2 font-semibold text-center">Thu hồi TP BQ (%)</th>
                        <th className="px-2 py-2 font-semibold text-center text-purple-700 dark:text-purple-300">
                          Thu hồi phụ phẩm (%)
                        </th>
                        <th className="px-2 py-2 font-semibold text-center">Trạng thái</th>
                        <th className="px-3 py-2 font-semibold text-center w-28">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {aggregateCalculations.lineStats.map((stat) => (
                        <tr key={stat.line.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-3 py-2.5 font-bold text-foreground">
                            <div>{stat.line.name}</div>
                            <div className="text-[10px] text-muted-foreground">{stat.line.code}</div>
                          </td>
                          <td className="px-2 py-2 text-center text-foreground font-semibold">
                            {formatNum(stat.avgCapacityTph, 2)}
                          </td>
                          <td className="px-2 py-2 text-right font-bold text-primary">
                            {formatNum(stat.totalOutputTons)}
                          </td>
                          <td className="px-2 py-2 text-right text-foreground font-semibold">
                            {formatNum(stat.totalInputTons)}
                          </td>
                          <td className="px-2 py-2 text-right text-foreground font-semibold">
                            {formatNum(stat.totalOperatingHours, 0)}
                          </td>
                          <td className="px-2 py-2 text-center text-foreground">
                            {formatNum(stat.avgProductivityTph, 2)}
                          </td>
                          <td className="px-2 py-2 text-center font-bold text-primary">
                            {stat.avgRecoveryPct > 0 ? `${stat.avgRecoveryPct.toFixed(1)}%` : '-'}
                          </td>
                          <td className="px-2 py-2 text-center font-bold text-purple-700 dark:text-purple-300">
                            {stat.byproductRecoveryPct > 0 ? `${stat.byproductRecoveryPct.toFixed(1)}%` : '-'}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {stat.status === 'not_created' ? (
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                Chưa lập KH
                              </span>
                            ) : (
                              <PlanStatusBadge status={stat.status} />
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLineId(stat.line.id);
                                setActiveLineTab(stat.line.id);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Chi tiết</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* SINGLE LINE ANNUAL PLANNER (Sections 1 to 5) */}
      {activeLineTab !== 'aggregate' && (
        <>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
              <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-xs text-muted-foreground">Đang tải kế hoạch năm...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* SECTION 1: KẾ HOẠCH SẢN LƯỢNG */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex flex-col gap-2 border-b border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        1. Kế hoạch sản lượng (12 tháng trong năm)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Chọn sản phẩm và nhập kế hoạch sản lượng từng tháng để tính tổng sản lượng năm của từng loại sản phẩm
                      </p>
                    </div>
                  </div>

                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        loadProductCatalog();
                        setIsProductModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors self-start sm:self-auto"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Chọn sản phẩm</span>
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-muted-foreground">
                        <th className="sticky left-0 z-10 bg-muted/90 px-3 py-2 font-medium min-w-[180px]">
                          Loại sản phẩm (SKU)
                        </th>
                        <th className="px-2 py-2 font-medium text-center w-14">ĐVT</th>
                        <th className="px-3 py-2 font-semibold text-right min-w-[84px] bg-primary/5 text-primary">
                          Cả năm
                        </th>
                        {MONTHS.map((m) => (
                          <th key={m} className="px-1 py-2 font-medium text-center min-w-[54px]">
                            T{m}
                          </th>
                        ))}
                        {!isReadOnly && <th className="px-2 py-2 text-center w-8"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {products.length === 0 ? (
                        <tr>
                          <td
                            colSpan={16}
                            className="py-8 text-center text-xs text-muted-foreground italic"
                          >
                            Chưa có sản phẩm nào trong kế hoạch. Bấm nút "+ Chọn sản phẩm" để thêm sản phẩm vào kế hoạch.
                          </td>
                        </tr>
                      ) : (
                        products.map((prod) => {
                          const rowTotal = Object.values(prod.months).reduce(
                            (acc, val) => acc + (Number(val) || 0),
                            0,
                          );
                          return (
                            <tr key={prod.productId} className="hover:bg-muted/10 transition-colors">
                              <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium text-foreground">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold">{prod.productSku || prod.productName}</span>
                                  {getClassificationBadge(prod.productType)}
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center text-muted-foreground">
                                {prod.unitOfMeasure}
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-foreground bg-primary/5">
                                {formatNum(rowTotal)}
                              </td>
                              {MONTHS.map((m) => (
                                <td key={m} className="p-0.5">
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={prod.months[m] ?? 0}
                                    disabled={isReadOnly}
                                    onChange={(e) =>
                                      handleProductMonthChange(prod.productId, m, e.target.value)
                                    }
                                    className="w-full h-7 rounded border border-border bg-background px-1 text-center text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted/30"
                                  />
                                </td>
                              ))}
                              {!isReadOnly && (
                                <td className="px-1 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveProduct(prod.productId)}
                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                    title="Xóa sản phẩm này"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}

                      {/* 1. Tổng sản lượng Thành phẩm */}
                      {products.length > 0 && (
                        <tr className="border-t-2 border-border bg-emerald-500/10 font-bold text-emerald-800 dark:text-emerald-300">
                          <td className="sticky left-0 z-10 bg-emerald-500/15 px-3 py-2">
                            Tổng sản lượng thành phẩm
                          </td>
                          <td className="px-2 py-2 text-center">tấn</td>
                          <td className="px-3 py-2 text-right font-black bg-emerald-500/20">
                            {formatNum(annualSummary.annualFinishedProductTons)}
                          </td>
                          {MONTHS.map((m) => {
                            const mFinished = sumMonthProductsByType(products, m, 'finished_good');
                            return (
                              <td key={m} className="px-1 py-2 text-center font-bold">
                                {formatNum(mFinished)}
                              </td>
                            );
                          })}
                          {!isReadOnly && <td></td>}
                        </tr>
                      )}

                      {/* 2. Tổng sản lượng Bán thành phẩm */}
                      {products.length > 0 && (
                        <tr className="bg-amber-500/10 font-bold text-amber-800 dark:text-amber-300">
                          <td className="sticky left-0 z-10 bg-amber-500/15 px-3 py-2">
                            Tổng sản lượng bán thành phẩm
                          </td>
                          <td className="px-2 py-2 text-center">tấn</td>
                          <td className="px-3 py-2 text-right font-black bg-amber-500/20">
                            {formatNum(annualSummary.annualSemiFinishedProductTons)}
                          </td>
                          {MONTHS.map((m) => {
                            const mSemi = sumMonthProductsByType(products, m, 'semi_finished');
                            return (
                              <td key={m} className="px-1 py-2 text-center font-bold">
                                {formatNum(mSemi)}
                              </td>
                            );
                          })}
                          {!isReadOnly && <td></td>}
                        </tr>
                      )}

                      {/* 3. Tổng sản lượng Phụ phẩm */}
                      {products.length > 0 && (
                        <tr className="bg-purple-500/10 font-bold text-purple-800 dark:text-purple-300">
                          <td className="sticky left-0 z-10 bg-purple-500/15 px-3 py-2">
                            Tổng sản lượng phụ phẩm
                          </td>
                          <td className="px-2 py-2 text-center">tấn</td>
                          <td className="px-3 py-2 text-right font-black bg-purple-500/20">
                            {formatNum(annualSummary.annualByproductTons)}
                          </td>
                          {MONTHS.map((m) => {
                            const mBy = sumMonthProductsByType(products, m, 'by_product');
                            return (
                              <td key={m} className="px-1 py-2 text-center font-bold">
                                {formatNum(mBy)}
                              </td>
                            );
                          })}
                          {!isReadOnly && <td></td>}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 2: KẾ HOẠCH VẬT TƯ NGUYÊN NHIÊN LIỆU (BỎ TỔNG GỘP) */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex flex-col gap-2 border-b border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                      <Fuel className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        2. Kế hoạch vật tư, nguyên nhiên liệu (12 tháng trong năm)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Chọn nguyên liệu, nhiên liệu, vật tư và nhập kế hoạch tiêu hao 12 tháng (hiển thị riêng từng loại, không gộp tổng)
                      </p>
                    </div>
                  </div>

                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        loadMaterialCatalog();
                        setIsMaterialModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors self-start sm:self-auto"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Chọn vật tư / nguyên liệu</span>
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-muted-foreground">
                        <th className="sticky left-0 z-10 bg-muted/90 px-3 py-2 font-medium min-w-[180px]">
                          Vật tư / Nguyên liệu
                        </th>
                        <th className="px-2 py-2 font-medium text-center w-20">Phân nhóm</th>
                        <th className="px-2 py-2 font-medium text-center w-14">ĐVT</th>
                        <th className="px-3 py-2 font-semibold text-right min-w-[84px] bg-amber-500/5 text-amber-700 dark:text-amber-400">
                          Cả năm
                        </th>
                        {MONTHS.map((m) => (
                          <th key={m} className="px-1 py-2 font-medium text-center min-w-[54px]">
                            T{m}
                          </th>
                        ))}
                        {!isReadOnly && <th className="px-2 py-2 text-center w-8"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {materials.length === 0 ? (
                        <tr>
                          <td
                            colSpan={17}
                            className="py-8 text-center text-xs text-muted-foreground italic"
                          >
                            Chưa có nguyên vật liệu nào. Bấm nút "+ Chọn vật tư / nguyên liệu" để thêm vào kế hoạch.
                          </td>
                        </tr>
                      ) : (
                        materials.map((mat) => {
                          const rowTotal = Object.values(mat.months).reduce(
                            (acc, val) => acc + (Number(val) || 0),
                            0,
                          );
                          const groupLabel =
                            mat.categoryGroup === 'material'
                              ? 'Nguyên liệu'
                              : mat.categoryGroup === 'fuel'
                                ? 'Nhiên liệu'
                                : 'Vật tư phụ';
                          const badgeClass =
                            mat.categoryGroup === 'material'
                              ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                              : mat.categoryGroup === 'fuel'
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
                          const isElectricity = mat.materialId === 'default-electricity';

                          return (
                            <tr key={mat.materialId} className="hover:bg-muted/10 transition-colors">
                              <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium text-foreground">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span>{mat.materialName}</span>
                                  {isElectricity && (
                                    <span className="inline-block rounded bg-primary/10 text-primary border border-primary/20 px-1 py-0.2 text-[9px] font-semibold">
                                      Mặc định
                                    </span>
                                  )}
                                </div>
                                {mat.materialCode && (
                                  <div className="text-[10px] text-muted-foreground">
                                    {mat.materialCode}
                                  </div>
                                )}
                              </td>
                              <td className="px-2 py-2 text-center">
                                <span
                                  className={cn(
                                    'inline-block rounded px-1.5 py-0.5 text-[10px] font-medium',
                                    badgeClass,
                                  )}
                                >
                                  {groupLabel}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center text-muted-foreground">
                                {mat.unitOfMeasure}
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-foreground bg-amber-500/5">
                                {formatNum(rowTotal)}
                              </td>
                              {MONTHS.map((m) => (
                                <td key={m} className="p-0.5">
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={mat.months[m] ?? 0}
                                    disabled={isReadOnly}
                                    onChange={(e) =>
                                      handleMaterialMonthChange(mat.materialId, m, e.target.value)
                                    }
                                    className="w-full h-7 rounded border border-border bg-background px-1 text-center text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted/30"
                                  />
                                </td>
                              ))}
                              {!isReadOnly && (
                                <td className="px-1 py-2 text-center">
                                  {isElectricity ? (
                                    <span className="text-[10px] text-muted-foreground italic" title="Điện tiêu hao là mục mặc định của kế hoạch">
                                      —
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMaterial(mat.materialId)}
                                      className="text-muted-foreground hover:text-destructive transition-colors"
                                      title="Xóa vật tư này"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 3: KẾ HOẠCH THỜI GIAN */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 border-b border-border bg-muted/40 p-4">
                  <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      3. Kế hoạch thời gian (12 tháng trong năm)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Tự động tính số giờ lịch, nhập giờ bảo trì/sự cố/nghỉ để tính Giờ vận hành
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-muted-foreground">
                        <th className="sticky left-0 z-10 bg-muted/90 px-3 py-2 font-medium min-w-[180px]">
                          Chỉ tiêu thời gian
                        </th>
                        <th className="px-2 py-2 font-medium text-center w-14">ĐVT</th>
                        <th className="px-3 py-2 font-semibold text-right min-w-[84px] bg-indigo-500/5 text-indigo-600 dark:text-indigo-400">
                          Cả năm
                        </th>
                        {MONTHS.map((m) => (
                          <th key={m} className="px-1 py-2 font-medium text-center min-w-[54px]">
                            T{m}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {/* Row 1: Tổng số giờ lịch (tự tính) */}
                      <tr className="bg-muted/10 font-medium">
                        <td className="sticky left-0 z-10 bg-muted/40 px-3 py-2 text-foreground">
                          Số giờ trong tháng (giờ lịch)
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">h</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground bg-indigo-500/5">
                          {annualSummary.totalCalendarHours}
                        </td>
                        {MONTHS.map((m) => (
                          <td key={m} className="px-1 py-2 text-center text-foreground font-semibold">
                            {timePlan[m]?.calendarHours || getCalendarHours(selectedYear, m)}
                          </td>
                        ))}
                      </tr>

                      {/* Row 2: Giờ bảo trì (nhập) */}
                      <tr>
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 text-foreground">
                          Giờ bảo trì
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">h</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground bg-indigo-500/5">
                          {formatNum(annualSummary.totalMaintenanceHours)}
                        </td>
                        {MONTHS.map((m) => (
                          <td key={m} className="p-0.5">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={timePlan[m]?.maintenanceHours ?? 0}
                              disabled={isReadOnly}
                              onChange={(e) =>
                                handleTimeFieldChange(m, 'maintenanceHours', e.target.value)
                              }
                              className="w-full h-7 rounded border border-border bg-background px-1 text-center text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted/30"
                            />
                          </td>
                        ))}
                      </tr>

                      {/* Row 3: Giờ sự cố (nhập) */}
                      <tr>
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 text-foreground">
                          Giờ sự cố
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">h</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground bg-indigo-500/5">
                          {formatNum(annualSummary.totalIncidentHours)}
                        </td>
                        {MONTHS.map((m) => (
                          <td key={m} className="p-0.5">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={timePlan[m]?.incidentHours ?? 0}
                              disabled={isReadOnly}
                              onChange={(e) =>
                                handleTimeFieldChange(m, 'incidentHours', e.target.value)
                              }
                              className="w-full h-7 rounded border border-border bg-background px-1 text-center text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted/30"
                            />
                          </td>
                        ))}
                      </tr>

                      {/* Row 4: Giờ nghỉ trong kế hoạch (nhập) */}
                      <tr>
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 text-foreground">
                          Giờ nghỉ trong kế hoạch
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">h</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground bg-indigo-500/5">
                          {formatNum(annualSummary.totalShutdownHours)}
                        </td>
                        {MONTHS.map((m) => (
                          <td key={m} className="p-0.5">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={timePlan[m]?.plannedShutdownHours ?? 0}
                              disabled={isReadOnly}
                              onChange={(e) =>
                                handleTimeFieldChange(m, 'plannedShutdownHours', e.target.value)
                              }
                              className="w-full h-7 rounded border border-border bg-background px-1 text-center text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted/30"
                            />
                          </td>
                        ))}
                      </tr>

                      {/* Row 5: Giờ vận hành (tự động tính = Tổng - Bảo trì - Sự cố - Nghỉ) */}
                      <tr className="border-t-2 border-border bg-emerald-500/10 font-bold text-emerald-900 dark:text-emerald-200">
                        <td className="sticky left-0 z-10 bg-emerald-500/20 px-3 py-2.5">
                          Giờ vận hành (tự tính)
                        </td>
                        <td className="px-2 py-2 text-center">h</td>
                        <td className="px-3 py-2 text-right font-black text-emerald-700 dark:text-emerald-300 bg-emerald-500/20">
                          {formatNum(annualSummary.totalOperatingHours, 0)}
                        </td>
                        {MONTHS.map((m) => {
                          const op = timePlan[m]?.operatingHours ?? 0;
                          const isNegative = op <= 0;
                          return (
                            <td
                              key={m}
                              className={cn(
                                'px-1 py-2 text-center font-bold',
                                isNegative ? 'text-destructive font-black' : 'text-emerald-700 dark:text-emerald-300',
                              )}
                            >
                              {formatNum(op, 0)}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 4: DỰ KIẾN CHẤT LƯỢNG (BẢNG NẰM NGANG NGAY DƯỚI BẢNG THỜI GIAN) */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 border-b border-border bg-muted/40 p-4">
                  <div className="rounded-lg bg-teal-500/10 p-2 text-teal-600 dark:text-teal-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      4. Dự kiến chất lượng (% thành phẩm - 12 tháng trong năm)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Nhập tỉ lệ % thành phẩm đạt chất lượng theo từng tháng
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-muted-foreground">
                        <th className="sticky left-0 z-10 bg-muted/90 px-3 py-2 font-medium min-w-[180px]">
                          Chỉ tiêu chất lượng
                        </th>
                        <th className="px-2 py-2 font-medium text-center w-14">ĐVT</th>
                        <th className="px-3 py-2 font-semibold text-right min-w-[84px] bg-teal-500/10 text-teal-700 dark:text-teal-300">
                          Cả năm
                        </th>
                        {MONTHS.map((m) => (
                          <th key={m} className="px-1 py-2 font-medium text-center min-w-[54px]">
                            T{m}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-muted/10 transition-colors">
                        <td className="sticky left-0 z-10 bg-card px-3 py-2.5 font-semibold text-foreground">
                          Dự kiến tỷ lệ chất lượng (% thành phẩm đạt)
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground font-medium">%</td>
                        <td className="px-3 py-2 text-right font-black text-teal-700 dark:text-teal-300 bg-teal-500/10">
                          {annualSummary.avgQualityPct.toFixed(2)}%
                        </td>
                        {MONTHS.map((m) => (
                          <td key={m} className="p-0.5">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={targetQualityPct[m] ?? 99.0}
                              disabled={isReadOnly}
                              onChange={(e) => handleQualityChange(m, e.target.value)}
                              className="w-full h-7 rounded border border-border bg-background px-1 text-center text-xs font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-muted/30"
                            />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 5: BẢNG CHỈ SỐ THEO DÕI & ĐỊNH MỨC KT-KT */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex flex-col gap-1 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">
                      5. Bảng chỉ số theo dõi kế hoạch năm & Định mức Kinh tế - Kỹ thuật
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tổng hợp công suất, năng suất, tỷ lệ thu hồi thành phẩm, cơ cấu thời gian và định mức tiêu hao từng loại nguyên nhiên vật liệu
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                        <th className="sticky left-0 z-10 bg-muted/95 px-3 py-2.5 font-semibold min-w-[200px]">
                          Chỉ tiêu theo dõi & Định mức
                        </th>
                        <th className="px-2 py-2 font-medium text-center w-20">ĐVT</th>
                        <th className="px-3 py-2 font-bold text-right min-w-[84px] bg-primary/10 text-primary">
                          Cả năm
                        </th>
                        {MONTHS.map((m) => (
                          <th key={m} className="px-1 py-2 font-medium text-center min-w-[54px]">
                            T{m}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {/* Category Header: Năng lực & Sản lượng */}
                      <tr className="bg-muted/40 font-semibold text-foreground">
                        <td colSpan={15} className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-primary">
                          A. Nhóm chỉ tiêu Năng lực & Thu hồi
                        </td>
                      </tr>

                      {/* 1. Công suất: nguyên liệu * 0.95 / giờ vận hành */}
                      <tr className="hover:bg-muted/10 transition-colors">
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 font-semibold text-foreground">
                          Công suất
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground font-medium">tấn/h</td>
                        <td className="px-3 py-2 text-right font-black text-primary bg-primary/5">
                          {formatNum(annualSummary.annualKPI.capacityTph, 2)}
                        </td>
                        {monthlyCalculations.map((c) => (
                          <td key={c.month} className="px-1 py-2 text-center font-semibold text-foreground">
                            {formatNum(c.kpis.capacityTph, 2)}
                          </td>
                        ))}
                      </tr>

                      {/* 2. Năng suất: thành phẩm * 0.955 / giờ vận hành */}
                      <tr className="hover:bg-muted/10 transition-colors">
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 font-semibold text-foreground">
                          Năng suất
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground font-medium">tấn/h</td>
                        <td className="px-3 py-2 text-right font-black text-primary bg-primary/5">
                          {formatNum(annualSummary.annualKPI.productivityTph, 2)}
                        </td>
                        {monthlyCalculations.map((c) => (
                          <td key={c.month} className="px-1 py-2 text-center font-semibold text-foreground">
                            {formatNum(c.kpis.productivityTph, 2)}
                          </td>
                        ))}
                      </tr>

                      {/* 3. Tỷ lệ thu hồi % chuẩn thực tế */}
                      <tr className="hover:bg-muted/10 transition-colors bg-primary/5">
                        <td className="sticky left-0 z-10 bg-primary/10 px-3 py-2 font-semibold text-primary">
                          Tỷ lệ thu hồi thành phẩm (%)
                        </td>
                        <td className="px-2 py-2 text-center text-primary font-bold">%</td>
                        <td className="px-3 py-2 text-right font-black text-primary bg-primary/15">
                          {annualSummary.annualKPI.recoveryPct > 0
                            ? `${annualSummary.annualKPI.recoveryPct.toFixed(1)}%`
                            : '-'}
                        </td>
                        {monthlyCalculations.map((c) => (
                          <td key={c.month} className="px-1 py-2 text-center font-bold text-primary">
                            {c.kpis.recoveryPct > 0 ? `${c.kpis.recoveryPct.toFixed(1)}%` : '-'}
                          </td>
                        ))}
                      </tr>

                      {/* 4. Tỷ lệ thu hồi phụ phẩm */}
                      <tr className="hover:bg-muted/10 transition-colors bg-purple-500/5">
                        <td className="sticky left-0 z-10 bg-purple-500/10 px-3 py-2 font-semibold text-purple-800 dark:text-purple-300">
                          Tỷ lệ thu hồi phụ phẩm (%)
                        </td>
                        <td className="px-2 py-2 text-center text-purple-700 dark:text-purple-300 font-bold">%</td>
                        <td className="px-3 py-2 text-right font-black text-purple-700 dark:text-purple-300 bg-purple-500/15">
                          {annualSummary.annualKPI.byproductRecoveryPct > 0
                            ? `${annualSummary.annualKPI.byproductRecoveryPct.toFixed(1)}%`
                            : '-'}
                        </td>
                        {monthlyCalculations.map((c) => (
                          <td key={c.month} className="px-1 py-2 text-center font-bold text-purple-700 dark:text-purple-300">
                            {c.kpis.byproductRecoveryPct > 0 ? `${c.kpis.byproductRecoveryPct.toFixed(1)}%` : '-'}
                          </td>
                        ))}
                      </tr>

                      {/* Category Header: Cơ cấu thời gian */}
                      <tr className="bg-muted/40 font-semibold text-foreground">
                        <td colSpan={15} className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                          B. Cơ cấu thời gian đối với tổng giờ tháng
                        </td>
                      </tr>

                      {/* % Giờ vận hành */}
                      <tr className="hover:bg-muted/10 transition-colors">
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 text-foreground font-medium">
                          % Giờ vận hành
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">%</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-primary/5">
                          {annualSummary.annualKPI.pctOperatingHours.toFixed(1)}%
                        </td>
                        {monthlyCalculations.map((c) => (
                          <td key={c.month} className="px-1 py-2 text-center font-medium text-emerald-600 dark:text-emerald-400">
                            {c.kpis.pctOperatingHours > 0 ? `${c.kpis.pctOperatingHours.toFixed(1)}%` : '-'}
                          </td>
                        ))}
                      </tr>

                      {/* % Giờ bảo trì */}
                      <tr className="hover:bg-muted/10 transition-colors">
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 text-foreground font-medium">
                          % Giờ bảo trì
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">%</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground bg-primary/5">
                          {annualSummary.annualKPI.pctMaintenanceHours.toFixed(1)}%
                        </td>
                        {monthlyCalculations.map((c) => (
                          <td key={c.month} className="px-1 py-2 text-center font-medium text-muted-foreground">
                            {c.kpis.pctMaintenanceHours > 0 ? `${c.kpis.pctMaintenanceHours.toFixed(1)}%` : '-'}
                          </td>
                        ))}
                      </tr>

                      {/* % Giờ sự cố */}
                      <tr className="hover:bg-muted/10 transition-colors">
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 text-foreground font-medium">
                          % Giờ sự cố
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">%</td>
                        <td className="px-3 py-2 text-right font-bold text-amber-600 bg-primary/5">
                          {annualSummary.annualKPI.pctIncidentHours.toFixed(1)}%
                        </td>
                        {monthlyCalculations.map((c) => (
                          <td key={c.month} className="px-1 py-2 text-center font-medium text-amber-600">
                            {c.kpis.pctIncidentHours > 0 ? `${c.kpis.pctIncidentHours.toFixed(1)}%` : '-'}
                          </td>
                        ))}
                      </tr>

                      {/* % Giờ nghỉ trong kế hoạch */}
                      <tr className="hover:bg-muted/10 transition-colors">
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 text-foreground font-medium">
                          % Giờ nghỉ trong kế hoạch
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">%</td>
                        <td className="px-3 py-2 text-right font-bold text-foreground bg-primary/5">
                          {annualSummary.annualKPI.pctShutdownHours.toFixed(1)}%
                        </td>
                        {monthlyCalculations.map((c) => (
                          <td key={c.month} className="px-1 py-2 text-center font-medium text-muted-foreground">
                            {c.kpis.pctShutdownHours > 0 ? `${c.kpis.pctShutdownHours.toFixed(1)}%` : '-'}
                          </td>
                        ))}
                      </tr>

                      {/* Category Header: Định mức Kinh tế Kỹ thuật */}
                      <tr className="bg-muted/40 font-semibold text-foreground">
                        <td colSpan={15} className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-amber-600 dark:text-amber-400">
                          C. Định mức Kinh tế - Kỹ thuật (chi tiết theo từng loại nguyên nhiên vật liệu)
                        </td>
                      </tr>

                      {/* Dynamic Material Norm Rows */}
                      {materials.length === 0 ? (
                        <tr>
                          <td
                            colSpan={15}
                            className="py-4 text-center text-xs text-muted-foreground italic"
                          >
                            Chưa có vật tư nguyên nhiên liệu. Thêm vật tư ở mục 2 để hiển thị định mức KT-KT tương ứng.
                          </td>
                        </tr>
                      ) : (
                        materials.map((mat) => {
                          const isMaterial = mat.categoryGroup === 'material';
                          const isElec =
                            mat.materialName.toLowerCase().includes('điện') ||
                            mat.materialCode === 'ELEC-POWER';
                          const normLabel = isElec
                            ? 'Định mức tiêu hao điện'
                            : `Định mức ${mat.materialName}`;
                          const normUnit = isElec ? 'kWh/tấn TP' : `${mat.unitOfMeasure || 'đv'}/tấn TP`;
                          const annualMatTotal = Object.values(mat.months).reduce(
                            (s, v) => s + (Number(v) || 0),
                            0,
                          );
                          const annualFinishedTons = annualSummary.annualFinishedProductTons;
                          const annualNorm = computeItemNorm(
                            annualMatTotal,
                            mat.categoryGroup,
                            annualFinishedTons,
                          );

                          return (
                            <tr key={`norm-${mat.materialId}`} className="hover:bg-muted/10 transition-colors">
                              <td className="sticky left-0 z-10 bg-card px-3 py-2 font-semibold text-foreground">
                                <div className="flex items-center gap-2">
                                  <span>{normLabel}</span>
                                  <span
                                    className={cn(
                                      'rounded px-1.5 py-0.5 text-[9px] font-semibold',
                                      mat.categoryGroup === 'material'
                                        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                        : mat.categoryGroup === 'fuel'
                                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                                    )}
                                  >
                                    {mat.categoryGroup === 'material'
                                      ? 'Nguyên liệu'
                                      : mat.categoryGroup === 'fuel'
                                        ? 'Nhiên liệu'
                                        : 'Vật tư phụ'}
                                  </span>
                                </div>
                                {mat.materialCode && (
                                  <div className="text-[10px] text-muted-foreground font-normal">
                                    {mat.materialCode}
                                  </div>
                                )}
                              </td>
                              <td className="px-2 py-2 text-center text-muted-foreground text-[11px] font-medium">
                                {normUnit}
                              </td>
                              <td className="px-3 py-2 text-right font-black text-amber-600 dark:text-amber-400 bg-primary/5">
                                {formatNum(annualNorm, isMaterial ? 3 : 2)}
                              </td>
                              {MONTHS.map((m) => {
                                const mQty = Number(mat.months[m]) || 0;
                                const mFinishedTons = sumMonthProductsByType(products, m, 'finished_good');
                                const mNorm = computeItemNorm(mQty, mat.categoryGroup, mFinishedTons);
                                return (
                                  <td
                                    key={m}
                                    className="px-1 py-2 text-center font-semibold text-foreground"
                                  >
                                    {formatNum(mNorm, isMaterial ? 3 : 2)}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* FORMULAS & NOTES CARD */}
                <div className="border-t border-border bg-muted/20 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Công thức xác định các chỉ tiêu theo dõi & Định mức Kinh tế - Kỹ thuật
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                      <div className="font-semibold text-primary text-[11px] uppercase tracking-wide">
                        A. Năng lực & Thu hồi
                      </div>
                      <ul className="space-y-1.5 text-muted-foreground text-[11px]">
                        <li>
                          <strong className="text-foreground">Công suất (tấn/h):</strong>{' '}
                          <code>(Tổng nguyên liệu * 0.95) / Giờ vận hành</code>
                        </li>
                        <li>
                          <strong className="text-foreground">Năng suất (tấn/h):</strong>{' '}
                          <code>(Tổng thành phẩm * 0.955) / Giờ vận hành</code>
                        </li>
                        <li>
                          <strong className="text-foreground">Tỷ lệ thu hồi TP (%):</strong>{' '}
                          <code>(Tổng thành phẩm * 0.955) / (Tổng nguyên liệu * 0.95) * 100%</code>
                        </li>
                        <li>
                          <strong className="text-foreground">Tỷ lệ thu hồi phụ phẩm (%):</strong>{' '}
                          <code>(Tổng phụ phẩm * 0.955) / (Tổng nguyên liệu * 0.95) * 100%</code>
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                      <div className="font-semibold text-indigo-600 dark:text-indigo-400 text-[11px] uppercase tracking-wide">
                        B. Cơ cấu thời gian (đối với tổng giờ tháng)
                      </div>
                      <ul className="space-y-1.5 text-muted-foreground text-[11px]">
                        <li>
                          <strong className="text-foreground">% Giờ vận hành:</strong>{' '}
                          <code>(Giờ vận hành / Giờ lịch tháng) * 100%</code>
                        </li>
                        <li>
                          <strong className="text-foreground">% Giờ bảo trì:</strong>{' '}
                          <code>(Giờ bảo trì / Giờ lịch tháng) * 100%</code>
                        </li>
                        <li>
                          <strong className="text-foreground">% Giờ sự cố:</strong>{' '}
                          <code>(Giờ sự cố / Giờ lịch tháng) * 100%</code>
                        </li>
                        <li>
                          <strong className="text-foreground">% Giờ nghỉ trong KH:</strong>{' '}
                          <code>(Giờ nghỉ / Giờ lịch tháng) * 100%</code>
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                      <div className="font-semibold text-amber-600 dark:text-amber-400 text-[11px] uppercase tracking-wide">
                        C. Định mức Kinh tế - Kỹ thuật
                      </div>
                      <ul className="space-y-1.5 text-muted-foreground text-[11px]">
                        <li>
                          <strong className="text-foreground">Định mức tiêu hao điện:</strong>{' '}
                          <code>Tổng điện năng (kWh) / (Tổng TP * 0.955)</code> (kWh/tấn TP)
                        </li>
                        <li>
                          <strong className="text-foreground">Định mức nguyên liệu:</strong>{' '}
                          <code>(Lượng tiêu hao * 0.95) / (Tổng TP * 0.955)</code> (tấn/tấn TP)
                        </li>
                        <li>
                          <strong className="text-foreground">Định mức nhiên liệu:</strong>{' '}
                          <code>Lượng tiêu hao / (Tổng TP * 0.955)</code> (đơn vị/tấn TP)
                        </li>
                        <li>
                          <strong className="text-foreground">Định mức vật tư phụ:</strong>{' '}
                          <code>Lượng tiêu hao / (Tổng TP * 0.955)</code> (đơn vị/tấn TP)
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: CHỌN SẢN PHẨM VÀO KẾ HOẠCH */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-border p-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Chọn sản phẩm vào kế hoạch</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 border-b border-border bg-card">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã SKU hoặc tên sản phẩm..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full h-8 rounded-lg border border-input bg-background pl-8 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {catalogLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">Đang tải danh mục...</div>
              ) : filteredCatalogProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">Không tìm thấy sản phẩm phù hợp.</div>
              ) : (
                <div className="space-y-1">
                  {filteredCatalogProducts.map((p) => {
                    const isAdded = products.some((pr) => pr.productId === p.id);
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/40 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-foreground">{p.name}</span>
                            {getClassificationBadge(p.product_type)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            SKU: {p.sku} • ĐVT: {p.unit_of_measure}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddProduct(p)}
                          disabled={isAdded}
                          className={cn(
                            'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                            isAdded
                              ? 'bg-muted text-muted-foreground cursor-not-allowed'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90',
                          )}
                        >
                          {isAdded ? 'Đã thêm' : 'Chọn'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end border-t border-border p-3 bg-muted/20">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHỌN VẬT TƯ / NGUYÊN LIỆU VÀO KẾ HOẠCH */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-border p-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold text-foreground">Chọn vật tư / nguyên nhiên liệu</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMaterialModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 border-b border-border bg-card space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã hoặc tên vật tư..."
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  className="w-full h-8 rounded-lg border border-input bg-background pl-8 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-1.5">
                {(['all', 'material', 'fuel', 'supply'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setMaterialCategoryFilter(cat)}
                    className={cn(
                      'rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors',
                      materialCategoryFilter === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {cat === 'all'
                      ? 'Tất cả'
                      : cat === 'material'
                        ? 'Nguyên liệu'
                        : cat === 'fuel'
                          ? 'Nhiên liệu'
                          : 'Vật tư phụ'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {catalogLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">Đang tải danh mục...</div>
              ) : filteredCatalogMaterials.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">Không tìm thấy vật tư phù hợp.</div>
              ) : (
                <div className="space-y-1">
                  {filteredCatalogMaterials.map((m) => {
                    const isAdded = materials.some((mat) => mat.materialId === m.id);
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/40 transition-colors"
                      >
                        <div>
                          <div className="text-xs font-semibold text-foreground">{m.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            Mã: {m.code} • Phân nhóm: {m.category} • ĐVT: {m.unit_of_measure}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddMaterial(m)}
                          disabled={isAdded}
                          className={cn(
                            'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                            isAdded
                              ? 'bg-muted text-muted-foreground cursor-not-allowed'
                              : 'bg-amber-600 text-white hover:bg-amber-700',
                          )}
                        >
                          {isAdded ? 'Đã thêm' : 'Chọn'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end border-t border-border p-3 bg-muted/20">
              <button
                type="button"
                onClick={() => setIsMaterialModalOpen(false)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: XÁC NHẬN XÓA KẾ HOẠCH NĂM */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="rounded-full bg-destructive/10 p-2.5">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Xác nhận xóa kế hoạch năm</h3>
                <p className="text-xs text-muted-foreground">Thao tác này sẽ xóa vĩnh viễn dữ liệu</p>
              </div>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Bạn có chắc chắn muốn xóa toàn bộ kế hoạch sản xuất năm <strong className="text-foreground">{selectedYear}</strong> của dây chuyền <strong className="text-foreground">{selectedLine?.name || selectedLineId}</strong>?
              Tất cả 12 tháng cùng dữ liệu sản lượng, vật tư tiêu hao và thời gian vận hành sẽ bị xóa khỏi cơ sở dữ liệu.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeletePlan}
                disabled={deletePlanMutation.isPending}
                className="rounded-lg bg-destructive px-3.5 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {deletePlanMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: XÁC NHẬN XÓA DÂY CHUYỀN SẢN XUẤT */}
      {isDeleteLineDialogOpen && selectedLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="rounded-full bg-destructive/10 p-2.5">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Xác nhận xóa dây chuyền</h3>
                <p className="text-xs text-muted-foreground">Thao tác này sẽ xóa dây chuyền khỏi hệ thống</p>
              </div>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Bạn có chắc chắn muốn xóa dây chuyền <strong className="text-foreground">{selectedLine.name} ({selectedLine.code})</strong>?
              Dữ liệu kế hoạch liên quan sẽ bị xóa nếu chưa có lệnh sản xuất hoặc dữ liệu ca hoạt động.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setIsDeleteLineDialogOpen(false)}
                className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteSelectedLine}
                disabled={deleteLineMutation.isPending}
                className="rounded-lg bg-destructive px-3.5 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleteLineMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: THIẾT LẬP DÂY CHUYỀN SẢN XUẤT */}
      <ProductionLineDialog
        isOpen={isLineDialogOpen}
        onClose={() => {
          setIsLineDialogOpen(false);
          setEditingLine(null);
        }}
        line={editingLine}
        onSuccess={(savedLine) => {
          setSelectedLineId(savedLine.id);
          setActiveLineTab(savedLine.id);
        }}
        onDelete={(deletedLineId) => {
          setActiveLineTab('aggregate');
          const remaining = lines.filter((l) => l.id !== deletedLineId);
          if (remaining.length > 0 && remaining[0]) {
            setSelectedLineId(remaining[0].id);
          } else {
            setSelectedLineId('');
          }
        }}
      />
    </div>
  );
};
