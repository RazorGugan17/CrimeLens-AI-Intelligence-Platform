import type { CrimeRepository } from "../repositories/crime-repository";
import { categoryDistribution, hotspots } from "./analytics-service";
import { predictHotspot } from "./prediction-service";

/**
 * Provider-neutral AI facade. Gemini/OpenAI adapters can be added here later;
 * the dashboard contract remains explainable and source-linked.
 */
export function answerQuestion(repository: CrimeRepository, question: string) {
  const normalized = question.toLowerCase();
  const hotspot = hotspots(repository)[0];
  const category = categoryDistribution(repository)[0];
  const result = predictHotspot(repository);
  const answer = normalized.includes("hotspot")
    ? `${hotspot.district} is currently the highest-priority hotspot with ${hotspot.crimeCount} incidents.`
    : normalized.includes("category") || normalized.includes("crime")
      ? `${category.label} is the leading category in the monitored sample with ${category.count} records.`
      : `The strongest current signal is ${result.prediction}. Review the supporting records before taking action.`;
  return {
    ...result,
    predictionType: "operational_question",
    prediction: result.prediction,
    answer,
  };
}