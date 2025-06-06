import { Doc } from '../../convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';
import { useState } from 'react';

interface ElectionListProps {
  elections: Doc<"elections">[];
  onSelectElection: (electionId: string) => void;
}

export function ElectionList({ elections, onSelectElection }: ElectionListProps) {
  const [copiedElectionId, setCopiedElectionId] = useState<string | null>(null);
  const deleteElection = useMutation(api.elections.deleteElection);

  const handleDeleteElection = async (electionId: string, electionName: string) => {
    if (window.confirm(`Are you sure you want to delete "${electionName}"? This action cannot be undone.`)) {
      try {
        await deleteElection({ electionId });
        toast.success('Election deleted successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete election');
      }
    }
  };

  const getElectionLink = (electionId: string) => {
    return `${window.location.origin}/vote/${electionId}`;
  };

  const copyElectionLink = async (electionId: string) => {
    const link = getElectionLink(electionId);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedElectionId(electionId);
      toast.success('Election link copied to clipboard!');
      setTimeout(() => setCopiedElectionId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-gray-100 text-gray-800';
      case 'open': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatElectionDisplay = (election: Doc<"elections">) => {
    const sectionLetter = String.fromCharCode(65 + election.section);
    return `${election.campus.toUpperCase()}.${election.stream.toUpperCase()}.${election.programType.toUpperCase()}${election.programLength}${election.branch.toUpperCase()}${election.year}${sectionLetter}`;
  };

  return (
    <div className="space-y-4">
      {elections.map((election) => (
        <div key={election._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-black">
                  {election.electionName || 'Class Representative Election'}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(election.status)}`}>
                  {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                <div>
                  <span className="font-medium">Class:</span> {election.className || formatElectionDisplay(election)}
                </div>
                <div>
                  <span className="font-medium">Students:</span> {election.studentCount}
                </div>
                <div>
                  <span className="font-medium">Candidates:</span> {election.candidateCount}
                </div>
                <div>
                  <span className="font-medium">Voting:</span> {election.multiVote ? 'Multi-vote' : 'Single vote'}
                </div>
              </div>

              {election.startTime && election.endTime && (
                <div className="text-sm text-gray-500 mb-4">
                  <div><span className="font-medium">Start:</span> {formatDate(election.startTime)}</div>
                  <div><span className="font-medium">End:</span> {formatDate(election.endTime)}</div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onSelectElection(election.electionId)}
                  className="px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors rounded-md"
                >
                  Manage Election
                </button>
                
                <button
                  onClick={() => copyElectionLink(election.electionId)}
                  className={`px-4 py-2 text-sm font-medium transition-colors rounded-md ${
                    copiedElectionId === election.electionId
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  {copiedElectionId === election.electionId ? '✓ Copied!' : 'Copy Voting Link'}
                </button>

                <button
                  onClick={() => handleDeleteElection(election.electionId, election.electionName || 'Election')}
                  className="px-4 py-2 bg-red-100 text-red-800 text-sm font-medium hover:bg-red-200 transition-colors rounded-md"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Voting Link Display */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="text-xs text-gray-500 mb-1">Voting Link:</div>
            <div className="text-sm font-mono text-gray-700 break-all">
              {getElectionLink(election.electionId)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
