import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionPatrolApi } from '../api/production-patrol-api';
import type {
  PatrolFilterParams,
  QuickIncidentFormValues,
  PatrolAreaFormValues,
} from '../types';

export const PATROL_AREAS_QUERY_KEY = ['production_patrol_areas'] as const;
export const PATROL_LOGS_QUERY_KEY = ['production_patrol_logs'] as const;
export const PATROL_INCIDENTS_QUERY_KEY = ['production_patrol_incidents'] as const;
export const AVAILABLE_MACHINES_QUERY_KEY = ['production_available_machines'] as const;

/**
 * Hook to fetch all plant machines available for patrol assignment
 */
export function useAvailableMachines() {
  return useQuery({
    queryKey: AVAILABLE_MACHINES_QUERY_KEY,
    queryFn: () => productionPatrolApi.getAvailableMachines(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch all inspection patrol areas and their machines
 */
export function usePatrolAreas() {
  return useQuery({
    queryKey: PATROL_AREAS_QUERY_KEY,
    queryFn: () => productionPatrolApi.getPatrolAreas(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new patrol area with QR code and machine assignments
 */
export function useCreatePatrolArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PatrolAreaFormValues) => productionPatrolApi.createPatrolArea(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATROL_AREAS_QUERY_KEY });
    },
  });
}

/**
 * Hook to update an existing patrol area
 */
export function useUpdatePatrolArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PatrolAreaFormValues }) =>
      productionPatrolApi.updatePatrolArea(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATROL_AREAS_QUERY_KEY });
    },
  });
}

/**
 * Hook to soft-delete an inspection patrol area
 */
export function useDeletePatrolArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productionPatrolApi.deletePatrolArea(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATROL_AREAS_QUERY_KEY });
    },
  });
}

/**
 * Hook to fetch paginated patrol logs
 */
export function usePatrolLogs(params: PatrolFilterParams = {}) {
  return useQuery({
    queryKey: [
      ...PATROL_LOGS_QUERY_KEY,
      params.areaId || 'all',
      params.hasIssue || 'all',
      params.fromDate || '',
      params.toDate || '',
      params.search || '',
      params.page || 1,
      params.pageSize || 15,
    ],
    queryFn: () => productionPatrolApi.getPatrolLogs(params),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch incidents across all patrol logs
 */
export function usePatrolIncidents(params: PatrolFilterParams = {}) {
  return useQuery({
    queryKey: [
      ...PATROL_INCIDENTS_QUERY_KEY,
      params.areaId || 'all',
      params.resolutionType || 'all',
      params.fromDate || '',
      params.toDate || '',
      params.search || '',
      params.page || 1,
      params.pageSize || 15,
    ],
    queryFn: () => productionPatrolApi.getPatrolIncidents(params),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook mutation to confirm a normal inspection (all machines OK)
 */
export function useConfirmNormalInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      area_id: string;
      inspector_name: string;
      checked_machines_count: number;
      shift_id?: string | null;
      notes?: string;
    }) => productionPatrolApi.confirmNormalInspection(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATROL_LOGS_QUERY_KEY });
    },
  });
}

/**
 * Hook mutation to report a machine incident during patrol
 */
export function useReportPatrolIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: QuickIncidentFormValues & {
      checked_machines_count?: number;
      shift_id?: string | null;
    }) => productionPatrolApi.reportPatrolIncident(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATROL_LOGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PATROL_INCIDENTS_QUERY_KEY });
      // Invalidate maintenance work orders if present
      queryClient.invalidateQueries({ queryKey: ['maintenance_work_orders'] });
      queryClient.invalidateQueries({ queryKey: ['machine_patrol_incidents'] });
    },
  });
}

/**
 * Hook to check if a machine has an active incomplete work order (anti-duplicate)
 */
export function useActiveMachineWorkOrder(machineId?: string | null) {
  return useQuery({
    queryKey: ['active_machine_work_order', machineId],
    queryFn: () => productionPatrolApi.getActiveMachineWorkOrder(machineId || ''),
    enabled: Boolean(machineId),
    staleTime: 10 * 1000,
  });
}

/**
 * Hook to fetch all patrol incidents for a specific machine (for MachineDetailModal history tab)
 */
export function useMachinePatrolIncidents(machineId?: string | null) {
  return useQuery({
    queryKey: ['machine_patrol_incidents', machineId],
    queryFn: () => productionPatrolApi.getMachinePatrolIncidents(machineId || ''),
    enabled: Boolean(machineId),
    staleTime: 20 * 1000,
  });
}

/**
 * Hook mutation to update resolution photo for an existing incident
 */
export function useUpdateIncidentResolutionPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ incidentId, resolutionImageUrl }: { incidentId: string; resolutionImageUrl: string }) =>
      productionPatrolApi.updateIncidentResolutionPhoto(incidentId, resolutionImageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATROL_LOGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PATROL_INCIDENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['machine_patrol_incidents'] });
    },
  });
}

