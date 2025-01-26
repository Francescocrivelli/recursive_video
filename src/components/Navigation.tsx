import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { ArrowLeft, Home, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';

interface NavigationProps {
  showBack?: boolean;
  showHome?: boolean;
  onBack?: () => void;
}

export function Navigation({ showBack = true, showHome = true, onBack }: NavigationProps) {
  const router = useRouter();
  const { user } = useAuth();

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

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // Clear any session cookies
      document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
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
      <div className="space-x-2">
        {showHome && (
          <Button variant="ghost" size="sm" onClick={handleHome}>
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        )}
        {user && (
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        )}
      </div>
    </div>
  );
}