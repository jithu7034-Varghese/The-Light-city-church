// Ministries page. The old site had no ministries page: descriptions follow the old site's own
// wording for each ministry (home, freedom-from-religion and the-loved-circle pages). Times and
// places are only given where the old site states them.
import { img, link, type SeedPage } from "./helpers";

export default {
  slug: "ministries",
  title: "Ministries",
  seo: {
    title: "Our ministries",
    description: "Sunday worship, the Daily Light devotional, Freedom from Religion and The Loved Circle at The Light City Church, Nottingham.",
  },
  sections: [
    {
      type: "ministries_hero",
      data: {
        tag: "Paths of Faith",
        heading: "Our Ministries",
        subheading: "Empowering every person to live out their divine inheritance through worship, study, grace, and fellowship.",
        image: img("thecitylight.webp"),
      },
    },
    {
      type: "ministries_grid",
      data: {
        heading: "Ministries & Pathways",
        intro: "Explore our core areas of service and find where you can connect, learn, and grow.",
        items: [
          {
            id: "sunday",
            title: "Sunday Worship",
            badge: "Worship & Word",
            text: "Every Sunday, we get together for Jesus-centred praise and worship, and an anointed time in the Word preached by Pastor Ronnie Dube. We look forward to receiving you!",
            schedule: "Every Sunday, 10:30am",
            location: "The Motorpoint Arena, Nottingham",
            image: null,
            link: link("Plan your visit", "/contact"),
          },
          {
            id: "devotional",
            title: "Daily Light Devotional",
            badge: "Growth & Study",
            text: "Delve deeper into the Word with our daily devotionals, written to help you understand right standing with God through faith in Jesus Christ.",
            schedule: "",
            location: "Online",
            image: null,
            link: link("Read the devotionals", "/devotionals"),
          },
          {
            id: "freedom",
            title: "Freedom from Religion",
            badge: "Grace & Truth",
            text: "Jesus came to undo the religious mentality and view of God created by the teaching of the law. Discover the good news: right standing and peace with God through faith in Christ, without fear or condemnation.",
            schedule: "",
            location: "",
            image: null,
            link: link("Find freedom from religion", "/freedom-from-religion"),
          },
          {
            id: "loved-circle",
            title: "The Loved Circle",
            badge: "Community & Sisterhood",
            text: "A circle of sisterhood with Pastor Annalene that helps you on a journey of self-discovery, healing, wellness, success and above all love.",
            schedule: "",
            location: "",
            image: null,
            link: link("Join The Loved Circle", "/the-loved-circle"),
          },
        ],
      },
    },
    {
      type: "ministries_cta",
      data: {
        heading: "Find Your Place in",
        headingHighlight: "Community",
        text: "Whether you want to serve, connect in fellowship, or grow through Pastor Ronnie’s teaching, there is a place for you.",
        button: link("Connect With Us", "/contact"),
      },
    },
  ],
} satisfies SeedPage;
