import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  QrCode,
  Scan,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import type { PatrolArea } from '../types';

interface ProductionQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: PatrolArea[];
  onAreaDetected: (area: PatrolArea) => void;
}

export const ProductionQrScannerModal: React.FC<ProductionQrScannerModalProps> = ({
  isOpen,
  onClose,
  areas,
  onAreaDetected,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize camera when opened
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isOpen) {
      setErrorMsg(null);
      // Attempt to access user media
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: 'environment' } })
          .then((s) => {
            stream = s;
            if (videoRef.current) {
              videoRef.current.srcObject = s;
              videoRef.current.play().catch(() => {});
              setCameraActive(true);
            }
          })
          .catch((err) => {
            console.log('Camera access notice (fallback mode active):', err);
            setCameraActive(false);
          });
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectArea = (area: PatrolArea) => {
    onAreaDetected(area);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const code = manualCode.trim().toUpperCase();
    if (!code) {
      setErrorMsg('Vui lòng nhập mã QR hoặc mã khu vực.');
      return;
    }

    const matched = areas.find(
      (a) =>
        a.qr_code.toUpperCase() === code ||
        a.area_code.toUpperCase() === code ||
        a.name.toUpperCase().includes(code),
    );

    if (matched) {
      handleSelectArea(matched);
    } else {
      setErrorMsg(`Không tìm thấy khu vực tuần kiểm tương ứng với mã "${code}".`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Scan className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Quét mã QR Khu vực tuần kiểm
              </h2>
              <p className="text-xs text-muted-foreground">
                Quét mã tại trạm/cột mốc để xác nhận đã đến hiện trường
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Scanner Viewfinder Box */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-dashed border-primary/50 bg-black/90 flex flex-col items-center justify-center text-center p-4">
            {cameraActive ? (
              <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}

            {/* Scanning Overlay Visual */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="relative h-32 w-32 rounded-lg border-2 border-emerald-400 bg-emerald-400/10 flex items-center justify-center">
                <QrCode className="h-16 w-16 text-emerald-400/60" />
                {/* Laser animation */}
                <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-bounce" />
              </div>

              <p className="mt-2 text-xs font-medium text-white/90">
                {cameraActive
                  ? 'Hướng camera vào mã QR dán tại khu vực'
                  : 'Sẵn sàng nhận diện mã QR khu vực'}
              </p>
            </div>
          </div>

          {/* Quick Area Picker (Zero friction fallback for factory environments) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground">
              Hoặc chọn trực tiếp Khu vực hiện diện:
            </label>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {areas.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => handleSelectArea(area)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-2.5 text-left transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {area.area_code}
                        </span>
                        <span className="text-xs text-foreground font-medium">
                          {area.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {area.machines?.length || 0} thiết bị phụ trách
                      </span>
                    </div>
                  </div>
                  <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                    {area.qr_code}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual input */}
          <form onSubmit={handleManualSubmit} className="pt-2 border-t border-border">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Nhập thủ công mã QR (nếu camera bị mờ/bụi bẩn):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="VD: ITS-AREA-KV01 hoặc KV-01-CAPLIEU..."
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none uppercase font-mono"
              />
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Xác nhận
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
