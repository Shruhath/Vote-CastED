import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithMicrosoft } from '../lib/firebase';
import { toast } from 'sonner';

interface StudentEmailAuthProps {
  electionId: string;
  onLogin: (email: string) => void;
  electionName?: string;
  className?: string;
}

export function StudentEmailAuth({ electionId, onLogin, electionName, className }: StudentEmailAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Firebase auth state changed:', user);
      
      if (user && user.email) {
        console.log('User already authenticated with email:', user.email);
        onLogin(user.email);
      }
      
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [onLogin]);

  const handleMicrosoftSignIn = async () => {
    setIsLoading(true);
    
    try {
      const result = await signInWithMicrosoft();
      const user = result.user;
      
      if (!user.email) {
        throw new Error('No email found in Microsoft account');
      }
      
      console.log('Microsoft user authenticated:', user.email);
      onLogin(user.email);
      toast.success('Successfully signed in with Microsoft!');
    } catch (error: any) {
      console.error('Microsoft sign in error:', error);
      
      let errorMessage = 'Failed to sign in with Microsoft. Please try again.';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up was blocked. Please allow pop-ups and try again.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with this email using a different sign-in method.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/90 border-b border-gray-200 px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <div className="h-12 w-12 bg-black text-white flex items-center justify-center text-lg font-bold mx-auto rounded-lg mb-4">
              VC
            </div>
            <h1 className="text-2xl font-bold text-black">Vote Casted</h1>
            <p className="text-gray-600 mt-1">Student Voting Portal</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Election Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-black mb-2">
              {electionName || 'Election'}
            </h2>
            {className && (
              <p className="text-gray-600 text-sm">Class: {className}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">Election ID: {electionId}</p>
          </div>

          {/* Auth Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-black mb-2">Sign In to Vote</h3>
              <p className="text-gray-600 text-sm">
                Use your institutional Microsoft account to access this election
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleMicrosoftSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 bg-white text-black font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#f25022" d="M1 1h10v10H1z"/>
                      <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                      <path fill="#7fba00" d="M1 13h10v10H1z"/>
                      <path fill="#ffb900" d="M13 13h10v10H13z"/>
                    </svg>
                    Continue with Microsoft
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Only students registered for this election can access the voting portal
                </p>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              Having trouble? Make sure you're using the email address registered for this election.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
