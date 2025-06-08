import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CreateElection } from "./CreateElection";
import { ElectionList } from "./ElectionList";
import { ElectionDetails } from "./ElectionDetails";

type ViewType = 'dashboard' | 'create-election' | 'election-details';

export function AdminDashboard() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);
  
  const elections = useQuery(api.elections.getElections);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    window.location.reload();
  };

  if (currentView === 'create-election') {
    return (
      <CreateElection 
        onBack={() => setCurrentView('dashboard')} 
      />
    );
  }

  if (currentView === 'election-details' && selectedElectionId) {
    return (
      <ElectionDetails 
        electionId={selectedElectionId} 
        onBack={() => {
          setCurrentView('dashboard');
          setSelectedElectionId(null);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-300 bg-opacity-5">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-White">Vote Casted Admin</h1>
            <p className="text-gray-400 mt-1">Manage college elections and student voting</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentView('create-election')}
              className="px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors rounded-lg"
            >
              Create New Election
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-white/90 text-black border border-black font-medium hover:bg-gray-50 transition-colors rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Elections Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 bg-opacity-85">
          <h2 className="text-xl font-semibold text-black mb-6">All Elections</h2>
          {elections === undefined ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          ) : elections.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">🗳️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No elections yet</h3>
              <p className="text-gray-500 mb-6">Create your first election to get started</p>
              <button
                onClick={() => setCurrentView('create-election')}
                className="px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors rounded-lg"
              >
                Create Election
              </button>
            </div>
          ) : (
            <ElectionList 
              elections={elections} 
              onSelectElection={(electionId) => {
                setSelectedElectionId(electionId);
                setCurrentView('election-details');
              }} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
