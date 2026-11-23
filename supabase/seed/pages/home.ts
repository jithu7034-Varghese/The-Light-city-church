// Home page seed. Wording comes from the old site (supabase/seed/old-site-content.json → pages.home,
// pages.about, site) wherever there is a match; the rest is the current design's own copy.
import { button, img, link, markdown, type SeedPage } from "./helpers";

const MISSION =
  "We are passionate about empowering every man, woman, and child to live in the fulness of their inheritance in Christ.";

export default {
  slug: "home",
  title: "Home",
  seo: {
    title: "The Light City Church | Nottingham",
    description: MISSION,
  },
  sections: [
    {
      type: "home_hero",
      data: {
        eyebrow: "WHAT WE DO",
        heading: "Welcome to The Light City Church",
        headingLine2: "",
        text: MISSION,
        image: img("thecitylight.webp"),
        buttons: [button("hero-btn-1", "GET INVOLVED", "/contact"), button("hero-btn-2", "WORSHIP WITH US", "/about")],
      },
    },
    {
      type: "home_features",
      data: {
        tag: "/Our Mission",
        highlight: "To empower every man, woman, and child to live in the fulness of their inheritance in Christ",
        muted:
          "through the accurate teaching of the Gospel. To bring light where there was once darkness and to prepare the church for the coming of our Lord and Saviour.",
        youtube: "QiJN-zZk-hI",
        videoQuote: "Believe in God in you!",
        videoReference: "",
        cardLabelLeft: "DAILY LIGHT",
        cardLabelRight: "devotional",
        cardTitle: "Without miracles Christianity is reduced to philosophy.",
        cardText: "Believe in God in you! Christ in you the hope of glory!",
        cardImage: img("pastorronny.jpeg"),
      },
    },
    {
      type: "scripture",
      data: {
        heading: "",
        text: "to open their eyes and to turn them from darkness to light, and from the power of Satan unto God, that they may receive forgiveness of sins and an inheritance among those who are sanctified by faith that is in Me.",
        reference: "ACTS 26:18",
        buttons: [],
      },
    },
    {
      type: "home_pastor",
      data: {
        image: img("ronnyandanna.jpeg"),
        badgeName: "Ronnie & Annalene Dube",
        badgeRole: "Pastors, The Light City Church",
        tag: "// LEADERSHIP",
        heading: "Guiding Our Community",
        headingLine2: "With Grace & Vision",
        quote: "",
        tabs: [
          {
            id: "pastor-tab-story",
            label: "Our Story",
            body: markdown(
              [
                "Pastor Ronnie is co-founder and senior pastor at The Light City Church, his ministry as a pastor, teacher, author and healing minister, continues to transform many lives around the world helping them to experience a victorious and purposeful life in God’s word.",
                "",
                "A devoted wife to Pastor Ronnie and a loving mother to Ronnie Jnr, Ariel and Christian, Pastor Annalene is a seasoned minister of the word and worship leader. Her humility, warmth and genuine love for God and people have led to her touching many lives around the world through her music and teaching ministry.",
              ].join("\n"),
            ),
            buttons: [],
          },
          {
            id: "pastor-tab-values",
            label: "Our Values",
            body: markdown(
              [
                "To empower every man, woman, and child to live in the fulness of their inheritance in Christ through the accurate teaching of the Gospel.",
                "",
                "- **Love above all:** The love of God is shed abroad in our hearts and it is when we love that we demonstrate the divine nature of God in our lives. We love and value every person because of the price tag God put on their life, which is His own blood.",
                "- **Standard of excellence:** We seek to excel in everything we do because Christ is made unto us wisdom and we have the mind of Christ.",
                "- **Honour:** We treat each other with respect and integrity, we honour and submit to our leaders as unto the Lord.",
              ].join("\n"),
            ),
            buttons: [],
          },
          {
            id: "pastor-tab-connect",
            label: "Connect",
            body: markdown(
              "The Light City Church is located in the metropolitan city of Nottingham in the United Kingdom. With services every Sunday 10:30am at The Motorpoint Arena in the heart of the city. Come and visit whenever you are in the area or become part of our global community by joining our online Light Groups.",
            ),
            buttons: [button("pastor-connect-1", "Contact Us", "/contact"), button("pastor-connect-2", "The Loved Circle", "/the-loved-circle")],
          },
        ],
        socialLabel: "Follow our journey:",
        showSocials: true,
      },
    },
    {
      type: "service_times",
      data: {
        heading: "Worship with us this Sunday",
        text: "Every Sunday, we get together for Jesus-centred praise and worship, and an anointed time in the Word preached by Pastor Ronnie Dube. We meet every Sunday 10:30am at The Motorpoint Arena in the City of Nottingham. We look forward to receiving you!",
        buttons: [button("service-btn-1", "FIND OUT MORE", "/contact")],
      },
    },
    {
      type: "home_services",
      data: {
        heading: "Ministries & Pathways",
        items: [
          {
            id: "service-worship",
            title: "Sunday Worship",
            text: "Jesus-centred praise, worship, and an anointed message by Pastor Ronnie Dube at Nottingham Motorpoint Arena.",
            image: img("thecitylight.webp"),
            link: link("", "/about"),
          },
          {
            id: "service-devotional",
            title: "Daily Devotional",
            text: "Sign up to receive our Daily Devotional, monthly newsletter and to hear from us about special conferences and events.",
            image: img("citylights.jpeg"),
            link: link("", "/devotionals"),
          },
          {
            id: "service-freedom",
            title: "Freedom from Religion",
            text: "Discover the good news of grace and how salvation through faith in Jesus Christ is completely free.",
            image: img("logo1.png"),
            link: link("", "/freedom-from-religion"),
          },
          {
            id: "service-loved-circle",
            title: "The Loved Circle",
            text: "A circle of sisterhood that helps you on a journey of self-discovery, healing, wellness, success and above all LOVE!",
            image: null,
            link: link("", "/the-loved-circle"),
          },
        ],
      },
    },
    {
      type: "home_gallery",
      data: {
        heading: "Photo Gallery",
        text: "Explore key moments, ministries, and events that capture the heart of our community in action.",
        photos: [
          { id: "gallery-1", image: img("thecitylight.webp"), caption: "Welcome" },
          { id: "gallery-2", image: img("ronnyandanna.jpeg"), caption: "Our Pastors" },
          { id: "gallery-3", image: img("citylights.jpeg"), caption: "" },
          { id: "gallery-4", image: img("pastorronny.jpeg"), caption: "Pastor Ronnie Dube" },
        ],
        buttonLabel: "View Gallery",
        buttonLink: link("", "/gallery"),
      },
    },
    {
      type: "home_blog",
      data: {
        label: "Daily Devotional",
        heading: "My Daily",
        headingItalic: "Light",
        buttonLabel: "View All Devotionals",
        buttonLink: link("", "/devotionals"),
      },
    },
    {
      type: "giving",
      data: {
        heading: "Tithes and Offerings",
        text: "The Bible speaks of giving to God through our tithes and offerings. We believe giving is an act of worship and thanksgiving to the Lord, and our response to Him for all that He has done for us.",
        buttonLabel: "PARTNERSHIP AND OFFERING",
      },
    },
    {
      type: "newsletter",
      data: {
        heading: "Subscribe",
        text: "Sign up to receive our Daily Devotional, monthly newsletter and to hear from us about special conferences and events.",
        buttonLabel: "SIGN UP",
      },
    },
    {
      type: "home_prayer",
      data: {
        heading: "Prayer",
        text: "Whatever the need we would like to join our faith with yours and stand in agreement with you in prayer. Please send through your prayer requests and testimonies, we look forward to hearing from you.",
        image: img("citylights.jpeg"),
        buttonLabel: "SEND US YOUR PRAYER REQUEST",
        buttonLink: link("", "/contact"),
      },
    },
  ],
} satisfies SeedPage;
