// About page. Wording from the old site (supabase/seed/old-site-content.json → pages.about).
import { img, link, type SeedPage } from "./helpers";

export default {
  slug: "about",
  title: "About",
  seo: {
    title: "About us",
    description:
      "Our mission is to empower every man, woman, and child to live in the fulness of their inheritance in Christ through the accurate teaching of the Gospel.",
  },
  sections: [
    {
      type: "about_hero",
      data: {
        tag: "Welcome to Our House",
        heading: "Our Story & Vision",
        subheading: "To empower every man, woman, and child to live in the fulness of their inheritance in Christ.",
        image: img("nature/hills.jpg"),
      },
    },
    {
      type: "about_story",
      data: {
        tag: "Our Mission",
        heading: "Bringing Light Where There Was",
        headingHighlight: "Darkness",
        body: [
          "To empower every man, woman, and child to live in the fulness of their inheritance in Christ through the accurate teaching of the Gospel.",
          "To bring light where there was once darkness and to prepare the church for the coming of our Lord and Saviour.",
        ].join("\n\n"),
        image: img("citylights.jpeg"),
        badgeTitle: "Christ in you",
        badgeText: "The Hope of Glory — Colossians 1:27",
      },
    },
    {
      type: "about_values",
      data: {
        tag: "What We Stand For",
        heading: "Our Core Values",
        items: [
          {
            id: "love",
            title: "Love above all",
            text: "The love of God is shed abroad in our hearts and it is when we love that we demonstrate the divine nature of God in our lives. We love and value every person because of the price tag God put on their life, which is His own blood.",
            icon: "heart",
            image: img("citylights.jpeg"),
          },
          {
            id: "excellence",
            title: "Standard of excellence",
            text: "We seek to excel in everything we do because Christ is made unto us wisdom and we have the mind of Christ.",
            icon: "star",
            image: null,
          },
          {
            id: "honour",
            title: "Honour",
            text: "We treat each other with respect and integrity, we honour and submit to our leaders as unto the Lord.",
            icon: "shield",
            image: null,
          },
        ],
      },
    },
    {
      type: "about_leadership",
      data: {
        tag: "Our Leadership",
        heading: "Pastoral Oversight",
        items: [
          {
            id: "ronnie",
            tabLabel: "Pastor Ronnie",
            name: "Pastor Ronnie Dube",
            role: "Co-Founder & Senior Pastor",
            bio: "Pastor Ronnie is co-founder and senior pastor at The Light City Church, his ministry as a pastor, teacher, author and healing minister, continues to transform many lives around the world helping them to experience a victorious and purposeful life in God’s word.",
            quote: "",
            image: img("pastorronny.jpeg"),
          },
          {
            id: "annalene",
            tabLabel: "Pastor Annalene",
            name: "Pastor Annalene Dube",
            role: "Minister & Worship Leader",
            bio: "A devoted wife to Pastor Ronnie and a loving mother to Ronnie Jnr, Ariel and Christian, Pastor Annalene is a seasoned minister of the word and worship leader. Her humility, warmth and genuine love for God and people have led to her touching many lives around the world through her music and teaching ministry.",
            quote: "",
            image: img("ronnyandanna.jpeg"),
          },
        ],
      },
    },
    {
      type: "about_visit",
      data: {
        heading: "Learn More",
        text: "The Light City Church is located in the metropolitan city of Nottingham in the United Kingdom. With services every Sunday 10:30am at The Motorpoint Arena in the heart of the city. Come and visit whenever you are in the area or become part of our global community by joining our online Light Groups.",
        serviceLabel: "Worship Service",
        locationLabel: "Location",
        showServiceTimes: true,
        button: link("Find out more", "/contact"),
        image: img("nature/meadow.jpg"),
      },
    },
  ],
} satisfies SeedPage;
