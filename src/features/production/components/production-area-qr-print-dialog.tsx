import React from 'react';
import { X, Printer, QrCode, Factory, CheckCircle2, Edit } from 'lucide-react';
import { ProductionQRCodeSvg } from './production-qr-code-svg';
import type { PatrolArea } from '../types';

interface ProductionAreaQrPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  areas: PatrolArea[];
  onEditArea?: (area: PatrolArea) => void;
}

export const ProductionAreaQrPrintDialog: React.FC<ProductionAreaQrPrintDialogProps> = ({
  isOpen,
  onClose,
  areas,
  onEditArea,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:p-0 print:bg-white">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-border bg-card shadow-2xl print:max-h-none print:w-full print:border-none print:shadow-none">
        {/* Header - Hidden during print */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 print:hidden">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                In mã QR Khu vực tuần kiểm sản xuất
              </h2>
              <p className="text-xs text-muted-foreground">
                Mã QR dán tại cột mốc từng khu vực để công nhân quét xác nhận tuần kiểm thiết bị
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Printer className="h-4 w-4" />
              <span>In Decal / Khổ A4</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Area Cards Grid */}
        <div className="overflow-y-auto p-6 print:p-0">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 print:grid-cols-2 print:gap-4">
            {areas.map((area) => (
              <div
                key={area.id}
                className="flex flex-col justify-between rounded-xl border-2 border-dashed border-primary/40 bg-card p-5 text-card-foreground shadow-sm break-inside-avoid print:border-solid print:border-black print:p-4"
              >
                {/* Header of Badge */}
                <div className="flex items-center justify-between border-b border-border/80 pb-3 print:border-black">
                  <div className="flex items-center gap-1.5">
                    <Factory className="h-4 w-4 text-primary print:text-black" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary print:text-black">
                      ITS QLSX • NHÀ MÁY CHẾ BIẾN CÁT
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-bold text-primary print:border print:border-black print:bg-white print:text-black">
                      {area.area_code}
                    </span>
                    {onEditArea && (
                      <button
                        type="button"
                        onClick={() => onEditArea(area)}
                        title="Chỉnh sửa khu vực & máy móc"
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground print:hidden"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Main QR + Info */}
                <div className="my-4 flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-white p-2.5 shadow-sm print:border-black">
                    <ProductionQRCodeSvg
                      value={area.qr_code}
                      size={120}
                      fgColor="#000000"
                    />
                    <span className="mt-1 font-mono text-[10px] font-bold text-black">
                      {area.qr_code}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="text-sm font-bold leading-snug text-foreground print:text-black">
                        {area.name}
                      </h3>
                      {area.line_name && (
                        <p className="text-xs font-medium text-muted-foreground print:text-gray-700">
                          Dây chuyền: {area.line_name}
                        </p>
                      )}
                    </div>

                    {area.description && (
                      <p className="line-clamp-2 text-[11px] text-muted-foreground print:text-gray-600">
                        {area.description}
                      </p>
                    )}

                    {/* Machine List */}
                    <div className="rounded-lg bg-muted/50 p-2 text-[11px] print:bg-gray-50 print:border print:border-gray-300">
                      <span className="font-semibold text-foreground print:text-black">
                        Thiết bị cần kiểm tra ({area.machines?.length || 0}):
                      </span>
                      <ul className="mt-1 space-y-0.5">
                        {(area.machines || []).map((m) => (
                          <li key={m.machine_id} className="flex items-center gap-1 text-muted-foreground print:text-gray-800">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                            <span className="font-mono font-medium">{m.machine_code}:</span>
                            <span className="truncate">{m.machine_name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Footer instructions */}
                <div className="flex items-center justify-between rounded bg-muted/30 px-3 py-1.5 text-[10px] text-muted-foreground print:border-t print:border-black print:bg-white print:text-gray-600">
                  <span>📱 Quét mã QR bằng App ITS QLSX để xác nhận tuần kiểm</span>
                  <span>Vị trí dán: Cột mốc đầu cụm máy</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions - Hidden during print */}
        <div className="flex items-center justify-end border-t border-border px-6 py-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
