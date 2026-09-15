import "server-only";

import type { KnowledgeMetadata } from "../index";

export const apertureMetadata = {
  topic: "aperture",
  title: "Bländare",
  relatedTopics: ["iso", "shutter-speed", "exposure-triangle", "relationships"],
  difficulty: "beginner",
  tags: ["aperture", "f-stop", "depth-of-field", "light", "bokeh"]
} satisfies KnowledgeMetadata;
