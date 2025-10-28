import { relations } from "drizzle-orm/relations";
import { teams, invitations, users, teamMembers, activityLogs, memories } from "./schema";

export const invitationsRelations = relations(invitations, ({one}) => ({
	team: one(teams, {
		fields: [invitations.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [invitations.invitedBy],
		references: [users.id]
	}),
}));

export const teamsRelations = relations(teams, ({many}) => ({
	invitations: many(invitations),
	teamMembers: many(teamMembers),
	activityLogs: many(activityLogs),
}));

export const usersRelations = relations(users, ({many}) => ({
	invitations: many(invitations),
	teamMembers: many(teamMembers),
	activityLogs: many(activityLogs),
	memories: many(memories),
}));

export const teamMembersRelations = relations(teamMembers, ({one}) => ({
	user: one(users, {
		fields: [teamMembers.userId],
		references: [users.id]
	}),
	team: one(teams, {
		fields: [teamMembers.teamId],
		references: [teams.id]
	}),
}));

export const activityLogsRelations = relations(activityLogs, ({one}) => ({
	team: one(teams, {
		fields: [activityLogs.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [activityLogs.userId],
		references: [users.id]
	}),
}));

export const memoriesRelations = relations(memories, ({one}) => ({
	user: one(users, {
		fields: [memories.userId],
		references: [users.id]
	}),
}));