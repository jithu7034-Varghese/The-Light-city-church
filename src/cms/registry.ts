// The section registry: every section type the CMS knows (docs/ARCHITECTURE.md §8).
import type { SectionDef } from "./define";
import { cardsGrid, cta, pageHero, richText, scripture, textImage } from "./sections/shared/basic";
import { directions, enquiryForm, giving, latestPosts, newsletter, podcast, serviceTimes, video } from "./sections/shared/more";
import { homeSections } from "./sections/home";
import { aboutSections } from "./sections/about";
import { ministriesSections } from "./sections/ministries";
import { gallerySections } from "./sections/gallery";
import { contactSections } from "./sections/contact";

const ALL: SectionDef[] = [
  pageHero, richText, scripture, cta, textImage, cardsGrid,
  video, serviceTimes, giving, newsletter, enquiryForm, latestPosts, podcast, directions,
  ...homeSections, ...aboutSections, ...ministriesSections, ...gallerySections, ...contactSections,
] as unknown as SectionDef[];

if (new Set(ALL.map((d) => d.type)).size !== ALL.length) throw new Error("Duplicate section type in the CMS registry");

export const REGISTRY: Record<string, SectionDef> = Object.fromEntries(ALL.map((d) => [d.type, d]));

export function getSectionDef(type: string): SectionDef | undefined {
  return REGISTRY[type];
}
