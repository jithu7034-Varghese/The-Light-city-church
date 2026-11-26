import { contactDetailsBar, contactForm, contactMapHero } from "./sections";

/** Contact page sections. The "Visiting Us" block uses the shared `directions` section. */
export const contactSections = [contactMapHero, contactDetailsBar, contactForm] as const;
