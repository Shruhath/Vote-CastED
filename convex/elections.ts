import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createElection = mutation({
  args: {
    electionName: v.string(),
    className: v.optional(v.string()),
    year: v.number(),
    branch: v.string(),
    section: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    studentsData: v.array(v.object({
      rollNumber: v.string(),
      name: v.string(),
      email: v.string(),
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
    // Generate shorter, more readable election ID (6 characters)
    const generateShortId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let electionId = generateShortId();
    
    // Ensure uniqueness
    let existing = await ctx.db
      .query("elections")
      .withIndex("by_election_id", (q) => q.eq("electionId", electionId))
      .unique();
    
    while (existing) {
      electionId = generateShortId();
      existing = await ctx.db
        .query("elections")
        .withIndex("by_election_id", (q) => q.eq("electionId", electionId))
        .unique();
    }
    
    // Create election record with "created" status (not auto-started)
    await ctx.db.insert("elections", {
      electionId,
      electionName: args.electionName,
      className: args.className,
      campus: "default",
      stream: "default",
      programType: "default",
      programLength: 4,
      branch: args.branch,
      year: args.year,
      section: args.section,
      startTime: args.startDate,
      endTime: args.endDate,
      status: "created", // Start as created, not open
      studentCount: args.studentsData.length,
      candidateCount: 0, // No candidates initially
      multiVote: args.electionConfig.multiVote,
      totalVotesPerVoter: args.electionConfig.totalVotesPerVoter,
      minVotesPerGender: args.electionConfig.minVotesPerGender,
    });

    // Insert students as NON-candidates initially
    let studentsProcessed = 0;
    for (const student of args.studentsData) {
      try {
        await ctx.db.insert("electionStudents", {
          electionId,
          rollNumber: student.rollNumber,
          name: student.name,
          email: student.email.toLowerCase(),
          gender: student.gender,
          isCandidate: false, // Changed: Students are NOT candidates by default
          hasVoted: false,
        });
        studentsProcessed++;
      } catch (error) {
        console.error(`Failed to insert student ${student.rollNumber}:`, error);
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
    const elections = await ctx.db.query("elections").collect();
    
    // Don't auto-update status in queries - keep manual control
    return elections;
  },
});

export const getElectionById = query({
  args: { electionId: v.string() },
  handler: async (ctx, args) => {
    const election = await ctx.db
      .query("elections")
      .withIndex("by_election_id", (q) => q.eq("electionId", args.electionId))
      .unique();
    
    if (!election) return null;
    
    // Don't auto-update status - keep manual control
    return election;
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

export const toggleCandidateStatus = mutation({
  args: {
    electionId: v.string(),
    rollNumber: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if election allows candidate changes
    const election = await ctx.db
      .query("elections")
      .withIndex("by_election_id", (q) => q.eq("electionId", args.electionId))
      .unique();
    
    if (!election) {
      throw new Error("Election not found");
    }
    
    // Prevent changes if election is already started
    if (election.status === "open" || election.status === "closed") {
      throw new Error("Cannot modify candidates after election has started");
    }

    const student = await ctx.db
      .query("electionStudents")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .filter((q) => q.eq(q.field("rollNumber"), args.rollNumber))
      .unique();
    
    if (!student) {
      throw new Error("Student not found");
    }
    
    await ctx.db.patch(student._id, {
      isCandidate: !student.isCandidate,
    });
    
    // Update candidate count in election
    const candidates = await ctx.db
      .query("electionStudents")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .filter((q) => q.eq(q.field("isCandidate"), true))
      .collect();
    
    if (election) {
      await ctx.db.patch(election._id, {
        candidateCount: candidates.length,
      });
    }
    
    return { success: true };
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
      throw new Error("Election has already been started or ended");
    }
    
    // Check if there are candidates
    const candidates = await ctx.db
      .query("electionStudents")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .filter((q) => q.eq(q.field("isCandidate"), true))
      .collect();
    
    if (candidates.length === 0) {
      throw new Error("Cannot start election without any candidates. Please add candidates first.");
    }
    
    await ctx.db.patch(election._id, {
      status: "open",
      startTime: Date.now(), // Update actual start time
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
      endTime: Date.now(),
    });
    
    return { success: true };
  },
});

export const updateElectionStatus = mutation({
  args: { electionId: v.string() },
  handler: async (ctx, args) => {
    const election = await ctx.db
      .query("elections")
      .withIndex("by_election_id", (q) => q.eq("electionId", args.electionId))
      .unique();
    
    if (!election) {
      return { success: false, message: "Election not found" };
    }
    
    // Only auto-close elections that have passed their end time
    const now = Date.now();
    let newStatus = election.status;
    
    if (election.status === "open" && election.endTime && now >= election.endTime) {
      newStatus = "closed";
    }
    
    if (newStatus !== election.status) {
      await ctx.db.patch(election._id, { status: newStatus });
    }
    
    return { success: true };
  },
});

export const deleteElection = mutation({
  args: { electionId: v.string() },
  handler: async (ctx, args) => {
    const election = await ctx.db
      .query("elections")
      .withIndex("by_election_id", (q) => q.eq("electionId", args.electionId))
      .unique();
    
    if (!election) {
      throw new Error("Election not found");
    }
    
    await ctx.db.delete(election._id);
    return { success: true };
  },
});
