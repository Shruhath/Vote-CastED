import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { StudentPhoneAuth } from './StudentPhoneAuth';
import { StudentVoting } from './StudentVoting';

export function VotingPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const handlePhoneAuth = (phone: string) => {
    setPhoneNumber(phone);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setPhoneNumber(null);
    setIsAuthenticated(false);
  };

  const handleBackToHome = () => {
    // Force a hard navigation to home
    window.location.href = '/';
  };

  // Loading state
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
                <h1 className="text-xl font-bold text-white">Vote Casted</h1>
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
            <h2 className="text-2xl font-bold text-white mb-4">Election Not Found</h2>
            <p className="text-gray-200 mb-6">
              The election with ID "{electionId}" could not be found or may have been removed.
              If you you need to participate in an election, please enter it into url with /vote/--id--
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
                <h1 className="text-xl font-bold text-white">Vote Casted</h1>
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
            <h2 className="text-2xl font-bold text-white mb-4">Election Unavailable</h2>
            <p className="text-gray-200 mb-6">{statusMessage}</p>
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
        onAuthenticated={handlePhoneAuth}
        onBack={handleBackToHome}
        electionId={electionId!}
        electionName={election.electionName}
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
