import type { Profile } from "@/types/database";

export const defaultProfile: Profile = {
  id: "local-profile",
  full_name: "Prajjwol Bhandari",
  headline: "Video editor & motion designer",
  title: "AI video creator & web developer",
  tagline: "A strong idea. A clear story. Every frame with a purpose.",
  bio: "I'm a creative IT student focused on video editing and motion graphics. I also create AI-generated video ads for clients and build websites, turning ideas into stories and experiences.",
  location: "Kathmandu, Nepal",
  email: "bhandariprajjwol094@gmail.com",
  github_url: "https://github.com/prajjwol132",
  linkedin_url: "https://www.linkedin.com/in/prajjwol-bhandari-a0464b372",
  website_url: "https://prajjwol-bhandari-portfolio-website.vercel.app/",
  resume_url: "/resume",
  avatar_url: "/media/brand/prajjwol-main.webp",
  social_links: [
    { label: "TikTok", url: "https://www.tiktok.com/@bhandari1007" },
    { label: "YouTube", url: "https://www.youtube.com/@Prajjwolbhandari" },
    { label: "Instagram", url: "https://www.instagram.com/prajjwol_bhandari_/" },
  ],
  metrics: [
    { label: "Age", value: "21", detail: "Years old" },
    { label: "Semester", value: "4th", detail: "IT student" },
  ],
  created_at: "",
  updated_at: "",
};
