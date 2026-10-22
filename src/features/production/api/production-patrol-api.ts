import { supabase } from '@/lib/supabase/client';
import type {
  PatrolArea,
  PatrolAreaMachineItem,
  PatrolAreaFormValues,
  AvailableMachineItem,
  PatrolLog,
  PatrolIncident,
  QuickIncidentFormValues,
  PatrolFilterParams,
  PaginatedResult,
} from '../types';

interface RawMachineRelation {
  id: string;
  machine_id: string;
  sort_order: number;
  inspection_notes: string | null;
  machines: {
    machine_code: string;
    name: string;
  } | null;
}

interface RawPatrolArea {
  id: string;
  area_code: string;
  name: string;
  line_id: string | null;
  qr_code: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
  production_lines: {
    name: string;
  } | null;
  production_patrol_area_machines: RawMachineRelation[];
}

interface RawPatrolIncident {
  id: string;
  incident_code: string;
  patrol_log_id: string | null;
  area_id: string | null;
  machine_id: string;
  shift_id: string | null;
  reported_at: string;
  reporter_name: string;
  condition_type: string;
  description: string;
  resolution_type: 'resolved' | 'temporary_fix' | 'maintenance_scheduled';
  maintenance_work_order_id: string | null;
  status: 'reported' | 'in_progress' | 'resolved' | 'closed';
  incident_image_url: string | null;
  resolution_image_url: string | null;
  created_at: string;
  updated_at: string;
  production_patrol_areas: {
    name: string;
  } | null;
  machines: {
    machine_code: string;
    name: string;
  } | null;
  maintenance_work_orders: {
    work_order_number: string;
    status: string;
  } | null;
}

/**
 * Nén ảnh hiện trường tuần kiểm trước khi tải lên Supabase Storage
 * Giảm độ phân giải tối đa 1600px và nén JPEG 75% để ảnh rõ nét mà dung lượng cực nhẹ (~150-300KB)
 */
export async function compressPatrolImage(file: File, maxDimension = 1600, quality = 0.75): Promise<File> {
  // Bỏ qua nếu là file gif
  if (file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { naturalWidth: width, naturalHeight: height } = img;

      // Tính toán tỷ lệ thu nhỏ nếu kích thước vượt quá maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Tải ảnh sự cố hoặc ảnh sau khắc phục lên Supabase Storage bucket 'incident-photos'
 */
export async function uploadIncidentPhoto(file: File, type: 'incident' | 'resolution'): Promise<string> {
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Dung lượng ảnh gốc không được vượt quá 15MB.');
  }

  // Nén ảnh client-side
  const compressed = await compressPatrolImage(file, 1600, 0.75);

  const fileExt = compressed.type === 'image/gif' ? 'gif' : 'jpg';
  const filePath = `${type}s/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('incident-photos')
    .upload(filePath, compressed, {
      contentType: compressed.type,
      cacheControl: '31536000',
      upsert: true,
    });

  if (uploadError) {
    console.error('Failed to upload incident photo:', uploadError);
    throw new Error(`Tải ảnh thất bại: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('incident-photos')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}


interface RawPatrolLog {
  id: string;
  area_id: string;
  shift_id: string | null;
  scanned_at: string;
  inspector_name: string;
  has_issue: boolean;
  checked_machines_count: number;
  notes: string | null;
  created_at: string;
  production_patrol_areas: {
    area_code: string;
    name: string;
  } | null;
  production_patrol_incidents: RawPatrolIncident[];
}

export const productionPatrolApi = {
  /**
   * Fetch all active patrol areas with their assigned machines
   */
  async getPatrolAreas(): Promise<PatrolArea[]> {
    const { data, error } = await supabase
      .from('production_patrol_areas')
      .select(`
        id,
        area_code,
        name,
        line_id,
        qr_code,
        description,
        order_index,
        is_active,
        production_lines:line_id ( name ),
        production_patrol_area_machines (
          id,
          machine_id,
          sort_order,
          inspection_notes,
          machines:machine_id ( machine_code, name )
        )
      `)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching patrol areas:', error);
      throw error;
    }

    const rawAreas = (data || []) as unknown as RawPatrolArea[];

    return rawAreas.map((area) => {
      const sortedMachines: PatrolAreaMachineItem[] = (area.production_patrol_area_machines || [])
        .map((m) => ({
          id: m.id,
          machine_id: m.machine_id,
          machine_code: m.machines?.machine_code || 'N/A',
          machine_name: m.machines?.name || 'Thiết bị không xác định',
          sort_order: m.sort_order ?? 1,
          inspection_notes: m.inspection_notes,
        }))
        .sort((a, b) => a.sort_order - b.sort_order);

      return {
        id: area.id,
        area_code: area.area_code,
        name: area.name,
        line_id: area.line_id,
        line_name: area.production_lines?.name,
        qr_code: area.qr_code,
        description: area.description,
        order_index: area.order_index,
        is_active: area.is_active,
        machines: sortedMachines,
      };
    });
  },

  /**
   * Fetch all plant machines available to be assigned to patrol areas
   */
  async getAvailableMachines(): Promise<AvailableMachineItem[]> {
    const { data, error } = await supabase
      .from('machines')
      .select('id, machine_code, name, line_id, status')
      .order('machine_code', { ascending: true });

    if (error) {
      console.error('Error fetching available machines:', error);
      throw error;
    }

    return (data || []) as AvailableMachineItem[];
  },

  /**
   * Create a new patrol area with assigned machines and QR code
   */
  async createPatrolArea(payload: PatrolAreaFormValues): Promise<PatrolArea> {
    // 1. Insert area
    const { data: areaData, error: areaError } = await supabase
      .from('production_patrol_areas')
      .insert({
        area_code: payload.area_code.trim().toUpperCase(),
        name: payload.name.trim(),
        line_id: payload.line_id || null,
        qr_code: payload.qr_code.trim().toUpperCase(),
        description: payload.description?.trim() || null,
        order_index: payload.order_index ?? 1,
        is_active: payload.is_active ?? true,
      })
      .select('id')
      .single();

    if (areaError) {
      console.error('Error creating patrol area:', areaError);
      throw areaError;
    }

    const areaId = (areaData as { id: string }).id;

    // 2. Insert assigned machines
    if (payload.machines && payload.machines.length > 0) {
      const machineInserts = payload.machines.map((m, idx) => ({
        area_id: areaId,
        machine_id: m.machine_id,
        sort_order: m.sort_order ?? idx + 1,
        inspection_notes: m.inspection_notes?.trim() || null,
      }));

      const { error: machinesError } = await supabase
        .from('production_patrol_area_machines')
        .insert(machineInserts);

      if (machinesError) {
        console.error('Error assigning machines to patrol area:', machinesError);
        throw machinesError;
      }
    }

    const allAreas = await this.getPatrolAreas();
    const created = allAreas.find((a) => a.id === areaId);
    if (!created) {
      throw new Error('Khu vực đã tạo nhưng không tìm thấy dữ liệu.');
    }
    return created;
  },

  /**
   * Update an existing patrol area and its assigned machines
   */
  async updatePatrolArea(id: string, payload: PatrolAreaFormValues): Promise<PatrolArea> {
    // 1. Update area details
    const { error: areaError } = await supabase
      .from('production_patrol_areas')
      .update({
        area_code: payload.area_code.trim().toUpperCase(),
        name: payload.name.trim(),
        line_id: payload.line_id || null,
        qr_code: payload.qr_code.trim().toUpperCase(),
        description: payload.description?.trim() || null,
        order_index: payload.order_index ?? 1,
        is_active: payload.is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (areaError) {
      console.error('Error updating patrol area:', areaError);
      throw areaError;
    }

    // 2. Sync machines: delete old assignments and re-insert new
    const { error: delError } = await supabase
      .from('production_patrol_area_machines')
      .delete()
      .eq('area_id', id);

    if (delError) {
      console.error('Error removing old patrol area machines:', delError);
      throw delError;
    }

    if (payload.machines && payload.machines.length > 0) {
      const machineInserts = payload.machines.map((m, idx) => ({
        area_id: id,
        machine_id: m.machine_id,
        sort_order: m.sort_order ?? idx + 1,
        inspection_notes: m.inspection_notes?.trim() || null,
      }));

      const { error: insError } = await supabase
        .from('production_patrol_area_machines')
        .insert(machineInserts);

      if (insError) {
        console.error('Error re-inserting patrol area machines:', insError);
        throw insError;
      }
    }

    const allAreas = await this.getPatrolAreas();
    const updated = allAreas.find((a) => a.id === id);
    if (!updated) {
      throw new Error('Khu vực đã cập nhật nhưng không tìm thấy dữ liệu.');
    }
    return updated;
  },

  /**
   * Delete a patrol area (soft-deletes to preserve historic audit logs)
   */
  async deletePatrolArea(id: string): Promise<void> {
    const { error } = await supabase
      .from('production_patrol_areas')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting patrol area:', error);
      throw error;
    }
  },

  /**
   * Fetch paginated patrol logs with linked incidents
   */
  async getPatrolLogs(params: PatrolFilterParams = {}): Promise<PaginatedResult<PatrolLog>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 15;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('production_patrol_logs')
      .select(`
        id,
        area_id,
        shift_id,
        scanned_at,
        inspector_name,
        has_issue,
        checked_machines_count,
        notes,
        created_at,
        production_patrol_areas:area_id ( area_code, name ),
        production_patrol_incidents (
          id,
          incident_code,
          area_id,
          machine_id,
          condition_type,
          description,
          resolution_type,
          maintenance_work_order_id,
          status,
          incident_image_url,
          resolution_image_url,
          reported_at,
          reporter_name,
          created_at,
          updated_at,
          machines:machine_id ( machine_code, name )
        )
      `, { count: 'exact' });

    if (params.areaId && params.areaId !== 'all') {
      query = query.eq('area_id', params.areaId);
    }
    if (params.hasIssue === 'has_issue') {
      query = query.eq('has_issue', true);
    } else if (params.hasIssue === 'normal') {
      query = query.eq('has_issue', false);
    }
    if (params.fromDate) {
      query = query.gte('scanned_at', `${params.fromDate}T00:00:00`);
    }
    if (params.toDate) {
      query = query.lte('scanned_at', `${params.toDate}T23:59:59`);
    }
    if (params.search && params.search.trim()) {
      const s = params.search.trim();
      query = query.or(`inspector_name.ilike.%${s}%,notes.ilike.%${s}%`);
    }

    query = query.order('scanned_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error('Error fetching patrol logs:', error);
      throw error;
    }

    const rawLogs = (data || []) as unknown as RawPatrolLog[];
    const totalCount = count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const items: PatrolLog[] = rawLogs.map((log) => ({
      id: log.id,
      area_id: log.area_id,
      area_code: log.production_patrol_areas?.area_code,
      area_name: log.production_patrol_areas?.name || 'Khu vực tuần kiểm',
      shift_id: log.shift_id,
      scanned_at: log.scanned_at,
      inspector_name: log.inspector_name,
      has_issue: log.has_issue,
      checked_machines_count: log.checked_machines_count,
      notes: log.notes,
      created_at: log.created_at,
      incidents: (log.production_patrol_incidents || []).map((inc) => ({
        id: inc.id,
        incident_code: inc.incident_code,
        patrol_log_id: log.id,
        area_id: inc.area_id,
        machine_id: inc.machine_id,
        machine_code: inc.machines?.machine_code || 'N/A',
        machine_name: inc.machines?.name || 'Thiết bị',
        shift_id: inc.shift_id,
        reported_at: inc.reported_at,
        reporter_name: inc.reporter_name,
        condition_type: inc.condition_type,
        description: inc.description,
        resolution_type: inc.resolution_type,
        maintenance_work_order_id: inc.maintenance_work_order_id,
        status: inc.status,
        incident_image_url: inc.incident_image_url,
        resolution_image_url: inc.resolution_image_url,
        created_at: inc.created_at,
        updated_at: inc.updated_at,
      })),
    }));

    return {
      data: items,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },

  /**
   * Fetch all incidents across patrols (for incident-focused view)
   */
  async getPatrolIncidents(params: PatrolFilterParams = {}): Promise<PaginatedResult<PatrolIncident>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 15;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('production_patrol_incidents')
      .select(`
        id,
        incident_code,
        patrol_log_id,
        area_id,
        machine_id,
        shift_id,
        reported_at,
        reporter_name,
        condition_type,
        description,
        resolution_type,
        maintenance_work_order_id,
        status,
        incident_image_url,
        resolution_image_url,
        created_at,
        updated_at,
        production_patrol_areas:area_id ( name ),
        machines:machine_id ( machine_code, name ),
        maintenance_work_orders:maintenance_work_order_id ( work_order_number, status )
      `, { count: 'exact' });

    if (params.areaId && params.areaId !== 'all') {
      query = query.eq('area_id', params.areaId);
    }
    if (params.resolutionType && params.resolutionType !== 'all') {
      query = query.eq('resolution_type', params.resolutionType);
    }
    if (params.fromDate) {
      query = query.gte('reported_at', `${params.fromDate}T00:00:00`);
    }
    if (params.toDate) {
      query = query.lte('reported_at', `${params.toDate}T23:59:59`);
    }
    if (params.search && params.search.trim()) {
      const s = params.search.trim();
      query = query.or(`incident_code.ilike.%${s}%,description.ilike.%${s}%,reporter_name.ilike.%${s}%`);
    }

    query = query.order('reported_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error('Error fetching patrol incidents:', error);
      throw error;
    }

    const rawIncidents = (data || []) as unknown as RawPatrolIncident[];
    const totalCount = count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const items: PatrolIncident[] = rawIncidents.map((inc) => ({
      id: inc.id,
      incident_code: inc.incident_code,
      patrol_log_id: inc.patrol_log_id,
      area_id: inc.area_id,
      area_name: inc.production_patrol_areas?.name || 'Khu vực tuần kiểm',
      machine_id: inc.machine_id,
      machine_code: inc.machines?.machine_code || 'N/A',
      machine_name: inc.machines?.name || 'Thiết bị',
      shift_id: inc.shift_id,
      reported_at: inc.reported_at,
      reporter_name: inc.reporter_name,
      condition_type: inc.condition_type,
      description: inc.description,
      resolution_type: inc.resolution_type,
      maintenance_work_order_id: inc.maintenance_work_order_id,
      work_order_number: inc.maintenance_work_orders?.work_order_number,
      work_order_status: inc.maintenance_work_orders?.status,
      status: inc.status,
      incident_image_url: inc.incident_image_url,
      resolution_image_url: inc.resolution_image_url,
      created_at: inc.created_at,
      updated_at: inc.updated_at,
    }));

    return {
      data: items,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },

  /**
   * Confirm that an area was inspected and all machines are normal (No incidents)
   */
  async confirmNormalInspection(payload: {
    area_id: string;
    inspector_name: string;
    checked_machines_count: number;
    shift_id?: string | null;
    notes?: string;
  }): Promise<PatrolLog> {
    const { data, error } = await supabase
      .from('production_patrol_logs')
      .insert({
        area_id: payload.area_id,
        shift_id: payload.shift_id || null,
        scanned_at: new Date().toISOString(),
        inspector_name: payload.inspector_name.trim(),
        has_issue: false,
        checked_machines_count: payload.checked_machines_count,
        notes: payload.notes?.trim() || null,
      })
      .select('id, area_id, shift_id, scanned_at, inspector_name, has_issue, checked_machines_count, notes, created_at')
      .single();

    if (error) {
      console.error('Error recording normal inspection:', error);
      throw error;
    }

    return data as unknown as PatrolLog;
  },

  /**
   * Report an incident during area patrol
   * If resolution_type === 'maintenance_scheduled', automatically creates a maintenance work order
   */
  async reportPatrolIncident(payload: QuickIncidentFormValues & {
    checked_machines_count?: number;
    shift_id?: string | null;
  }): Promise<PatrolIncident> {
    const now = new Date();
    const incidentCode = `SC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Create a patrol log entry with has_issue: true
    const { data: logData, error: logError } = await supabase
      .from('production_patrol_logs')
      .insert({
        area_id: payload.area_id,
        shift_id: payload.shift_id || null,
        scanned_at: now.toISOString(),
        inspector_name: payload.reporter_name.trim(),
        has_issue: true,
        checked_machines_count: payload.checked_machines_count ?? 1,
        notes: payload.notes?.trim() || `Phát hiện sự cố: ${payload.condition_type} - ${payload.description}`,
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Error creating patrol log for incident:', logError);
      throw logError;
    }

    const patrolLogId = (logData as { id: string } | null)?.id ?? null;
    let workOrderId: string | null = null;

    // 2. If resolution_type is 'maintenance_scheduled', handle work order (prevent duplicate or link existing)
    if (payload.resolution_type === 'maintenance_scheduled') {
      try {
        // Anti-duplicate: if user specified existing_work_order_id, link to it!
        if (payload.existing_work_order_id) {
          workOrderId = payload.existing_work_order_id;
          const { data: currentWo } = await supabase
            .from('maintenance_work_orders')
            .select('reported_issue')
            .eq('id', workOrderId)
            .maybeSingle();

          if (currentWo?.reported_issue) {
            await supabase
              .from('maintenance_work_orders')
              .update({
                reported_issue: `${currentWo.reported_issue}\n[Tuần kiểm bổ sung]: ${payload.condition_type} - ${payload.description}`,
                updated_at: now.toISOString(),
              })
              .eq('id', workOrderId);
          }
        } else if (payload.create_new_work_order === false) {
          // Check if an active open work order already exists for this machine
          const activeWo = await this.getActiveMachineWorkOrder(payload.machine_id);
          if (activeWo) {
            workOrderId = activeWo.id;
            await supabase
              .from('maintenance_work_orders')
              .update({
                reported_issue: `${activeWo.reported_issue}\n[Tuần kiểm bổ sung]: ${payload.condition_type} - ${payload.description}`,
                updated_at: now.toISOString(),
              })
              .eq('id', workOrderId);
          }
        }

        // If still no work order linked, create a new WO-TK-...
        if (!workOrderId) {
          const woNumber = `WO-TK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
          const { data: woData, error: woError } = await supabase
            .from('maintenance_work_orders')
            .insert({
              work_order_number: woNumber,
              machine_id: payload.machine_id,
              type: 'corrective',
              priority: 'medium',
              reported_issue: `[Tuần kiểm] ${payload.condition_type}: ${payload.description}`,
              downtime_minutes: 0,
              labor_hours: 0,
              spare_parts_cost: 0,
              status: 'pending',
              scheduled_date: now.toISOString(),
            })
            .select('id')
            .single();

          if (!woError && woData) {
            workOrderId = (woData as { id: string }).id;
          } else if (woError) {
            console.warn('Could not auto-create maintenance work order (skipping non-blocking link):', woError);
          }
        }
      } catch (e) {
        console.warn('Maintenance work order creation encountered an error:', e);
      }
    }

    // 3. Insert incident record
    const { data: incidentData, error: incidentError } = await supabase
      .from('production_patrol_incidents')
      .insert({
        incident_code: incidentCode,
        patrol_log_id: patrolLogId,
        area_id: payload.area_id,
        machine_id: payload.machine_id,
        shift_id: payload.shift_id || null,
        reported_at: now.toISOString(),
        reporter_name: payload.reporter_name.trim(),
        condition_type: payload.condition_type,
        description: payload.description.trim(),
        resolution_type: payload.resolution_type,
        maintenance_work_order_id: workOrderId,
        status: payload.resolution_type === 'resolved' ? 'resolved' : 'reported',
        incident_image_url: payload.incident_image_url || null,
        resolution_image_url: payload.resolution_image_url || null,
      })
      .select('id, incident_code, patrol_log_id, area_id, machine_id, shift_id, reported_at, reporter_name, condition_type, description, resolution_type, maintenance_work_order_id, status, incident_image_url, resolution_image_url, created_at, updated_at')
      .single();

    if (incidentError) {
      console.error('Error creating patrol incident:', incidentError);
      throw incidentError;
    }

    return incidentData as unknown as PatrolIncident;
  },

  /**
   * Check if a machine currently has an active incomplete work order (anti-duplicate)
   */
  async getActiveMachineWorkOrder(machineId: string): Promise<{
    id: string;
    work_order_number: string;
    reported_issue: string | null;
    status: string;
    scheduled_date: string | null;
  } | null> {
    if (!machineId) return null;
    const { data, error } = await supabase
      .from('maintenance_work_orders')
      .select('id, work_order_number, reported_issue, status, scheduled_date')
      .eq('machine_id', machineId)
      .not('status', 'in', '("completed","cancelled")')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Error checking active machine work order:', error);
      return null;
    }
    return data;
  },

  /**
   * Get all patrol incidents for a specific machine to display in Machine Detail Modal (History Tab)
   */
  async getMachinePatrolIncidents(machineId: string): Promise<PatrolIncident[]> {
    if (!machineId) return [];
    const { data, error } = await supabase
      .from('production_patrol_incidents')
      .select(`
        id,
        incident_code,
        patrol_log_id,
        area_id,
        machine_id,
        shift_id,
        reported_at,
        reporter_name,
        condition_type,
        description,
        resolution_type,
        maintenance_work_order_id,
        status,
        incident_image_url,
        resolution_image_url,
        created_at,
        updated_at,
        production_patrol_areas:area_id ( name ),
        machines:machine_id ( machine_code, name ),
        maintenance_work_orders:maintenance_work_order_id ( work_order_number, status )
      `)
      .eq('machine_id', machineId)
      .order('reported_at', { ascending: false });

    if (error) {
      console.error('Error fetching machine patrol incidents:', error);
      throw error;
    }

    const rawIncidents = (data || []) as unknown as RawPatrolIncident[];
    return rawIncidents.map((inc) => ({
      id: inc.id,
      incident_code: inc.incident_code,
      patrol_log_id: inc.patrol_log_id,
      area_id: inc.area_id,
      area_name: inc.production_patrol_areas?.name || 'Khu vực tuần kiểm',
      machine_id: inc.machine_id,
      machine_code: inc.machines?.machine_code || 'N/A',
      machine_name: inc.machines?.name || 'Thiết bị',
      shift_id: inc.shift_id,
      reported_at: inc.reported_at,
      reporter_name: inc.reporter_name,
      condition_type: inc.condition_type,
      description: inc.description,
      resolution_type: inc.resolution_type,
      maintenance_work_order_id: inc.maintenance_work_order_id,
      work_order_number: inc.maintenance_work_orders?.work_order_number,
      work_order_status: inc.maintenance_work_orders?.status,
      status: inc.status,
      incident_image_url: inc.incident_image_url,
      resolution_image_url: inc.resolution_image_url,
      created_at: inc.created_at,
      updated_at: inc.updated_at,
    }));
  },

  /**
   * Update resolution photo for an existing incident (e.g. after fixing it)
   */
  async updateIncidentResolutionPhoto(incidentId: string, resolutionImageUrl: string): Promise<void> {
    const { error } = await supabase
      .from('production_patrol_incidents')
      .update({
        resolution_image_url: resolutionImageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', incidentId);

    if (error) {
      console.error('Error updating incident resolution photo:', error);
      throw error;
    }
  },
};
