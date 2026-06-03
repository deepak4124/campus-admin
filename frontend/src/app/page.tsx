import { AdminPlaceholderView } from "./components";

export default function AdminHomePage() {
  return <AdminPlaceholderView actionLabel="Check API Health" description="Use the sidebar to open students, attendance, fee management, and reports." endpoint="/health" title="Dashboard" />;
}
