import React, { useState } from 'react';
import { Users, UserCheck, Clock, Building2 } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { EmployeeFilterBar } from '../components/employee-filter-bar';
import { EmployeeTable } from '../components/employee-table';
import { EmployeeFormDialog } from '../components/employee-form-dialog';
import { EmployeeDetailModal } from '../components/employee-detail-modal';
import { EmployeeAccountModal } from '../components/employee-account-modal';
import { DepartmentTab } from '../components/department-tab';
import { PositionTab } from '../components/position-tab';
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from '../hooks/use-employees';
import { useDepartments } from '../hooks/use-departments';
import type { Employee, EmployeeStatus, EmployeeFilterParams } from '../types';
import type { EmployeeFormValues } from '../validation/hr-schemas';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const HRPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'employees' | 'departments' | 'positions'>('employees');

  // Filter and pagination state
  const [filters, setFilters] = useState<EmployeeFilterParams>({
    search: '',
    departmentId: 'all',
    positionId: 'all',
    status: 'all',
    page: 1,
    pageSize: 10,
  });

  // Queries
  const { data: employeeData, isLoading, isError, refetch } = useEmployees(filters);
  const { data: departments } = useDepartments();

  // Mutations
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [accountModalEmployee, setAccountModalEmployee] = useState<Employee | null>(null);

  // Handlers
  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  const handleDepartmentChange = (departmentId: string) => {
    setFilters((prev) => ({ ...prev, departmentId, page: 1 }));
  };

  const handleStatusChange = (status: EmployeeStatus | 'all') => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      departmentId: 'all',
      positionId: 'all',
      status: 'all',
      page: 1,
      pageSize: 10,
    });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleFormSubmit = async (values: EmployeeFormValues) => {
    if (editingEmployee) {
      await updateMutation.mutateAsync({ id: editingEmployee.id, values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  const handleDeleteConfirm = async () => {
    if (deletingEmployee) {
      await deleteMutation.mutateAsync(deletingEmployee.id);
      setDeletingEmployee(null);
    }
  };

  // Metrics summary
  const totalEmployees = employeeData?.totalCount ?? 0;
  const activeCount = employeeData?.data?.filter((e) => e.status === 'active').length ?? 0;
  const onLeaveCount = employeeData?.data?.filter((e) => e.status === 'on_leave').length ?? 0;
  const deptCount = departments?.length ?? 0;

  return (
    <PageContainer
      title="Quản Lý Nhân Sự & Tổ Chức"
      description="Hồ sơ nhân viên, phân bổ phòng ban và bảng phân cấp chức danh nhà máy"
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Tổng nhân sự</p>
                <h4 className="text-xl font-bold text-foreground">{totalEmployees}</h4>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Đang làm việc</p>
                <h4 className="text-xl font-bold text-foreground">{activeCount}</h4>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Nghỉ phép</p>
                <h4 className="text-xl font-bold text-foreground">{onLeaveCount}</h4>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Phòng ban</p>
                <h4 className="text-xl font-bold text-foreground">{deptCount}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border">
          <button
            type="button"
            id="tab-employees"
            onClick={() => setActiveTab('employees')}
            className={cn(
              'px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px',
              activeTab === 'employees'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            Nhân Sự & Nhân Viên
          </button>
          <button
            type="button"
            id="tab-departments"
            onClick={() => setActiveTab('departments')}
            className={cn(
              'px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px',
              activeTab === 'departments'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            Cơ Cấu Phòng Ban
          </button>
          <button
            type="button"
            id="tab-positions"
            onClick={() => setActiveTab('positions')}
            className={cn(
              'px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px',
              activeTab === 'positions'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            Chức Danh & Vị Trí
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'employees' && (
          <div className="space-y-4">
            <EmployeeFilterBar
              search={filters.search || ''}
              onSearchChange={handleSearchChange}
              departmentId={filters.departmentId || 'all'}
              onDepartmentChange={handleDepartmentChange}
              status={filters.status || 'all'}
              onStatusChange={handleStatusChange}
              onReset={handleResetFilters}
              onAddNew={() => {
                setEditingEmployee(null);
                setIsFormOpen(true);
              }}
            />

            <EmployeeTable
              data={employeeData}
              isLoading={isLoading}
              isError={isError}
              onRetry={() => refetch()}
              onPageChange={handlePageChange}
              onViewDetail={(emp) => setViewingEmployee(emp)}
              onEdit={(emp) => {
                setEditingEmployee(emp);
                setIsFormOpen(true);
              }}
              onDelete={(emp) => setDeletingEmployee(emp)}
              onManageAccount={(emp) => setAccountModalEmployee(emp)}
            />
          </div>
        )}

        {activeTab === 'departments' && <DepartmentTab />}

        {activeTab === 'positions' && <PositionTab />}

        {/* Employee Create/Edit Modal */}
        <EmployeeFormDialog
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingEmployee(null);
          }}
          employeeToEdit={editingEmployee}
          onSubmit={handleFormSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />

        {/* Employee Detail Modal */}
        <EmployeeDetailModal
          isOpen={!!viewingEmployee}
          employee={viewingEmployee}
          onClose={() => setViewingEmployee(null)}
          onEdit={(emp) => {
            setViewingEmployee(null);
            setEditingEmployee(emp);
            setIsFormOpen(true);
          }}
          onManageAccount={(emp) => setAccountModalEmployee(emp)}
        />

        {/* Employee Account Management Modal */}
        <EmployeeAccountModal
          isOpen={!!accountModalEmployee}
          employee={accountModalEmployee}
          onClose={() => setAccountModalEmployee(null)}
        />

        {/* Delete Confirmation Dialog */}
        {deletingEmployee && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeletingEmployee(null)}
            />
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
              <h3 className="text-sm font-bold text-foreground">Xác nhận xóa nhân viên</h3>
              <p className="mt-2 text-xs text-muted-foreground">
                Bạn có chắc chắn muốn xóa nhân viên{' '}
                <span className="font-semibold text-foreground">
                  {deletingEmployee.last_name} {deletingEmployee.first_name} (
                  {deletingEmployee.employee_code})
                </span>
                ? Hành động này không thể hoàn tác nếu nhân viên chưa có dữ liệu giao dịch liên kết.
              </p>

              <div className="mt-5 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingEmployee(null)}
                  disabled={deleteMutation.isPending}
                >
                  Hủy
                </Button>
                <Button
                  id="confirm-delete-employee-btn"
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteConfirm}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
