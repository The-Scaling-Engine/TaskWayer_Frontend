import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-2xl border border-border shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Log In</h1>
          <p className="text-muted-foreground mt-2">Welcome back to MicroDo</p>
        </div>
        <p className="text-center text-muted-foreground text-sm">
          (Login page will be fully built in Phase 2)
        </p>
        <div className="text-center">
          <Button asChild variant="link">
            <Link to="/">← Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
