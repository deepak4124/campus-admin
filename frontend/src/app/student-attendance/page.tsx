import { AdminPlaceholderView } from "../components";

export default function StudentAttendancePage() {
  return <AdminPlaceholderView actionLabel="Load Classes" description="Student attendance submission is wired to the backend attendance route when records are selected." endpoint="/classes" title="Student Attendance" />;
}
