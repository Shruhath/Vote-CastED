import { logOut } from '../lib/firebase';
import { toast } from 'sonner';

export function FirebaseSignOut() {
  const handleSignOut = async () => {
    try {
      await logOut();
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
    >
      Sign Out
    </button>
  );
}
