import React from 'react';
import { CompanyKpiBar } from '../components/company-kpi-bar';

export const AppsheetPortalPage: React.FC = () => {
  return (
    <div className="w-full px-4 py-5 sm:px-6 space-y-6 animate-in fade-in duration-150">
      {/* CÁC THẺ CARD CHỈ SỐ KPI CÔNG TY: SẢN LƯỢNG, OEE, TIÊU HAO VẬT TƯ */}
      <section aria-label="Bảng chỉ số KPI công ty">
        <CompanyKpiBar />
      </section>
    </div>
  );
};
