import { AdminPlaceholderView } from "../components";

export default function StudentsPage() {
  return <AdminPlaceholderView actionLabel="Search Sample Students" description="Student directory tools will use the backend directory routes." endpoint="/students/search?q=a&limit=5" title="Students" />;
}
