// Every page the seed creates, in menu order. Wording comes from old-site-content.json.
import type { SeedPage } from "./helpers";
import home from "./home";
import about from "./about";
import ministries from "./ministries";
import gallery from "./gallery";
import contact from "./contact";
import freedomFromReligion from "./freedom-from-religion";
import theLovedCircle from "./the-loved-circle";
import give from "./give";
import privacyPolicy from "./privacy-policy";

export const SEED_PAGES: SeedPage[] = [home, about, ministries, gallery, contact, freedomFromReligion, theLovedCircle, give, privacyPolicy];
