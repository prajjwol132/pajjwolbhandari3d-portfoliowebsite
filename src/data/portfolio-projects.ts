import type { Category, ProjectWithCategory } from "@/types/database";
import selectedVideos from "./video-projects.json" with { type: "json" };

// Selected local videos and existing web work. Publication dates were not supplied.
export const fallbackCategories: Category[] = [
  { id: "cat-video-projects", name: "Video Editing", slug: "video-projects", description: "Editing, motion graphics, and social-first storytelling.", display_order: 1, created_at: "", updated_at: "" },
  { id: "cat-web-apps", name: "Web Apps", slug: "web-apps", description: "React projects built alongside my IT studies.", display_order: 2, created_at: "", updated_at: "" },
];

type Work = Pick<ProjectWithCategory, "title" | "slug" | "short_description" | "full_description" | "featured_image_url" | "live_demo_url" | "technical_breakdown"> & { kind: "video" | "web" };

const work: Work[] = [
  {
    kind: "web", title: "Expense Tracker", slug: "expense-tracker",
    short_description: "A React app for tracking spending and organizing expenses by category.",
    full_description: "## The project\nAn expense-tracking application built with React and Tailwind CSS.\n\n## Focus\nClear expense categorization and a practical interface for everyday use.",
    featured_image_url: "/media/work/expense-tracker.webp",
    live_demo_url: "https://daily-expenses-trackerr.netlify.app/",
    technical_breakdown: { Framework: "React", Styling: "Tailwind CSS", Focus: "Expense categorization" },
  },
  {
    kind: "web", title: "E-Commerce Store", slug: "e-commerce-store",
    short_description: "A React storefront with product browsing, a shopping cart, and checkout.",
    full_description: "## The project\nA storefront built with React and Tailwind CSS.\n\n## Focus\nConnecting product discovery, cart interactions, and the checkout experience.",
    featured_image_url: "/media/work/e-commerce-store.webp",
    live_demo_url: "https://bhandariecommerceshopandservice.netlify.app/",
    technical_breakdown: { Framework: "React", Styling: "Tailwind CSS", Focus: "Shopping experience" },
  },
  {
    kind: "web", title: "Hotel Booking", slug: "hotel-booking",
    short_description: "A React project exploring hotel search and a straightforward booking flow.",
    full_description: "## The project\nA hotel-booking interface built with React and Tailwind CSS.\n\n## Focus\nHelping visitors search for a stay and move through the booking flow.",
    featured_image_url: "/media/work/hotel-booking.webp",
    live_demo_url: "https://react-js-proffessional-class-projec.vercel.app/",
    technical_breakdown: { Framework: "React", Styling: "Tailwind CSS", Focus: "Search and booking" },
  },
];

export const selectedVideoProjects: ProjectWithCategory[] = selectedVideos.map((entry, index): ProjectWithCategory => ({
  id: `selected-${entry.slug}`, slug: entry.slug, title: entry.title,
  category_id: fallbackCategories[0].id, category: fallbackCategories[0],
  short_description: entry.description,
  full_description: `## The edit\n${entry.description}\n\n## Creative focus\n${entry.discipline}.`,
  tech_stack: [entry.discipline], featured_image_url: entry.poster_url, video_url: entry.video_url,
  gallery_images: [], github_url: null, live_demo_url: null,
  is_featured: entry.featured, status: "published", display_order: index + 1,
  technical_breakdown: {
    Focus: entry.discipline,
    Duration: `${Math.floor(Math.round(entry.duration) / 60)}:${String(Math.round(entry.duration) % 60).padStart(2, "0")}`,
    Format: entry.height > entry.width ? "Vertical" : "Widescreen",
    Resolution: `${entry.width} x ${entry.height}`,
  },
  media: { preview_url: entry.preview_url, width: entry.width, height: entry.height, duration: entry.duration },
  created_at: "", updated_at: "",
}));

export const fallbackProjects: ProjectWithCategory[] = [...selectedVideoProjects, ...work.map(({ kind, ...entry }, index): ProjectWithCategory => {
  const category = fallbackCategories[kind === "video" ? 0 : 1];
  return {
    ...entry, id: `public-${entry.slug}`, category_id: category.id, category,
    tech_stack: kind === "video" ? ["Premiere Pro", "DaVinci Resolve"] : ["React", "Tailwind CSS"],
    video_url: null, github_url: null, gallery_images: [],
    is_featured: kind === "video", status: "published", display_order: selectedVideoProjects.length + index + 1,
    created_at: "", updated_at: "",
  };
})];
