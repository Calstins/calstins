import Link from "next/link";
import ProblemPanel from "@/components/admin/ProblemPanel";

export default function AdminNotFound() {
  return (
    <ProblemPanel title="That admin page does not exist" actions={<Link href="/admin" className="btn-primary text-sm py-2">Back to dashboard</Link>}>
      <p>The link may be old, or the page was renamed. Use the menu on the left to find what you need.</p>
    </ProblemPanel>
  );
}
