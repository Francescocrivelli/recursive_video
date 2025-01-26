import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { ArrowLeft, Home } from 'lucide-react';

interface NavigationProps {
  showBack?: boolean;
  showHome?: boolean;
  onBack?: () => void;
}

export function Navigation({ showBack = true, showHome = true, onBack }: NavigationProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleHome = () => {
    router.push('/select-therapy');
  };

  return (
    <div className="flex justify-between items-center w-full mb-6">
      <div className="space-x-2">
        {showBack && (
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>
      <div>
        {showHome && (
          <Button variant="ghost" size="sm" onClick={handleHome}>
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        )}
      </div>
    </div>
  );
}