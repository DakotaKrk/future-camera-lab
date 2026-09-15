import "server-only";

import type { KnowledgeMetadata } from "../index";

export const shutterSpeedMetadata = {
  topic: "shutter-speed",
  title: "Slutartid",
  relatedTopics: ["iso", "aperture", "exposure-triangle", "relationships"],
  difficulty: "beginner",
  tags: ["shutter-speed", "motion-blur", "camera-shake", "light", "exposure"]
} satisfies KnowledgeMetadata;
