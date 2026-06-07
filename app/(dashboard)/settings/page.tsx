import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import SettingsPageContent from "./SettingsPageContent";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg text-fg">
        <Loader2 className="h-5 w-5 animate-spin text-fg-subtle" />
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  );
}
