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

  // Separate candidates by gender and sort by votes
  const maleResults = results.results
    .filter(candidate => candidate.gender === "Male")
    .sort((a, b) => b.votes - a.votes);
  
  const femaleResults = results.results
    .filter(candidate => candidate.gender === "Female")
    .sort((a, b) => b.votes - a.votes);

  // Get winners based on election quota
  const maleWinners = maleResults.slice(0, election.minVotesPerGender.Male);
  const femaleWinners = femaleResults.slice(0, election.minVotesPerGender.Female);

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

      {/* Winners Section */}
      {(maleWinners.length > 0 || femaleWinners.length > 0) && (
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-yellow-800 mb-2">
              Election Winners
            </h3>
            <p className="text-sm text-yellow-700">
              Based on gender quota: {election.minVotesPerGender.Male} Male, {election.minVotesPerGender.Female} Female
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Male Winners */}
            {maleWinners.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <h4 className="font-semibold text-blue-800 mb-3 text-center">
                  🏆 Male Winners ({maleWinners.length})
                </h4>
                <div className="space-y-2">
                  {maleWinners.map((winner, index) => (
                    <div key={winner.rollNumber} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`}
                        </span>
                        <div>
                          <div className="font-medium text-black">{winner.name}</div>
                          <div className="text-sm text-gray-600">{winner.rollNumber}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{winner.votes}</div>
                        <div className="text-xs text-blue-500">votes</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Female Winners */}
            {femaleWinners.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <h4 className="font-semibold text-pink-800 mb-3 text-center">
                  🏆 Female Winners ({femaleWinners.length})
                </h4>
                <div className="space-y-2">
                  {femaleWinners.map((winner, index) => (
                    <div key={winner.rollNumber} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`}
                        </span>
                        <div>
                          <div className="font-medium text-black">{winner.name}</div>
                          <div className="text-sm text-gray-600">{winner.rollNumber}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-pink-600">{winner.votes}</div>
                        <div className="text-xs text-pink-500">votes</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Complete Results by Gender */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Male Candidates */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-800">Male Candidates ({maleResults.length})</h3>
          </div>
          
          {maleResults.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-2xl mb-2">👤</div>
              <p className="text-gray-500">No male candidates</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {maleResults.map((candidate, index) => {
                const percentage = results.totalVotes > 0 
                  ? ((candidate.votes / results.totalVotes) * 100).toFixed(1)
                  : "0.0";
                const isWinner = index < election.minVotesPerGender.Male;
                
                return (
                  <div key={candidate.rollNumber} className={`p-4 ${isWinner ? "bg-blue-50" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex items-center mr-3">
                          {isWinner && <span className="text-blue-500 mr-1">🏆</span>}
                          <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium text-black">{candidate.name}</div>
                          <div className="text-sm text-gray-600">{candidate.rollNumber}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-black">{candidate.votes}</div>
                        <div className="text-xs text-gray-500">{percentage}%</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Female Candidates */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-pink-50">
            <h3 className="text-lg font-semibold text-pink-800">Female Candidates ({femaleResults.length})</h3>
          </div>
          
          {femaleResults.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-2xl mb-2">👤</div>
              <p className="text-gray-500">No female candidates</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {femaleResults.map((candidate, index) => {
                const percentage = results.totalVotes > 0 
                  ? ((candidate.votes / results.totalVotes) * 100).toFixed(1)
                  : "0.0";
                const isWinner = index < election.minVotesPerGender.Female;
                
                return (
                  <div key={candidate.rollNumber} className={`p-4 ${isWinner ? "bg-pink-50" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex items-center mr-3">
                          {isWinner && <span className="text-pink-500 mr-1">🏆</span>}
                          <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium text-black">{candidate.name}</div>
                          <div className="text-sm text-gray-600">{candidate.rollNumber}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-black">{candidate.votes}</div>
                        <div className="text-xs text-gray-500">{percentage}%</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
