import { Router, type IRouter } from "express";
import {
  AskCrimeLensBody,
  AskCrimeLensResponse,
  GetCategoryDistributionResponse,
  GetCrimeTimelineResponse,
  GetCrimeTrendsResponse,
  GetDashboardResponse,
  GetHotspotsResponse,
  GetInvestigationProgressResponse,
  GetOffenderNetworkParams,
  GetOffenderNetworkResponse,
  GetOffenderParams,
  GetOffenderResponse,
  GetRepeatOffenderRankingResponse,
  PredictHotspotResponse,
  PredictOffenderRiskResponse,
  DetectAnomaliesResponse,
  ForecastCrimeCategoryResponse,
} from "@workspace/api-zod";
import type { CrimeRepository } from "../repositories/crime-repository";
import { requireAuth } from "../middlewares/auth";
import {
  categoryDistribution,
  dashboard,
  investigationProgress,
  offenderRanking,
  hotspots,
  timeline,
  trends,
  toEvent,
} from "../services/analytics-service";
import {
  detectAnomalies,
  forecastCategory,
  predictHotspot,
  predictOffenderRisk,
} from "../services/prediction-service";
import { answerQuestion } from "../services/ai-service";

function parseId(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number(raw);
  return Number.isInteger(id) ? id : null;
}

export function createCrimeRouter(repository: CrimeRepository): IRouter {
  const router: IRouter = Router();

  router.get("/dashboard", requireAuth, (_req, res): void => {
    res.json(GetDashboardResponse.parse(dashboard(repository)));
  });

  router.get("/hotspots", requireAuth, (_req, res): void => {
    res.json(GetHotspotsResponse.parse(hotspots(repository)));
  });

  router.get("/analytics/trends", requireAuth, (_req, res): void => {
    res.json(GetCrimeTrendsResponse.parse(trends(repository)));
  });

  router.get("/analytics/categories", requireAuth, (_req, res): void => {
    res.json(GetCategoryDistributionResponse.parse(categoryDistribution(repository)));
  });

  router.get("/analytics/offenders", requireAuth, (_req, res): void => {
    res.json(GetRepeatOffenderRankingResponse.parse(offenderRanking(repository)));
  });

  router.get("/analytics/investigations", requireAuth, (_req, res): void => {
    res.json(GetInvestigationProgressResponse.parse(investigationProgress(repository)));
  });

  router.get("/analytics/timeline", requireAuth, (_req, res): void => {
    res.json(GetCrimeTimelineResponse.parse(timeline(repository)));
  });

  router.get("/network/:offenderId", requireAuth, (req, res): void => {
    const params = GetOffenderNetworkParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const offender = repository.findOffender(params.data.offenderId);
    if (!offender) {
      res.status(404).json({ error: "Offender not found" });
      return;
    }
    const related = repository
      .listRelationships()
      .filter(
        (relationship) =>
          relationship.sourceId === offender.id || relationship.targetId === offender.id,
      );
    const ids = new Set<number>([offender.id]);
    related.forEach((relationship) => {
      ids.add(relationship.sourceId);
      ids.add(relationship.targetId);
    });
    const nodes = [...ids].flatMap((id) => {
      const record = repository.findOffender(id);
      return record
        ? [
            {
              id: `offender-${record.id}`,
              label: record.name,
              type: record.id === offender.id ? "focus" : "offender",
              data: { riskScore: record.riskScore, incidents: repository.crimesForOffender(record.id).length },
            },
          ]
        : [];
    });
    res.json(
      GetOffenderNetworkResponse.parse({
        nodes,
        edges: related.map((relationship, index) => ({
          id: `relationship-${index + 1}`,
          source: `offender-${relationship.sourceId}`,
          target: `offender-${relationship.targetId}`,
          relationshipType: relationship.relationshipType,
          confidenceScore: relationship.confidenceScore,
        })),
      }),
    );
  });

  router.get("/offenders/:offenderId", requireAuth, (req, res): void => {
    const params = GetOffenderParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const offender = repository.findOffender(params.data.offenderId);
    if (!offender) {
      res.status(404).json({ error: "Offender not found" });
      return;
    }
    res.json(
      GetOffenderResponse.parse({
        ...offender,
        crimes: repository.crimesForOffender(offender.id).map(toEvent),
      }),
    );
  });

  router.get("/predictions/hotspots", requireAuth, (_req, res): void => {
    res.json(PredictHotspotResponse.parse(predictHotspot(repository)));
  });
  router.get("/predictions/offender-risk", requireAuth, (_req, res): void => {
    res.json(PredictOffenderRiskResponse.parse(predictOffenderRisk(repository)));
  });
  router.get("/predictions/anomalies", requireAuth, (_req, res): void => {
    res.json(DetectAnomaliesResponse.parse(detectAnomalies(repository)));
  });
  router.get("/predictions/category-forecast", requireAuth, (_req, res): void => {
    res.json(ForecastCrimeCategoryResponse.parse(forecastCategory(repository)));
  });

  router.post("/chat", requireAuth, (req, res): void => {
    const parsed = AskCrimeLensBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    res.json(AskCrimeLensResponse.parse(answerQuestion(repository, parsed.data.question)));
  });
  return router;
}
