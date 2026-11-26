// Home page sections, in the page's order.
import { homeHero } from "./hero";
import { homeFeatures } from "./features";
import { homePastor } from "./pastor";
import { homeServices } from "./services";
import { homeGallery } from "./gallery";
import { homeBlog } from "./blog";
import { homePrayer } from "./prayer";

export const homeSections = [homeHero, homeFeatures, homePastor, homeServices, homeGallery, homeBlog, homePrayer] as const;
