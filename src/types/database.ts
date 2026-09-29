export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProjectStatus = "draft" | "published" | "archived";

export interface SocialLink {
  label: string;
  url: string;
  icon?: "github" | "linkedin" | "mail" | "website" | "x";
}

export interface TelemetryMetric {
  label: string;
  value: string;
  detail?: string;
}

export interface Profile {
  [key: string]: unknown;
  id: string;
  full_name: string;
  headline: string;
  title: string | null;
  tagline: string | null;
  bio: string;
  location: string | null;
  email: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  resume_url: string | null;
  avatar_url: string | null;
  social_links: SocialLink[];
  metrics: TelemetryMetric[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  [key: string]: unknown;
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  [key: string]: unknown;
  id: string;
  category_id: string | null;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  tech_stack: string[];
  featured_image_url: string | null;
  video_url: string | null;
  gallery_images: string[];
  github_url: string | null;
  live_demo_url: string | null;
  technical_breakdown: Record<string, string> | null;
  is_featured: boolean;
  status: ProjectStatus;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type ProjectWithCategory = Project & {
  category: Category | null;
};

export type ProfileInsert = Omit<Profile, "created_at" | "updated_at"> &
  Partial<Pick<Profile, "created_at" | "updated_at">>;

export type ProfileUpdate = Partial<ProfileInsert>;

export type CategoryInsert = Omit<Category, "id" | "created_at" | "updated_at"> &
  Partial<Pick<Category, "id" | "created_at" | "updated_at">>;

export type CategoryUpdate = Partial<CategoryInsert>;

export type ProjectInsert = Omit<Project, "id" | "created_at" | "updated_at"> &
  Partial<Pick<Project, "id" | "created_at" | "updated_at">>;

export type ProjectUpdate = Partial<ProjectInsert>;

export type ProjectCategory = Category;
export type ProjectCategoryInsert = CategoryInsert;
export type ProjectCategoryUpdate = CategoryUpdate;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
        Relationships: [];
      };
      project_categories: {
        Row: Category;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
        Relationships: [];
      };
      projects: {
        Row: Project;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
        Relationships: [
          {
            foreignKeyName: "projects_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      project_status: ProjectStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
