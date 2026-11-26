// Gallery page. Only the church's own photos for now; the church will upload more in the admin.
import { img, type SeedPage } from "./helpers";

export default {
  slug: "gallery",
  title: "Gallery",
  seo: {
    title: "Gallery",
    description: "Photos from The Light City Church, Nottingham.",
  },
  sections: [
    {
      type: "gallery_hero",
      data: {
        tag: "Life in Focus",
        heading: "Capturing Our Faith",
        subheading: "A glimpse into the worship and fellowship of our church family.",
        image: img("nature/lake.jpg"),
      },
    },
    {
      type: "gallery_grid",
      data: {
        tag: "Gallery",
        heading: "Moments in Community",
        intro: "Click on any photograph to view it in full size.",
        items: [
          {
            id: "pastors",
            image: img("ronnyandanna.jpeg"),
            tag: "Leadership",
            title: "Pastors Ronnie & Annalene Dube",
            caption: "",
          },
          {
            id: "ronnie",
            image: img("pastorronny.jpeg"),
            tag: "Leadership",
            title: "Pastor Ronnie Dube",
            caption: "",
          },
          {
            id: "welcome",
            image: img("thecitylight.webp"),
            tag: "Welcome",
            title: "Welcome to The Light City Church",
            caption: "",
          },
        ],
      },
    },
  ],
} satisfies SeedPage;
