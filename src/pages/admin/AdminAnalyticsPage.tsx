import { SeoHead } from "@/components/SeoHead";
import { ProductAnalyticsDashboard } from "@/components/analytics/ProductAnalyticsDashboard";

export default function AdminAnalyticsPage() {
  return (
    <>
      <SeoHead title="Product Analytics — Admin" description="View product views, clicks, and review trends." />
      <ProductAnalyticsDashboard title="Product Analytics" />
    </>
  );
}
