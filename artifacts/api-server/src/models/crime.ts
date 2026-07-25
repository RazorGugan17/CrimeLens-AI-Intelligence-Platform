export type Role = "Admin" | "Investigator" | "Analyst" | "Supervisor";

export type CrimeStatus =
  | "Open"
  | "Under Investigation"
  | "Chargesheet Filed"
  | "Closed";

export interface CrimeRecord {
  id: number;
  firNumber: string;
  crimeType: string;
  description: string;
  district: string;
  policeStation: string;
  latitude: number;
  longitude: number;
  date: string;
  time: string;
  status: CrimeStatus;
  severity: "Low" | "Medium" | "High" | "Critical";
  offenderId: number;
  victimAge: number;
}

export interface OffenderRecord {
  id: number;
  name: string;
  age: number;
  gender: string;
  riskScore: number;
  modusOperandi: string;
  criminalHistory: number;
}

export interface RelationshipRecord {
  sourceId: number;
  targetId: number;
  relationshipType: string;
  confidenceScore: number;
}

export interface DataSession {
  crimes: CrimeRecord[];
  offenders: OffenderRecord[];
  relationships: RelationshipRecord[];
}