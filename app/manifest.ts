import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pucklytics",
    short_name: "Pucklytics",
    description:
      "Adult league hockey stats, highlights, film, draft room, and team communication.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#07111f",
    theme_color: "#07111f",
    icons: [
      {
        src: "/pucklytics-logo.png",
        sizes: "768x768",
        type: "image/png",
      },
    ],
  };
}
