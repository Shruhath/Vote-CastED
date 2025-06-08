// import { v } from "convex/values";
// import { mutation } from "./_generated/server";

// export const createDemoElection = mutation({
//   args: {},
//   handler: async (ctx) => {
//     // Check if demo election already exists
//     const existing = await ctx.db
//       .query("elections")
//       .withIndex("by_election_id", (q) => q.eq("electionId", "DEMO01"))
//       .unique();

//     if (existing) {
//       return { message: "Demo election already exists", electionId: "DEMO01" };
//     }

//     // Create demo election
//     await ctx.db.insert("elections", {
//       electionId: "DEMO01",
//       electionName: "Demo Election",
//       className: "Demo-A",
//       campus: "cb",
//       stream: "sc", 
//       programType: "u",
//       programLength: 4,
//       branch: "cse",
//       year: 24,
//       section: 0,
//       startTime: Date.now() - 86400000,
//       endTime: Date.now() + 86400000,
//       status: "open",
//       studentCount: 4,
//       candidateCount: 2,
//       multiVote: false,
//       totalVotesPerVoter: 1,
//       minVotesPerGender: { Male: 0, Female: 0 },
//     });

//     // Add demo students
//     const demoStudents = [
//       { rollNumber: "001", name: "Alice Johnson", email: "alice.johnson@student.amrita.edu", gender: "Female", isCandidate: true },
//       { rollNumber: "002", name: "Bob Smith", email: "bob.smith@student.amrita.edu", gender: "Male", isCandidate: true },
//       { rollNumber: "003", name: "Charlie Brown", email: "charlie.brown@student.amrita.edu", gender: "Male", isCandidate: false },
//       { rollNumber: "004", name: "Diana Prince", email: "diana.prince@student.amrita.edu", gender: "Female", isCandidate: false },
//     ];

//     for (const student of demoStudents) {
//       await ctx.db.insert("electionStudents", {
//         electionId: "DEMO01",
//         rollNumber: student.rollNumber,
//         name: student.name,
//         email: student.email,
//         gender: student.gender,
//         isCandidate: student.isCandidate,
//         hasVoted: false,
//       });
//     }

//     return { message: "Demo election created successfully", electionId: "DEMO01" };
//   },
// });
