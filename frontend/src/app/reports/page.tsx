import { AdminPlaceholderView } from "../components";

export default function ReportsPage() {
  return <AdminPlaceholderView actionLabel="Check Database" description="Reports will read from attendance, receipt, student, and class data." endpoint="/health/db" title="Reports" />;
}
