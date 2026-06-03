import { AdminPlaceholderView } from "../components";

export default function FacultyAttendancePage() {
  return <AdminPlaceholderView actionLabel="Load Faculty" description="Faculty attendance uses the backend faculty directory and attendance routes." endpoint="/faculty?limit=5" title="Faculty Attendance" />;
}
