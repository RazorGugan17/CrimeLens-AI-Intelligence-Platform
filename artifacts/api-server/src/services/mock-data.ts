import type {
  CrimeRecord,
  DataSession,
  OffenderRecord,
  RelationshipRecord,
} from "../models/crime";

export const DISTRICTS = [
  "Bengaluru Urban",
  "Mysuru",
  "Mangaluru",
  "Hubballi",
  "Belagavi",
  "Shivamogga",
  "Tumakuru",
  "Kalaburagi",
];

export const CATEGORIES = [
  "Theft",
  "Cyber Crime",
  "Narcotics",
  "Murder",
  "Robbery",
  "Fraud",
  "Assault",
  "Domestic Violence",
  "Missing Person",
];

const STATIONS: Record<string, string> = {
  "Bengaluru Urban": "Indiranagar PS",
  Mysuru: "Devaraja PS",
  Mangaluru: "Kadri PS",
  Hubballi: "Hubballi Dharwad PS",
  Belagavi: "Tilakwadi PS",
  Shivamogga: "Shivamogga Town PS",
  Tumakuru: "Tumakuru Town PS",
  Kalaburagi: "Ashok Nagar PS",
};

const NAMES = [
  "Ravi Kumar",
  "Suresh Gowda",
  "Imran Shaikh",
  "Prakash Shetty",
  "Manjunath H.",
  "Vijay Patil",
  "Naveen Reddy",
  "Arun Bhat",
  "Kiran M.",
  "Shabana Begum",
  "Ramesh Naik",
  "Dinesh Joshi",
];

const DESCRIPTIONS = [
  "Reported near a transit corridor during evening hours.",
  "Digital evidence and transaction records submitted for review.",
  "Incident linked to a recurring pattern in the local beat.",
  "Witness statements collected; forensic review pending.",
];

const coordinates: Record<string, [number, number]> = {
  "Bengaluru Urban": [12.9716, 77.5946],
  Mysuru: [12.2958, 76.6394],
  Mangaluru: [12.9141, 74.856],
  Hubballi: [15.3647, 75.124],
  Belagavi: [15.8497, 74.4977],
  Shivamogga: [13.9299, 75.5681],
  Tumakuru: [13.3379, 77.1173],
  Kalaburagi: [17.3297, 76.8343],
};

function buildOffenders(): OffenderRecord[] {
  return NAMES.map((name, index) => ({
    id: index + 1,
    name,
    age: 24 + ((index * 7) % 22),
    gender: index % 4 === 3 ? "Female" : "Male",
    riskScore: Number((0.46 + ((index * 0.041) % 0.48)).toFixed(2)),
    modusOperandi:
      index % 3 === 0
        ? "Night-time access through weakly monitored corridors"
        : index % 3 === 1
          ? "Social engineering and digital payment diversion"
          : "Coordinated movement with local associates",
    criminalHistory: 2 + (index % 6),
  }));
}

function buildCrimes(offenders: OffenderRecord[]): CrimeRecord[] {
  const crimes: CrimeRecord[] = [];
  let id = 1;
  for (let month = 1; month <= 9; month += 1) {
    for (let districtIndex = 0; districtIndex < DISTRICTS.length; districtIndex += 1) {
      const district = DISTRICTS[districtIndex];
      const count = districtIndex === 0 ? 2 : 1;
      for (let repeat = 0; repeat < count; repeat += 1) {
        const category = CATEGORIES[(id + districtIndex + month) % CATEGORIES.length];
        const [latitude, longitude] = coordinates[district];
        const offender = offenders[(id + districtIndex) % offenders.length];
        const status =
          id % 9 === 0
            ? "Closed"
            : id % 4 === 0
              ? "Chargesheet Filed"
              : id % 3 === 0
                ? "Under Investigation"
                : "Open";
        const severity =
          category === "Murder"
            ? "Critical"
            : category === "Robbery" || category === "Narcotics"
              ? "High"
              : id % 3 === 0
                ? "Medium"
                : "Low";
        crimes.push({
          id,
          firNumber: `KA-${districtIndex + 1}/${String(month).padStart(2, "0")}/${String(id).padStart(4, "0")}`,
          crimeType: category,
          description: DESCRIPTIONS[id % DESCRIPTIONS.length],
          district,
          policeStation: STATIONS[district],
          latitude: Number((latitude + ((id % 5) - 2) * 0.004).toFixed(5)),
          longitude: Number((longitude + ((id % 7) - 3) * 0.004).toFixed(5)),
          date: `2026-${String(month).padStart(2, "0")}-${String((id % 26) + 1).padStart(2, "0")}`,
          time: `${String(7 + (id % 13)).padStart(2, "0")}:${id % 6}0`,
          status,
          severity,
          offenderId: offender.id,
          victimAge: 19 + (id % 47),
        });
        id += 1;
      }
    }
  }
  return crimes;
}

function buildRelationships(offenders: OffenderRecord[]): RelationshipRecord[] {
  return offenders.slice(0, 9).flatMap((offender, index) => [
    {
      sourceId: offender.id,
      targetId: offenders[(index + 1) % offenders.length].id,
      relationshipType: index % 2 === 0 ? "Known associate" : "Shared location",
      confidenceScore: Number((0.74 + (index % 4) * 0.05).toFixed(2)),
    },
    ...(index % 3 === 0
      ? [
          {
            sourceId: offender.id,
            targetId: offenders[(index + 3) % offenders.length].id,
            relationshipType: "Common case linkage",
            confidenceScore: 0.81,
          },
        ]
      : []),
  ]);
}

export function createMockSession(): DataSession {
  const offenders = buildOffenders();
  return {
    offenders,
    crimes: buildCrimes(offenders),
    relationships: buildRelationships(offenders),
  };
}