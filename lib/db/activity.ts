export enum ActivityType {
  SIGN_UP = "SIGN_UP",
  SIGN_IN = "SIGN_IN",
  SIGN_OUT = "SIGN_OUT",
  UPDATE_PASSWORD = "UPDATE_PASSWORD",
  DELETE_ACCOUNT = "DELETE_ACCOUNT",
  UPDATE_ACCOUNT = "UPDATE_ACCOUNT",
  ACCEPT_INVITATION = "ACCEPT_INVITATION",
}

export type NewActivityLog = {
  userId?: number | null;
  action: ActivityType | string;
  timestamp?: string | Date;
  ipAddress?: string | null;
};

export type ActivityLog = {
  id: number;
  userId?: number | null;
  action: ActivityType | string;
  timestamp: string;
  ipAddress?: string | null;
};
