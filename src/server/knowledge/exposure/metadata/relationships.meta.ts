import "server-only";

import type { KnowledgeMetadata } from "../index";

export const relationshipsMetadata = {
  topic: "relationships",
  title: "Relationer mellan ISO, bländare och slutartid",
  relatedTopics: ["iso", "aperture", "shutter-speed", "exposure-triangle", "misconceptions"],
  difficulty: "intermediate",
  tags: ["stops", "tradeoffs", "exposure-balance", "settings"]
} satisfies KnowledgeMetadata;
