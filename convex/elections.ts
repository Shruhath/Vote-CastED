import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Generate a unique election ID
function generateElectionId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const createElection = mutation({
  args: {
    electionName: v.string(),
    className: v.string(),
    year: v.number(),
    branch: v.string(),
    section: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    studentsData: v.array(v.object({
      rollNumber: v.string(),
      name: v.string(),
      phone: v.string(),
      gender: v.string(),
    })),
    electionConfig: v.object({
      multiVote: v.boolean(),
      totalVotesPerVoter: v.number(),
      minVotesPerGender: v.object({
        Male: v.number(),
        Female: v.number(),
      }),
    }),
  },
  handler: async (ctx, args) => {
    const electionId = generateElectionId();
    
    // Create the election record
    const election = await ctx.db.insert("elections", {
      electionId,
      electionName: args.electionName,
      className: args.className,
      campus: "cb", // Default values for compatibility
      stream: "sc",
      programType: "u",
      programLength: 4,
      branch: args.branch,
      year: args.year,
      section: args.section,
      startTime: args.startDate,
      endTime: args.endDate,
      status: "created",
      studentCount: args.studentsData.length,
      candidateCount: 0,
      multiVote: args.electionConfig.multiVote,
      totalVotesPerVoter: args.electionConfig.totalVotesPerVoter,
      minVotesPerGender: args.electionConfig.minVotesPerGender,
    });

    // Add students to the election
    let studentsProcessed = 0;
    for (const studentData of args.studentsData) {
      try {
        await ctx.db.insert("electionStudents", {
          electionId,
          rollNumber: studentData.rollNumber,
          name: studentData.name,
          phone: studentData.phone,
          gender: studentData.gender,
          isCandidate: false,
          hasVoted: false,
        });
        studentsProcessed++;
      } catch (error) {
        console.error(`Failed to add student ${studentData.rollNumber}:`, error);
      }
    }

    return {
      electionId,
      studentsProcessed,
    };
  },
});

export const getElections = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("elections").order("desc").collect();
  },
});

export const getElectionStudents = query({
  args: { electionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("electionStudents")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .collect();
  },
});

export const toggleElectionCandidate = mutation({
  args: {
    studentId: v.id("electionStudents"),
    isCandidate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    await ctx.db.patch(args.studentId, {
      isCandidate: args.isCandidate,
    });

    // Update election candidate count
    const election = await ctx.db
      .query("elections")
      .withIndex("by_election_id", (q) => q.eq("electionId", student.electionId))
      .unique();

    if (election) {
      const candidateCount = await ctx.db
        .query("electionStudents")
        .withIndex("by_election", (q) => q.eq("electionId", student.electionId))
        .filter((q) => q.eq(q.field("isCandidate"), true))
        .collect();

      await ctx.db.patch(election._id, {
        candidateCount: candidateCount.length,
      });
    }

    return { success: true };
  },
});

export const checkStudentEligibility = query({
  args: {
    electionId: v.string(),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the election
    const election = await ctx.db
      .query("elections")
      .withIndex("by_election_id", (q) => q.eq("electionId", args.electionId))
      .unique();

    if (!election) {
      return {
        eligible: false,
        message: "Election not found",
        election: null,
        student: null,
      };
    }

    // Check if election is open
    if (election.status !== "open") {
      return {
        eligible: false,
        message: election.status === "created" 
          ? "Election has not started yet" 
          : "Election has ended",
        election,
        student: null,
      };
    }

    // Find the student in this election
    const student = await ctx.db
      .query("electionStudents")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .filter((q) => q.eq(q.field("phone"), args.phoneNumber))
      .unique();

    if (!student) {
      return {
        eligible: false,
        message: "You are not registered for this election",
        election,
        student: null,
      };
    }

    return {
      eligible: true,
      message: "You are eligible to vote",
      election,
      student,
    };
  },
});

export const startElection = mutation({
  args: { electionId: v.string() },
  handler: async (ctx, args) => {
    const election = await ctx.db
      .query("elections")
      .withIndex("by_election_id", (q) => q.eq("electionId", args.electionId))
      .unique();

    if (!election) {
      throw new Error("Election not found");
    }

    if (election.status !== "created") {
      throw new Error("Election cannot be started");
    }

    // Check if there are candidates
    const candidates = await ctx.db
      .query("electionStudents")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .filter((q) => q.eq(q.field("isCandidate"), true))
      .collect();

    if (candidates.length === 0) {
      throw new Error("Cannot start election without candidates");
    }

    await ctx.db.patch(election._id, {
      status: "open",
    });

    return { success: true };
  },
});

export const endElection = mutation({
  args: { electionId: v.string() },
  handler: async (ctx, args) => {
    const election = await ctx.db
      .query("elections")
      .withIndex("by_election_id", (q) => q.eq("electionId", args.electionId))
      .unique();

    if (!election) {
      throw new Error("Election not found");
    }

    if (election.status !== "open") {
      throw new Error("Election is not currently open");
    }

    await ctx.db.patch(election._id, {
      status: "closed",
    });

    return { success: true };
  },
});

export const deleteElection = mutation({
  args: { electionId: v.string() },
  handler: async (ctx, args) => {
    // Find the election
    const election = await ctx.db
      .query("elections")
      .withIndex("by_election_id", (q) => q.eq("electionId", args.electionId))
      .unique();

    if (!election) {
      throw new Error("Election not found");
    }

    // Delete all students in this election
    const students = await ctx.db
      .query("electionStudents")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .collect();

    for (const student of students) {
      await ctx.db.delete(student._id);
    }

    // Delete all votes for this election
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .collect();

    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    // Delete the election
    await ctx.db.delete(election._id);

    return { success: true };
  },
});
