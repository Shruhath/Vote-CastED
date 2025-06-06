import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const createDemoElection = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if demo election already exists
    const existing = await ctx.db
      .query("elections")
      .withIndex("by_election_id", (q) => q.eq("electionId", "DEMO01"))
      .unique();

    if (existing) {
      return { message: "Demo election already exists", electionId: "DEMO01" };
    }

    // Create demo election
    await ctx.db.insert("elections", {
      electionId: "DEMO01",
      electionName: "Class Representative Election",
      className: "CSE-A",
      campus: "cb",
      stream: "sc", 
      programType: "u",
      programLength: 4,
      branch: "cse",
      year: 24,
      section: 0,
      startTime: Date.now() - 86400000,
      endTime: Date.now() + 86400000,
      status: "open",
      studentCount: 4,
      candidateCount: 2,
      multiVote: false,
      totalVotesPerVoter: 1,
      minVotesPerGender: { Male: 0, Female: 0 },
    });

    // Add demo students
    const demoStudents = [
      { rollNumber: "001", name: "Alice Johnson", phone: "+919876543210", gender: "Female", isCandidate: true },
      { rollNumber: "002", name: "Bob Smith", phone: "+919876543211", gender: "Male", isCandidate: true },
      { rollNumber: "003", name: "Charlie Brown", phone: "+919876543212", gender: "Male", isCandidate: false },
      { rollNumber: "004", name: "Diana Prince", phone: "+919876543213", gender: "Female", isCandidate: false },
    ];

    for (const student of demoStudents) {
      await ctx.db.insert("electionStudents", {
        electionId: "DEMO01",
        rollNumber: student.rollNumber,
        name: student.name,
        phone: student.phone,
        gender: student.gender,
        isCandidate: student.isCandidate,
        hasVoted: false,
      });
    }

    return { message: "Demo election created successfully", electionId: "DEMO01" };
  },
});
