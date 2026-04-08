import { useEffect } from "react";

const metaDefinitions = [
  {
    selector: 'meta[name="description"]',
    attributes: {
      name: "description",
      content:
        "Hope Shelter provides safety, healing, and support for at-risk girls in the Dominican Republic. Get help, donate, or learn about our mission.",
    },
  },
  {
    selector: 'meta[name="author"]',
    attributes: {
      name: "author",
      content: "Hope Shelter",
    },
  },
  {
    selector: 'meta[property="og:title"]',
    attributes: {
      property: "og:title",
      content: "Hope Shelter - Safety & Hope for At-Risk Girls",
    },
  },
  {
    selector: 'meta[property="og:description"]',
    attributes: {
      property: "og:description",
      content:
        "Providing safety, healing, and brighter futures for at-risk girls in the Dominican Republic.",
    },
  },
  {
    selector: 'meta[property="og:type"]',
    attributes: {
      property: "og:type",
      content: "website",
    },
  },
  {
    selector: 'meta[property="og:image"]',
    attributes: {
      property: "og:image",
      content: "https://lovable.dev/opengraph-image-p98pqg.png",
    },
  },
  {
    selector: 'meta[name="twitter:card"]',
    attributes: {
      name: "twitter:card",
      content: "summary_large_image",
    },
  },
  {
    selector: 'meta[name="twitter:site"]',
    attributes: {
      name: "twitter:site",
      content: "@Lovable",
    },
  },
  {
    selector: 'meta[name="twitter:image"]',
    attributes: {
      name: "twitter:image",
      content: "https://lovable.dev/opengraph-image-p98pqg.png",
    },
  },
];

const upsertMetaTag = (selector: string, attributes: Record<string, string>) => {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);

  if (!tag) {
    tag = document.createElement("meta");
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    tag?.setAttribute(key, value);
  });
};

const LandingPage = () => {
  useEffect(() => {
    document.title = "Hope Shelter - Safety & Hope for At-Risk Girls in the DR";
    metaDefinitions.forEach(({ selector, attributes }) =>
      upsertMetaTag(selector, attributes),
    );
  }, []);

  return null;
};

export default LandingPage;
