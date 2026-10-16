import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  fetchSalesOrders,
  fetchSalesOrderDetail,
  createSalesOrder,
  updateSalesOrder,
  updateSalesOrderStatus,
  deleteSalesOrder,
  fetchPurchaseOrders,
  fetchPurchaseOrderDetail,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
  receivePurchaseOrder,
  type ReceivePurchaseOrderParams,
  fetchSalesMetrics,
  fetchProductOptions,
  fetchMaterialOptions,
} from '../api/sales-api';
import type {
  CustomerFilterParams,
  SupplierFilterParams,
  SalesOrderFilterParams,
  PurchaseOrderFilterParams,
  SalesOrderStatus,
  PurchaseOrderStatus,
} from '../types';
import type {
  CustomerFormValues,
  SupplierFormValues,
  SalesOrderFormValues,
  PurchaseOrderFormValues,
} from '../validation/sales-schemas';
import { useAuth } from '@/features/auth/hooks/use-auth';

export const salesKeys = {
  all: ['sales'] as const,
  customers: (params: CustomerFilterParams) => ['sales', 'customers', params] as const,
  suppliers: (params: SupplierFilterParams) => ['sales', 'suppliers', params] as const,
  orders: (params: SalesOrderFilterParams) => ['sales', 'orders', params] as const,
  orderDetail: (id: string) => ['sales', 'orders', 'detail', id] as const,
  purchaseOrders: (params: PurchaseOrderFilterParams) => ['sales', 'purchase-orders', params] as const,
  purchaseOrderDetail: (id: string) => ['sales', 'purchase-orders', 'detail', id] as const,
  metrics: () => ['sales', 'metrics'] as const,
  productOptions: () => ['sales', 'options', 'products'] as const,
  materialOptions: () => ['sales', 'options', 'materials'] as const,
};

// ==========================================
// CUSTOMERS HOOKS
// ==========================================

export function useCustomers(params: CustomerFilterParams) {
  return useQuery({
    queryKey: salesKeys.customers(params),
    queryFn: () => fetchCustomers(params),
    staleTime: 30000,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CustomerFormValues) => createCustomer(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'customers'] });
      queryClient.invalidateQueries({ queryKey: salesKeys.metrics() });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CustomerFormValues }) =>
      updateCustomer(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'customers'] });
      queryClient.invalidateQueries({ queryKey: ['sales', 'orders'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'customers'] });
      queryClient.invalidateQueries({ queryKey: salesKeys.metrics() });
    },
  });
}

// ==========================================
// SUPPLIERS HOOKS
// ==========================================

export function useSuppliers(params: SupplierFilterParams) {
  return useQuery({
    queryKey: salesKeys.suppliers(params),
    queryFn: () => fetchSuppliers(params),
    staleTime: 30000,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: SupplierFormValues) => createSupplier(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'suppliers'] });
      queryClient.invalidateQueries({ queryKey: salesKeys.metrics() });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SupplierFormValues }) =>
      updateSupplier(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['sales', 'purchase-orders'] });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'suppliers'] });
      queryClient.invalidateQueries({ queryKey: salesKeys.metrics() });
    },
  });
}

// ==========================================
// SALES ORDERS HOOKS
// ==========================================

export function useSalesOrders(params: SalesOrderFilterParams) {
  return useQuery({
    queryKey: salesKeys.orders(params),
    queryFn: () => fetchSalesOrders(params),
    staleTime: 30000,
  });
}

export function useSalesOrderDetail(id: string | null) {
  return useQuery({
    queryKey: salesKeys.orderDetail(id || ''),
    queryFn: () => (id ? fetchSalesOrderDetail(id) : null),
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (values: SalesOrderFormValues) => createSalesOrder(values, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'orders'] });
      queryClient.invalidateQueries({ queryKey: salesKeys.metrics() });
    },
  });
}

export function useUpdateSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SalesOrderFormValues }) =>
      updateSalesOrder(id, values),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'orders'] });
      queryClient.invalidateQueries({ queryKey: salesKeys.orderDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: salesKeys.metrics() });
    },
  });
}

export function useUpdateSalesOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SalesOrderStatus }) =>
      updateSalesOrderStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'orders'] });
      queryClient.invalidateQueries({ queryKey: salesKeys.orderDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: salesKeys.metrics() });
    },
  });
}

export function useDeleteSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSalesOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'orders'] });
      queryClient.invalidateQueries({ queryKey: salesKeys.metrics() });
    },
  });
}

// ==========================================
// PURCHASE ORDERS HOOKS
// ==========================================

export function usePurchaseOrders(params: PurchaseOrderFilterParams) {
  return useQuery({
    queryKey: salesKeys.purchaseOrders(params),
    queryFn: () => fetchPurchaseOrders(params),
    staleTime: 30000,
  });
}

export function usePurchaseOrderDetail(id: string | null) {
  return useQuery({
    queryKey: salesKeys.purchaseOrderDetail(id || ''),
    queryFn: () => (id ? fetchPurchaseOrderDetail(id) : null),
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (values: PurchaseOrderFormValues) => createPurchaseOrder(values, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: salesKeys.metrics() });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: PurchaseOrderFormValues }) =>
      updatePurchaseOrder(id, values),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: salesKeys.purchaseOrderDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: salesKeys.metrics() });
    },
  });
}

export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PurchaseOrderStatus }) =>
      updatePurchaseOrderStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: salesKeys.purchaseOrderDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: salesKeys.metrics() });
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: salesKeys.metrics() });
    },
  });
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (params: ReceivePurchaseOrderParams) => receivePurchaseOrder(params, user?.id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'purchase-orders'] });
      queryClient.invalidateQueries({
        queryKey: salesKeys.purchaseOrderDetail(variables.purchase_order_id),
      });
      queryClient.invalidateQueries({ queryKey: salesKeys.metrics() });
      queryClient.invalidateQueries({ queryKey: ['inventory_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_stock_balance'] });
      queryClient.invalidateQueries({ queryKey: ['stock_balance'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse_metrics'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
}

// ==========================================
// METRICS & OPTIONS HOOKS
// ==========================================

export function useSalesMetrics() {
  return useQuery({
    queryKey: salesKeys.metrics(),
    queryFn: fetchSalesMetrics,
    staleTime: 60000,
  });
}

export function useProductOptions() {
  return useQuery({
    queryKey: salesKeys.productOptions(),
    queryFn: fetchProductOptions,
    staleTime: 300000,
  });
}

export function useMaterialOptions() {
  return useQuery({
    queryKey: salesKeys.materialOptions(),
    queryFn: fetchMaterialOptions,
    staleTime: 300000,
  });
}
