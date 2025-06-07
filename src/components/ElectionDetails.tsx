import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { ElectionResults } from "./ElectionResults";

interface ElectionDetailsProps {
  electionId: string;
  onBack: () => void;
}

export function ElectionDetails({ electionId, onBack }: ElectionDetailsProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'candidates' | 'results'>('all');
  const election = useQuery(api.elections.getElections)?.find(e => e.electionId === electionId);
  const students = useQuery(api.elections.getElectionStudents, { electionId });
  const toggleCandidate = useMutation(api.elections.toggleElectionCandidate);
  const startElection = useMutation(api.elections.startElection);
  const endElection = useMutation(api.elections.endElection);

  const handleToggleCandidate = async (student: Doc<"electionStudents">) => {
    try {
      await toggleCandidate({
        studentId: student._id,
        isCandidate: !student.isCandidate,
      });
      toast.success(
        student.isCandidate 
          ? `${student.name} removed as candidate`
          : `${student.name} added as candidate`
      );
    } catch (error) {
      toast.error("Failed to update candidate status");
    }
  };

  const handleStartElection = async () => {
    try {
      await startElection({ electionId });
      toast.success("Election started successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to start election");
    }
  };

  const handleEndElection = async () => {
    try {
      await endElection({ electionId });
      toast.success("Election ended successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to end election");
    }
  };

  const formatElectionDisplay = (electionId: string) => {
    if (!election) return electionId;
    const sectionLetter = String.fromCharCode(65 + election.section);
    return `${election.campus.toUpperCase()}.${election.stream.toUpperCase()}.${election.programType.toUpperCase()}${election.programLength}${election.branch.toUpperCase()}${election.year}${sectionLetter}`;
  };

  if (!election || students === undefined) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
      </div>
    );
  }

  // Show results view
  if (activeTab === 'results') {
    return (
      <ElectionResults 
        electionId={electionId} 
        onBack={() => setActiveTab('all')} 
      />
    );
  }

  const candidates = students?.filter(s => s.isCandidate) || [];
  const displayStudents = activeTab === 'candidates' ? candidates : students;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="flex items-center text-white hover:text-gray-600 mb-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-white">
            Election: {formatElectionDisplay(electionId)}
          </h1>
          <p className="text-gray-200 mt-1">
            {students.length} students • {candidates.length} candidates • Status: {election.status}
          </p>
          <p className="text-sm text-gray-500">
            Election ID: {electionId}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {election.status === 'created' && (
            <button 
              onClick={handleStartElection}
              className="bg-green-600 text-white px-4 py-2 hover:bg-green-700 transition-colors"
            >
              Start Election
            </button>
          )}
          {election.status === 'open' && (
            <button 
              onClick={handleEndElection}
              className="bg-red-600 text-white px-4 py-2 hover:bg-red-700 transition-colors"
            >
              End Election
            </button>
          )}
          {(election.status === 'open' || election.status === 'closed') && (
            <button 
              onClick={() => setActiveTab('results')}
              className="bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors"
            >
              View Results
            </button>
          )}
        </div>
      </div>

      {/* Election Config */}
      <div className="bg-white border bg-opacity-85 border-black p-4">
        <h3 className="text-lg font-semibold text-black mb-2">Election Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Multi-vote:</span>
            <span className="ml-1 font-medium text-black">{election.multiVote ? 'Yes' : 'No'}</span>
          </div>
          {election.multiVote && (
            <>
              <div>
                <span className="text-gray-500">Votes per voter:</span>
                <span className="ml-1 font-medium text-black">{election.totalVotesPerVoter}</span>
              </div>
              <div>
                <span className="text-gray-500">Min Male votes:</span>
                <span className="ml-1 font-medium text-black">{election.minVotesPerGender.Male}</span>
              </div>
              <div>
                <span className="text-gray-500">Min Female votes:</span>
                <span className="ml-1 font-medium text-black">{election.minVotesPerGender.Female}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-black text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('candidates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'candidates'
                ? 'border-black text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Candidates ({candidates.length})
          </button>
        </nav>
      </div>

      {/* Student List */}
      <div className="bg-white border border-black">
        {displayStudents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">
              {activeTab === 'candidates' ? 'No candidates selected' : 'No students found'}
            </div>
            <div className="text-sm text-gray-400">
              {activeTab === 'candidates' 
                ? 'Toggle students as candidates to see them here'
                : 'No students in this election'
              }
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roll Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-black">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.gender}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {student.rollNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {student.phone || 'Not provided'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {student.isCandidate && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-black">
                            Candidate
                          </span>
                        )}
                        {student.hasVoted && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Voted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleToggleCandidate(student)}
                        disabled={election.status === 'open'}
                        className={`px-3 py-1 text-sm font-medium transition-colors ${
                          election.status === 'open' 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : student.isCandidate
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-gray-100 text-black hover:bg-gray-200'
                        }`}
                      >
                        {student.isCandidate ? 'Remove Candidate' : 'Make Candidate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
