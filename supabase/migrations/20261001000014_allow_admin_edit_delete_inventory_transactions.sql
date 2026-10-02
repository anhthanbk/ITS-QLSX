-- Migration: 20261001000014_allow_admin_edit_delete_inventory_transactions.sql
-- Description: Enable UPDATE and DELETE on inventory_transactions for Admin and Plant Manager with automatic stock balance synchronization

-- 1. Update trigger function to handle INSERT, UPDATE, and DELETE
CREATE OR REPLACE FUNCTION public.fn_sync_inventory_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.inventory_stock_balance (
      warehouse_id, item_type, item_id, current_quantity, last_transaction_at
    ) VALUES (
      NEW.warehouse_id, NEW.item_type, NEW.item_id, NEW.quantity, NEW.created_at
    )
    ON CONFLICT (warehouse_id, item_type, item_id) DO UPDATE
    SET
      current_quantity = public.inventory_stock_balance.current_quantity + NEW.quantity,
      last_transaction_at = NEW.created_at;
    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.inventory_stock_balance
    SET
      current_quantity = current_quantity - OLD.quantity,
      last_transaction_at = NOW()
    WHERE warehouse_id = OLD.warehouse_id
      AND item_type = OLD.item_type
      AND item_id = OLD.item_id;
    RETURN OLD;

  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.warehouse_id <> NEW.warehouse_id OR OLD.item_type <> NEW.item_type OR OLD.item_id <> NEW.item_id) THEN
      -- Revert old balance
      UPDATE public.inventory_stock_balance
      SET
        current_quantity = current_quantity - OLD.quantity,
        last_transaction_at = NOW()
      WHERE warehouse_id = OLD.warehouse_id
        AND item_type = OLD.item_type
        AND item_id = OLD.item_id;

      -- Apply new balance
      INSERT INTO public.inventory_stock_balance (
        warehouse_id, item_type, item_id, current_quantity, last_transaction_at
      ) VALUES (
        NEW.warehouse_id, NEW.item_type, NEW.item_id, NEW.quantity, NOW()
      )
      ON CONFLICT (warehouse_id, item_type, item_id) DO UPDATE
      SET
        current_quantity = public.inventory_stock_balance.current_quantity + NEW.quantity,
        last_transaction_at = NOW();
    ELSE
      -- Same item & warehouse, adjust difference
      UPDATE public.inventory_stock_balance
      SET
        current_quantity = current_quantity + (NEW.quantity - OLD.quantity),
        last_transaction_at = NOW()
      WHERE warehouse_id = NEW.warehouse_id
        AND item_type = NEW.item_type
        AND item_id = NEW.item_id;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$function$;

-- 2. Ensure trigger fires AFTER INSERT OR UPDATE OR DELETE
DROP TRIGGER IF EXISTS trg_sync_inventory_balance ON public.inventory_transactions;
CREATE TRIGGER trg_sync_inventory_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_inventory_balance();

-- 3. RLS policies for UPDATE and DELETE
DROP POLICY IF EXISTS "auth_admin_update_inventory_tx" ON public.inventory_transactions;
CREATE POLICY "auth_admin_update_inventory_tx" ON public.inventory_transactions
  FOR UPDATE TO authenticated
  USING (has_role('admin') OR has_role('plant_manager') OR has_permission('master_data.manage'))
  WITH CHECK (has_role('admin') OR has_role('plant_manager') OR has_permission('master_data.manage'));

DROP POLICY IF EXISTS "auth_admin_delete_inventory_tx" ON public.inventory_transactions;
CREATE POLICY "auth_admin_delete_inventory_tx" ON public.inventory_transactions
  FOR DELETE TO authenticated
  USING (has_role('admin') OR has_role('plant_manager') OR has_permission('master_data.manage'));
