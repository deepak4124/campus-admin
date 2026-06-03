import { AdminPlaceholderView } from "./components";

export default function AdminHomePage() {
  return <AdminPlaceholderView actionLabel="Fetch Classes (Auth Test)" description="Use the sidebar to open students, attendance, fee management, and reports." endpoint="/classes" title="Dashboard" />;
}
