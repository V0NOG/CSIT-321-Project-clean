// frontend/src/pages/Analytics.tsx
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

import AnalyticsMetrics from "../components/analytics/AnalyticsMetrics";      // real data
import AnalyticsBarChart from "../components/analytics/AnalyticsBarChart";    // real data (uploads 30d)
import SessionChart from "../components/analytics/SessionChart";              // real data (storage by type)
import TopChannel from "../components/analytics/TopChannel";                  // real data (top actions)

export default function Analytics() {
  return (
    <>
      <PageMeta
        title="Analytics | CSIT321 Vault"
        description="Usage analytics for your encrypted file vault."
      />
      <PageBreadcrumb pageTitle="Analytics" />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* KPI tiles */}
        <div className="col-span-12">
          <AnalyticsMetrics />
        </div>

        {/* Uploads trend (30d) */}
        <div className="col-span-12">
          <AnalyticsBarChart />
        </div>

        {/* Top actions (30d) + Storage by category */}
        <div className="col-span-12 xl:col-span-7">
          <TopChannel />
        </div>
        <div className="col-span-12 xl:col-span-5">
          <SessionChart />
        </div>
      </div>
    </>
  );
}