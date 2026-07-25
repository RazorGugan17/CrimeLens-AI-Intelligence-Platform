import type {
  CrimeRecord,
  DataSession,
  OffenderRecord,
  RelationshipRecord,
} from "../models/crime";

/**
 * Storage boundary for CrimeLens. A database-backed session can implement the
 * same shape later without changing services or route handlers.
 */
export class CrimeRepository {
  public constructor(private readonly session: DataSession) {}

  public listCrimes(): CrimeRecord[] {
    return this.session.crimes;
  }

  public listOffenders(): OffenderRecord[] {
    return this.session.offenders;
  }

  public listRelationships(): RelationshipRecord[] {
    return this.session.relationships;
  }

  public findOffender(id: number): OffenderRecord | undefined {
    return this.session.offenders.find((offender) => offender.id === id);
  }

  public crimesForOffender(id: number): CrimeRecord[] {
    return this.session.crimes.filter((crime) => crime.offenderId === id);
  }
}