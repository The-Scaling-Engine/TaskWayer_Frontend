import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-primary">
          MicroDo
        </h1>
        <p className="text-xl text-muted-foreground max-w-md">
          Smart, simple, and efficient task management.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link to="/login">Log In</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/register">Sign Up</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
