export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SubjectType =
  | "Matematik"
  | "Türkçe"
  | "Fen Bilgisi"
  | "Sosyal Bilgiler"
  | "İngilizce";

export type SubmissionStatus = "pending" | "processing" | "completed" | "failed";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      children: {
        Row: {
          id: string;
          parent_id: string;
          name: string;
          grade: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          name: string;
          grade: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          grade?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "children_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      homework_submissions: {
        Row: {
          id: string;
          child_id: string;
          parent_id: string;
          subject: SubjectType;
          grade_at_time: number;
          image_path: string;
          image_url: string;
          status: SubmissionStatus;
          submitted_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          child_id: string;
          parent_id: string;
          subject: SubjectType;
          grade_at_time: number;
          image_path: string;
          image_url: string;
          status?: SubmissionStatus;
          submitted_at?: string;
          completed_at?: string | null;
        };
        Update: {
          status?: SubmissionStatus;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "homework_submissions_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "homework_submissions_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      analyses: {
        Row: {
          id: string;
          submission_id: string;
          child_id: string;
          detected_topic: string | null;
          total_questions: number | null;
          correct_count: number | null;
          incorrect_count: number | null;
          unanswered_count: number | null;
          score_percentage: number | null;
          strong_topics: string[] | null;
          weak_topics: string[] | null;
          questions_detail: Json | null;
          solutions: Json | null;
          raw_claude_response: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          child_id: string;
          detected_topic?: string | null;
          total_questions?: number | null;
          correct_count?: number | null;
          incorrect_count?: number | null;
          unanswered_count?: number | null;
          score_percentage?: number | null;
          strong_topics?: string[] | null;
          weak_topics?: string[] | null;
          questions_detail?: Json | null;
          solutions?: Json | null;
          raw_claude_response?: string | null;
          created_at?: string;
        };
        Update: {
          detected_topic?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "analyses_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: true;
            referencedRelation: "homework_submissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analyses_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          }
        ];
      };
      topic_performance: {
        Row: {
          id: string;
          child_id: string;
          subject: string;
          topic: string;
          attempts: number;
          correct: number;
          incorrect: number;
          last_seen: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          subject: string;
          topic: string;
          attempts?: number;
          correct?: number;
          incorrect?: number;
          last_seen?: string;
        };
        Update: {
          attempts?: number;
          correct?: number;
          incorrect?: number;
          last_seen?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topic_performance_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      upsert_topic_performance: {
        Args: { rows: Json };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Child = Database["public"]["Tables"]["children"]["Row"];
export type HomeworkSubmission = Database["public"]["Tables"]["homework_submissions"]["Row"];
export type Analysis = Database["public"]["Tables"]["analyses"]["Row"];
export type TopicPerformance = Database["public"]["Tables"]["topic_performance"]["Row"];
