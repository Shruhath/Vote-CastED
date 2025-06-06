import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface ElectionResultsProps {
  electionId: string;
  onBack: () => void;
}

export function ElectionResults({ electionId, onBack }: ElectionResultsProps) {
  const results = useQuery(api.voting.getElectionResults, { electionId });
  const election = useQuery(api.elections.getElections)?.find(e => e.electionId === electionId);

  if (results === undefined || !election) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  const formatElectionDisplay = () => {
    const sectionLetter = String.fromCharCode(65 + election.section);
    return election.className || `${election.campus.toUpperCase()}.${election.stream.toUpperCase()}.${election.programType.toUpperCase()}${election.programLength}${election.branch.toUpperCase()}${election.year}${sectionLetter}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="flex items-center text-black hover:text-gray-600 mb-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Election Details
          </button>
          <h1 className="text-2xl font-bold text-black">
            Election Results: {formatElectionDisplay()}
          </h1>
          <p className="text-gray-600">
            {results.totalVotes} votes cast • {results.totalVoters} voters participated
          </p>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-black mb-4">Vote Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{results.totalVotes}</div>
            <div className="text-sm text-blue-800">Total Votes</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{results.totalVoters}</div>
            <div className="text-sm text-green-800">Voters Participated</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{results.results.length}</div>
            <div className="text-sm text-purple-800">Candidates</div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-black">Candidate Results</h3>
        </div>
        
        {results.results.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
            <p className="text-gray-500">No votes have been cast yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roll Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Votes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.results.map((candidate, index) => {
                  const percentage = results.totalVotes > 0 
                    ? ((candidate.votes / results.totalVotes) * 100).toFixed(1)
                    : "0.0";
                  
                  return (
                    <tr key={candidate.rollNumber} className={index === 0 ? "bg-yellow-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index === 0 && (
                            <span className="text-yellow-500 mr-2">👑</span>
                          )}
                          <span className="text-sm font-medium text-black">
                            #{index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-black">{candidate.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {candidate.rollNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {candidate.gender}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-black">{candidate.votes}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-black mr-2">{percentage}%</div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Winner Announcement */}
      {results.results.length > 0 && results.results[0].votes > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-yellow-800 mb-2">
              Congratulations to the Winner!
            </h3>
            <p className="text-lg text-yellow-700">
              <strong>{results.results[0].name}</strong> ({results.results[0].rollNumber})
            </p>
            <p className="text-sm text-yellow-600 mt-1">
              Won with {results.results[0].votes} votes ({((results.results[0].votes / results.totalVotes) * 100).toFixed(1)}%)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
