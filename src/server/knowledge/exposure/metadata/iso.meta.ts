import "server-only";

import type { KnowledgeMetadata } from "../index";

export const isoMetadata = {
  topic: "iso",
  title: "ISO",
  relatedTopics: ["aperture", "shutter-speed", "exposure-triangle", "relationships"],
  difficulty: "beginner",
  tags: ["iso", "gain", "noise", "dynamic-range", "exposure"]
} satisfies KnowledgeMetadata;
