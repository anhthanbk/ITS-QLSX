-- Migration: Add specifications column to products table
-- Description: Adds a specifications column for technical parameters of products and semi-finished products.

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS specifications text;

COMMENT ON COLUMN public.products.specifications IS 'Thông số kỹ thuật / Tiêu chuẩn chất lượng của sản phẩm / thành phẩm';

-- Cập nhật dữ liệu thông số kỹ thuật tiêu chuẩn cho các sản phẩm hiện hữu của nhà máy cát Cam Ranh
UPDATE public.products 
SET specifications = 'Hàm lượng Fe2O3 ≤ 80ppm; SiO2 ≥ 99.5%; Độ ẩm ≤ 0.5%; Cỡ hạt: 0.1 - 0.4mm' 
WHERE sku = 'S80';

UPDATE public.products 
SET specifications = 'Hàm lượng Fe2O3 ≤ 60ppm; SiO2 ≥ 99.6%; Độ ẩm ≤ 0.5%; Cỡ hạt: 0.1 - 0.35mm' 
WHERE sku = 'S60';

UPDATE public.products 
SET specifications = 'Hàm lượng Fe2O3 ≤ 100ppm; SiO2 ≥ 99.3%; Độ ẩm ≤ 0.5%; Cỡ hạt: 0.1 - 0.5mm' 
WHERE sku = 'S100';

UPDATE public.products 
SET specifications = 'Hàm lượng Fe2O3 ≤ 80ppm; Đóng bao 50kg/Jumbo chống ẩm; Độ ẩm ≤ 0.5%' 
WHERE sku = 'S80-DB';

UPDATE public.products 
SET specifications = 'Cát trắng phụ phẩm hạt mịn qua tuyển từ MM' 
WHERE sku = 'MAGMIN';

UPDATE public.products 
SET specifications = 'Cát trắng phụ phẩm tuyển nổi hạt rất mịn VFS' 
WHERE sku = 'VFS';

UPDATE public.products 
SET specifications = 'Cát siêu mịn sau nghiền phân ly FSAP' 
WHERE sku = 'FSAP';

UPDATE public.products 
SET specifications = 'Cát nguyên khai sau tuyển ướt BTP (hạt 0.1 - 0.8mm)' 
WHERE sku = 'CNS-BTP';
