import { pgTable, foreignKey, serial, integer, varchar, timestamp, unique, text } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const invitations = pgTable("invitations", {
	id: serial().primaryKey().notNull(),
	teamId: integer("team_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 50 }).notNull(),
	invitedBy: integer("invited_by").notNull(),
	invitedAt: timestamp("invited_at", { mode: 'string' }).defaultNow().notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "invitations_team_id_teams_id_fk"
		}),
	foreignKey({
			columns: [table.invitedBy],
			foreignColumns: [users.id],
			name: "invitations_invited_by_users_id_fk"
		}),
]);

export const teamMembers = pgTable("team_members", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	teamId: integer("team_id").notNull(),
	role: varchar({ length: 50 }).notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "team_members_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "team_members_team_id_teams_id_fk"
		}),
]);

export const teams = pgTable("teams", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	stripeCustomerId: text("stripe_customer_id"),
	stripeSubscriptionId: text("stripe_subscription_id"),
	stripeProductId: text("stripe_product_id"),
	planName: varchar("plan_name", { length: 50 }),
	subscriptionStatus: varchar("subscription_status", { length: 20 }),
}, (table) => [
	unique("teams_stripe_customer_id_unique").on(table.stripeCustomerId),
	unique("teams_stripe_subscription_id_unique").on(table.stripeSubscriptionId),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: text("password_hash").notNull(),
	role: varchar({ length: 20 }).default('member').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	googleId: varchar("google_id", { length: 64 }),
	googleAccessToken: text("google_access_token"),
	googleRefreshToken: text("google_refresh_token"),
	googleScopes: text("google_scopes"),
	gmailEnabled: integer("gmail_enabled").default(0).notNull(),
	calendarEnabled: integer("calendar_enabled").default(0).notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const activityLogs = pgTable("activity_logs", {
	id: serial().primaryKey().notNull(),
	teamId: integer("team_id").notNull(),
	userId: integer("user_id"),
	action: text().notNull(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
}, (table) => [
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "activity_logs_team_id_teams_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "activity_logs_user_id_users_id_fk"
		}),
]);

export const memories = pgTable("memories", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	content: text().notNull(),
	tags: text(),
	category: varchar({ length: 100 }).default('general').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "memories_user_id_users_id_fk"
		}),
]);
