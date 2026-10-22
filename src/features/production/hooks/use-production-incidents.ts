import { useQuery } from '@tanstack/react-query';
import {
  fetchDowntimeIncidents,
  calculatePareto,
  generateIncidentAIInsights,
} from '../api/production-api';
import type { IncidentAnalyticsFilters } from '../types';

export const DOWNTIME_INCIDENTS_QUERY_KEY = ['downtime_incidents'] as const;

export function useProductionIncidents(filters: IncidentAnalyticsFilters = {}) {
  const query = useQuery({
    queryKey: [
      ...DOWNTIME_INCIDENTS_QUERY_KEY,
      filters.lineId || 'all',
      filters.downtimeType || 'all',
      filters.fromDate || '',
      filters.toDate || '',
      filters.search || '',
    ],
    queryFn: () => fetchDowntimeIncidents(filters),
    staleTime: 60 * 1000,
  });

  const incidents = query.data || [];
  const dimension = filters.dimension || 'incident_category';

  const paretoData = calculatePareto(incidents, dimension);
  const aiInsights = generateIncidentAIInsights(
    paretoData.frequencyPareto,
    paretoData.durationPareto,
    paretoData.totalIncidents,
    paretoData.totalHours,
  );

  return {
    ...query,
    incidents,
    frequencyPareto: paretoData.frequencyPareto,
    durationPareto: paretoData.durationPareto,
    totalIncidents: paretoData.totalIncidents,
    totalHours: paretoData.totalHours,
    aiInsights,
  };
}
