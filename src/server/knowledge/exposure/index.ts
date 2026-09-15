import "server-only";

import { apertureMetadata } from "./metadata/aperture.meta";
import { isoMetadata } from "./metadata/iso.meta";
import { relationshipsMetadata } from "./metadata/relationships.meta";
import { shutterSpeedMetadata } from "./metadata/shutter-speed.meta";

export type ExposureTopic =
  | "iso"
  | "aperture"
  | "shutter-speed"
  | "exposure-triangle"
  | "relationships"
  | "misconceptions";

export interface KnowledgeMetadata {
  topic: ExposureTopic;
  title: string;
  relatedTopics: readonly ExposureTopic[];
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: readonly string[];
}

export const exposureKnowledgeMetadata = [
  isoMetadata,
  apertureMetadata,
  shutterSpeedMetadata,
  relationshipsMetadata
] as const satisfies readonly KnowledgeMetadata[];

export function getExposureMetadata(topic: ExposureTopic): KnowledgeMetadata | null {
  return exposureKnowledgeMetadata.find((metadata) => metadata.topic === topic) ?? null;
}

export function getRelatedExposureTopics(topic: ExposureTopic): readonly KnowledgeMetadata[] {
  const metadata = getExposureMetadata(topic);

  if (metadata === null) {
    return [];
  }

  return metadata.relatedTopics
    .map((relatedTopic) => getExposureMetadata(relatedTopic))
    .filter((relatedMetadata): relatedMetadata is KnowledgeMetadata => relatedMetadata !== null);
}

export function getExposureSourcePath(topic: ExposureTopic): `source/${ExposureTopic}.md` {
  return `source/${topic}.md`;
}
