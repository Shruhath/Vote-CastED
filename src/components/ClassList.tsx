import { Doc } from "../../convex/_generated/dataModel";

interface ClassListProps {
  classes: Doc<"classes">[];
  onSelectClass: (classId: string) => void;
}

export function ClassList({ classes, onSelectClass }: ClassListProps) {
  const formatClassDisplay = (classData: Doc<"classes">) => {
    const sectionLetter = String.fromCharCode(65 + classData.section); // 0=A, 1=B, etc.
    return `${classData.campus.toUpperCase()}.${classData.stream.toUpperCase()}.${classData.programType.toUpperCase()}${classData.programLength}${classData.branch.toUpperCase()}${classData.year}${sectionLetter}`;
  };

  const getBranchName = (branch: string) => {
    const branchNames: Record<string, string> = {
      'cse': 'Computer Science',
      'ece': 'Electronics & Communication',
      'eee': 'Electrical & Electronics',
      'mech': 'Mechanical',
      'civil': 'Civil',
      'it': 'Information Technology',
    };
    return branchNames[branch.toLowerCase()] || branch.toUpperCase();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {classes.map((classData) => (
        <div
          key={classData._id}
          onClick={() => onSelectClass(classData.classId)}
          className="bg-white border border-black p-6 hover:shadow-md transition-shadow cursor-pointer hover:border-gray-600"
        >
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-black">
                {formatClassDisplay(classData)}
              </h3>
              <p className="text-sm text-gray-600">
                {getBranchName(classData.branch)} - Section {String.fromCharCode(65 + classData.section)}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Students:</span>
                <span className="ml-1 font-medium text-black">{classData.studentCount}</span>
              </div>
              <div>
                <span className="text-gray-500">Candidates:</span>
                <span className="ml-1 font-medium text-black">{classData.candidateCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Year: 20{classData.year}
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${
                classData.electionStarted 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {classData.electionStarted ? 'Election Active' : 'Not Started'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
