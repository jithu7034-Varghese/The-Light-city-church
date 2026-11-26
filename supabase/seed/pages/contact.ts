// Contact page. Wording from the old site (supabase/seed/old-site-content.json → pages.contact).
// Venue, service time, email and phone are shown from Site settings, not stored here.
import { img, link, type SeedPage } from "./helpers";

export default {
  slug: "contact",
  title: "Contact",
  seo: {
    title: "Contact us",
    description: "Get involved, send us a message, or find directions to our Sunday service at The Motorpoint Arena, Nottingham.",
  },
  sections: [
    {
      type: "contact_map_hero",
      data: {
        image: img("nature/lake.jpg"),
        mapEmbedUrl:
          "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2402.730303649666!2d-1.1448831230006277!3d52.9531818722421!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4879c3d4abfca783%3A0xb3515cf8bfa00cb3!2sMotorpoint%20Arena%20Nottingham!5e0!3m2!1sen!2suk!4v1710000000000!5m2!1sen!2suk",
        tag: "Our Weekly Sunday Services",
        headingLine1: "Easily Join Our Sunday",
        headingLine2: "Service to Grow Your Faith",
        subheading: "Empowering every man, woman, and child to live in the fullness of their inheritance in Christ. Join us in Nottingham.",
        cardBadge: "Next Service",
        cardImage: img("thecitylight.webp"),
        welcomeText: "All welcome",
        footerLabel: "Senior Pastor",
        footerValue: "Pastor Ronnie Dube",
        directions: link("Get Directions", "https://maps.google.com/?q=Motorpoint+Arena+Nottingham"),
      },
    },
    {
      type: "contact_details_bar",
      data: {
        serviceLabel: "Sunday Worship",
        venueValue: "Arena",
        venueLabel: "Location Venue",
        emailLabel: "Email Contact",
        phoneLabel: "Phone",
      },
    },
    {
      type: "contact_form",
      data: {
        tag: "Contact Us",
        heading: "Get Involved!",
        text: "",
        cards: [
          {
            id: "help",
            icon: "heart",
            title: "Find out more ways to help!",
            text: "There are so many ways to support our mission. Contact us to find out more about volunteer opportunities, fundraising events, and ways to get our message to your friends and family.",
            wide: true,
            badge: "",
            image: null,
            imageTitle: "",
            imageCaption: "",
          },
        ],
      },
    },
    {
      type: "directions",
      data: {
        tag: "Directions",
        heading: "Visiting Us",
        address: "Motorpoint Arena Nottingham, Bolero Sq, Nottingham, England NG1 1LA, United Kingdom",
        items: [
          {
            id: "car",
            title: "By Car",
            text: "The Motorpoint Arena Nottingham is less than 30 minutes from the A52 and located in the heart of Nottingham city centre, making it easily accessible by car. Brown tourist signs are visible on all.",
            link: link("", ""),
          },
          {
            id: "tram",
            title: "By Train / Tram",
            text: "The nearest tram stop to the Arena is the Lace Market stop on Fletcher Gate, which is just a 5 minute walk from the venue – making it a convenient and green way to get to the city centre!",
            link: link("", ""),
          },
          {
            id: "park-ride",
            title: "Park & Ride",
            text: "Trams run at least every 7 minutes until midnight. In addition, there are seven Park & Ride sites with 5000+ spaces, conveniently located close to major roads on the outskirts of the city: Clifton just off the A453, Toton Lane just off junction 25 of the M1, Phoenix Park just off the M1 Junction 26.",
            link: link("Park & Ride information", "https://click2go.me/.2zioc"),
          },
        ],
        buttonLabel: "Get Directions",
      },
    },
  ],
} satisfies SeedPage;
