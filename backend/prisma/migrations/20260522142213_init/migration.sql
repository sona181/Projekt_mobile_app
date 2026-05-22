-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "is_verified" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "avatar_url" VARCHAR(500),
    "bio" TEXT,
    "country" VARCHAR(100),
    "timezone" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "email_notifications" BOOLEAN NOT NULL,
    "language" VARCHAR(10) NOT NULL,
    "dark_mode" BOOLEAN NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "bio" TEXT,
    "specialties" VARCHAR(255),
    "languages" VARCHAR(255),
    "hourly_rate" DECIMAL(10,2),
    "rating" DECIMAL(3,2),
    "is_verified" BOOLEAN NOT NULL,
    "is_available" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "instructor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "parent_id" UUID,

    CONSTRAINT "course_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "category_id" UUID,
    "author_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "slug" VARCHAR(300) NOT NULL,
    "level" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "is_premium" BOOLEAN NOT NULL,
    "price" DECIMAL(10,2),
    "thumbnail_url" VARCHAR(500),
    "language" VARCHAR(10) NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_landing_pages" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "headline" VARCHAR(255),
    "subheadline" TEXT,
    "objectives" JSONB,
    "target_audience" JSONB,
    "faq" JSONB,
    "seo_title" VARCHAR(255),
    "seo_desc" TEXT,
    "generated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "course_landing_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_reviews" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "course_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_authors" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "author_role" VARCHAR(20) NOT NULL,
    "added_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "course_authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL,
    "chapter_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "lesson_type" VARCHAR(50) NOT NULL,
    "order_index" INTEGER NOT NULL,
    "duration_seconds" INTEGER,
    "is_free_preview" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_contents" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "content_type" VARCHAR(50) NOT NULL,
    "body" TEXT,
    "media_url" VARCHAR(1000),
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lesson_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_exercises" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "instructions" TEXT,
    "language" VARCHAR(50) NOT NULL,
    "starter_code" TEXT,
    "solution_code" TEXT,
    "expected_output" TEXT,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "course_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_assets" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "lesson_id" UUID,
    "asset_type" VARCHAR(50) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(1000) NOT NULL,
    "file_size" INTEGER,
    "mime_type" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "course_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "enrolled_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "is_completed" BOOLEAN NOT NULL,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_progress" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "total_lessons" INTEGER NOT NULL,
    "completed_lessons" INTEGER NOT NULL,
    "progress_percent" DECIMAL(5,2) NOT NULL,
    "last_accessed_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "course_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID,
    "path_id" UUID,
    "certificate_number" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" UUID NOT NULL,
    "chapter_id" UUID,
    "path_unit_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "pass_score" INTEGER NOT NULL,
    "time_limit_seconds" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "question_type" VARCHAR(50) NOT NULL,
    "order_index" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_options" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "answer_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "max_score" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "time_taken_seconds" INTEGER,
    "attempted_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempt_answers" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "selected_option_id" UUID,
    "is_correct" BOOLEAN NOT NULL,

    CONSTRAINT "quiz_attempt_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "level" VARCHAR(20) NOT NULL,
    "language" VARCHAR(10) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "estimated_days" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "path_units" (
    "id" UUID NOT NULL,
    "path_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "path_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "path_lessons" (
    "id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "order_index" INTEGER NOT NULL,
    "xp_reward" INTEGER NOT NULL,
    "learning_objective_ids" JSONB,
    "source_card_ids" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "path_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "path_activities" (
    "id" UUID NOT NULL,
    "path_lesson_id" UUID NOT NULL,
    "activity_type" VARCHAR(50) NOT NULL,
    "prompt" TEXT NOT NULL,
    "correct_answer" TEXT,
    "options" JSONB,
    "order_index" INTEGER NOT NULL,
    "xp_reward" INTEGER NOT NULL,
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'pending_review',
    "quality_score" INTEGER,
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewed_by" VARCHAR(255),
    "review_notes" TEXT,
    "generation_count" INTEGER NOT NULL DEFAULT 1,
    "generation_run_id" UUID,
    "learning_objective_ids" JSONB,
    "source_card_ids" JSONB,

    CONSTRAINT "path_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_responses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "question_key" VARCHAR(100) NOT NULL,
    "answer_value" VARCHAR(255) NOT NULL,
    "responded_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "onboarding_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "path_id" UUID NOT NULL,
    "score" INTEGER,
    "assigned_level" VARCHAR(20),
    "attempted_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "placement_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_answers" (
    "id" UUID NOT NULL,
    "placement_attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "selected_option_id" UUID,
    "is_correct" BOOLEAN NOT NULL,

    CONSTRAINT "placement_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_path_enrollments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "path_id" UUID NOT NULL,
    "level" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "enrolled_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_path_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_path_progress" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "path_lesson_id" UUID NOT NULL,
    "is_completed" BOOLEAN NOT NULL,
    "xp_earned" INTEGER NOT NULL,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_path_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_queue_items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "path_activity_id" UUID NOT NULL,
    "interval_days" INTEGER NOT NULL,
    "repetition_count" INTEGER NOT NULL,
    "ease_factor" DECIMAL(4,2) NOT NULL,
    "next_review_date" DATE NOT NULL,
    "last_reviewed_date" DATE,

    CONSTRAINT "review_queue_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_plans" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "plan_date" DATE NOT NULL,
    "is_completed" BOOLEAN NOT NULL,
    "generated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "daily_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_plan_items" (
    "id" UUID NOT NULL,
    "daily_plan_id" UUID NOT NULL,
    "path_activity_id" UUID,
    "review_item_id" UUID,
    "item_type" VARCHAR(50) NOT NULL,
    "is_completed" BOOLEAN NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "daily_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_energy" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "current_energy" INTEGER NOT NULL,
    "max_energy" INTEGER NOT NULL,
    "last_refill_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_energy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "energy_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_streaks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "current_streak" INTEGER NOT NULL,
    "longest_streak" INTEGER NOT NULL,
    "last_activity_date" DATE NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xp_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "xp_amount" INTEGER NOT NULL,
    "source_type" VARCHAR(50) NOT NULL,
    "source_id" UUID,
    "description" TEXT,
    "earned_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "xp_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_cards" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(300) NOT NULL,
    "card_type" VARCHAR(50) NOT NULL DEFAULT 'topic',
    "track" VARCHAR(50) NOT NULL,
    "topic" VARCHAR(120) NOT NULL,
    "level" VARCHAR(30) NOT NULL,
    "source_name" VARCHAR(255) NOT NULL,
    "source_url" VARCHAR(1000) NOT NULL,
    "source_type" VARCHAR(80) NOT NULL,
    "credibility_tier" VARCHAR(100) NOT NULL,
    "license_note" TEXT,
    "safe_use" TEXT,
    "prohibited_use" TEXT,
    "sources" JSONB,
    "jls_sections" JSONB,
    "module_sequence" JSONB,
    "teach_after" JSONB,
    "pedagogy_rules" JSONB,
    "test_rules" JSONB,
    "generation_rules" JSONB,
    "concepts" JSONB NOT NULL,
    "learning_goals" JSONB NOT NULL,
    "exercise_types" JSONB NOT NULL,
    "common_mistakes" JSONB,
    "teach_later" JSONB,
    "test_requirements" JSONB,
    "reference_json" JSONB NOT NULL,
    "body" TEXT,
    "review_status" VARCHAR(30) NOT NULL DEFAULT 'pending_review',
    "reviewed_by" VARCHAR(255),
    "reviewed_at" TIMESTAMPTZ(6),
    "approved_by" VARCHAR(255),
    "approved_at" TIMESTAMPTZ(6),
    "review_notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "source_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_runs" (
    "id" UUID NOT NULL,
    "run_type" VARCHAR(50) NOT NULL,
    "track" VARCHAR(50) NOT NULL,
    "topic" VARCHAR(120),
    "model" VARCHAR(100) NOT NULL,
    "prompt_version" VARCHAR(50),
    "input_json" JSONB,
    "output_json" JSONB,
    "source_card_ids" JSONB,
    "status" VARCHAR(30) NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_objectives" (
    "id" UUID NOT NULL,
    "track" VARCHAR(50) NOT NULL,
    "topic" VARCHAR(120) NOT NULL,
    "level" VARCHAR(30) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "prerequisite_objective_ids" JSONB,
    "source_card_ids" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "learning_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "path_lesson_source_cards" (
    "id" UUID NOT NULL,
    "path_lesson_id" UUID NOT NULL,
    "source_card_id" UUID NOT NULL,
    "purpose" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "path_lesson_source_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "path_activity_source_cards" (
    "id" UUID NOT NULL,
    "path_activity_id" UUID NOT NULL,
    "source_card_id" UUID NOT NULL,
    "purpose" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "path_activity_source_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_objective_source_cards" (
    "id" UUID NOT NULL,
    "learning_objective_id" UUID NOT NULL,
    "source_card_id" UUID NOT NULL,
    "purpose" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_objective_source_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_validations" (
    "id" UUID NOT NULL,
    "path_activity_id" UUID NOT NULL,
    "generation_run_id" UUID,
    "validation_type" VARCHAR(80) NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "summary" TEXT,
    "input_json" JSONB,
    "output_json" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_validations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "icon_url" VARCHAR(500),
    "criteria_type" VARCHAR(50) NOT NULL,
    "criteria_value" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "badge_id" UUID NOT NULL,
    "earned_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "icon_url" VARCHAR(500),
    "criteria_type" VARCHAR(50) NOT NULL,
    "criteria_value" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "current_value" INTEGER NOT NULL,
    "is_completed" BOOLEAN NOT NULL,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_slots" (
    "id" UUID NOT NULL,
    "instructor_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "is_booked" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_bookings" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "instructor_id" UUID NOT NULL,
    "slot_id" UUID NOT NULL,
    "topic" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL,
    "amount_paid" DECIMAL(10,2),
    "booked_at" TIMESTAMPTZ(6) NOT NULL,
    "cancelled_at" TIMESTAMPTZ(6),

    CONSTRAINT "session_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_sessions" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "external_meeting_id" VARCHAR(255),
    "join_url" VARCHAR(500),
    "provider" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL,
    "duration_minutes" INTEGER,
    "started_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_notes" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_shared_with_student" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "session_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_plans" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "price_monthly" DECIMAL(10,2) NOT NULL,
    "price_yearly" DECIMAL(10,2),
    "has_premium_courses" BOOLEAN NOT NULL,
    "has_live_sessions" BOOLEAN NOT NULL,
    "has_academy" BOOLEAN NOT NULL,
    "max_live_sessions_per_month" INTEGER,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pricing_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "billing_cycle" VARCHAR(10) NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "cancelled_at" TIMESTAMPTZ(6),
    "payment_provider" VARCHAR(50),
    "provider_customer_id" VARCHAR(255),
    "provider_subscription_id" VARCHAR(255),
    "subscription_status" VARCHAR(24),
    "subscription_current_period_end" TIMESTAMPTZ(6),

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subscription_id" UUID,
    "course_id" UUID,
    "booking_id" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "provider" VARCHAR(50),
    "provider_reference" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_profiles_user_id_key" ON "instructor_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_categories_name_key" ON "course_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "course_categories_slug_key" ON "course_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_category_id_idx" ON "courses"("category_id");

-- CreateIndex
CREATE INDEX "courses_author_id_idx" ON "courses"("author_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_landing_pages_course_id_key" ON "course_landing_pages"("course_id");

-- CreateIndex
CREATE INDEX "course_reviews_course_id_idx" ON "course_reviews"("course_id");

-- CreateIndex
CREATE INDEX "course_reviews_user_id_idx" ON "course_reviews"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_reviews_course_id_user_id_key" ON "course_reviews"("course_id", "user_id");

-- CreateIndex
CREATE INDEX "course_authors_course_id_idx" ON "course_authors"("course_id");

-- CreateIndex
CREATE INDEX "course_authors_user_id_idx" ON "course_authors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_authors_course_id_user_id_key" ON "course_authors"("course_id", "user_id");

-- CreateIndex
CREATE INDEX "chapters_course_id_idx" ON "chapters"("course_id");

-- CreateIndex
CREATE INDEX "lessons_chapter_id_idx" ON "lessons"("chapter_id");

-- CreateIndex
CREATE INDEX "lesson_contents_lesson_id_idx" ON "lesson_contents"("lesson_id");

-- CreateIndex
CREATE INDEX "course_exercises_lesson_id_idx" ON "course_exercises"("lesson_id");

-- CreateIndex
CREATE INDEX "course_assets_course_id_idx" ON "course_assets"("course_id");

-- CreateIndex
CREATE INDEX "course_assets_lesson_id_idx" ON "course_assets"("lesson_id");

-- CreateIndex
CREATE INDEX "enrollments_user_id_idx" ON "enrollments"("user_id");

-- CreateIndex
CREATE INDEX "enrollments_course_id_idx" ON "enrollments"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_user_id_course_id_key" ON "enrollments"("user_id", "course_id");

-- CreateIndex
CREATE INDEX "lesson_progress_enrollment_id_idx" ON "lesson_progress"("enrollment_id");

-- CreateIndex
CREATE INDEX "lesson_progress_lesson_id_idx" ON "lesson_progress"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_enrollment_id_lesson_id_key" ON "lesson_progress"("enrollment_id", "lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_progress_enrollment_id_key" ON "course_progress"("enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificate_number_key" ON "certificates"("certificate_number");

-- CreateIndex
CREATE INDEX "certificates_user_id_idx" ON "certificates"("user_id");

-- CreateIndex
CREATE INDEX "quizzes_chapter_id_idx" ON "quizzes"("chapter_id");

-- CreateIndex
CREATE INDEX "quizzes_path_unit_id_idx" ON "quizzes"("path_unit_id");

-- CreateIndex
CREATE INDEX "questions_quiz_id_idx" ON "questions"("quiz_id");

-- CreateIndex
CREATE INDEX "answer_options_question_id_idx" ON "answer_options"("question_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_user_id_idx" ON "quiz_attempts"("user_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_quiz_id_idx" ON "quiz_attempts"("quiz_id");

-- CreateIndex
CREATE INDEX "quiz_attempt_answers_attempt_id_idx" ON "quiz_attempt_answers"("attempt_id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_paths_slug_key" ON "learning_paths"("slug");

-- CreateIndex
CREATE INDEX "path_units_path_id_idx" ON "path_units"("path_id");

-- CreateIndex
CREATE INDEX "path_lessons_unit_id_idx" ON "path_lessons"("unit_id");

-- CreateIndex
CREATE INDEX "path_activities_path_lesson_id_idx" ON "path_activities"("path_lesson_id");

-- CreateIndex
CREATE INDEX "path_activities_review_status_idx" ON "path_activities"("review_status");

-- CreateIndex
CREATE INDEX "path_activities_generation_run_id_idx" ON "path_activities"("generation_run_id");

-- CreateIndex
CREATE UNIQUE INDEX "path_activities_path_lesson_id_order_index_key" ON "path_activities"("path_lesson_id", "order_index");

-- CreateIndex
CREATE INDEX "onboarding_responses_user_id_idx" ON "onboarding_responses"("user_id");

-- CreateIndex
CREATE INDEX "placement_attempts_user_id_idx" ON "placement_attempts"("user_id");

-- CreateIndex
CREATE INDEX "placement_attempts_path_id_idx" ON "placement_attempts"("path_id");

-- CreateIndex
CREATE INDEX "placement_answers_placement_attempt_id_idx" ON "placement_answers"("placement_attempt_id");

-- CreateIndex
CREATE INDEX "user_path_enrollments_user_id_idx" ON "user_path_enrollments"("user_id");

-- CreateIndex
CREATE INDEX "user_path_enrollments_path_id_idx" ON "user_path_enrollments"("path_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_path_enrollments_user_id_path_id_key" ON "user_path_enrollments"("user_id", "path_id");

-- CreateIndex
CREATE INDEX "user_path_progress_enrollment_id_idx" ON "user_path_progress"("enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_path_progress_enrollment_id_path_lesson_id_key" ON "user_path_progress"("enrollment_id", "path_lesson_id");

-- CreateIndex
CREATE INDEX "review_queue_items_user_id_idx" ON "review_queue_items"("user_id");

-- CreateIndex
CREATE INDEX "review_queue_items_next_review_date_idx" ON "review_queue_items"("next_review_date");

-- CreateIndex
CREATE INDEX "daily_plans_user_id_idx" ON "daily_plans"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_plans_user_id_plan_date_key" ON "daily_plans"("user_id", "plan_date");

-- CreateIndex
CREATE INDEX "daily_plan_items_daily_plan_id_idx" ON "daily_plan_items"("daily_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_energy_user_id_key" ON "user_energy"("user_id");

-- CreateIndex
CREATE INDEX "energy_transactions_user_id_idx" ON "energy_transactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_streaks_user_id_key" ON "user_streaks"("user_id");

-- CreateIndex
CREATE INDEX "xp_logs_user_id_idx" ON "xp_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "source_cards_slug_key" ON "source_cards"("slug");

-- CreateIndex
CREATE INDEX "source_cards_track_idx" ON "source_cards"("track");

-- CreateIndex
CREATE INDEX "source_cards_topic_idx" ON "source_cards"("topic");

-- CreateIndex
CREATE INDEX "source_cards_level_idx" ON "source_cards"("level");

-- CreateIndex
CREATE INDEX "source_cards_review_status_idx" ON "source_cards"("review_status");

-- CreateIndex
CREATE INDEX "source_cards_is_active_idx" ON "source_cards"("is_active");

-- CreateIndex
CREATE INDEX "source_cards_track_topic_idx" ON "source_cards"("track", "topic");

-- CreateIndex
CREATE INDEX "generation_runs_run_type_idx" ON "generation_runs"("run_type");

-- CreateIndex
CREATE INDEX "generation_runs_track_idx" ON "generation_runs"("track");

-- CreateIndex
CREATE INDEX "generation_runs_status_idx" ON "generation_runs"("status");

-- CreateIndex
CREATE INDEX "learning_objectives_track_idx" ON "learning_objectives"("track");

-- CreateIndex
CREATE INDEX "learning_objectives_topic_idx" ON "learning_objectives"("topic");

-- CreateIndex
CREATE INDEX "learning_objectives_level_idx" ON "learning_objectives"("level");

-- CreateIndex
CREATE INDEX "path_lesson_source_cards_path_lesson_id_idx" ON "path_lesson_source_cards"("path_lesson_id");

-- CreateIndex
CREATE INDEX "path_lesson_source_cards_source_card_id_idx" ON "path_lesson_source_cards"("source_card_id");

-- CreateIndex
CREATE UNIQUE INDEX "path_lesson_source_cards_path_lesson_id_source_card_id_key" ON "path_lesson_source_cards"("path_lesson_id", "source_card_id");

-- CreateIndex
CREATE INDEX "path_activity_source_cards_path_activity_id_idx" ON "path_activity_source_cards"("path_activity_id");

-- CreateIndex
CREATE INDEX "path_activity_source_cards_source_card_id_idx" ON "path_activity_source_cards"("source_card_id");

-- CreateIndex
CREATE UNIQUE INDEX "path_activity_source_cards_path_activity_id_source_card_id_key" ON "path_activity_source_cards"("path_activity_id", "source_card_id");

-- CreateIndex
CREATE INDEX "learning_objective_source_cards_learning_objective_id_idx" ON "learning_objective_source_cards"("learning_objective_id");

-- CreateIndex
CREATE INDEX "learning_objective_source_cards_source_card_id_idx" ON "learning_objective_source_cards"("source_card_id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_objective_source_cards_learning_objective_id_sourc_key" ON "learning_objective_source_cards"("learning_objective_id", "source_card_id");

-- CreateIndex
CREATE INDEX "activity_validations_path_activity_id_idx" ON "activity_validations"("path_activity_id");

-- CreateIndex
CREATE INDEX "activity_validations_generation_run_id_idx" ON "activity_validations"("generation_run_id");

-- CreateIndex
CREATE INDEX "activity_validations_validation_type_idx" ON "activity_validations"("validation_type");

-- CreateIndex
CREATE INDEX "activity_validations_status_idx" ON "activity_validations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "badges_name_key" ON "badges"("name");

-- CreateIndex
CREATE UNIQUE INDEX "badges_slug_key" ON "badges"("slug");

-- CreateIndex
CREATE INDEX "user_badges_user_id_idx" ON "user_badges"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_name_key" ON "achievements"("name");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_slug_key" ON "achievements"("slug");

-- CreateIndex
CREATE INDEX "user_achievements_user_id_idx" ON "user_achievements"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");

-- CreateIndex
CREATE INDEX "availability_slots_instructor_id_idx" ON "availability_slots"("instructor_id");

-- CreateIndex
CREATE INDEX "availability_slots_starts_at_idx" ON "availability_slots"("starts_at");

-- CreateIndex
CREATE INDEX "session_bookings_student_id_idx" ON "session_bookings"("student_id");

-- CreateIndex
CREATE INDEX "session_bookings_instructor_id_idx" ON "session_bookings"("instructor_id");

-- CreateIndex
CREATE UNIQUE INDEX "live_sessions_booking_id_key" ON "live_sessions"("booking_id");

-- CreateIndex
CREATE INDEX "session_notes_session_id_idx" ON "session_notes"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_plans_name_key" ON "pricing_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_plans_slug_key" ON "pricing_plans"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_provider_subscription_id_key" ON "user_subscriptions"("provider_subscription_id");

-- CreateIndex
CREATE INDEX "user_subscriptions_user_id_idx" ON "user_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "user_subscriptions_status_idx" ON "user_subscriptions"("status");

-- CreateIndex
CREATE INDEX "user_subscriptions_payment_provider_idx" ON "user_subscriptions"("payment_provider");

-- CreateIndex
CREATE INDEX "user_subscriptions_subscription_status_idx" ON "user_subscriptions"("subscription_status");

-- CreateIndex
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_profiles" ADD CONSTRAINT "instructor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_categories" ADD CONSTRAINT "course_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "course_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "course_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_landing_pages" ADD CONSTRAINT "course_landing_pages_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_authors" ADD CONSTRAINT "course_authors_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_authors" ADD CONSTRAINT "course_authors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_contents" ADD CONSTRAINT "lesson_contents_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_exercises" ADD CONSTRAINT "course_exercises_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_assets" ADD CONSTRAINT "course_assets_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_assets" ADD CONSTRAINT "course_assets_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "learning_paths"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_path_unit_id_fkey" FOREIGN KEY ("path_unit_id") REFERENCES "path_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_options" ADD CONSTRAINT "answer_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "answer_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "path_units" ADD CONSTRAINT "path_units_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "learning_paths"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "path_lessons" ADD CONSTRAINT "path_lessons_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "path_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "path_activities" ADD CONSTRAINT "path_activities_generation_run_id_fkey" FOREIGN KEY ("generation_run_id") REFERENCES "generation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "path_activities" ADD CONSTRAINT "path_activities_path_lesson_id_fkey" FOREIGN KEY ("path_lesson_id") REFERENCES "path_lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_responses" ADD CONSTRAINT "onboarding_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_attempts" ADD CONSTRAINT "placement_attempts_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "learning_paths"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_attempts" ADD CONSTRAINT "placement_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_answers" ADD CONSTRAINT "placement_answers_placement_attempt_id_fkey" FOREIGN KEY ("placement_attempt_id") REFERENCES "placement_attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_answers" ADD CONSTRAINT "placement_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_answers" ADD CONSTRAINT "placement_answers_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "answer_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_path_enrollments" ADD CONSTRAINT "user_path_enrollments_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "learning_paths"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_path_enrollments" ADD CONSTRAINT "user_path_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_path_progress" ADD CONSTRAINT "user_path_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "user_path_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_path_progress" ADD CONSTRAINT "user_path_progress_path_lesson_id_fkey" FOREIGN KEY ("path_lesson_id") REFERENCES "path_lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_queue_items" ADD CONSTRAINT "review_queue_items_path_activity_id_fkey" FOREIGN KEY ("path_activity_id") REFERENCES "path_activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_queue_items" ADD CONSTRAINT "review_queue_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_plans" ADD CONSTRAINT "daily_plans_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "user_path_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_plans" ADD CONSTRAINT "daily_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_plan_items" ADD CONSTRAINT "daily_plan_items_daily_plan_id_fkey" FOREIGN KEY ("daily_plan_id") REFERENCES "daily_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_plan_items" ADD CONSTRAINT "daily_plan_items_path_activity_id_fkey" FOREIGN KEY ("path_activity_id") REFERENCES "path_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_plan_items" ADD CONSTRAINT "daily_plan_items_review_item_id_fkey" FOREIGN KEY ("review_item_id") REFERENCES "review_queue_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_energy" ADD CONSTRAINT "user_energy_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_transactions" ADD CONSTRAINT "energy_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_logs" ADD CONSTRAINT "xp_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "path_lesson_source_cards" ADD CONSTRAINT "path_lesson_source_cards_path_lesson_id_fkey" FOREIGN KEY ("path_lesson_id") REFERENCES "path_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "path_lesson_source_cards" ADD CONSTRAINT "path_lesson_source_cards_source_card_id_fkey" FOREIGN KEY ("source_card_id") REFERENCES "source_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "path_activity_source_cards" ADD CONSTRAINT "path_activity_source_cards_path_activity_id_fkey" FOREIGN KEY ("path_activity_id") REFERENCES "path_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "path_activity_source_cards" ADD CONSTRAINT "path_activity_source_cards_source_card_id_fkey" FOREIGN KEY ("source_card_id") REFERENCES "source_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_objective_source_cards" ADD CONSTRAINT "learning_objective_source_cards_learning_objective_id_fkey" FOREIGN KEY ("learning_objective_id") REFERENCES "learning_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_objective_source_cards" ADD CONSTRAINT "learning_objective_source_cards_source_card_id_fkey" FOREIGN KEY ("source_card_id") REFERENCES "source_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_validations" ADD CONSTRAINT "activity_validations_generation_run_id_fkey" FOREIGN KEY ("generation_run_id") REFERENCES "generation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_validations" ADD CONSTRAINT "activity_validations_path_activity_id_fkey" FOREIGN KEY ("path_activity_id") REFERENCES "path_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_bookings" ADD CONSTRAINT "session_bookings_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_bookings" ADD CONSTRAINT "session_bookings_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "availability_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_bookings" ADD CONSTRAINT "session_bookings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "session_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_notes" ADD CONSTRAINT "session_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_notes" ADD CONSTRAINT "session_notes_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "live_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "pricing_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "session_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "user_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
