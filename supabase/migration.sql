-- ============================================================
-- ÖdevAI — Supabase Migration
-- Supabase SQL Editor'a kopyalayıp çalıştırın
-- ============================================================

-- 1. PROFILES (auth.users'a bağlı)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  full_name   text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Otomatik profil oluşturma trigger'ı
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. CHILDREN
CREATE TABLE IF NOT EXISTS public.children (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        text NOT NULL,
  grade       smallint NOT NULL CHECK (grade BETWEEN 1 AND 8),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children(parent_id);

-- 3. HOMEWORK_SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.homework_submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id        uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id       uuid NOT NULL REFERENCES public.profiles(id),
  subject         text NOT NULL CHECK (subject IN ('Matematik','Türkçe','Fen Bilgisi','Sosyal Bilgiler','İngilizce')),
  grade_at_time   smallint NOT NULL,
  image_path      text NOT NULL,
  image_url       text NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','completed','failed')),
  submitted_at    timestamptz DEFAULT now(),
  completed_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_submissions_child_id ON public.homework_submissions(child_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_parent_id ON public.homework_submissions(parent_id);

-- 4. ANALYSES
CREATE TABLE IF NOT EXISTS public.analyses (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id         uuid UNIQUE NOT NULL REFERENCES public.homework_submissions(id) ON DELETE CASCADE,
  child_id              uuid NOT NULL REFERENCES public.children(id),
  detected_topic        text,
  total_questions       smallint,
  correct_count         smallint,
  incorrect_count       smallint,
  unanswered_count      smallint,
  score_percentage      numeric(5,2),
  strong_topics         text[],
  weak_topics           text[],
  questions_detail      jsonb,
  solutions             jsonb,
  raw_claude_response   text,
  created_at            timestamptz DEFAULT now()
);

-- 5. TOPIC_PERFORMANCE
CREATE TABLE IF NOT EXISTS public.topic_performance (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  subject     text NOT NULL,
  topic       text NOT NULL,
  attempts    integer DEFAULT 0,
  correct     integer DEFAULT 0,
  incorrect   integer DEFAULT 0,
  last_seen   timestamptz DEFAULT now(),
  UNIQUE (child_id, subject, topic)
);

CREATE INDEX IF NOT EXISTS idx_topic_perf_child_id ON public.topic_performance(child_id);

-- 6. UPSERT FUNCTION for topic_performance
CREATE OR REPLACE FUNCTION public.upsert_topic_performance(rows jsonb)
RETURNS void AS $$
DECLARE
  r jsonb;
BEGIN
  FOR r IN SELECT * FROM jsonb_array_elements(rows)
  LOOP
    INSERT INTO public.topic_performance
      (child_id, subject, topic, attempts, correct, incorrect, last_seen)
    VALUES (
      (r->>'child_id')::uuid,
      r->>'subject',
      r->>'topic',
      (r->>'attempts')::integer,
      (r->>'correct')::integer,
      (r->>'incorrect')::integer,
      (r->>'last_seen')::timestamptz
    )
    ON CONFLICT (child_id, subject, topic)
    DO UPDATE SET
      attempts  = topic_performance.attempts  + EXCLUDED.attempts,
      correct   = topic_performance.correct   + EXCLUDED.correct,
      incorrect = topic_performance.incorrect + EXCLUDED.incorrect,
      last_seen = EXCLUDED.last_seen;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_performance ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Kendi profilini görüntüleyebilir" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Kendi profilini güncelleyebilir" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- CHILDREN
CREATE POLICY "Kendi çocuklarını görüntüleyebilir" ON public.children
  FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "Çocuk ekleyebilir" ON public.children
  FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Kendi çocuğunu güncelleyebilir" ON public.children
  FOR UPDATE USING (auth.uid() = parent_id);
CREATE POLICY "Kendi çocuğunu silebilir" ON public.children
  FOR DELETE USING (auth.uid() = parent_id);

-- HOMEWORK_SUBMISSIONS
CREATE POLICY "Kendi ödevlerini görüntüleyebilir" ON public.homework_submissions
  FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "Ödev ekleyebilir" ON public.homework_submissions
  FOR INSERT WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Kendi ödevini güncelleyebilir" ON public.homework_submissions
  FOR UPDATE USING (auth.uid() = parent_id);

-- ANALYSES (servis rolü yazar, veliler sadece okur)
CREATE POLICY "Çocuğunun analizini görüntüleyebilir" ON public.analyses
  FOR SELECT USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = auth.uid()
    )
  );

-- TOPIC_PERFORMANCE
CREATE POLICY "Çocuğunun performansını görüntüleyebilir" ON public.topic_performance
  FOR SELECT USING (
    child_id IN (
      SELECT id FROM public.children WHERE parent_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE BUCKET
-- Supabase Dashboard > Storage > New Bucket
-- Name: homework-images
-- Public: HAYIR (private)
-- ============================================================
