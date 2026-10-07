import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Clock,
  Package,
  Fuel,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  Wrench,
  PauseCircle,
  CalendarRange,
  ChevronDown,
  User,
  Layers,
  Activity,
  Settings2,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { AuthContext } from '@/features/auth/context/auth-context';
import {
  productionShiftSchema,
  type ProductionShiftFormValues,
} from '../validation/production-schemas';
import { isFinishedProduct, type ProductionShift, type ProductionLine, type ShiftProductOutput, type ShiftDowntimeEvent } from '../types';
import { useShiftPlanContext } from '../hooks/use-production-shifts';
import { useWarehouses } from '@/features/warehouse/hooks/use-warehouses';
import { useMachineOptions } from '@/features/maintenance/hooks/use-machines';
import { AddShiftProductDialog } from './add-shift-product-dialog';

const isElectricityResource = (name?: string | null, unit?: string | null): boolean => {
  const n = (name || '').toLowerCase();
  const u = (unit || '').toLowerCase();
  return (
    n.includes('điện') ||
    n.includes('electricity') ||
    n.includes('kwh') ||
    u === 'kwh' ||
    u === 'kwh/tấn' ||
    u === 'kwh/t'
  );
};

const calculateDowntimeDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return { minutes: 0, hours: 0 };
  const [shStr, smStr] = startTime.split(':');
  const [ehStr, emStr] = endTime.split(':');
  const sh = Number(shStr);
  const sm = Number(smStr);
  const eh = Number(ehStr);
  const em = Number(emStr);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return { minutes: 0, hours: 0 };

  const startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // qua đêm (ca 3 hoặc vắt qua 00:00)
  }

  const diffMinutes = Math.max(0, endMinutes - startMinutes);
  const diffHours = Number((diffMinutes / 60).toFixed(2));
  return { minutes: diffMinutes, hours: diffHours };
};

interface ProductionShiftFormDialogProps {
  isOpen: boolean;
  initialMode?: 'shift' | 'date_range';
  onClose: () => void;
  onSubmit: (values: ProductionShiftFormValues) => Promise<void>;
  initialData?: ProductionShift | null;
  lines: ProductionLine[];
  isSubmitting?: boolean;
}

export const ProductionShiftFormDialog: React.FC<ProductionShiftFormDialogProps> = ({
  isOpen,
  initialMode = 'shift',
  onClose,
  onSubmit,
  initialData,
  lines,
  isSubmitting = false,
}) => {
  const isEditing = !!initialData;
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const authContext = useContext(AuthContext);
  const currentUserName = authContext?.user?.profile?.full_name || 'Lê Anh Thân';

  const [formMode, setFormMode] = useState<'shift' | 'date_range'>('shift');
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [isDowntimeDropdownOpen, setIsDowntimeDropdownOpen] = useState(false);
  const downtimeDropdownRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'products' | 'materials' | 'downtime'>('products');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Machine options for downtime equipment assignment
  const { data: machineOptions = [] } = useMachineOptions();

  // Custom incident categories state
  const DEFAULT_INCIDENT_CATEGORIES = useMemo(
    () => [
      'Sự cố Điện - Tự động hóa',
      'Sự cố Cơ khí',
      'Sự cố Chất lượng',
      'Sự cố Cấp liệu & Kẹt liệu',
      'Sự cố Công nghệ & Tuyển khoáng',
      'Sự cố An toàn & Môi trường',
      'Sự cố khác',
    ],
    [],
  );

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('custom_incident_categories');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [deletedCategories, setDeletedCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('deleted_incident_categories');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [addingCategoryIdx, setAddingCategoryIdx] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  const allIncidentCategories = useMemo(() => {
    const list = [...DEFAULT_INCIDENT_CATEGORIES, ...customCategories].filter(
      (cat) => !deletedCategories.includes(cat),
    );
    initialData?.downtime_breakdown?.events?.forEach((evt) => {
      if (evt.incident_category && !list.includes(evt.incident_category)) {
        list.push(evt.incident_category);
      }
    });
    return Array.from(new Set(list));
  }, [DEFAULT_INCIDENT_CATEGORIES, customCategories, deletedCategories, initialData]);

  const handleSaveCustomCategory = (idx?: number | null) => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    if (deletedCategories.includes(trimmed)) {
      const nextDeleted = deletedCategories.filter((c) => c !== trimmed);
      setDeletedCategories(nextDeleted);
      try {
        localStorage.setItem('deleted_incident_categories', JSON.stringify(nextDeleted));
      } catch (e) {
        console.error(e);
      }
    }

    if (!customCategories.includes(trimmed) && !DEFAULT_INCIDENT_CATEGORIES.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      try {
        localStorage.setItem('custom_incident_categories', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }

    if (idx !== undefined && idx !== null) {
      setValue(`downtime_breakdown.events.${idx}.incident_category`, trimmed);
    }
    setAddingCategoryIdx(null);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (!catToDelete) return;

    const nextCustom = customCategories.filter((c) => c !== catToDelete);
    setCustomCategories(nextCustom);
    try {
      localStorage.setItem('custom_incident_categories', JSON.stringify(nextCustom));
    } catch (e) {
      console.error(e);
    }

    if (!deletedCategories.includes(catToDelete)) {
      const nextDeleted = [...deletedCategories, catToDelete];
      setDeletedCategories(nextDeleted);
      try {
        localStorage.setItem('deleted_incident_categories', JSON.stringify(nextDeleted));
      } catch (e) {
        console.error(e);
      }
    }

    const remaining = allIncidentCategories.filter((c) => c !== catToDelete);
    const fallback = remaining[0] || 'Sự cố khác';
    const currentEvents = watch('downtime_breakdown.events') || [];
    currentEvents.forEach((evt, i) => {
      if (evt.incident_category === catToDelete) {
        setValue(`downtime_breakdown.events.${i}.incident_category`, fallback);
      }
    });
  };

  const handleRestoreDefaultCategories = () => {
    setDeletedCategories([]);
    try {
      localStorage.removeItem('deleted_incident_categories');
    } catch (e) {
      console.error(e);
    }
  };

  // Close downtime dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        downtimeDropdownRef.current &&
        !downtimeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDowntimeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<ProductionShiftFormValues>({
    resolver: zodResolver(productionShiftSchema),
    defaultValues: {
      shift_code: '',
      line_id: lines[0]?.id || '',
      shift_date: todayStr,
      shift_number: 1,
      standard_shift_hours: 8.0,
      total_downtime_hours: 0,
      raw_material_input_tons: 0,
      product_output_tons: 0,
      byproduct_output_tons: 0,
      actual_quality_rate_pct: 100,
      operator_name: currentUserName,
      status: 'completed',
      notes: '',
      products_output: [],
      materials_consumption: [],
      downtime_breakdown: {
        maintenance_hours: 0,
        maintenance_note: '',
        incident_hours: 0,
        incident_category: 'mechanical',
        incident_reason: '',
        incident_action: '',
        planned_shutdown_hours: 0,
        planned_shutdown_reason: '',
        total_downtime_hours: 0,
        events: [],
        updated_by_name: currentUserName,
      },
    },
  });

  const selectedLineId = watch('line_id');
  const selectedDate = watch('shift_date');
  const selectedShiftNumber = watch('shift_number');
  const stdHours = watch('standard_shift_hours') || 8;

  // Field arrays
  const {
    fields: productFields,
    append: appendProduct,
    remove: removeProduct,
    replace: replaceProducts,
  } = useFieldArray({
    control,
    name: 'products_output',
  });

  const {
    fields: materialFields,
    append: appendMaterial,
    remove: removeMaterial,
    replace: replaceMaterials,
  } = useFieldArray({
    control,
    name: 'materials_consumption',
  });

  const {
    fields: downtimeEventFields,
    append: appendDowntimeEvent,
    remove: removeDowntimeEvent,
  } = useFieldArray({
    control,
    name: 'downtime_breakdown.events',
  });

  // Watch downtime events & breakdown to calculate total downtime and running hours
  const rawWatchedEvents = watch('downtime_breakdown.events');
  const watchEvents = useMemo(() => rawWatchedEvents ?? [], [rawWatchedEvents]);
  const rawWatchedProducts = watch('products_output');
  const watchProducts = useMemo(() => rawWatchedProducts ?? [], [rawWatchedProducts]);

  const watchMaintHours = watch('downtime_breakdown.maintenance_hours');
  const watchIncHours = watch('downtime_breakdown.incident_hours');
  const watchShutHours = watch('downtime_breakdown.planned_shutdown_hours');
  const watchTotalDowntimeDirect = watch('total_downtime_hours');

  const {
    maintenanceHours,
    incidentHours,
    plannedShutdownHours,
    totalDowntime,
  } = useMemo(() => {
    if (watchEvents.length > 0) {
      let maint = 0;
      let inc = 0;
      let plan = 0;
      for (const evt of watchEvents) {
        const customHours = Number(evt.duration_hours);
        const dur =
          !isNaN(customHours) && customHours > 0
            ? customHours
            : calculateDowntimeDuration(evt.start_time || '', evt.end_time || '').hours;
        if (evt.type === 'planned_maintenance') maint += dur;
        else if (evt.type === 'scheduled_shutdown') plan += dur;
        else inc += dur;
      }
      const total = Number((maint + inc + plan).toFixed(2));
      return {
        maintenanceHours: Number(maint.toFixed(2)),
        incidentHours: Number(inc.toFixed(2)),
        plannedShutdownHours: Number(plan.toFixed(2)),
        totalDowntime: total,
      };
    }

    const m = Number(watchMaintHours || 0);
    const i = Number(watchIncHours || 0);
    const p = Number(watchShutHours || 0);
    const sum = Number((m + i + p).toFixed(2));
    const directTotal = Number(watchTotalDowntimeDirect || 0);
    const finalTotal = sum > 0 ? sum : directTotal;

    return {
      maintenanceHours: m,
      incidentHours: i,
      plannedShutdownHours: p,
      totalDowntime: finalTotal,
    };
  }, [
    watchEvents,
    watchMaintHours,
    watchIncHours,
    watchShutHours,
    watchTotalDowntimeDirect,
  ]);

  const runningHours = Math.max(0, Number((stdHours - totalDowntime).toFixed(2)));

  // Auto sum finished products (strictly excluding byproducts and semi-finished products)
  const totalFinishedOutput = useMemo(() => {
    return Number(
      watchProducts
        .reduce((sum, p) => (isFinishedProduct(p) ? sum + (Number(p.quantity_tons) || 0) : sum), 0)
        .toFixed(2),
    );
  }, [watchProducts]);

  const totalByproductOutput = useMemo(() => {
    return Number(
      watchProducts
        .reduce((sum, p) => (!isFinishedProduct(p) ? sum + (Number(p.quantity_tons) || 0) : sum), 0)
        .toFixed(2),
    );
  }, [watchProducts]);

  const rawWatchedMaterials = watch('materials_consumption');
  const watchedRawInput = watch('raw_material_input_tons');
  const totalRawInput = useMemo(() => {
    const rawDirect = Number(watchedRawInput || 0);
    if (rawDirect > 0) return rawDirect;
    const mats = rawWatchedMaterials || [];
    return Number(
      mats
        .reduce((acc, m) => {
          const name = (m.resource_name || '').toLowerCase();
          const isRaw =
            m.category === 'material' ||
            name.includes('cát nguyên khai') ||
            name.includes('quặng') ||
            name.includes('nguyên khai');
          return isRaw ? acc + (Number(m.actual_quantity) || 0) : acc;
        }, 0)
        .toFixed(2),
    );
  }, [watchedRawInput, rawWatchedMaterials]);

  const recoveryRate = useMemo(() => {
    if (totalRawInput <= 0) return 0;
    return Number(((totalFinishedOutput / totalRawInput) * 100).toFixed(2));
  }, [totalFinishedOutput, totalRawInput]);

  const productivityTPH = useMemo(() => {
    if (runningHours <= 0) return 0;
    return Number((totalFinishedOutput / runningHours).toFixed(2));
  }, [totalFinishedOutput, runningHours]);

  // Keep total_downtime_hours and product_output_tons in sync
  useEffect(() => {
    if (watchEvents.length > 0) {
      setValue('total_downtime_hours', totalDowntime);
      setValue('downtime_breakdown.total_downtime_hours', totalDowntime);
      setValue('downtime_breakdown.maintenance_hours', maintenanceHours);
      setValue('downtime_breakdown.incident_hours', incidentHours);
      setValue('downtime_breakdown.planned_shutdown_hours', plannedShutdownHours);
    } else if (totalDowntime > 0) {
      setValue('total_downtime_hours', totalDowntime);
      setValue('downtime_breakdown.total_downtime_hours', totalDowntime);
    }
  }, [
    totalDowntime,
    maintenanceHours,
    incidentHours,
    plannedShutdownHours,
    watchEvents.length,
    setValue,
  ]);

  useEffect(() => {
    setValue('product_output_tons', totalFinishedOutput);
    setValue('byproduct_output_tons', totalByproductOutput);
  }, [totalFinishedOutput, totalByproductOutput, setValue]);

  // Fetch plan context (registered products & planned materials for this line and month)
  const { data: planContext, isLoading: _isLoadingPlan } = useShiftPlanContext(
    selectedLineId,
    selectedDate,
    isOpen,
  );

  // Fetch warehouses list for selection
  const { data: warehousesData } = useWarehouses({ page: 1, pageSize: 50 });
  const warehousesList = warehousesData?.data || [];

  // Fetch materials catalog for unit pre-filling and selection
  const { data: materialsCatalog = [] } = useQuery({
    queryKey: ['materials-catalog-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('id, code, name, category, unit_of_measure')
        .order('name');
      if (error) {
        console.error('Error fetching materials catalog:', error);
        return [];
      }
      return data || [];
    },
    staleTime: 60 * 1000,
  });

  const availableUnits = useMemo(() => {
    const set = new Set<string>(['Tấn', 'kg', 'Lít', 'm3', 'kWh', 'bình', 'bao', 'cuộn', 'bộ', 'can', 'thùng']);
    materialsCatalog.forEach((m) => {
      if (m.unit_of_measure) set.add(m.unit_of_measure.trim());
    });
    return Array.from(set);
  }, [materialsCatalog]);

  // Auto-generate shift code
  useEffect(() => {
    if (!isEditing && selectedLineId && selectedDate && selectedShiftNumber) {
      if (formMode === 'date_range') return;
      const line = lines.find((l) => l.id === selectedLineId);
      const lineCode = line?.code || 'LINE';
      const cleanDate = selectedDate.replace(/-/g, '');
      setValue('shift_code', `CA-${cleanDate}-${lineCode}-S${selectedShiftNumber}`);
    }
  }, [selectedLineId, selectedDate, selectedShiftNumber, isEditing, lines, setValue, formMode]);

  const prevIsOpenRef = useRef(false);
  const lastContextKeyRef = useRef('');

  const handleSwitchMode = (newMode: 'shift' | 'date_range') => {
    setFormMode(newMode);
    const lineObj = lines.find((l) => l.id === selectedLineId) || lines[0];
    const lineCode = lineObj?.code || 'LINE';
    if (newMode === 'date_range') {
      const cleanFrom = fromDate.replace(/-/g, '');
      const cleanTo = toDate.replace(/-/g, '');
      setValue('shift_code', `KY-${cleanFrom}-${cleanTo}-${lineCode}`);
      const days = Math.max(1, Math.round((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 3600 * 24)) + 1);
      setValue('standard_shift_hours', days * 24);
      setValue('shift_number', 1);
      setValue('shift_date', fromDate);
    } else {
      const cleanDate = (selectedDate || todayStr).replace(/-/g, '');
      setValue('shift_code', `CA-${cleanDate}-${lineCode}-S${selectedShiftNumber || 1}`);
      setValue('standard_shift_hours', 8.0);
    }
  };

  const handleFromDateChange = (newFrom: string) => {
    setFromDate(newFrom);
    setValue('shift_date', newFrom);
    const lineObj = lines.find((l) => l.id === selectedLineId) || lines[0];
    const cleanFrom = newFrom.replace(/-/g, '');
    const cleanTo = toDate.replace(/-/g, '');
    setValue('shift_code', `KY-${cleanFrom}-${cleanTo}-${lineObj?.code || 'LINE'}`);
    const days = Math.max(1, Math.round((new Date(toDate).getTime() - new Date(newFrom).getTime()) / (1000 * 3600 * 24)) + 1);
    setValue('standard_shift_hours', days * 24);
  };

  const handleToDateChange = (newTo: string) => {
    setToDate(newTo);
    const lineObj = lines.find((l) => l.id === selectedLineId) || lines[0];
    const cleanFrom = fromDate.replace(/-/g, '');
    const cleanTo = newTo.replace(/-/g, '');
    setValue('shift_code', `KY-${cleanFrom}-${cleanTo}-${lineObj?.code || 'LINE'}`);
    const days = Math.max(1, Math.round((new Date(newTo).getTime() - new Date(fromDate).getTime()) / (1000 * 3600 * 24)) + 1);
    setValue('standard_shift_hours', days * 24);
  };

  // Initialize or reset form when dialog opens
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      lastContextKeyRef.current = '';
      const isRangeInit = initialData
        ? Boolean(initialData.downtime_breakdown?.is_date_range) ||
          initialData.shift_code.startsWith('KY-') ||
          Boolean(initialData.notes?.includes('[Kỳ:'))
        : (initialMode === 'date_range');

      setFormMode(isRangeInit ? 'date_range' : 'shift');

      const initFrom = initialData?.shift_date || todayStr;
      const initTo =
        initialData?.end_date ||
        initialData?.downtime_breakdown?.to_date ||
        (() => {
          const m = initialData?.notes?.match(/\[Kỳ:\s*([^\s]+)\s*(?:đến|->|-)\s*([^\]]+)\]/i);
          return m && m[2] ? m[2].trim() : todayStr;
        })();
      setFromDate(initFrom);
      setToDate(initTo);

      if (initialData) {
        const breakdown = initialData.downtime_breakdown;
        const initialEvents: ShiftDowntimeEvent[] =
          breakdown?.events && Array.isArray(breakdown.events) ? [...breakdown.events] : [];

        reset({
          shift_code: initialData.shift_code,
          line_id: initialData.line_id,
          shift_date: initialData.shift_date,
          end_date: initialData.end_date || initTo,
          shift_number: initialData.shift_number,
          standard_shift_hours: initialData.standard_shift_hours,
          total_downtime_hours: initialData.total_downtime_hours,
          raw_material_input_tons: initialData.raw_material_input_tons || 0,
          product_output_tons: initialData.product_output_tons || 0,
          byproduct_output_tons: initialData.byproduct_output_tons || 0,
          actual_quality_rate_pct:
            initialData.actual_quality_rate_pct !== undefined && initialData.actual_quality_rate_pct !== null
              ? Number(initialData.actual_quality_rate_pct)
              : 100,
          operator_employee_id: initialData.operator_employee_id,
          operator_name:
            initialData.operator_name ||
            breakdown?.updated_by_name ||
            breakdown?.operator_name ||
            currentUserName,
          status: initialData.status,
          notes: initialData.notes || '',
          products_output: initialData.products_output || [],
          materials_consumption: initialData.materials_consumption || [],
          downtime_breakdown: {
            maintenance_hours: breakdown?.maintenance_hours || 0,
            maintenance_note: breakdown?.maintenance_note || '',
            incident_hours: breakdown?.incident_hours || 0,
            incident_category: breakdown?.incident_category || 'mechanical',
            incident_reason: breakdown?.incident_reason || '',
            incident_action: breakdown?.incident_action || '',
            planned_shutdown_hours: breakdown?.planned_shutdown_hours || 0,
            planned_shutdown_reason: breakdown?.planned_shutdown_reason || '',
            total_downtime_hours: initialData.total_downtime_hours,
            events: initialEvents,
            is_date_range: isRangeInit,
            from_date: initFrom,
            to_date: initTo,
            updated_by_name:
              initialData.operator_name ||
              breakdown?.updated_by_name ||
              breakdown?.operator_name ||
              currentUserName,
            operator_name:
              initialData.operator_name ||
              breakdown?.updated_by_name ||
              breakdown?.operator_name ||
              currentUserName,
          },
        });
      } else {
        const cleanDate = todayStr.replace(/-/g, '');
        const targetLineId = lines[0]?.id || '';
        const targetLineCode = lines[0]?.code || 'LINE';

        // If planContext is already cached and available, prepopulate immediately
        const initialProds = (planContext?.products && planContext.products.length > 0)
          ? planContext.products.map((p) => ({
              product_id: p.productId,
              product_name: p.productName,
              product_sku: p.productSku,
              unitOfMeasure: p.unitOfMeasure,
              is_out_of_plan: false,
              quantity_tons: 0,
            }))
          : [];

        const initialMats = (planContext?.materials && planContext.materials.length > 0)
          ? planContext.materials.map((m) => ({
              material_id: m.materialId,
              resource_name: m.resourceName,
              category: m.categoryGroup,
              unitOfMeasure: m.unitOfMeasure,
              planned_norm: m.monthlyPlannedQty,
              actual_quantity: 0,
              notes: '',
            }))
          : [];

        if (initialProds.length > 0 || initialMats.length > 0) {
          lastContextKeyRef.current = `${targetLineId}_${todayStr}`;
        }

        const days = Math.max(1, Math.round((new Date(initTo).getTime() - new Date(initFrom).getTime()) / (1000 * 3600 * 24)) + 1);

        reset({
          shift_code: isRangeInit
            ? `KY-${initFrom.replace(/-/g, '')}-${initTo.replace(/-/g, '')}-${targetLineCode}`
            : `CA-${cleanDate}-${targetLineCode}-S1`,
          line_id: targetLineId,
          shift_date: initFrom,
          end_date: isRangeInit ? initTo : null,
          shift_number: 1,
          standard_shift_hours: isRangeInit ? days * 24 : 8.0,
          total_downtime_hours: 0,
          raw_material_input_tons: 0,
          product_output_tons: 0,
          byproduct_output_tons: 0,
          actual_quality_rate_pct: 100,
          operator_name: currentUserName,
          status: 'completed',
          notes: isRangeInit ? `[Kỳ: ${initFrom} đến ${initTo}]` : '',
          products_output: initialProds,
          materials_consumption: initialMats,
          downtime_breakdown: {
            maintenance_hours: 0,
            maintenance_note: '',
            incident_hours: 0,
            incident_category: 'mechanical',
            incident_reason: '',
            incident_action: '',
            planned_shutdown_hours: 0,
            planned_shutdown_reason: '',
            total_downtime_hours: 0,
            events: [],
            is_date_range: isRangeInit,
            from_date: initFrom,
            to_date: initTo,
            updated_by_name: currentUserName,
            operator_name: currentUserName,
          },
        });
      }
    } else if (!isOpen) {
      lastContextKeyRef.current = '';
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialData, initialMode, todayStr, lines, reset, planContext, currentUserName]);

  // Prepopulate products & materials from monthly plan when planContext is available or line/date changes
  useEffect(() => {
    if (!isOpen || isEditing) return;
    const currentKey = `${selectedLineId}_${selectedDate}`;

    if (planContext && lastContextKeyRef.current !== currentKey) {
      lastContextKeyRef.current = currentKey;

      if (planContext.products && planContext.products.length > 0) {
        const initialProds = planContext.products.map((p) => ({
          product_id: p.productId,
          product_name: p.productName,
          product_sku: p.productSku,
          unit_of_measure: p.unitOfMeasure,
          is_out_of_plan: false,
          quantity_tons: 0,
        }));
        replaceProducts(initialProds);
      } else {
        replaceProducts([]);
      }

      if (planContext.materials && planContext.materials.length > 0) {
        const initialMats = planContext.materials.map((m) => ({
          material_id: m.materialId,
          resource_name: m.resourceName,
          category: m.categoryGroup,
          unit_of_measure: m.unitOfMeasure,
          planned_norm: m.monthlyPlannedQty,
          actual_quantity: 0,
          notes: '',
        }));
        replaceMaterials(initialMats);
      } else {
        replaceMaterials([]);
      }
    }
  }, [isOpen, isEditing, planContext, selectedLineId, selectedDate, replaceProducts, replaceMaterials]);

  if (!isOpen) return null;

  const handleAddOutOfPlanProduct = (product: ShiftProductOutput) => {
    appendProduct(product);
  };

  const handleAddCustomMaterial = () => {
    const firstMat =
      materialsCatalog.find((m) => !watch('materials_consumption')?.some((mc) => mc.resource_name === m.name)) ||
      materialsCatalog[0];

    appendMaterial({
      material_id: firstMat?.id,
      resource_name: firstMat?.name || 'Vật tư / Nhiên liệu mới',
      category:
        firstMat?.category === 'raw_material'
          ? 'material'
          : firstMat?.category === 'fuel_energy'
          ? 'fuel'
          : 'supply',
      unit_of_measure: firstMat?.unit_of_measure || 'Kg',
      planned_norm: 0,
      actual_quantity: 0,
      warehouse_id: null,
      warehouse_name: null,
      notes: '',
    });
  };

  const handleAddDowntimeEvent = (
    type: 'breakdown_incident' | 'planned_maintenance' | 'scheduled_shutdown' = 'breakdown_incident',
  ) => {
    let defaultStart = '08:00';
    let defaultEnd = '08:30';
    if (selectedShiftNumber === 2) {
      defaultStart = '16:00';
      defaultEnd = '16:30';
    } else if (selectedShiftNumber === 3) {
      defaultStart = '00:00';
      defaultEnd = '00:30';
    }

    const currentEvents = watch('downtime_breakdown.events') || [];
    if (currentEvents.length > 0) {
      const lastEvent = currentEvents[currentEvents.length - 1];
      if (lastEvent?.end_time) {
        defaultStart = lastEvent.end_time;
        const timeParts = lastEvent.end_time.split(':');
        const lh = Number(timeParts[0]);
        const lm = Number(timeParts[1]);
        if (!isNaN(lh) && !isNaN(lm)) {
          const nextMin = (lh * 60 + lm + 30) % (24 * 60);
          const nh = String(Math.floor(nextMin / 60)).padStart(2, '0');
          const nm = String(nextMin % 60).padStart(2, '0');
          defaultEnd = `${nh}:${nm}`;
        }
      }
    }

    const { minutes, hours } = calculateDowntimeDuration(defaultStart, defaultEnd);

    appendDowntimeEvent({
      type,
      start_time: defaultStart,
      end_time: defaultEnd,
      duration_minutes: minutes,
      duration_hours: hours,
      machine_id: null,
      equipment_code: null,
      equipment_name: null,
      incident_category: type === 'breakdown_incident' ? 'Sự cố Cơ khí' : undefined,
      shutdown_type: type === 'scheduled_shutdown' ? 'Nghỉ trong kế hoạch' : undefined,
      maintenance_type: type === 'planned_maintenance' ? 'Bảo trì kế hoạch' : undefined,
      reason: '',
      action_taken: '',
    });
  };

  const existingProductIds = watchProducts
    .map((p) => p.product_id)
    .filter((id): id is string => !!id);

  const handleFormSubmit = async (values: ProductionShiftFormValues) => {
    const prods = values.products_output || [];
    const finishedSum = prods.reduce((acc, p) => {
      return isFinishedProduct(p) ? acc + (Number(p.quantity_tons) || 0) : acc;
    }, 0);
    const byproductSum = prods.reduce((acc, p) => {
      return !isFinishedProduct(p) ? acc + (Number(p.quantity_tons) || 0) : acc;
    }, 0);

    const mats = values.materials_consumption || [];
    const rawFromMats = mats.reduce((acc, m) => {
      const name = (m.resource_name || '').toLowerCase();
      const isRaw =
        m.category === 'material' ||
        name.includes('cát nguyên khai') ||
        name.includes('quặng') ||
        name.includes('nguyên khai');
      return isRaw ? acc + (Number(m.actual_quantity) || 0) : acc;
    }, 0);

    const finalRawInput =
      Number(values.raw_material_input_tons) > 0
        ? Number(values.raw_material_input_tons)
        : rawFromMats;

    const finalFinished =
      finishedSum > 0
        ? finishedSum
        : (Number(values.product_output_tons) > 0 ? Number(values.product_output_tons) : 0);

    const finalByproduct =
      byproductSum > 0
        ? byproductSum
        : (Number(values.byproduct_output_tons) > 0 ? Number(values.byproduct_output_tons) : 0);

    const isRange = formMode === 'date_range';
    const notesWithRange = isRange && !values.notes?.includes('[Kỳ:')
      ? `[Kỳ: ${fromDate} đến ${toDate}] ${values.notes || ''}`.trim()
      : (values.notes || '');

    const finalOperatorName = values.operator_name?.trim() || currentUserName || 'Lê Anh Thân';

    const finalBreakdown = {
      ...(values.downtime_breakdown || {}),
      is_date_range: isRange,
      from_date: isRange ? fromDate : values.shift_date,
      to_date: isRange ? toDate : values.shift_date,
      maintenance_hours: maintenanceHours,
      incident_hours: incidentHours,
      planned_shutdown_hours: plannedShutdownHours,
      total_downtime_hours: totalDowntime,
      updated_by_name: finalOperatorName,
      operator_name: finalOperatorName,
    };

    await onSubmit({
      ...values,
      operator_name: finalOperatorName,
      shift_date: isRange ? fromDate : values.shift_date,
      shift_number: isRange ? 1 : values.shift_number,
      raw_material_input_tons: finalRawInput,
      product_output_tons: finalFinished,
      byproduct_output_tons: finalByproduct,
      total_downtime_hours: totalDowntime,
      notes: notesWithRange,
      downtime_breakdown: finalBreakdown,
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/20 px-6 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
                {formMode === 'date_range' ? <CalendarRange className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  {isEditing
                    ? formMode === 'date_range'
                      ? 'Chỉnh sửa số liệu theo khoảng ngày'
                      : 'Chỉnh sửa số liệu ca sản xuất'
                    : formMode === 'date_range'
                      ? 'Ghi nhận số liệu theo khoảng ngày'
                      : 'Ghi nhận số liệu ca sản xuất'}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {formMode === 'date_range'
                    ? 'Tổng hợp sản lượng, tiêu hao và thời gian vận hành linh động từ ngày đến ngày'
                    : 'Theo dõi thành phẩm, tiêu hao nguyên nhiên liệu theo kế hoạch và dừng máy trong ca'}
                </p>
              </div>
            </div>

            {/* Segmented Mode Switcher & Close button */}
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-border bg-background/80 p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('shift')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                    formMode === 'shift'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Theo ca
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('date_range')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                    formMode === 'date_range'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CalendarRange className="h-3.5 w-3.5" />
                  Theo khoảng ngày
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-1"
                aria-label="Đóng popup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-1 flex-col overflow-y-auto">
            <div className="space-y-4 p-5 sm:p-6">
              {/* 1. THÔNG TIN CHUNG & THIẾT LẬP ĐIỀU HÀNH */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      1. Thông tin chung & Thiết lập điều hành
                    </h3>
                  </div>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {formMode === 'shift' ? 'Chế độ theo ca' : 'Chế độ khoảng ngày'}
                  </span>
                </div>

                {formMode === 'shift' ? (
                  /* Form theo ca - Row 1 */
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground">Mã ca *</label>
                      <input
                        type="text"
                        {...register('shift_code')}
                        className="mt-1 w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-xs font-mono font-medium text-foreground focus:ring-1 focus:ring-primary"
                      />
                      {errors.shift_code && (
                        <p className="mt-1 text-[11px] text-rose-500">{errors.shift_code.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground">Dây chuyền *</label>
                      <select
                        {...register('line_id')}
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
                      >
                        <option value="">-- Chọn dây chuyền --</option>
                        {lines.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.code} - {l.name}
                          </option>
                        ))}
                      </select>
                      {errors.line_id && (
                        <p className="mt-1 text-[11px] text-rose-500">{errors.line_id.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground">Ngày vận hành *</label>
                      <input
                        type="date"
                        {...register('shift_date')}
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
                      />
                      {errors.shift_date && (
                        <p className="mt-1 text-[11px] text-rose-500">{errors.shift_date.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground">Ca sản xuất *</label>
                      <select
                        {...register('shift_number', { valueAsNumber: true })}
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
                      >
                        <option value={1}>Ca 1 (06:00 - 14:00)</option>
                        <option value={2}>Ca 2 (14:00 - 22:00)</option>
                        <option value={3}>Ca 3 (22:00 - 06:00)</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  /* Form theo khoảng ngày - Row 1 */
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground">Mã đợt / kỳ sản xuất *</label>
                      <input
                        type="text"
                        {...register('shift_code')}
                        className="mt-1 w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-xs font-mono font-medium text-foreground focus:ring-1 focus:ring-primary"
                      />
                      {errors.shift_code && (
                        <p className="mt-1 text-[11px] text-rose-500">{errors.shift_code.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground">Dây chuyền *</label>
                      <select
                        {...register('line_id')}
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
                      >
                        <option value="">-- Chọn dây chuyền --</option>
                        {lines.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.code} - {l.name}
                          </option>
                        ))}
                      </select>
                      {errors.line_id && (
                        <p className="mt-1 text-[11px] text-rose-500">{errors.line_id.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground">Từ ngày *</label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => handleFromDateChange(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground font-semibold focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground">Đến ngày *</label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => handleToDateChange(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground font-semibold focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}

                {/* Section 1 - Row 2: Người cập nhật, Giờ tiêu chuẩn, Chất lượng, Ghi chú */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-4 pt-1">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <User className="h-3.5 w-3.5 text-primary" />
                      Người cập nhật / Trưởng ca
                    </label>
                    <input
                      type="text"
                      {...register('operator_name')}
                      placeholder="VD: Lê Anh Thân"
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-foreground">
                        {formMode === 'date_range' ? 'Giờ tiêu chuẩn kỳ *' : 'Giờ tiêu chuẩn ca *'}
                      </label>
                      <span className="text-[10px] text-muted-foreground">giờ</span>
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      {...register('standard_shift_hours', { valueAsNumber: true })}
                      placeholder={formMode === 'date_range' ? '144' : '8'}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground font-bold focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-foreground">
                        Tỉ lệ chất lượng (%) *
                      </label>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Mặc định 100%
                      </span>
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      {...register('actual_quality_rate_pct', { valueAsNumber: true })}
                      placeholder="100"
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:ring-1 focus:ring-primary"
                    />
                    {errors.actual_quality_rate_pct && (
                      <p className="mt-1 text-[11px] text-rose-500">{errors.actual_quality_rate_pct.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground">Ghi chú điều hành</label>
                    <input
                      type="text"
                      {...register('notes')}
                      placeholder="Ghi chú tổng hợp hoặc lưu ý..."
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* REAL-TIME LIVE KPI RIBBON */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {/* 1. Giờ chạy máy */}
                <div className="flex flex-col justify-between rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/20 p-3">
                  <div className="flex items-center justify-between text-sky-600 dark:text-sky-400">
                    <span className="text-[11px] font-semibold">Giờ chạy thực tế</span>
                    <Clock className="h-4 w-4 opacity-80" />
                  </div>
                  <div className="mt-1">
                    <span className="text-base font-extrabold text-foreground">{runningHours}h</span>
                    <span className="text-xs text-muted-foreground ml-1">/ {stdHours}h</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    Dừng: <span className="font-semibold text-rose-500">{totalDowntime}h</span>
                  </div>
                </div>

                {/* 2. Sản lượng TP chính */}
                <div className="flex flex-col justify-between rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                    <span className="text-[11px] font-semibold">Sản lượng TP chính</span>
                    <Package className="h-4 w-4 opacity-80" />
                  </div>
                  <div className="mt-1">
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                      {totalFinishedOutput.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">Tấn</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    Phụ phẩm: <span className="font-semibold text-foreground">{totalByproductOutput.toLocaleString('vi-VN')}T</span>
                  </div>
                </div>

                {/* 3. Cát nguyên khai cấp */}
                <div className="flex flex-col justify-between rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                    <span className="text-[11px] font-semibold">Cát nguyên khai</span>
                    <Layers className="h-4 w-4 opacity-80" />
                  </div>
                  <div className="mt-1">
                    <span className="text-base font-extrabold text-foreground">
                      {totalRawInput.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">Tấn</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    Cấp vào vít / lò sấy
                  </div>
                </div>

                {/* 4. Tỉ lệ thu hồi cát */}
                <div className="flex flex-col justify-between rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-3">
                  <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
                    <span className="text-[11px] font-semibold">Tỉ lệ thu hồi</span>
                    <Activity className="h-4 w-4 opacity-80" />
                  </div>
                  <div className="mt-1">
                    <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                      {recoveryRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    Định mức: <span className="font-semibold text-foreground">83.75%</span>
                  </div>
                </div>

                {/* 5. Năng suất vận hành */}
                <div className="flex flex-col justify-between rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 p-3 col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
                    <span className="text-[11px] font-semibold">Năng suất vận hành</span>
                    <CheckCircle2 className="h-4 w-4 opacity-80" />
                  </div>
                  <div className="mt-1">
                    <span className="text-base font-extrabold text-foreground">
                      {productivityTPH.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">TPH</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    Tấn TP / giờ chạy máy
                  </div>
                </div>
              </div>

              {/* Sub-tab navigation */}
              <div className="flex border-b border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
                    activeTab === 'products'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Package className="h-4 w-4" />
                  1. Thành phẩm & Sản lượng ({watchProducts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('materials')}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
                    activeTab === 'materials'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Fuel className="h-4 w-4" />
                  2. Tiêu hao Nguyên nhiên liệu ({materialFields.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('downtime')}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
                    activeTab === 'downtime'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  3. Dừng máy & Sự cố ({watchEvents.length > 0 ? `${watchEvents.length} lần • ${totalDowntime}h` : `${totalDowntime}h`})
                </button>
              </div>

              {/* TAB 1: SẢN LƯỢNG THÀNH PHẨM (Yêu cầu 3) */}
              {activeTab === 'products' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Registered & Out-of-plan Products List */}
                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h3 className="text-xs font-bold text-foreground">
                          Danh mục thành phẩm sản xuất trong ca
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Ghi nhận các thành phẩm đã đăng ký ở kế hoạch hoặc sản phẩm ngoài kế hoạch
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddProductOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Thêm sản phẩm ngoài kế hoạch
                      </button>
                    </div>

                    {productFields.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        Chưa có sản phẩm nào. Nhấp vào nút &quot;Thêm sản phẩm ngoài kế hoạch&quot; để thêm.
                      </div>
                    ) : (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-muted/40 font-semibold text-muted-foreground">
                            <tr>
                              <th className="px-3 py-2">Mã SKU</th>
                              <th className="px-3 py-2">Tên thành phẩm</th>
                              <th className="px-3 py-2 text-center">Phân loại</th>
                              <th className="px-3 py-2 text-center">ĐVT</th>
                              <th className="px-3 py-2 text-right w-36">Sản lượng (Tấn) *</th>
                              <th className="px-3 py-2 w-44">Kho nhập</th>
                              <th className="px-3 py-2 w-32">Vị trí / Bãi</th>
                              <th className="px-3 py-2 text-center w-12"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {productFields.map((field, idx) => {
                              const item = watchProducts[idx] || {};
                              const isOutOfPlan = watch(`products_output.${idx}.is_out_of_plan`);
                              const isFinished = isFinishedProduct(item);
                              return (
                                <tr key={field.id} className="hover:bg-muted/20">
                                  <td className="px-3 py-2.5 font-mono font-medium text-foreground">
                                    {watch(`products_output.${idx}.product_sku`) || '---'}
                                  </td>
                                  <td className="px-3 py-2.5 font-medium text-foreground">
                                    {watch(`products_output.${idx}.product_name`)}
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <div className="flex flex-wrap items-center justify-center gap-1">
                                      {isOutOfPlan ? (
                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                          Ngoài KH
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                          Trong KH
                                        </span>
                                      )}
                                      {isFinished ? (
                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                                          Thành phẩm
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-semibold text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                                          Phụ phẩm
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-muted-foreground">
                                    {watch(`products_output.${idx}.unit_of_measure`) || 'tấn'}
                                  </td>
                                  <td className="px-3 py-2.5 text-right">
                                    <input
                                      type="number"
                                      step="any"
                                      min="0"
                                      {...register(`products_output.${idx}.quantity_tons`, {
                                        valueAsNumber: true,
                                      })}
                                      className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:ring-1 focus:ring-primary"
                                    />
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <select
                                      {...register(`products_output.${idx}.warehouse_id`)}
                                      onChange={(e) => {
                                        const whId = e.target.value;
                                        setValue(`products_output.${idx}.warehouse_id`, whId || null);
                                        const found = warehousesList.find((w) => w.id === whId);
                                        setValue(`products_output.${idx}.warehouse_name`, found?.name || null);
                                      }}
                                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                                    >
                                      <option value="">-- Kho nhập --</option>
                                      {warehousesList.map((w) => (
                                        <option key={w.id} value={w.id}>
                                          [{w.code}] {w.name}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <input
                                      type="text"
                                      placeholder="Bãi/Silo..."
                                      {...register(`products_output.${idx}.storage_location`)}
                                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                                    />
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    {isOutOfPlan && (
                                      <button
                                        type="button"
                                        onClick={() => removeProduct(idx)}
                                        className="rounded p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                        title="Xóa sản phẩm này"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="border-t-2 border-border bg-muted/20 font-bold">
                            <tr>
                              <td colSpan={4} className="px-3 py-2.5 text-right text-foreground">
                                Tổng sản lượng thành phẩm thu hồi:
                              </td>
                              <td className="px-3 py-2.5 text-right text-sm text-emerald-600 dark:text-emerald-400">
                                {totalFinishedOutput.toLocaleString()} Tấn
                              </td>
                              <td colSpan={3}></td>
                            </tr>
                            {totalByproductOutput > 0 && (
                              <tr className="border-t border-border/50 text-xs">
                                <td colSpan={4} className="px-3 py-1.5 text-right text-muted-foreground font-normal">
                                  Tổng sản lượng phụ phẩm (không tính vào TP):
                                </td>
                                <td className="px-3 py-1.5 text-right font-semibold text-purple-600 dark:text-purple-400">
                                  {totalByproductOutput.toLocaleString()} Tấn
                                </td>
                                <td></td>
                              </tr>
                            )}
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: TIÊU HAO NGUYÊN NHIÊN LIỆU (Yêu cầu 1) */}
              {activeTab === 'materials' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h3 className="text-xs font-bold text-foreground">
                          Tiêu hao Nguyên nhiên liệu & Năng lượng theo kế hoạch
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Bao gồm toàn bộ các loại điện, than, dầu, nước, hóa chất đã đề cập ở kế hoạch sản xuất
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCustomMaterial}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Thêm tiêu hao khác
                      </button>
                    </div>

                    {materialFields.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        Chưa có mục tiêu hao nào. Nhấp vào &quot;Thêm tiêu hao khác&quot; để thêm.
                      </div>
                    ) : (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-muted/40 font-semibold text-muted-foreground">
                            <tr>
                              <th className="px-3 py-2">Tên vật tư / Nhiên liệu / Năng lượng</th>
                              <th className="px-3 py-2 text-center">Nhóm</th>
                              <th className="px-3 py-2 text-center">Đơn vị</th>
                              <th className="px-3 py-2 text-right w-44">Tiêu hao thực tế trong ca *</th>
                              <th className="px-3 py-2 w-44">Kho xuất</th>
                              <th className="px-3 py-2">Ghi chú</th>
                              <th className="px-3 py-2 text-center w-12"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {materialFields.map((field, idx) => {
                              const cat = watch(`materials_consumption.${idx}.category`);
                              return (
                                <tr key={field.id} className="hover:bg-muted/20">
                                  <td className="px-3 py-2.5">
                                    <input
                                      type="text"
                                      list="materials-catalog-datalist"
                                      {...register(`materials_consumption.${idx}.resource_name`)}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setValue(`materials_consumption.${idx}.resource_name`, val);
                                        const matched = materialsCatalog.find(
                                          (m) =>
                                            m.name.toLowerCase() === val.toLowerCase() ||
                                            m.code.toLowerCase() === val.toLowerCase(),
                                        );
                                        if (matched) {
                                          if (matched.unit_of_measure) {
                                            setValue(`materials_consumption.${idx}.unit_of_measure`, matched.unit_of_measure);
                                          }
                                          setValue(
                                            `materials_consumption.${idx}.category`,
                                            matched.category === 'raw_material'
                                              ? 'material'
                                              : matched.category === 'fuel_energy'
                                              ? 'fuel'
                                              : 'supply',
                                          );
                                          if (matched.id) {
                                            setValue(`materials_consumption.${idx}.material_id`, matched.id);
                                          }
                                        }
                                        if (isElectricityResource(val, watch(`materials_consumption.${idx}.unit_of_measure`))) {
                                          setValue(`materials_consumption.${idx}.warehouse_id`, null);
                                          setValue(`materials_consumption.${idx}.warehouse_name`, null);
                                        }
                                      }}
                                      placeholder="Chọn hoặc nhập tên vật tư..."
                                      className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs font-semibold text-foreground focus:bg-background"
                                    />
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        cat === 'fuel'
                                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                          : cat === 'supply'
                                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      }`}
                                    >
                                      {cat === 'fuel'
                                        ? 'Nhiên liệu/Điện'
                                        : cat === 'supply'
                                        ? 'Vật tư tiêu hao'
                                        : 'Nguyên liệu'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-muted-foreground">
                                    <input
                                      type="text"
                                      list="units-catalog-datalist"
                                      {...register(`materials_consumption.${idx}.unit_of_measure`)}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setValue(`materials_consumption.${idx}.unit_of_measure`, val);
                                        if (isElectricityResource(watch(`materials_consumption.${idx}.resource_name`), val)) {
                                          setValue(`materials_consumption.${idx}.warehouse_id`, null);
                                          setValue(`materials_consumption.${idx}.warehouse_name`, null);
                                        }
                                      }}
                                      className="w-20 rounded border border-input bg-transparent px-1.5 py-1 text-center text-xs font-semibold text-foreground focus:bg-background"
                                      placeholder="ĐVT"
                                    />
                                  </td>
                                  <td className="px-3 py-2.5 text-right">
                                    <input
                                      type="number"
                                      step="any"
                                      min="0"
                                      {...register(`materials_consumption.${idx}.actual_quantity`, {
                                        valueAsNumber: true,
                                      })}
                                      className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-right text-xs font-bold text-primary focus:ring-1 focus:ring-primary"
                                    />
                                  </td>
                                  <td className="px-3 py-2.5">
                                    {isElectricityResource(
                                      watch(`materials_consumption.${idx}.resource_name`),
                                      watch(`materials_consumption.${idx}.unit_of_measure`),
                                    ) ? (
                                      <div className="flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] text-amber-700 dark:text-amber-300 font-medium border border-dashed border-amber-500/30">
                                        <Zap className="h-3 w-3 text-amber-500 shrink-0" />
                                        <span>Không qua kho (Lưới điện)</span>
                                      </div>
                                    ) : (
                                      <select
                                        {...register(`materials_consumption.${idx}.warehouse_id`)}
                                        onChange={(e) => {
                                          const whId = e.target.value;
                                          setValue(`materials_consumption.${idx}.warehouse_id`, whId || null);
                                          const found = warehousesList.find((w) => w.id === whId);
                                          setValue(`materials_consumption.${idx}.warehouse_name`, found?.name || null);
                                        }}
                                        className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                                      >
                                        <option value="">-- Kho xuất --</option>
                                        {warehousesList.map((w) => (
                                          <option key={w.id} value={w.id}>
                                            [{w.code}] {w.name}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <input
                                      type="text"
                                      placeholder="Chỉ số công tơ, bồn..."
                                      {...register(`materials_consumption.${idx}.notes`)}
                                      className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs text-foreground focus:bg-background"
                                    />
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => removeMaterial(idx)}
                                      className="rounded p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                      title="Xóa mục này"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {/* Datalists for materials catalog & units */}
                        <datalist id="materials-catalog-datalist">
                          {materialsCatalog.map((m) => (
                            <option key={m.id} value={m.name}>
                              [{m.code}] {m.unit_of_measure ? `(ĐVT: ${m.unit_of_measure})` : ''}
                            </option>
                          ))}
                        </datalist>

                        <datalist id="units-catalog-datalist">
                          {availableUnits.map((u) => (
                            <option key={u} value={u} />
                          ))}
                        </datalist>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: THỜI GIAN DỪNG CHUYỀN & SỰ CỐ (Nhiều lần dừng trong ca / kỳ) */}
              {activeTab === 'downtime' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    {/* Khối nhập nhanh tổng thời gian dừng máy theo 3 nhóm */}
                    <div className="mb-4 rounded-xl border border-border bg-muted/20 p-3.5">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-primary" />
                          Tổng hợp thời gian dừng theo 3 nhóm (Linh động nhập số giờ lớn hơn)
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {downtimeEventFields.length > 0
                            ? 'Đang tự động cộng dồn từ các lần dừng chi tiết bên dưới'
                            : 'Nhập trực tiếp số giờ theo từng nhóm nếu không phân rã chi tiết'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border border-rose-200 bg-rose-50/40 p-2.5 dark:border-rose-900/50 dark:bg-rose-950/20">
                          <label className="text-[11px] font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                            1. Sự cố dừng chuyền (giờ)
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            {...register('downtime_breakdown.incident_hours', { valueAsNumber: true })}
                            disabled={downtimeEventFields.length > 0}
                            placeholder="0.0"
                            className="mt-1 w-full rounded border border-rose-300 bg-background px-2.5 py-1.5 text-xs font-bold text-rose-700 dark:border-rose-900 dark:text-rose-300 disabled:opacity-75"
                          />
                          <p className="mt-1 text-[10px] text-muted-foreground">Cơ khí, điện, cấp liệu, lỗi vận hành</p>
                        </div>

                        <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-2.5 dark:border-amber-900/50 dark:bg-amber-950/20">
                          <label className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                            <Wrench className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            2. Dừng bảo trì (giờ)
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            {...register('downtime_breakdown.maintenance_hours', { valueAsNumber: true })}
                            disabled={downtimeEventFields.length > 0}
                            placeholder="0.0"
                            className="mt-1 w-full rounded border border-amber-300 bg-background px-2.5 py-1.5 text-xs font-bold text-amber-700 dark:border-amber-900 dark:text-amber-300 disabled:opacity-75"
                          />
                          <p className="mt-1 text-[10px] text-muted-foreground">Bảo dưỡng, vệ sinh, sửa chữa theo lịch</p>
                        </div>

                        <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-2.5 dark:border-blue-900/50 dark:bg-blue-950/20">
                          <label className="text-[11px] font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                            <PauseCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            3. Nghỉ kế hoạch (giờ)
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            {...register('downtime_breakdown.planned_shutdown_hours', { valueAsNumber: true })}
                            disabled={downtimeEventFields.length > 0}
                            placeholder="0.0"
                            className="mt-1 w-full rounded border border-blue-300 bg-background px-2.5 py-1.5 text-xs font-bold text-blue-700 dark:border-blue-900 dark:text-blue-300 disabled:opacity-75"
                          />
                          <p className="mt-1 text-[10px] text-muted-foreground">Nghỉ ca, chờ điện, lịch điều độ tháng/kỳ</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
                      <div>
                        <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          Nhật ký các lần dừng máy chi tiết ({downtimeEventFields.length} lần)
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Ghi nhận chi tiết từng lần dừng, linh động nhập số giờ và nguyên nhân khắc phục
                        </p>
                      </div>

                      {/* Nút xổ xuống thêm lần dừng máy */}
                      <div className="relative" ref={downtimeDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsDowntimeDropdownOpen(!isDowntimeDropdownOpen)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors shadow-xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Thêm ghi nhận dừng máy
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isDowntimeDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDowntimeDropdownOpen && (
                          <div className="absolute right-0 top-full mt-1.5 z-30 w-64 rounded-xl border border-border bg-card p-1.5 shadow-xl animate-in fade-in zoom-in-95">
                            <button
                              type="button"
                              onClick={() => {
                                handleAddDowntimeEvent('breakdown_incident');
                                setIsDowntimeDropdownOpen(false);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-foreground hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 transition-colors"
                            >
                              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                                <AlertTriangle className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">Sự cố dừng chuyền</div>
                                <div className="text-[10px] text-muted-foreground">Cơ khí, điện, cấp liệu, kẹt máy...</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleAddDowntimeEvent('planned_maintenance');
                                setIsDowntimeDropdownOpen(false);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-foreground hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40 dark:hover:text-amber-300 transition-colors"
                            >
                              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                                <Wrench className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">Dừng bảo trì</div>
                                <div className="text-[10px] text-muted-foreground">Bảo dưỡng, thay phụ tùng, kiểm tra định kỳ</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleAddDowntimeEvent('scheduled_shutdown');
                                setIsDowntimeDropdownOpen(false);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-foreground hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/40 dark:hover:text-blue-300 transition-colors"
                            >
                              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                                <PauseCircle className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">Nghỉ kế hoạch</div>
                                <div className="text-[10px] text-muted-foreground">Nghỉ theo lịch điều độ, chờ điện, giao ca</div>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {downtimeEventFields.length === 0 ? (
                      <div className="py-10 text-center space-y-2">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-medium text-foreground">Ca vận hành liên tục, không có lần dừng máy nào.</p>
                        <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                          Nếu trong ca hoặc kỳ có phát sinh dừng bảo dưỡng thiết bị, sự cố kỹ thuật hoặc nghỉ theo kế hoạch, hãy nhấp nút &quot;Thêm ghi nhận dừng máy ▾&quot; ở trên để ghi nhận.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {downtimeEventFields.map((field, idx) => {
                          const currentType = watch(`downtime_breakdown.events.${idx}.type`) || 'breakdown_incident';
                          const currentDur = watch(`downtime_breakdown.events.${idx}.duration_hours`);
                          const sTime = watch(`downtime_breakdown.events.${idx}.start_time`) || '08:00';
                          const eTime = watch(`downtime_breakdown.events.${idx}.end_time`) || '08:30';
                          const durHours =
                            currentDur !== undefined && currentDur !== null && !isNaN(Number(currentDur)) && Number(currentDur) > 0
                              ? Number(currentDur)
                              : calculateDowntimeDuration(sTime, eTime).hours;

                          const isIncident = currentType === 'breakdown_incident';
                          const isMaint = currentType === 'planned_maintenance';
                          const isShutdown = currentType === 'scheduled_shutdown';

                          return (
                            <div
                              key={field.id}
                              className={`rounded-xl border p-3.5 shadow-xs transition-all ${
                                isIncident
                                  ? 'border-rose-200 bg-rose-50/20 dark:border-rose-900/50 dark:bg-rose-950/10'
                                  : isMaint
                                  ? 'border-amber-200 bg-amber-50/20 dark:border-amber-900/50 dark:bg-amber-950/10'
                                  : 'border-blue-200 bg-blue-50/20 dark:border-blue-900/50 dark:bg-blue-950/10'
                              }`}
                            >
                              {/* Event Top Bar */}
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                                    #{idx + 1}
                                  </span>
                                  {/* Event Type Selector */}
                                  <div className="flex rounded-lg border border-border bg-background p-0.5 text-xs">
                                    <button
                                      type="button"
                                      onClick={() => setValue(`downtime_breakdown.events.${idx}.type`, 'breakdown_incident')}
                                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                                        isIncident
                                          ? 'bg-rose-100 text-rose-800 font-bold dark:bg-rose-950 dark:text-rose-200 shadow-xs'
                                          : 'text-muted-foreground hover:text-foreground'
                                      }`}
                                    >
                                      <AlertTriangle className="h-3 w-3" />
                                      Sự cố dừng chuyền
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setValue(`downtime_breakdown.events.${idx}.type`, 'planned_maintenance')}
                                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                                        isMaint
                                          ? 'bg-amber-100 text-amber-800 font-bold dark:bg-amber-950 dark:text-amber-200 shadow-xs'
                                          : 'text-muted-foreground hover:text-foreground'
                                      }`}
                                    >
                                      <Wrench className="h-3 w-3" />
                                      Dừng bảo trì
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setValue(`downtime_breakdown.events.${idx}.type`, 'scheduled_shutdown')}
                                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                                        isShutdown
                                          ? 'bg-blue-100 text-blue-800 font-bold dark:bg-blue-950 dark:text-blue-200 shadow-xs'
                                          : 'text-muted-foreground hover:text-foreground'
                                      }`}
                                    >
                                      <PauseCircle className="h-3 w-3" />
                                      Nghỉ kế hoạch
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                      isIncident
                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                        : isMaint
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                    }`}
                                  >
                                    <Clock className="h-3 w-3" />
                                    {durHours} giờ
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => removeDowntimeEvent(idx)}
                                    className="rounded p-1 text-muted-foreground hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-colors"
                                    title="Xóa lần dừng này"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Event Fields Grid */}
                              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12 items-start">
                                {/* 1. Time Range & Direct Hours */}
                                <div className="sm:col-span-5 flex items-center gap-2 bg-background p-2.5 rounded-lg border border-border">
                                  <div className="w-24">
                                    <label className="block text-[10px] font-bold text-foreground">
                                      Số giờ dừng *
                                    </label>
                                    <input
                                      type="number"
                                      step="any"
                                      min="0"
                                      {...register(`downtime_breakdown.events.${idx}.duration_hours`, { valueAsNumber: true })}
                                      className="mt-0.5 w-full rounded border border-primary/40 bg-primary/5 px-2 py-1 text-xs font-bold text-primary focus:bg-background focus:ring-1 focus:ring-primary"
                                    />
                                  </div>
                                  <div className="flex-1 flex items-center gap-1 border-l border-border pl-2">
                                    <div className="flex-1">
                                      <label className="block text-[9px] font-medium text-muted-foreground">
                                        Từ giờ
                                      </label>
                                      <input
                                        type="time"
                                        {...register(`downtime_breakdown.events.${idx}.start_time`)}
                                        className="mt-0.5 w-full rounded border border-input bg-transparent px-1 py-0.5 text-xs text-foreground focus:bg-background"
                                      />
                                    </div>
                                    <span className="text-muted-foreground text-[10px] font-bold pt-3">→</span>
                                    <div className="flex-1">
                                      <label className="block text-[9px] font-medium text-muted-foreground">
                                        Đến giờ
                                      </label>
                                      <input
                                        type="time"
                                        {...register(`downtime_breakdown.events.${idx}.end_time`)}
                                        className="mt-0.5 w-full rounded border border-input bg-transparent px-1 py-0.5 text-xs text-foreground focus:bg-background"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* 2. Equipment / Machine Selection */}
                                <div className="sm:col-span-7 bg-background p-2.5 rounded-lg border border-border">
                                  <div className="flex items-center justify-between">
                                    <label className="block text-[10px] font-semibold text-foreground">
                                      Mã thiết bị / Máy dừng
                                    </label>
                                    <span className="text-[9px] text-muted-foreground font-mono">Dùng cho biểu đồ Pareto</span>
                                  </div>
                                  <div className="mt-1 flex items-center gap-2">
                                    <select
                                      value={
                                        watch(`downtime_breakdown.events.${idx}.machine_id`) ||
                                        (watch(`downtime_breakdown.events.${idx}.equipment_code`) ? '__custom__' : '')
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '') {
                                          setValue(`downtime_breakdown.events.${idx}.machine_id`, null);
                                          setValue(`downtime_breakdown.events.${idx}.equipment_code`, null);
                                          setValue(`downtime_breakdown.events.${idx}.equipment_name`, null);
                                        } else if (val === '__custom__') {
                                          setValue(`downtime_breakdown.events.${idx}.machine_id`, null);
                                          if (!watch(`downtime_breakdown.events.${idx}.equipment_code`)) {
                                            setValue(`downtime_breakdown.events.${idx}.equipment_code`, '');
                                          }
                                        } else {
                                          const m = machineOptions.find((item) => item.id === val);
                                          if (m) {
                                            setValue(`downtime_breakdown.events.${idx}.machine_id`, m.id);
                                            setValue(`downtime_breakdown.events.${idx}.equipment_code`, m.machine_code);
                                            setValue(`downtime_breakdown.events.${idx}.equipment_name`, m.name);
                                          }
                                        }
                                      }}
                                      className="flex-1 rounded border border-input bg-transparent px-2 py-1 text-xs text-foreground focus:bg-background"
                                    >
                                      <option value="">-- Toàn dây chuyền / Chưa gán máy --</option>
                                      {machineOptions.map((m) => (
                                        <option key={m.id} value={m.id}>
                                          {m.machine_code} - {m.name}
                                        </option>
                                      ))}
                                      <option value="__custom__">Mã khác (nhập tay)...</option>
                                    </select>

                                    {/* If custom equipment code */}
                                    {(!watch(`downtime_breakdown.events.${idx}.machine_id`) &&
                                      watch(`downtime_breakdown.events.${idx}.equipment_code`) !== null &&
                                      watch(`downtime_breakdown.events.${idx}.equipment_code`) !== undefined) && (
                                      <input
                                        type="text"
                                        placeholder="Mã máy (vd: MN-01)"
                                        {...register(`downtime_breakdown.events.${idx}.equipment_code`)}
                                        className="w-32 rounded border border-primary/50 bg-primary/5 px-2 py-1 text-xs font-semibold text-foreground focus:bg-background"
                                      />
                                    )}
                                  </div>
                                </div>

                                {/* 3. Sub-classification (Incident Category / Shutdown Type / Maintenance Type) */}
                                {isIncident && (
                                  <div className="sm:col-span-12 bg-background p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
                                    <div className="flex items-center justify-between">
                                      <label className="block text-[10px] font-semibold text-rose-700 dark:text-rose-400">
                                        Phân loại sự cố *
                                      </label>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setAddingCategoryIdx(idx);
                                            setNewCategoryName('');
                                          }}
                                          className="inline-flex items-center gap-1 text-[10px] text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold hover:underline"
                                        >
                                          <Plus className="h-3 w-3" /> Thêm mới
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setIsCategoryManagerOpen(true)}
                                          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground font-medium hover:underline"
                                          title="Quản lý và xóa phân loại"
                                        >
                                          <Settings2 className="h-3 w-3" /> Quản lý / Xóa
                                        </button>
                                      </div>
                                    </div>

                                    {addingCategoryIdx === idx ? (
                                      <div className="mt-1 flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={newCategoryName}
                                          onChange={(e) => setNewCategoryName(e.target.value)}
                                          placeholder="Nhập tên phân loại sự cố mới (vd: Sự cố Áp lực nước...)"
                                          className="flex-1 rounded border border-primary px-2 py-1 text-xs text-foreground bg-background"
                                          autoFocus
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              handleSaveCustomCategory(idx);
                                            }
                                          }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleSaveCustomCategory(idx)}
                                          className="rounded bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                                        >
                                          Lưu
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setAddingCategoryIdx(null)}
                                          className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                                        >
                                          Hủy
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="mt-1 flex items-center gap-1.5">
                                        <select
                                          {...register(`downtime_breakdown.events.${idx}.incident_category`)}
                                          className="flex-1 rounded border border-input bg-transparent px-2 py-1 text-xs text-foreground focus:bg-background"
                                        >
                                          {allIncidentCategories.map((cat) => (
                                            <option key={cat} value={cat}>
                                              {cat}
                                            </option>
                                          ))}
                                        </select>
                                        {allIncidentCategories.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const cur =
                                                watch(`downtime_breakdown.events.${idx}.incident_category`) ||
                                                allIncidentCategories[0];
                                              if (cur && window.confirm(`Bạn có chắc muốn xóa phân loại "${cur}" khỏi danh mục lựa chọn?`)) {
                                                handleDeleteCategory(cur);
                                              }
                                            }}
                                            className="rounded p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                            title="Xóa phân loại này khỏi danh sách"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {isShutdown && (
                                  <div className="sm:col-span-12 bg-background p-2.5 rounded-lg border border-blue-200 dark:border-blue-900/50">
                                    <label className="block text-[10px] font-semibold text-blue-700 dark:text-blue-400">
                                      Phân loại nghỉ kế hoạch *
                                    </label>
                                    <select
                                      {...register(`downtime_breakdown.events.${idx}.shutdown_type`)}
                                      className="mt-1 w-full rounded border border-input bg-transparent px-2 py-1 text-xs text-foreground focus:bg-background"
                                    >
                                      <option value="Nghỉ trong kế hoạch">Nghỉ trong kế hoạch (Lịch sản xuất, Điều độ điện, Thay ca)</option>
                                      <option value="Đầy kho">Đầy kho (Kho chứa / Silo / Bãi quặng đầy, tạm dừng kéo dài)</option>
                                      <option value="Khác">Khác</option>
                                    </select>
                                  </div>
                                )}

                                {isMaint && (
                                  <div className="sm:col-span-12 bg-background p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50">
                                    <label className="block text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                                      Phân loại bảo trì *
                                    </label>
                                    <select
                                      {...register(`downtime_breakdown.events.${idx}.maintenance_type`)}
                                      className="mt-1 w-full rounded border border-input bg-transparent px-2 py-1 text-xs text-foreground focus:bg-background"
                                    >
                                      <option value="Bảo trì kế hoạch">Bảo trì kế hoạch (Bảo dưỡng định kỳ, tra mỡ, kiểm tra máy)</option>
                                      <option value="Đầy kho bảo trì">Đầy kho bảo trì (Tranh thủ dừng bảo trì / sửa chữa khi đầy kho)</option>
                                      <option value="Khác">Khác</option>
                                    </select>
                                  </div>
                                )}

                                {/* 4. Details and Actions */}
                                <div className="sm:col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  <div className="bg-background p-2.5 rounded-lg border border-border">
                                    <label className="block text-[10px] font-semibold text-foreground">
                                      {isIncident
                                        ? 'Nguyên nhân / Hiện tượng sự cố *'
                                        : isMaint
                                        ? 'Nội dung bảo trì thiết bị *'
                                        : 'Lý do nghỉ theo kế hoạch *'}
                                    </label>
                                    <input
                                      type="text"
                                      placeholder={
                                        isIncident
                                          ? 'VD: Kẹt dị vật buồng nghiền, nhảy rơle nhiệt...'
                                          : isMaint
                                          ? 'VD: Tra mỡ vòng bi, cân chỉnh băng tải, thay tấm lót...'
                                          : 'VD: Nghỉ theo lịch điều độ điện, chuyển đổi ca...'
                                      }
                                      {...register(`downtime_breakdown.events.${idx}.reason`)}
                                      className="mt-0.5 w-full rounded border border-input bg-transparent px-2 py-1 text-xs text-foreground focus:bg-background"
                                    />
                                  </div>

                                  <div className="bg-background p-2.5 rounded-lg border border-border">
                                    <label className="block text-[10px] font-semibold text-foreground">
                                      {isIncident
                                        ? 'Biện pháp khắc phục / Xử lý *'
                                        : isMaint
                                        ? 'Người/Đội thực hiện hoặc Kết quả'
                                        : 'Ghi chú thêm'}
                                    </label>
                                    <input
                                      type="text"
                                      placeholder={
                                        isIncident
                                          ? 'VD: Đã gắp dị vật, kiểm tra tải và chạy lại bình thường...'
                                          : isMaint
                                          ? 'VD: Tổ Cơ điện hoàn tất bảo dưỡng, chạy thử đạt yêu cầu...'
                                          : 'Ghi chú thông tin điều độ...'
                                      }
                                      {...register(`downtime_breakdown.events.${idx}.action_taken`)}
                                      className="mt-0.5 w-full rounded border border-input bg-transparent px-2 py-1 text-xs text-foreground focus:bg-background"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Downtime live computation card */}
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-rose-500/10 p-2 text-rose-500">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          Tổng thời gian dừng chuyền: <span className="text-rose-600 dark:text-rose-400">{totalDowntime} giờ</span>
                          {watchEvents.length > 0 && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              ({watchEvents.length} lần dừng)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Bảo trì: {maintenanceHours}h • Sự cố: {incidentHours}h • Nghỉ kế hoạch: {plannedShutdownHours}h
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground">Giờ chạy máy thực tế:</span>
                      <p className="text-base font-bold text-primary">{runningHours} giờ / {stdHours}h</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-6 py-3.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded bg-muted/70 px-2.5 py-1 text-[11px] font-medium border border-border/50">
                  Chạy máy: <strong className="text-primary">{runningHours}h</strong> / {stdHours}h
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-muted/70 px-2.5 py-1 text-[11px] font-medium border border-border/50">
                  TP chính: <strong className="text-emerald-600 dark:text-emerald-400">{totalFinishedOutput.toLocaleString('vi-VN')} Tấn</strong>
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-muted/70 px-2.5 py-1 text-[11px] font-medium border border-border/50">
                  Thu hồi: <strong className="text-foreground">{recoveryRate.toFixed(1)}%</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-input bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isSubmitting ? 'Đang lưu...' : isEditing ? 'Cập nhật số liệu' : 'Lưu bản ghi'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Dialog for adding out-of-plan products */}
      <AddShiftProductDialog
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onAdd={handleAddOutOfPlanProduct}
        existingProductIds={existingProductIds}
      />

      {/* Category Manager Modal */}
      {isCategoryManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground">Quản lý Phân loại Sự cố</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryManagerOpen(false)}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                Thêm phân loại mới hoặc xóa bớt các phân loại cũ không còn áp dụng trong nhà máy.
              </p>

              {/* Add form */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nhập tên phân loại mới..."
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveCustomCategory();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleSaveCustomCategory()}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Thêm
                </button>
              </div>

              {/* List */}
              <div className="max-h-64 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                {allIncidentCategories.map((cat) => (
                  <div key={cat} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-muted/30">
                    <span className="font-medium text-foreground">{cat}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="rounded p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-colors"
                      title={`Xóa "${cat}"`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {allIncidentCategories.length === 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Không còn phân loại nào. Hãy thêm mới hoặc khôi phục mặc định.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleRestoreDefaultCategories}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Khôi phục mặc định
                </button>
                <button
                  type="button"
                  onClick={() => setIsCategoryManagerOpen(false)}
                  className="rounded-lg bg-secondary px-3.5 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80"
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
