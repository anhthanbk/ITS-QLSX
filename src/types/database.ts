export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      bill_of_materials: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          material_id: string
          product_id: string
          quantity_required: number
          scrap_tolerance_pct: number
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          material_id: string
          product_id: string
          quantity_required: number
          scrap_tolerance_pct?: number
          updated_at?: string
          version?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          material_id?: string
          product_id?: string
          quantity_required?: number
          scrap_tolerance_pct?: number
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_of_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_of_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          code: string
          created_at: string
          credit_limit: number | null
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          credit_limit?: number | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          credit_limit?: number | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string
          created_at: string
          id: string
          manager_employee_id: string | null
          name: string
          parent_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          manager_employee_id?: string | null
          name: string
          parent_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          manager_employee_id?: string | null
          name?: string
          parent_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_departments_manager"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          department_id: string
          direct_manager_id: string | null
          email: string | null
          employee_code: string
          first_name: string
          hire_date: string
          id: string
          last_name: string
          phone: string | null
          position_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id: string
          direct_manager_id?: string | null
          email?: string | null
          employee_code: string
          first_name: string
          hire_date?: string
          id?: string
          last_name: string
          phone?: string | null
          position_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string
          direct_manager_id?: string | null
          email?: string | null
          employee_code?: string
          first_name?: string
          hire_date?: string
          id?: string
          last_name?: string
          phone?: string | null
          position_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_direct_manager_id_fkey"
            columns: ["direct_manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_production_costs: {
        Row: {
          calculated_at: string
          cost_per_unit: number
          direct_labor_cost: number
          energy_cost: number
          id: string
          machine_overhead_cost: number
          notes: string | null
          production_order_id: string
          raw_material_cost: number
          total_actual_cost: number
        }
        Insert: {
          calculated_at?: string
          cost_per_unit?: number
          direct_labor_cost?: number
          energy_cost?: number
          id?: string
          machine_overhead_cost?: number
          notes?: string | null
          production_order_id: string
          raw_material_cost?: number
          total_actual_cost?: number
        }
        Update: {
          calculated_at?: string
          cost_per_unit?: number
          direct_labor_cost?: number
          energy_cost?: number
          id?: string
          machine_overhead_cost?: number
          notes?: string | null
          production_order_id?: string
          raw_material_cost?: number
          total_actual_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_production_costs_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      hsse_incidents: {
        Row: {
          closed_at: string | null
          corrective_preventative_actions: string | null
          created_at: string
          days_lost: number
          department_id: string | null
          description: string
          id: string
          immediate_actions_taken: string | null
          incident_date: string
          incident_number: string
          incident_type: string
          involved_employee_id: string | null
          location: string
          reported_by_id: string | null
          root_cause_analysis: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          corrective_preventative_actions?: string | null
          created_at?: string
          days_lost?: number
          department_id?: string | null
          description: string
          id?: string
          immediate_actions_taken?: string | null
          incident_date: string
          incident_number: string
          incident_type: string
          involved_employee_id?: string | null
          location: string
          reported_by_id?: string | null
          root_cause_analysis?: string | null
          severity: string
          status?: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          corrective_preventative_actions?: string | null
          created_at?: string
          days_lost?: number
          department_id?: string | null
          description?: string
          id?: string
          immediate_actions_taken?: string | null
          incident_date?: string
          incident_number?: string
          incident_type?: string
          involved_employee_id?: string | null
          location?: string
          reported_by_id?: string | null
          root_cause_analysis?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hsse_incidents_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hsse_incidents_involved_employee_id_fkey"
            columns: ["involved_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hsse_incidents_reported_by_id_fkey"
            columns: ["reported_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_stock_balance: {
        Row: {
          current_quantity: number
          item_id: string
          item_type: string
          last_transaction_at: string
          reserved_quantity: number
          warehouse_id: string
        }
        Insert: {
          current_quantity?: number
          item_id: string
          item_type: string
          last_transaction_at?: string
          reserved_quantity?: number
          warehouse_id: string
        }
        Update: {
          current_quantity?: number
          item_id?: string
          item_type?: string
          last_transaction_at?: string
          reserved_quantity?: number
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_stock_balance_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          item_type: string
          notes: string | null
          quantity: number
          reference_doc_id: string | null
          reference_doc_type: string | null
          transaction_number: string
          transaction_type: string
          unit_cost: number
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          item_type: string
          notes?: string | null
          quantity: number
          reference_doc_id?: string | null
          reference_doc_type?: string | null
          transaction_number: string
          transaction_type: string
          unit_cost?: number
          warehouse_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          item_type?: string
          notes?: string | null
          quantity?: number
          reference_doc_id?: string | null
          reference_doc_type?: string | null
          transaction_number?: string
          transaction_type?: string
          unit_cost?: number
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          installation_date: string | null
          line_id: string | null
          line_location: string | null
          machine_code: string
          model: string | null
          name: string
          power_rating_kw: number | null
          rated_capacity_per_hour: number | null
          serial_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id?: string
          installation_date?: string | null
          line_id?: string | null
          line_location?: string | null
          machine_code: string
          model?: string | null
          name: string
          power_rating_kw?: number | null
          rated_capacity_per_hour?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          installation_date?: string | null
          line_id?: string | null
          line_location?: string | null
          machine_code?: string
          model?: string | null
          name?: string
          power_rating_kw?: number | null
          rated_capacity_per_hour?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "machines_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machines_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "production_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_plans: {
        Row: {
          created_at: string
          frequency_days: number
          id: string
          is_active: boolean
          last_performed_date: string | null
          machine_id: string
          next_due_date: string
          plan_code: string
          standard_duration_hours: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          frequency_days: number
          id?: string
          is_active?: boolean
          last_performed_date?: string | null
          machine_id: string
          next_due_date: string
          plan_code: string
          standard_duration_hours?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          frequency_days?: number
          id?: string
          is_active?: boolean
          last_performed_date?: string | null
          machine_id?: string
          next_due_date?: string
          plan_code?: string
          standard_duration_hours?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_plans_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_work_orders: {
        Row: {
          assigned_technician_id: string | null
          completed_at: string | null
          created_at: string
          downtime_minutes: number
          id: string
          labor_hours: number
          machine_id: string
          maintenance_plan_id: string | null
          priority: string
          reported_issue: string | null
          resolution_summary: string | null
          root_cause: string | null
          scheduled_date: string | null
          spare_parts_cost: number
          status: string
          type: string
          updated_at: string
          work_order_number: string
        }
        Insert: {
          assigned_technician_id?: string | null
          completed_at?: string | null
          created_at?: string
          downtime_minutes?: number
          id?: string
          labor_hours?: number
          machine_id: string
          maintenance_plan_id?: string | null
          priority?: string
          reported_issue?: string | null
          resolution_summary?: string | null
          root_cause?: string | null
          scheduled_date?: string | null
          spare_parts_cost?: number
          status?: string
          type: string
          updated_at?: string
          work_order_number: string
        }
        Update: {
          assigned_technician_id?: string | null
          completed_at?: string | null
          created_at?: string
          downtime_minutes?: number
          id?: string
          labor_hours?: number
          machine_id?: string
          maintenance_plan_id?: string | null
          priority?: string
          reported_issue?: string | null
          resolution_summary?: string | null
          root_cause?: string | null
          scheduled_date?: string | null
          spare_parts_cost?: number
          status?: string
          type?: string
          updated_at?: string
          work_order_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_work_orders_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_work_orders_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_work_orders_maintenance_plan_id_fkey"
            columns: ["maintenance_plan_id"]
            isOneToOne: false
            referencedRelation: "maintenance_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category: string
          code: string
          created_at: string
          id: string
          max_stock_level: number | null
          min_stock_level: number
          name: string
          preferred_supplier_id: string | null
          reorder_point: number
          standard_cost: number
          status: string
          unit_of_measure: string
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          id?: string
          max_stock_level?: number | null
          min_stock_level?: number
          name: string
          preferred_supplier_id?: string | null
          reorder_point?: number
          standard_cost?: number
          status?: string
          unit_of_measure: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          id?: string
          max_stock_level?: number | null
          min_stock_level?: number
          name?: string
          preferred_supplier_id?: string | null
          reorder_point?: number
          standard_cost?: number
          status?: string
          unit_of_measure?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_preferred_supplier_id_fkey"
            columns: ["preferred_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      mining_extraction_logs: {
        Row: {
          created_at: string
          created_by: string | null
          destination_warehouse_id: string | null
          equipment_id: string | null
          extraction_date: string
          haul_trucks_count: number | null
          id: string
          log_number: string
          mining_site_id: string
          notes: string | null
          operator_employee_id: string | null
          raw_volume_extracted_tons: number
          shift: string
          waste_volume_tons: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          destination_warehouse_id?: string | null
          equipment_id?: string | null
          extraction_date?: string
          haul_trucks_count?: number | null
          id?: string
          log_number: string
          mining_site_id: string
          notes?: string | null
          operator_employee_id?: string | null
          raw_volume_extracted_tons: number
          shift: string
          waste_volume_tons?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          destination_warehouse_id?: string | null
          equipment_id?: string | null
          extraction_date?: string
          haul_trucks_count?: number | null
          id?: string
          log_number?: string
          mining_site_id?: string
          notes?: string | null
          operator_employee_id?: string | null
          raw_volume_extracted_tons?: number
          shift?: string
          waste_volume_tons?: number
        }
        Relationships: [
          {
            foreignKeyName: "mining_extraction_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mining_extraction_logs_destination_warehouse_id_fkey"
            columns: ["destination_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mining_extraction_logs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mining_extraction_logs_mining_site_id_fkey"
            columns: ["mining_site_id"]
            isOneToOne: false
            referencedRelation: "mining_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mining_extraction_logs_operator_employee_id_fkey"
            columns: ["operator_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      mining_sites: {
        Row: {
          created_at: string
          estimated_reserves_tons: number | null
          id: string
          location_coordinates: string | null
          mineral_type: string
          name: string
          site_code: string
          status: string
          supervisor_employee_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_reserves_tons?: number | null
          id?: string
          location_coordinates?: string | null
          mineral_type: string
          name: string
          site_code: string
          status?: string
          supervisor_employee_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_reserves_tons?: number | null
          id?: string
          location_coordinates?: string | null
          mineral_type?: string
          name?: string
          site_code?: string
          status?: string
          supervisor_employee_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mining_sites_supervisor_employee_id_fkey"
            columns: ["supervisor_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          code: string
          created_at: string
          description: string | null
          id: string
          module: string
        }
        Insert: {
          action: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          module: string
        }
        Update: {
          action?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          module?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          code: string
          created_at: string
          department_id: string
          id: string
          level: number
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          department_id: string
          id?: string
          level?: number
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          department_id?: string
          id?: string
          level?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      production_batches: {
        Row: {
          actual_quantity: number
          batch_number: string
          created_at: string
          end_time: string | null
          id: string
          machine_id: string | null
          notes: string | null
          operator_employee_id: string | null
          planned_quantity: number
          production_order_id: string
          scrap_quantity: number
          shift: string | null
          start_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_quantity?: number
          batch_number: string
          created_at?: string
          end_time?: string | null
          id?: string
          machine_id?: string | null
          notes?: string | null
          operator_employee_id?: string | null
          planned_quantity: number
          production_order_id: string
          scrap_quantity?: number
          shift?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_quantity?: number
          batch_number?: string
          created_at?: string
          end_time?: string | null
          id?: string
          machine_id?: string | null
          notes?: string | null
          operator_employee_id?: string | null
          planned_quantity?: number
          production_order_id?: string
          scrap_quantity?: number
          shift?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_batches_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_batches_operator_employee_id_fkey"
            columns: ["operator_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_batches_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_lines: {
        Row: {
          code: string
          created_at: string
          department_id: string | null
          designed_capacity_tph: number
          id: string
          name: string
          shifts_per_day: number
          standard_shift_hours: number
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          department_id?: string | null
          designed_capacity_tph?: number
          id?: string
          name: string
          shifts_per_day?: number
          standard_shift_hours?: number
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          department_id?: string | null
          designed_capacity_tph?: number
          id?: string
          name?: string
          shifts_per_day?: number
          standard_shift_hours?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_lines_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      production_monthly_plans: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          id: string
          line_id: string
          month: number
          notes: string | null
          plan_code: string
          planned_breakdown_hours: number
          planned_byproduct_tons: number
          planned_capacity_tph: number
          planned_input_material_tons: number
          planned_maintenance_hours: number
          planned_operating_hours: number | null
          planned_output_product_tons: number
          planned_recovery_rate_pct: number
          planned_shutdown_hours: number
          status: string
          target_quality_rate_pct: number
          total_calendar_hours: number
          updated_at: string
          year: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          line_id: string
          month: number
          notes?: string | null
          plan_code: string
          planned_breakdown_hours?: number
          planned_byproduct_tons?: number
          planned_capacity_tph: number
          planned_input_material_tons?: number
          planned_maintenance_hours?: number
          planned_operating_hours?: number | null
          planned_output_product_tons?: number
          planned_recovery_rate_pct: number
          planned_shutdown_hours?: number
          status?: string
          target_quality_rate_pct?: number
          total_calendar_hours: number
          updated_at?: string
          year: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          line_id?: string
          month?: number
          notes?: string | null
          plan_code?: string
          planned_breakdown_hours?: number
          planned_byproduct_tons?: number
          planned_capacity_tph?: number
          planned_input_material_tons?: number
          planned_maintenance_hours?: number
          planned_operating_hours?: number | null
          planned_output_product_tons?: number
          planned_recovery_rate_pct?: number
          planned_shutdown_hours?: number
          status?: string
          target_quality_rate_pct?: number
          total_calendar_hours?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_monthly_plans_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_monthly_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_monthly_plans_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "production_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      production_orders: {
        Row: {
          actual_end_date: string | null
          actual_start_date: string | null
          bom_id: string | null
          completed_quantity: number
          created_at: string
          created_by: string | null
          id: string
          line_id: string | null
          order_number: string
          planned_end_date: string
          planned_start_date: string
          priority: string
          product_id: string
          production_plan_id: string | null
          scrap_quantity: number
          status: string
          target_quantity: number
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          bom_id?: string | null
          completed_quantity?: number
          created_at?: string
          created_by?: string | null
          id?: string
          line_id?: string | null
          order_number: string
          planned_end_date: string
          planned_start_date: string
          priority?: string
          product_id: string
          production_plan_id?: string | null
          scrap_quantity?: number
          status?: string
          target_quantity: number
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          bom_id?: string | null
          completed_quantity?: number
          created_at?: string
          created_by?: string | null
          id?: string
          line_id?: string | null
          order_number?: string
          planned_end_date?: string
          planned_start_date?: string
          priority?: string
          product_id?: string
          production_plan_id?: string | null
          scrap_quantity?: number
          status?: string
          target_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "bill_of_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "production_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_production_plan_id_fkey"
            columns: ["production_plan_id"]
            isOneToOne: false
            referencedRelation: "production_monthly_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_production_plan_id_fkey"
            columns: ["production_plan_id"]
            isOneToOne: false
            referencedRelation: "v_production_plan_vs_actual"
            referencedColumns: ["plan_id"]
          },
        ]
      }
      production_plan_byproducts: {
        Row: {
          byproduct_name: string
          destination_storage: string | null
          id: string
          notes: string | null
          plan_id: string
          planned_quantity_tons: number
          ratio_pct: number
        }
        Insert: {
          byproduct_name: string
          destination_storage?: string | null
          id?: string
          notes?: string | null
          plan_id: string
          planned_quantity_tons: number
          ratio_pct?: number
        }
        Update: {
          byproduct_name?: string
          destination_storage?: string | null
          id?: string
          notes?: string | null
          plan_id?: string
          planned_quantity_tons?: number
          ratio_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_plan_byproducts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "production_monthly_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_plan_byproducts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "v_production_plan_vs_actual"
            referencedColumns: ["plan_id"]
          },
        ]
      }
      production_plan_consumptions: {
        Row: {
          estimated_total_cost: number | null
          estimated_unit_price: number | null
          id: string
          norm_id: string | null
          norm_rate: number
          plan_id: string
          planned_total_consumption: number
          resource_name: string
          resource_type: string
          unit_of_measure: string
        }
        Insert: {
          estimated_total_cost?: number | null
          estimated_unit_price?: number | null
          id?: string
          norm_id?: string | null
          norm_rate: number
          plan_id: string
          planned_total_consumption: number
          resource_name: string
          resource_type: string
          unit_of_measure: string
        }
        Update: {
          estimated_total_cost?: number | null
          estimated_unit_price?: number | null
          id?: string
          norm_id?: string | null
          norm_rate?: number
          plan_id?: string
          planned_total_consumption?: number
          resource_name?: string
          resource_type?: string
          unit_of_measure?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_plan_consumptions_norm_id_fkey"
            columns: ["norm_id"]
            isOneToOne: false
            referencedRelation: "techno_economic_norms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_plan_consumptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "production_monthly_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_plan_consumptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "v_production_plan_vs_actual"
            referencedColumns: ["plan_id"]
          },
        ]
      }
      production_plan_products: {
        Row: {
          allocation_pct: number
          id: string
          notes: string | null
          plan_id: string
          planned_quantity_tons: number
          product_id: string
          target_quality_standard: string | null
        }
        Insert: {
          allocation_pct?: number
          id?: string
          notes?: string | null
          plan_id: string
          planned_quantity_tons: number
          product_id: string
          target_quality_standard?: string | null
        }
        Update: {
          allocation_pct?: number
          id?: string
          notes?: string | null
          plan_id?: string
          planned_quantity_tons?: number
          product_id?: string
          target_quality_standard?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_plan_products_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "production_monthly_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_plan_products_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "v_production_plan_vs_actual"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "production_plan_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_shift_downtime: {
        Row: {
          action_taken: string | null
          created_at: string
          downtime_category: string
          duration_minutes: number
          end_time: string
          id: string
          line_id: string
          machine_id: string | null
          reason: string
          reported_by_employee_id: string | null
          shift_id: string
          start_time: string
          status: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          downtime_category: string
          duration_minutes: number
          end_time: string
          id?: string
          line_id: string
          machine_id?: string | null
          reason: string
          reported_by_employee_id?: string | null
          shift_id: string
          start_time: string
          status?: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          downtime_category?: string
          duration_minutes?: number
          end_time?: string
          id?: string
          line_id?: string
          machine_id?: string | null
          reason?: string
          reported_by_employee_id?: string | null
          shift_id?: string
          start_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_shift_downtime_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "production_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_shift_downtime_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_shift_downtime_reported_by_employee_id_fkey"
            columns: ["reported_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_shift_downtime_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "production_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      production_shift_logs: {
        Row: {
          change_type: string
          changed_by_employee_id: string | null
          content: string
          created_at: string
          id: string
          log_time: string
          shift_id: string
        }
        Insert: {
          change_type: string
          changed_by_employee_id?: string | null
          content: string
          created_at?: string
          id?: string
          log_time?: string
          shift_id: string
        }
        Update: {
          change_type?: string
          changed_by_employee_id?: string | null
          content?: string
          created_at?: string
          id?: string
          log_time?: string
          shift_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_shift_logs_changed_by_employee_id_fkey"
            columns: ["changed_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_shift_logs_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "production_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      production_shift_meter_readings: {
        Row: {
          consumed_quantity: number
          end_reading: number
          id: string
          meter_code: string
          meter_name: string
          meter_type: string
          multiplier: number
          notes: string | null
          shift_id: string
          start_reading: number
          unit_of_measure: string
        }
        Insert: {
          consumed_quantity: number
          end_reading: number
          id?: string
          meter_code: string
          meter_name: string
          meter_type: string
          multiplier?: number
          notes?: string | null
          shift_id: string
          start_reading: number
          unit_of_measure: string
        }
        Update: {
          consumed_quantity?: number
          end_reading?: number
          id?: string
          meter_code?: string
          meter_name?: string
          meter_type?: string
          multiplier?: number
          notes?: string | null
          shift_id?: string
          start_reading?: number
          unit_of_measure?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_shift_meter_readings_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "production_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      production_shift_receipts: {
        Row: {
          batch_number: string | null
          byproduct_name: string | null
          id: string
          item_type: string
          notes: string | null
          product_id: string | null
          quality_status: string
          quantity_tons: number
          receipt_code: string
          receipt_time: string
          received_by_employee_id: string | null
          shift_id: string
          warehouse_id: string
        }
        Insert: {
          batch_number?: string | null
          byproduct_name?: string | null
          id?: string
          item_type: string
          notes?: string | null
          product_id?: string | null
          quality_status?: string
          quantity_tons: number
          receipt_code: string
          receipt_time?: string
          received_by_employee_id?: string | null
          shift_id: string
          warehouse_id: string
        }
        Update: {
          batch_number?: string | null
          byproduct_name?: string | null
          id?: string
          item_type?: string
          notes?: string | null
          product_id?: string | null
          quality_status?: string
          quantity_tons?: number
          receipt_code?: string
          receipt_time?: string
          received_by_employee_id?: string | null
          shift_id?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_shift_receipts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_shift_receipts_received_by_employee_id_fkey"
            columns: ["received_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_shift_receipts_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "production_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_shift_receipts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      production_shifts: {
        Row: {
          actual_capacity_tph: number | null
          actual_recovery_rate_pct: number | null
          byproduct_output_tons: number
          created_at: string
          id: string
          line_id: string
          notes: string | null
          operator_employee_id: string | null
          product_output_tons: number
          raw_material_input_tons: number
          running_hours: number | null
          shift_code: string
          shift_date: string
          shift_number: number
          standard_shift_hours: number
          status: string
          total_downtime_hours: number
          updated_at: string
          verified_by: string | null
        }
        Insert: {
          actual_capacity_tph?: number | null
          actual_recovery_rate_pct?: number | null
          byproduct_output_tons?: number
          created_at?: string
          id?: string
          line_id: string
          notes?: string | null
          operator_employee_id?: string | null
          product_output_tons?: number
          raw_material_input_tons?: number
          running_hours?: number | null
          shift_code: string
          shift_date: string
          shift_number: number
          standard_shift_hours?: number
          status?: string
          total_downtime_hours?: number
          updated_at?: string
          verified_by?: string | null
        }
        Update: {
          actual_capacity_tph?: number | null
          actual_recovery_rate_pct?: number | null
          byproduct_output_tons?: number
          created_at?: string
          id?: string
          line_id?: string
          notes?: string | null
          operator_employee_id?: string | null
          product_output_tons?: number
          raw_material_input_tons?: number
          running_hours?: number | null
          shift_code?: string
          shift_date?: string
          shift_number?: number
          standard_shift_hours?: number
          status?: string
          total_downtime_hours?: number
          updated_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_shifts_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "production_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_shifts_operator_employee_id_fkey"
            columns: ["operator_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_shifts_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_sales_price: number
          created_at: string
          id: string
          name: string
          product_type: string
          sku: string
          standard_cycle_time_mins: number | null
          standard_labor_cost: number | null
          status: string
          unit_of_measure: string
          updated_at: string
        }
        Insert: {
          base_sales_price?: number
          created_at?: string
          id?: string
          name: string
          product_type: string
          sku: string
          standard_cycle_time_mins?: number | null
          standard_labor_cost?: number | null
          status?: string
          unit_of_measure: string
          updated_at?: string
        }
        Update: {
          base_sales_price?: number
          created_at?: string
          id?: string
          name?: string
          product_type?: string
          sku?: string
          standard_cycle_time_mins?: number | null
          standard_labor_cost?: number | null
          status?: string
          unit_of_measure?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          employee_id: string | null
          full_name: string
          id: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          employee_id?: string | null
          full_name: string
          id: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          employee_id?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_inspections: {
        Row: {
          batch_id: string | null
          created_at: string
          defective_count: number
          evidence_file_urls: string[] | null
          id: string
          inspected_at: string
          inspection_number: string
          inspection_type: string
          inspector_id: string
          material_id: string | null
          measurements_data: Json | null
          remarks: string | null
          result: string
          sample_size: number
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          defective_count?: number
          evidence_file_urls?: string[] | null
          id?: string
          inspected_at?: string
          inspection_number: string
          inspection_type: string
          inspector_id: string
          material_id?: string | null
          measurements_data?: Json | null
          remarks?: string | null
          result: string
          sample_size: number
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          defective_count?: number
          evidence_file_urls?: string[] | null
          id?: string
          inspected_at?: string
          inspection_number?: string
          inspection_type?: string
          inspector_id?: string
          material_id?: string | null
          measurements_data?: Json | null
          remarks?: string | null
          result?: string
          sample_size?: number
        }
        Relationships: [
          {
            foreignKeyName: "quality_inspections_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "production_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_inspections_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_standards: {
        Row: {
          created_at: string
          id: string
          inspection_method: string | null
          is_active: boolean
          material_id: string | null
          max_acceptable_value: number | null
          min_acceptable_value: number | null
          parameter_name: string
          product_id: string | null
          standard_code: string
          target_value: number | null
          unit: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_method?: string | null
          is_active?: boolean
          material_id?: string | null
          max_acceptable_value?: number | null
          min_acceptable_value?: number | null
          parameter_name: string
          product_id?: string | null
          standard_code: string
          target_value?: number | null
          unit?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          inspection_method?: string | null
          is_active?: boolean
          material_id?: string | null
          max_acceptable_value?: number | null
          min_acceptable_value?: number | null
          parameter_name?: string
          product_id?: string | null
          standard_code?: string
          target_value?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_standards_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_standards_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_order_items: {
        Row: {
          created_at: string
          fulfilled_quantity: number
          id: string
          line_total: number
          product_id: string
          quantity: number
          sales_order_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          fulfilled_quantity?: number
          id?: string
          line_total: number
          product_id: string
          quantity: number
          sales_order_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          fulfilled_quantity?: number
          id?: string
          line_total?: number
          product_id?: string
          quantity?: number
          sales_order_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string
          id: string
          notes: string | null
          order_code: string
          order_date: string
          payment_terms: string | null
          promised_delivery_date: string | null
          status: string
          subtotal_amount: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id: string
          id?: string
          notes?: string | null
          order_code: string
          order_date?: string
          payment_terms?: string | null
          promised_delivery_date?: string | null
          status?: string
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string
          id?: string
          notes?: string | null
          order_code?: string
          order_date?: string
          payment_terms?: string | null
          promised_delivery_date?: string | null
          status?: string
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          code: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      techno_economic_norms: {
        Row: {
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean
          line_id: string | null
          norm_code: string
          norm_rate: number
          product_id: string | null
          resource_name: string
          resource_type: string
          unit_of_measure: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          line_id?: string | null
          norm_code: string
          norm_rate: number
          product_id?: string | null
          resource_name: string
          resource_type: string
          unit_of_measure: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          line_id?: string | null
          norm_code?: string
          norm_rate?: number
          product_id?: string | null
          resource_name?: string
          resource_type?: string
          unit_of_measure?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "techno_economic_norms_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "production_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "techno_economic_norms_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          role_id: string
          user_id: string
        }
        Insert: {
          role_id: string
          user_id: string
        }
        Update: {
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          code: string
          created_at: string
          id: string
          location: string | null
          manager_employee_id: string | null
          name: string
          status: string
          updated_at: string
          warehouse_type: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          location?: string | null
          manager_employee_id?: string | null
          name: string
          status?: string
          updated_at?: string
          warehouse_type: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          location?: string | null
          manager_employee_id?: string | null
          name?: string
          status?: string
          updated_at?: string
          warehouse_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_manager_employee_id_fkey"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_production_plan_vs_actual: {
        Row: {
          actual_avg_capacity_tph: number | null
          actual_breakdown_hours: number | null
          actual_byproduct_tons: number | null
          actual_maintenance_hours: number | null
          actual_product_tons: number | null
          actual_recovery_rate_pct: number | null
          actual_running_hours: number | null
          line_name: string | null
          month: number | null
          plan_code: string | null
          plan_id: string | null
          plan_status: string | null
          planned_breakdown_hours: number | null
          planned_byproduct_tons: number | null
          planned_capacity_tph: number | null
          planned_maintenance_hours: number | null
          planned_operating_hours: number | null
          planned_output_product_tons: number | null
          planned_recovery_rate_pct: number | null
          total_calendar_hours: number | null
          variance_operating_hours: number | null
          variance_product_tons: number | null
          variance_recovery_rate: number | null
          year: number | null
          yield_fulfillment_pct: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      authorize: { Args: { required_permission: string }; Returns: boolean }
      get_user_permissions: {
        Args: { p_user_id: string }
        Returns: {
          permission_code: string
          role_code: string
        }[]
      }
      has_permission: { Args: { p_permission: string }; Returns: boolean }
      has_role: { Args: { p_role: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
