import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';

interface StudentVotingProps {
  electionId: string;
  email: string;
  onLogout: () => void;
}

export function StudentVoting({ electionId, email, onLogout }: StudentVotingProps) {
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const voterAccess = useQuery(api.voting.verifyVoterAccess, { 
    electionId, 
    email 
  });
  const election = useQuery(api.elections.getElectionById, { electionId });
  const candidates = useQuery(api.voting.getElectionCandidates, { electionId });
  const castVote = useMutation(api.voting.castVote);

  useEffect(() => {
    if (voterAccess?.student?.hasVoted) {
      toast.success("You have already voted in this election");
    }
  }, [voterAccess]);

  const handleCandidateToggle = (rollNumber: string) => {
    if (!election) return;
    
    if (election.multiVote) {
      if (selectedCandidates.includes(rollNumber)) {
        setSelectedCandidates(prev => prev.filter(r => r !== rollNumber));
      } else {
        if (selectedCandidates.length < election.totalVotesPerVoter) {
          setSelectedCandidates(prev => [...prev, rollNumber]);
        } else {
          toast.error(`You can only select up to ${election.totalVotesPerVoter} candidates`);
        }
      }
    } else {
      setSelectedCandidates([rollNumber]);
    }
  };

  const validateVote = () => {
    if (!election || !candidates) return false;
    
    if (selectedCandidates.length === 0) {
      toast.error("Please select at least one candidate");
      return false;
    }

    if (election.multiVote) {
      // Check gender requirements
      const selectedCandidateData = candidates.filter(c => 
        selectedCandidates.includes(c.rollNumber)
      );
      
      const maleVotes = selectedCandidateData.filter(c => c.gender === "Male").length;
      const femaleVotes = selectedCandidateData.filter(c => c.gender === "Female").length;

      if (maleVotes < election.minVotesPerGender.Male) {
        toast.error(`You must select at least ${election.minVotesPerGender.Male} male candidates`);
        return false;
      }

      if (femaleVotes < election.minVotesPerGender.Female) {
        toast.error(`You must select at least ${election.minVotesPerGender.Female} female candidates`);
        return false;
      }
    }

    return true;
  };

  const handleSubmitVote = async () => {
    if (!validateVote()) return;

    setIsSubmitting(true);
    try {
      await castVote({
        electionId,
        voterEmail: email,
        candidateRollNumbers: selectedCandidates,
      });
      
      toast.success("Your vote has been cast successfully!");
      setSelectedCandidates([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to cast vote");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (voterAccess === undefined || election === undefined || candidates === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading voting interface...</p>
        </div>
      </div>
    );
  }

  if (!voterAccess.hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 py-6">
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
              onClick={onLogout}
              className="px-4 py-2 bg-white text-black border border-gray-300 font-medium hover:bg-gray-50 transition-colors rounded-lg"
            >
              Back to Login
            </button>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-2xl font-bold text-black mb-4">Not Eligible to Vote</h2>
            <p className="text-gray-600 mb-6">{voterAccess.message}</p>
            <button
              onClick={onLogout}
              className="px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors rounded-lg"
            >
              Try Different Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (voterAccess.student?.hasVoted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 py-6">
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
              onClick={onLogout}
              className="px-4 py-2 bg-white text-black border border-gray-300 font-medium hover:bg-gray-50 transition-colors rounded-lg"
            >
              Exit
            </button>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-2xl font-bold text-black mb-4">Vote Successfully Cast</h2>
            <p className="text-gray-600 mb-6">
              Thank you for participating in the election. Your vote has been recorded.
            </p>
            <button
              onClick={onLogout}
              className="px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors rounded-lg"
            >
              Exit Voting
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatElectionDisplay = () => {
    if (!election) return '';
    return election.className || `${election.campus.toUpperCase()}.${election.stream.toUpperCase()}.${election.programType.toUpperCase()}${election.programLength}${election.branch.toUpperCase()}${election.year}${String.fromCharCode(65 + election.section)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-black text-white flex items-center justify-center text-sm font-bold rounded-lg">
              VC
            </div>
            <div>
              <h1 className="text-xl font-bold text-black">Vote Casted</h1>
              <p className="text-sm text-gray-600">{formatElectionDisplay()}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-white text-black border border-gray-300 font-medium hover:bg-gray-50 transition-colors rounded-lg"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Election Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-2xl font-bold text-black mb-2">
              {election?.electionName || 'Class Representative Election'}
            </h2>
            <div className="text-gray-600 space-y-1">
              <p>Class: {formatElectionDisplay()}</p>
              <p>Welcome, {voterAccess.student?.name} ({voterAccess.student?.rollNumber})</p>
            </div>
          </div>

          {/* Voting Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">📋 Voting Instructions</h3>
            {election?.multiVote ? (
              <div className="text-sm text-blue-800 space-y-2">
                <p>• You can vote for up to <strong>{election?.totalVotesPerVoter}</strong> candidates</p>
                <p>• You must vote for at least <strong>{election?.minVotesPerGender.Male}</strong> male candidates</p>
                <p>• You must vote for at least <strong>{election?.minVotesPerGender.Female}</strong> female candidates</p>
                <p>• Click on candidates to select/deselect them</p>
                <p>• You can only vote <strong>once</strong> in this election</p>
              </div>
            ) : (
              <div className="text-sm text-blue-800 space-y-2">
                <p>• Select <strong>one candidate</strong> to vote for</p>
                <p>• You can only vote <strong>once</strong> in this election</p>
              </div>
            )}
          </div>

          {/* Vote Selection Summary */}
          {election?.multiVote && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-black mb-4">
                Your Selection: {selectedCandidates.length}/{election?.totalVotesPerVoter}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Male candidates selected:</span>
                  <span className="font-medium text-black">
                    {candidates.filter(c => selectedCandidates.includes(c.rollNumber) && c.gender === "Male").length}
                    /{election?.minVotesPerGender.Male} (min required)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Female candidates selected:</span>
                  <span className="font-medium text-black">
                    {candidates.filter(c => selectedCandidates.includes(c.rollNumber) && c.gender === "Female").length}
                    /{election?.minVotesPerGender.Female} (min required)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Candidates List */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-black mb-6">
              Candidates ({candidates.length})
            </h3>
            
            {candidates.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">👥</div>
                <p className="text-gray-500">No candidates available for this election</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.rollNumber}
                    onClick={() => handleCandidateToggle(candidate.rollNumber)}
                    className={`p-6 border-2 cursor-pointer transition-all rounded-lg ${
                      selectedCandidates.includes(candidate.rollNumber)
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1">{candidate.name}</h4>
                        <p className="text-sm opacity-75 mb-1">{candidate.rollNumber}</p>
                        <p className="text-sm opacity-75">{candidate.gender}</p>
                      </div>
                      <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center ${
                        selectedCandidates.includes(candidate.rollNumber)
                          ? 'bg-white border-white'
                          : 'border-gray-400'
                      }`}>
                        {selectedCandidates.includes(candidate.rollNumber) && (
                          <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Vote Button */}
          {candidates.length > 0 && (
            <div className="text-center">
              <button
                onClick={handleSubmitVote}
                disabled={selectedCandidates.length === 0 || isSubmitting}
                className="px-8 py-4 bg-black text-white font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Casting Your Vote...</span>
                  </div>
                ) : (
                  '🗳️ Cast My Vote'
                )}
              </button>
              
              {selectedCandidates.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Please select at least one candidate to continue
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
