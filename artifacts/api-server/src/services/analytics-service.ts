import type { CrimeRepository } from "../repositories/crime-repository";
import type { CrimeRecord } from "../models/crime";

function toEvent(crime: CrimeRecord) {
  return {
    id: crime.id,
    firNumber: crime.firNumber,
    crimeType: crime.crimeType,
    district: crime.district,
    policeStation: crime.policeStation,
    date: crime.date,
    status: crime.status,
    severity: crime.severity,
    summary: crime.description,
  };
}

function countBy(items: string[]): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  items.forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1));
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export function dashboard(repository: CrimeRepository) {
  const crimes = repository.listCrimes();
  const activeInvestigations = crimes.filter(
    (crime) => !["Closed", "Chargesheet Filed"].includes(crime.status),
  ).length;
  const districts = countBy(crimes.map((crime) => crime.district));
  const byMonth = countBy(
    crimes.map((crime) => crime.date.slice(0, 7)),
  ).sort((a, b) => a.label.localeCompare(b.label));
  return {
    totalCrimes: crimes.length,
    activeInvestigations,
    repeatOffenders: repository.listOffenders().filter((offender) => offender.criminalHistory >= 4).length,
    hotspotDistricts: districts.filter((district) => district.count >= 8).length,
    trend: byMonth.map(({ label, count }) => ({ month: label, total: count })),
    recentIncidents: [...crimes]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7)
      .map(toEvent),
  };
}

export function hotspots(repository: CrimeRepository) {
  const crimes = repository.listCrimes();
  return countBy(crimes.map((crime) => crime.district)).map(({ label, count }) => {
    const source = crimes.find((crime) => crime.district === label)!;
    return {
      district: label,
      latitude: source.latitude,
      longitude: source.longitude,
      crimeCount: count,
      intensity: Number(Math.min(1, count / 18).toFixed(2)),
    };
  });
}

export function trends(repository: CrimeRepository) {
  const crimes = repository.listCrimes();
  const byMonth = countBy(crimes.map((crime) => crime.date.slice(0, 7)))
    .sort((a, b) => a.label.localeCompare(b.label))
    .map(({ label, count }) => ({ month: label, total: count }));
  return { byMonth, byDistrict: countBy(crimes.map((crime) => crime.district)) };
}

export function categoryDistribution(repository: CrimeRepository) {
  return countBy(repository.listCrimes().map((crime) => crime.crimeType));
}

export function offenderRanking(repository: CrimeRepository) {
  return repository
    .listOffenders()
    .map((offender) => {
      const incidents = repository.crimesForOffender(offender.id).length;
      return {
        id: offender.id,
        name: offender.name,
        riskScore: offender.riskScore,
        incidents,
        status: offender.riskScore >= 0.75 ? "Priority watch" : "Monitored",
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 8);
}

export function investigationProgress(repository: CrimeRepository) {
  const crimes = repository.listCrimes();
  const colors: Record<string, string> = {
    Open: "#f59e0b",
    "Under Investigation": "#16b7a4",
    "Chargesheet Filed": "#4f7cff",
    Closed: "#64748b",
  };
  return countBy(crimes.map((crime) => crime.status)).map(({ label, count }) => ({
    label,
    count,
    color: colors[label] ?? "#64748b",
  }));
}

export function timeline(repository: CrimeRepository) {
  return [...repository.listCrimes()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 24)
    .map(toEvent);
}

export { toEvent };