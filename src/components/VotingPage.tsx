import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { api } from '../../convex/_generated/api';
import { StudentPhoneAuth } from './StudentPhoneAuth';
import { StudentVoting } from './StudentVoting';

export function VotingPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Check if election exists
  const elections = useQuery(api.elections.getElections);
  const election = elections?.find(e => e.electionId === electionId);

  useEffect(() => {
    // If no electionId in URL, redirect to home
    if (!electionId) {
      navigate('/');
      return;
    }
  }, [electionId, navigate]);

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Firebase auth state changed:', user);
      
      if (user && user.phoneNumber) {
        console.log('User authenticated with phone:', user.phoneNumber);
        setPhoneNumber(user.phoneNumber);
        setIsAuthenticated(true);
      } else {
        console.log('User not authenticated or no phone number');
        setPhoneNumber(null);
        setIsAuthenticated(false);
      }
      
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePhoneAuth = (phone: string) => {
    console.log('Phone auth completed:', phone);
    setPhoneNumber(phone);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setPhoneNumber(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  // Loading state for auth
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Loading state for elections
  if (elections === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading election...</p>
        </div>
      </div>
    );
  }

  // Election not found
  if (!election) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-white/90 border-b border-gray-200 px-4 py-6">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-black text-white flex items-center justify-center text-sm font-bold rounded-lg">
                VC
              </div>
              <div>
                <h1 className="text-xl font-bold text-black">Vote Casted</h1>
              </div>
            </div>
            <button
              onClick={handleBackToHome}
              className="px-4 py-2 bg-white/90 text-black border border-gray-300 font-medium hover:bg-gray-50 transition-colors rounded-lg"
            >
              Back to Home
            </button>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-2xl font-bold text-black mb-4">Election Not Found</h2>
            <p className="text-gray-600 mb-6">
              The election with ID "{electionId}" could not be found or may have been removed.
            </p>
            <button
              onClick={handleBackToHome}
              className="px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors rounded-lg"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Election found but not open
  if (election.status !== 'open') {
    const statusMessage = election.status === 'created' 
      ? 'This election has not started yet.' 
      : 'This election has ended.';

    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-white/90 border-b border-gray-200 px-4 py-6">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-black text-white flex items-center justify-center text-sm font-bold rounded-lg">
                VC
              </div>
              <div>
                <h1 className="text-xl font-bold text-black">Vote Casted</h1>
                <p className="text-sm text-gray-600">{election.electionName}</p>
              </div>
            </div>
            <button
              onClick={handleBackToHome}
              className="px-4 py-2 bg-white/90 text-black border border-gray-300 font-medium hover:bg-gray-50 transition-colors rounded-lg"
            >
              Back to Home
            </button>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">⏰</div>
            <h2 className="text-2xl font-bold text-black mb-4">Election Unavailable</h2>
            <p className="text-gray-600 mb-6">{statusMessage}</p>
            <button
              onClick={handleBackToHome}
              className="px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors rounded-lg"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show phone authentication if not authenticated
  if (!isAuthenticated || !phoneNumber) {
    return (
      <StudentPhoneAuth 
        onLogin={handlePhoneAuth}
        electionId={electionId!}
        electionName={election.electionName}
        className={election.className}
      />
    );
  }

  // Show voting interface
  return (
    <StudentVoting
      electionId={electionId!}
      phoneNumber={phoneNumber}
      onLogout={handleLogout}
    />
  );
}
