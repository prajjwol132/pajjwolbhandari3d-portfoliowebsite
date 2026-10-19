import type { ProjectWithCategory } from "@/types/database";

export function isVideoProject(project: Pick<ProjectWithCategory, "category" | "video_url">) {
  return Boolean(project.video_url) || /video|motion|film/i.test(project.category?.name ?? "");
}
