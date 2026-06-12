import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import VerifyEmailContent from './VerifyEmailContent';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';


export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg text-fg">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
