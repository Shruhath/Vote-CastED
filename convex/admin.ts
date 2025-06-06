import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const authenticateAdmin = query({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!admin) {
      return { success: false, message: "Invalid username" };
    }

    if (admin.password !== args.password) {
      return { success: false, message: "Invalid password" };
    }

    return { success: true, message: "Login successful" };
  },
});

export const createDefaultAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if admin already exists
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", "ushodaya"))
      .unique();

    if (existing) {
      return { message: "Default admin already exists" };
    }

    // Create default admin
    await ctx.db.insert("admins", {
      username: "ushodaya",
      password: "ushodayaforamrita",
    });

    return { message: "Default admin created successfully" };
  },
});
