-- Migration: 20261017000026_add_logistics_and_dispatch_to_sales_orders.sql
-- Description: Add logistics & transport carrier columns to sales_orders table

ALTER TABLE public.sales_orders
ADD COLUMN IF NOT EXISTS carrier_name text,
ADD COLUMN IF NOT EXISTS vehicle_plate text,
ADD COLUMN IF NOT EXISTS driver_info text,
ADD COLUMN IF NOT EXISTS delivery_location text;

COMMENT ON COLUMN public.sales_orders.carrier_name IS 'Tên đơn vị vận tải / Nhà xe / Đơn vị logistics';
COMMENT ON COLUMN public.sales_orders.vehicle_plate IS 'Biển kiểm soát xe ô tô bốc hàng hoặc phương tiện vận tải';
COMMENT ON COLUMN public.sales_orders.driver_info IS 'Thông tin tài xế & số điện thoại liên hệ';
COMMENT ON COLUMN public.sales_orders.delivery_location IS 'Địa điểm giao hàng hoặc cảng xuất hàng';

-- Update existing sample sales orders with realistic logistics info
UPDATE public.sales_orders
SET 
  carrier_name = 'Công ty TNHH Vận tải Hải Vân Cam Ranh',
  vehicle_plate = '79C-152.88',
  driver_info = 'Bác tài Nguyễn Văn Hùng - 0914.888.999',
  delivery_location = 'Cảng Quốc tế Cam Ranh, Khánh Hòa'
WHERE carrier_name IS NULL;
