import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pucklytics",
    short_name: "Pucklytics",
    description:
      "Adult league hockey stats, highlights, film, draft room, and team communication.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#07111f",
    theme_color: "#07111f",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
