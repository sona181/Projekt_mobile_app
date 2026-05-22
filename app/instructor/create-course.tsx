import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

// ─── Types ────────────────────────────────────────────────────────────────────
type Lesson = { id?: string; title: string; lessonType: string; isFreePreview: boolean };
type Chapter = { id?: string; title: string; lessons: Lesson[] };
type CourseState = {
  courseId: string | null;
  title: string;
  description: string;
  level: string;
  language: string;
  isPremium: boolean;
  price: string;
  chapters: Chapter[];
};

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const LANGUAGES = [{ value: 'sq', label: 'Shqip' }, { value: 'en', label: 'English' }, { value: 'it', label: 'Italiano' }];
const LESSON_TYPES = ['text', 'video', 'pdf', 'exercise', 'mixed'];
const STEPS = ['Basic Info', 'Structure', 'Publish'];

// ─── Small helpers ─────────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return <Text style={s.label}>{text}</Text>;
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.pill, active && s.pillActive]}
      activeOpacity={0.75}
    >
      <Text style={[s.pillText, active && s.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Step 1: Basic Info ───────────────────────────────────────────────────────
function Step1({
  state, update, onNext, instructorId,
}: {
  state: CourseState;
  update: (p: Partial<CourseState>) => void;
  onNext: () => void;
  instructorId: string;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setError('');
    if (!state.title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    try {
      if (state.courseId) {
        await fetch(`${BASE}/instructor/${instructorId}/courses/${state.courseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: state.title.trim(),
            description: state.description || undefined,
            level: state.level,
            language: state.language,
            isPremium: state.isPremium,
            price: state.isPremium && state.price ? Number(state.price) : undefined,
          }),
        });
      } else {
        const res = await fetch(`${BASE}/instructor/${instructorId}/courses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: state.title.trim(),
            description: state.description || undefined,
            level: state.level,
            language: state.language,
            isPremium: state.isPremium,
            price: state.isPremium && state.price ? Number(state.price) : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.message ?? 'Failed to create course.'); return; }
        update({ courseId: data.id });
      }
      onNext();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      <Text style={s.stepTitle}>Basic Information</Text>
      <Text style={s.stepSub}>Fill in the core details of your course.</Text>

      <View style={s.card}>
        <SectionLabel text="Course Title *" />
        <TextInput
          style={s.input}
          placeholder="e.g. Introduction to Python"
          value={state.title}
          onChangeText={(v) => update({ title: v })}
          placeholderTextColor="#9CA3AF"
        />

        <SectionLabel text="Description" />
        <TextInput
          style={[s.input, s.textarea]}
          placeholder="What will students learn..."
          value={state.description}
          onChangeText={(v) => update({ description: v })}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={s.card}>
        <SectionLabel text="Level" />
        <View style={s.pillRow}>
          {LEVELS.map((l) => (
            <Pill key={l} label={l.charAt(0).toUpperCase() + l.slice(1)} active={state.level === l} onPress={() => update({ level: l })} />
          ))}
        </View>

        <SectionLabel text="Language" />
        <View style={s.pillRow}>
          {LANGUAGES.map((l) => (
            <Pill key={l.value} label={l.label} active={state.language === l.value} onPress={() => update({ language: l.value })} />
          ))}
        </View>
      </View>

      <View style={s.card}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Premium Course</Text>
            <Text style={s.labelSub}>Charge students for access</Text>
          </View>
          <Switch
            value={state.isPremium}
            onValueChange={(v) => update({ isPremium: v })}
            trackColor={{ true: '#7C3AED', false: '#D1D5DB' }}
            thumbColor="white"
          />
        </View>
        {state.isPremium && (
          <>
            <SectionLabel text="Price (€)" />
            <TextInput
              style={[s.input, { width: 140 }]}
              placeholder="29.99"
              value={state.price}
              onChangeText={(v) => update({ price: v })}
              keyboardType="decimal-pad"
              placeholderTextColor="#9CA3AF"
            />
          </>
        )}
      </View>

      {!!error && <Text style={s.error}>{error}</Text>}

      <TouchableOpacity style={s.primaryBtn} onPress={save} disabled={saving} activeOpacity={0.85}>
        {saving
          ? <ActivityIndicator color="white" size="small" />
          : <Text style={s.primaryBtnText}>Save & Continue →</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ─── Step 2: Structure ────────────────────────────────────────────────────────
function Step2({
  state, update, onBack, onNext, instructorId,
}: {
  state: CourseState;
  update: (p: Partial<CourseState>) => void;
  onBack: () => void;
  onNext: () => void;
  instructorId: string;
}) {
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true });
  const [error, setError] = useState('');

  function addChapter() {
    const chapters = [...state.chapters, { title: 'New Chapter', lessons: [] }];
    update({ chapters });
    setExpanded((p) => ({ ...p, [chapters.length - 1]: true }));
  }

  function updateChapterTitle(i: number, title: string) {
    const chapters = state.chapters.map((c, ci) => ci === i ? { ...c, title } : c);
    update({ chapters });
  }

  function removeChapter(i: number) {
    update({ chapters: state.chapters.filter((_, ci) => ci !== i) });
  }

  function addLesson(ci: number) {
    const chapters = state.chapters.map((c, idx) =>
      idx === ci
        ? { ...c, lessons: [...c.lessons, { title: 'New Lesson', lessonType: 'text', isFreePreview: false }] }
        : c,
    );
    update({ chapters });
  }

  function updateLesson(ci: number, li: number, patch: Partial<Lesson>) {
    const chapters = state.chapters.map((c, idx) =>
      idx === ci
        ? { ...c, lessons: c.lessons.map((l, lIdx) => lIdx === li ? { ...l, ...patch } : l) }
        : c,
    );
    update({ chapters });
  }

  function removeLesson(ci: number, li: number) {
    const chapters = state.chapters.map((c, idx) =>
      idx === ci ? { ...c, lessons: c.lessons.filter((_, lIdx) => lIdx !== li) } : c,
    );
    update({ chapters });
  }

  async function save() {
    if (!state.courseId) { setError('Course not created yet. Go back to step 1.'); return; }
    if (state.chapters.length === 0) { setError('Add at least one chapter.'); return; }
    setSaving(true); setError('');
    try {
      const updatedChapters = [...state.chapters];
      for (let ci = 0; ci < updatedChapters.length; ci++) {
        const ch = updatedChapters[ci];
        if (!ch.id) {
          const res = await fetch(
            `${BASE}/instructor/${instructorId}/courses/${state.courseId}/chapters`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: ch.title, orderIndex: ci }) },
          );
          const data = await res.json();
          updatedChapters[ci] = { ...ch, id: data.id };
        } else {
          await fetch(
            `${BASE}/instructor/${instructorId}/courses/${state.courseId}/chapters/${ch.id}`,
            { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: ch.title, orderIndex: ci }) },
          );
        }
        const chapterId = updatedChapters[ci].id!;
        for (let li = 0; li < ch.lessons.length; li++) {
          const lesson = ch.lessons[li];
          if (!lesson.id) {
            const res = await fetch(
              `${BASE}/instructor/${instructorId}/courses/${state.courseId}/chapters/${chapterId}/lessons`,
              { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: lesson.title, lessonType: lesson.lessonType, isFreePreview: lesson.isFreePreview, orderIndex: li }) },
            );
            const data = await res.json();
            updatedChapters[ci].lessons[li] = { ...lesson, id: data.id };
          } else {
            await fetch(
              `${BASE}/instructor/${instructorId}/courses/${state.courseId}/chapters/${chapterId}/lessons/${lesson.id}`,
              { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: lesson.title, lessonType: lesson.lessonType, isFreePreview: lesson.isFreePreview, orderIndex: li }) },
            );
          }
        }
      }
      update({ chapters: updatedChapters });
      onNext();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const totalLessons = state.chapters.reduce((sum, c) => sum + c.lessons.length, 0);

  return (
    <View>
      <Text style={s.stepTitle}>Course Structure</Text>
      <Text style={s.stepSub}>{state.chapters.length} chapters · {totalLessons} lessons</Text>

      {state.chapters.map((ch, ci) => (
        <View key={ci} style={s.chapterCard}>
          {/* Chapter header */}
          <TouchableOpacity
            style={s.chapterHeader}
            onPress={() => setExpanded((p) => ({ ...p, [ci]: !p[ci] }))}
            activeOpacity={0.8}
          >
            <Text style={s.chapterIcon}>{expanded[ci] ? '▾' : '▸'}</Text>
            <TextInput
              style={s.chapterInput}
              value={ch.title}
              onChangeText={(v) => updateChapterTitle(ci, v)}
              onPressIn={(e) => e.stopPropagation?.()}
              placeholderTextColor="#9CA3AF"
            />
            <Text style={s.chapterCount}>{ch.lessons.length}</Text>
            <TouchableOpacity onPress={() => removeChapter(ci)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.removeBtn}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Lessons */}
          {expanded[ci] && (
            <View style={s.lessonsContainer}>
              {ch.lessons.map((lesson, li) => (
                <View key={li} style={s.lessonRow}>
                  <Text style={s.lessonIcon}>
                    {lesson.lessonType === 'video' ? '🎥' : lesson.lessonType === 'pdf' ? '📄' : lesson.lessonType === 'exercise' ? '💻' : '📝'}
                  </Text>
                  <TextInput
                    style={[s.input, s.lessonInput]}
                    value={lesson.title}
                    onChangeText={(v) => updateLesson(ci, li, { title: v })}
                    placeholderTextColor="#9CA3AF"
                  />
                  <View style={s.lessonTypeRow}>
                    {LESSON_TYPES.slice(0, 3).map((t) => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => updateLesson(ci, li, { lessonType: t })}
                        style={[s.typePill, lesson.lessonType === t && s.typePillActive]}
                      >
                        <Text style={[s.typePillText, lesson.lessonType === t && s.typePillTextActive]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity onPress={() => removeLesson(ci, li)} style={s.removeLessonBtn}>
                    <Text style={s.removeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={s.addLessonBtn} onPress={() => addLesson(ci)}>
                <Text style={s.addLessonBtnText}>+ Add Lesson</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity style={s.addChapterBtn} onPress={addChapter}>
        <Text style={s.addChapterBtnText}>+ Add Chapter</Text>
      </TouchableOpacity>

      {!!error && <Text style={s.error}>{error}</Text>}

      <View style={s.navRow}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.primaryBtn} onPress={save} disabled={saving} activeOpacity={0.85}>
          {saving
            ? <ActivityIndicator color="white" size="small" />
            : <Text style={s.primaryBtnText}>Save & Continue →</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Step 3: Publish ──────────────────────────────────────────────────────────
function Step3({
  state, onBack, instructorId,
}: {
  state: CourseState;
  onBack: () => void;
  instructorId: string;
}) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);

  async function publish() {
    if (!state.courseId) return;
    setPublishing(true);
    try {
      const res = await fetch(
        `${BASE}/instructor/${instructorId}/courses/${state.courseId}/publish`,
        { method: 'PATCH' },
      );
      if (res.ok) {
        Alert.alert('Published! 🎉', 'Your course is now live.', [
          { text: 'Go to Dashboard', onPress: () => router.replace('/instructor/dashboard') },
        ]);
      } else {
        Alert.alert('Error', 'Could not publish. Try again.');
      }
    } catch {
      Alert.alert('Error', 'Network error.');
    } finally {
      setPublishing(false);
    }
  }

  async function saveDraft() {
    router.replace('/instructor/dashboard');
  }

  const totalLessons = state.chapters.reduce((sum, c) => sum + c.lessons.length, 0);

  return (
    <View>
      <Text style={s.stepTitle}>Ready to Publish?</Text>
      <Text style={s.stepSub}>Review your course before going live.</Text>

      <View style={s.card}>
        <Text style={s.reviewTitle}>{state.title}</Text>
        <View style={s.reviewRow}>
          <Text style={s.reviewKey}>Level</Text>
          <Text style={s.reviewVal}>{state.level}</Text>
        </View>
        <View style={s.reviewRow}>
          <Text style={s.reviewKey}>Language</Text>
          <Text style={s.reviewVal}>{LANGUAGES.find((l) => l.value === state.language)?.label ?? state.language}</Text>
        </View>
        <View style={s.reviewRow}>
          <Text style={s.reviewKey}>Chapters</Text>
          <Text style={s.reviewVal}>{state.chapters.length}</Text>
        </View>
        <View style={s.reviewRow}>
          <Text style={s.reviewKey}>Lessons</Text>
          <Text style={s.reviewVal}>{totalLessons}</Text>
        </View>
        <View style={s.reviewRow}>
          <Text style={s.reviewKey}>Type</Text>
          <Text style={s.reviewVal}>{state.isPremium ? `Premium · ${state.price}€` : 'Free'}</Text>
        </View>
      </View>

      {state.chapters.map((ch, ci) => (
        <View key={ci} style={[s.card, { paddingVertical: 12 }]}>
          <Text style={s.reviewChapter}>📚 {ch.title}</Text>
          {ch.lessons.map((l, li) => (
            <Text key={li} style={s.reviewLesson}>  · {l.title} ({l.lessonType})</Text>
          ))}
        </View>
      ))}

      <View style={s.navRow}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ gap: 10 }}>
          <TouchableOpacity style={s.draftBtn} onPress={saveDraft}>
            <Text style={s.draftBtnText}>Save as Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.publishBtn} onPress={publish} disabled={publishing} activeOpacity={0.85}>
            {publishing
              ? <ActivityIndicator color="white" size="small" />
              : <Text style={s.primaryBtnText}>🚀 Publish Course</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────
export default function CreateCourseScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const instructorId = user?.id ?? '';
  const [step, setStep] = useState(1);
  const [state, setState] = useState<CourseState>({
    courseId: null,
    title: '',
    description: '',
    level: 'beginner',
    language: 'sq',
    isPremium: false,
    price: '',
    chapters: [],
  });

  function update(patch: Partial<CourseState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.topBarBack}>← My Courses</Text>
        </TouchableOpacity>
        <Text style={s.topBarTitle}>{state.courseId ? 'Edit Course' : 'New Course'}</Text>
        {state.courseId
          ? <Text style={s.topBarId}>ID: {state.courseId.slice(0, 6)}…</Text>
          : <View style={{ width: 60 }} />}
      </View>

      {/* Step progress */}
      <View style={s.stepBar}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <TouchableOpacity
              key={label}
              style={[s.stepItem, active && s.stepItemActive]}
              onPress={() => done && setStep(n)}
              activeOpacity={done ? 0.7 : 1}
            >
              <View style={[s.stepCircle, active && s.stepCircleActive, done && s.stepCircleDone]}>
                <Text style={[s.stepNum, (active || done) && { color: 'white' }]}>
                  {done ? '✓' : n}
                </Text>
              </View>
              <Text style={[s.stepLabel, active && s.stepLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step === 1 && <Step1 state={state} update={update} onNext={() => setStep(2)} instructorId={instructorId} />}
          {step === 2 && <Step2 state={state} update={update} onBack={() => setStep(1)} onNext={() => setStep(3)} instructorId={instructorId} />}
          {step === 3 && <Step3 state={state} onBack={() => setStep(2)} instructorId={instructorId} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  topBar: { backgroundColor: '#4c0884', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  topBarBack: { color: '#C4B5FD', fontSize: 13, fontWeight: '600' },
  topBarTitle: { color: 'white', fontSize: 15, fontWeight: '800' },
  topBarId: { color: '#C4B5FD', fontSize: 11 },

  stepBar: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  stepItem: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent', gap: 4 },
  stepItemActive: { borderBottomColor: '#7C3AED' },
  stepCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { backgroundColor: '#7C3AED' },
  stepCircleDone: { backgroundColor: '#059669' },
  stepNum: { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  stepLabel: { fontSize: 10, fontWeight: '600', color: '#9CA3AF' },
  stepLabelActive: { color: '#7C3AED' },

  body: { padding: 20, paddingBottom: 60 },

  stepTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  stepSub: { fontSize: 13, color: '#6B7280', marginBottom: 20 },

  card: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },

  label: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 12 },
  labelSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', backgroundColor: 'white' },
  textarea: { minHeight: 90, textAlignVertical: 'top' },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: 'white' },
  pillActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  pillText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  pillTextActive: { color: 'white' },

  row: { flexDirection: 'row', alignItems: 'center' },

  error: { color: '#DC2626', fontSize: 13, marginBottom: 12 },

  primaryBtn: { backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },

  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8, gap: 12 },
  backBtn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: 'white' },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },

  draftBtn: { borderWidth: 1, borderColor: '#7C3AED', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center' },
  draftBtnText: { color: '#7C3AED', fontWeight: '700', fontSize: 14 },
  publishBtn: { backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center' },

  // Chapter
  chapterCard: { backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, overflow: 'hidden' },
  chapterHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, backgroundColor: '#F9FAFB' },
  chapterIcon: { fontSize: 16, color: '#7C3AED', fontWeight: '700' },
  chapterInput: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827', padding: 0 },
  chapterCount: { fontSize: 11, color: '#9CA3AF', marginRight: 4 },
  removeBtn: { fontSize: 14, color: '#EF4444', fontWeight: '700' },

  lessonsContainer: { padding: 12, gap: 8 },
  lessonRow: { backgroundColor: '#F5F3FF', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#EDE9FE', gap: 6 },
  lessonIcon: { fontSize: 16 },
  lessonInput: { fontSize: 13, padding: 8 },
  lessonTypeRow: { flexDirection: 'row', gap: 6 },
  typePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#C4B5FD' },
  typePillActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  typePillText: { fontSize: 10, fontWeight: '600', color: '#7C3AED' },
  typePillTextActive: { color: 'white' },
  removeLessonBtn: { alignSelf: 'flex-end' },

  addLessonBtn: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#C4B5FD', borderRadius: 8, padding: 9, alignItems: 'center', marginTop: 4 },
  addLessonBtnText: { color: '#7C3AED', fontWeight: '600', fontSize: 13 },

  addChapterBtn: { borderWidth: 2, borderStyle: 'dashed', borderColor: '#C4B5FD', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 20 },
  addChapterBtnText: { color: '#7C3AED', fontWeight: '700', fontSize: 14 },

  // Review
  reviewTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  reviewKey: { fontSize: 13, color: '#6B7280' },
  reviewVal: { fontSize: 13, fontWeight: '600', color: '#111827' },
  reviewChapter: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 4 },
  reviewLesson: { fontSize: 12, color: '#6B7280', lineHeight: 20 },
});
