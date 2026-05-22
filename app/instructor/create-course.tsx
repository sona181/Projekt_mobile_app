import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
// Static file base (no /api prefix) for uploaded media URLs
const STATIC_BASE = BASE.replace(/\/api$/, '');

// ─── Types ────────────────────────────────────────────────────────────────────
type Lesson = {
  id?: string;
  title: string;
  lessonType: string;
  isFreePreview: boolean;
  hasContent?: boolean;
};
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
const LANGUAGES = [
  { value: 'sq', label: 'Shqip' },
  { value: 'en', label: 'English' },
  { value: 'it', label: 'Italiano' },
];
const LESSON_TYPES = [
  { value: 'text', emoji: '📝', label: 'Text' },
  { value: 'video', emoji: '🎥', label: 'Video' },
  { value: 'pdf', emoji: '📄', label: 'PDF' },
  { value: 'exercise', emoji: '💻', label: 'Exercise' },
];
const CODE_LANGUAGES = ['java', 'python', 'c', 'javascript', 'typescript'];
const STEPS = ['Info', 'Structure', 'Content', 'Publish'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return <Text style={s.label}>{text}</Text>;
}

function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
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
  state,
  update,
  onNext,
  instructorId,
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
    if (!state.title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    try {
      const body = JSON.stringify({
        title: state.title.trim(),
        description: state.description || undefined,
        level: state.level,
        language: state.language,
        isPremium: state.isPremium,
        price: state.isPremium && state.price ? Number(state.price) : undefined,
      });
      if (state.courseId) {
        await fetch(`${BASE}/instructor/${instructorId}/courses/${state.courseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
      } else {
        const res = await fetch(`${BASE}/instructor/${instructorId}/courses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message ?? 'Failed to create course.');
          return;
        }
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
            <Pill
              key={l}
              label={l.charAt(0).toUpperCase() + l.slice(1)}
              active={state.level === l}
              onPress={() => update({ level: l })}
            />
          ))}
        </View>
        <SectionLabel text="Language" />
        <View style={s.pillRow}>
          {LANGUAGES.map((l) => (
            <Pill
              key={l.value}
              label={l.label}
              active={state.language === l.value}
              onPress={() => update({ language: l.value })}
            />
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

      <TouchableOpacity
        style={s.primaryBtn}
        onPress={save}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={s.primaryBtnText}>Save & Continue →</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Step 2: Structure ────────────────────────────────────────────────────────
function Step2({
  state,
  update,
  onBack,
  onNext,
  instructorId,
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
    const chapters = state.chapters.map((c, ci) => (ci === i ? { ...c, title } : c));
    update({ chapters });
  }

  function removeChapter(i: number) {
    update({ chapters: state.chapters.filter((_, ci) => ci !== i) });
  }

  function addLesson(ci: number) {
    const chapters = state.chapters.map((c, idx) =>
      idx === ci
        ? {
            ...c,
            lessons: [
              ...c.lessons,
              { title: 'New Lesson', lessonType: 'text', isFreePreview: false },
            ],
          }
        : c,
    );
    update({ chapters });
  }

  function updateLesson(ci: number, li: number, patch: Partial<Lesson>) {
    const chapters = state.chapters.map((c, idx) =>
      idx === ci
        ? {
            ...c,
            lessons: c.lessons.map((l, lIdx) => (lIdx === li ? { ...l, ...patch } : l)),
          }
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
    if (!state.courseId) {
      setError('Course not created yet. Go back to step 1.');
      return;
    }
    if (state.chapters.length === 0) {
      setError('Add at least one chapter.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updatedChapters = [...state.chapters];
      for (let ci = 0; ci < updatedChapters.length; ci++) {
        const ch = updatedChapters[ci];
        if (!ch.id) {
          const res = await fetch(
            `${BASE}/instructor/${instructorId}/courses/${state.courseId}/chapters`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: ch.title, orderIndex: ci }),
            },
          );
          const data = await res.json();
          updatedChapters[ci] = { ...ch, id: data.id };
        } else {
          await fetch(
            `${BASE}/instructor/${instructorId}/courses/${state.courseId}/chapters/${ch.id}`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: ch.title, orderIndex: ci }),
            },
          );
        }
        const chapterId = updatedChapters[ci].id!;
        for (let li = 0; li < ch.lessons.length; li++) {
          const lesson = ch.lessons[li];
          if (!lesson.id) {
            const res = await fetch(
              `${BASE}/instructor/${instructorId}/courses/${state.courseId}/chapters/${chapterId}/lessons`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: lesson.title,
                  lessonType: lesson.lessonType,
                  isFreePreview: lesson.isFreePreview,
                  orderIndex: li,
                }),
              },
            );
            const data = await res.json();
            updatedChapters[ci].lessons[li] = { ...lesson, id: data.id };
          } else {
            await fetch(
              `${BASE}/instructor/${instructorId}/courses/${state.courseId}/chapters/${chapterId}/lessons/${lesson.id}`,
              {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: lesson.title,
                  lessonType: lesson.lessonType,
                  isFreePreview: lesson.isFreePreview,
                  orderIndex: li,
                }),
              },
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
      <Text style={s.stepSub}>
        {state.chapters.length} chapters · {totalLessons} lessons
      </Text>

      {state.chapters.map((ch, ci) => (
        <View key={ci} style={s.chapterCard}>
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
              placeholderTextColor="#9CA3AF"
            />
            <Text style={s.chapterCount}>{ch.lessons.length}</Text>
            <TouchableOpacity
              onPress={() => removeChapter(ci)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.removeBtn}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {expanded[ci] && (
            <View style={s.lessonsContainer}>
              {ch.lessons.map((lesson, li) => (
                <View key={li} style={s.lessonRow}>
                  <View style={s.lessonRowTop}>
                    <Text style={s.lessonIcon}>
                      {LESSON_TYPES.find((t) => t.value === lesson.lessonType)?.emoji ?? '📝'}
                    </Text>
                    <TextInput
                      style={[s.input, s.lessonInput]}
                      value={lesson.title}
                      onChangeText={(v) => updateLesson(ci, li, { title: v })}
                      placeholderTextColor="#9CA3AF"
                    />
                    <TouchableOpacity onPress={() => removeLesson(ci, li)}>
                      <Text style={s.removeBtn}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={s.lessonTypeRow}>
                    {LESSON_TYPES.map((t) => (
                      <TouchableOpacity
                        key={t.value}
                        onPress={() => updateLesson(ci, li, { lessonType: t.value })}
                        style={[
                          s.typePill,
                          lesson.lessonType === t.value && s.typePillActive,
                        ]}
                      >
                        <Text
                          style={[
                            s.typePillText,
                            lesson.lessonType === t.value && s.typePillTextActive,
                          ]}
                        >
                          {t.emoji} {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={s.lessonRowBottom}>
                    <TouchableOpacity
                      style={[
                        s.freeTag,
                        lesson.isFreePreview && s.freeTagActive,
                      ]}
                      onPress={() =>
                        updateLesson(ci, li, { isFreePreview: !lesson.isFreePreview })
                      }
                    >
                      <Text
                        style={[
                          s.freeTagText,
                          lesson.isFreePreview && s.freeTagTextActive,
                        ]}
                      >
                        {lesson.isFreePreview ? '✓ Free preview' : 'Free preview'}
                      </Text>
                    </TouchableOpacity>
                  </View>
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
        <TouchableOpacity
          style={s.primaryBtn}
          onPress={save}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={s.primaryBtnText}>Save & Continue →</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Content editors per lesson type ─────────────────────────────────────────

function TextEditor({
  lessonId,
  instructorId,
  onDone,
}: {
  lessonId: string;
  instructorId: string;
  onDone: () => void;
}) {
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await fetch(`${BASE}/instructor/${instructorId}/lessons/${lessonId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: 'text', body: body.trim(), orderIndex: 0 }),
      });
      onDone();
    } catch {
      Alert.alert('Error', 'Failed to save text content.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={s.editorBox}>
      <Text style={s.editorHint}>Write your lesson content below:</Text>
      <TextInput
        style={[s.input, s.editorTextarea]}
        placeholder="Type lesson text here..."
        value={body}
        onChangeText={setBody}
        multiline
        textAlignVertical="top"
        placeholderTextColor="#9CA3AF"
      />
      <TouchableOpacity
        style={[s.primaryBtn, { marginTop: 10 }]}
        onPress={save}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={s.primaryBtnText}>Save Text</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function VideoEditor({
  lessonId,
  courseId,
  instructorId,
  onDone,
}: {
  lessonId: string;
  courseId: string;
  instructorId: string;
  onDone: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  async function pick() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setPicked(asset.fileName ?? asset.uri.split('/').pop() ?? 'video.mp4');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', {
        uri: asset.uri,
        name: asset.fileName ?? 'video.mp4',
        type: asset.mimeType ?? 'video/mp4',
      } as any);
      const res = await fetch(
        `${BASE}/instructor/${instructorId}/courses/${courseId}/lessons/${lessonId}/upload?contentType=video`,
        { method: 'POST', body: form },
      );
      if (res.ok) {
        onDone();
      } else {
        Alert.alert('Upload failed', 'Could not upload video. Try again.');
      }
    } catch {
      Alert.alert('Error', 'Network error during upload.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={s.editorBox}>
      <Text style={s.editorHint}>Pick a video from your device:</Text>
      {picked && <Text style={s.pickedName}>📎 {picked}</Text>}
      <TouchableOpacity
        style={[s.uploadPickBtn, uploading && { opacity: 0.6 }]}
        onPress={pick}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#7C3AED" size="small" />
        ) : (
          <Text style={s.uploadPickBtnText}>🎥 Pick Video from Library</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function PdfEditor({
  lessonId,
  courseId,
  instructorId,
  onDone,
}: {
  lessonId: string;
  courseId: string;
  instructorId: string;
  onDone: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  async function pick() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setPicked(asset.name);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? 'application/pdf',
      } as any);
      const res = await fetch(
        `${BASE}/instructor/${instructorId}/courses/${courseId}/lessons/${lessonId}/upload?contentType=pdf`,
        { method: 'POST', body: form },
      );
      if (res.ok) {
        onDone();
      } else {
        Alert.alert('Upload failed', 'Could not upload PDF. Try again.');
      }
    } catch {
      Alert.alert('Error', 'Network error during upload.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={s.editorBox}>
      <Text style={s.editorHint}>Pick a PDF file from your device:</Text>
      {picked && <Text style={s.pickedName}>📎 {picked}</Text>}
      <TouchableOpacity
        style={[s.uploadPickBtn, uploading && { opacity: 0.6 }]}
        onPress={pick}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#7C3AED" size="small" />
        ) : (
          <Text style={s.uploadPickBtnText}>📄 Pick PDF from Device</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function ExerciseEditor({
  lessonId,
  instructorId,
  onDone,
}: {
  lessonId: string;
  instructorId: string;
  onDone: () => void;
}) {
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [language, setLanguage] = useState('python');
  const [starterCode, setStarterCode] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) {
      Alert.alert('Validation', 'Exercise title is required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `${BASE}/instructor/${instructorId}/lessons/${lessonId}/exercise`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            instructions: instructions.trim() || undefined,
            language,
            starterCode: starterCode.trim() || undefined,
            expectedOutput: expectedOutput.trim() || undefined,
            orderIndex: 0,
          }),
        },
      );
      if (res.ok) {
        onDone();
      } else {
        Alert.alert('Error', 'Failed to save exercise.');
      }
    } catch {
      Alert.alert('Error', 'Network error.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={s.editorBox}>
      <SectionLabel text="Exercise Title *" />
      <TextInput
        style={s.input}
        placeholder="e.g. Print Hello World"
        value={title}
        onChangeText={setTitle}
        placeholderTextColor="#9CA3AF"
      />

      <SectionLabel text="Programming Language" />
      <View style={[s.pillRow, { flexWrap: 'wrap' }]}>
        {CODE_LANGUAGES.map((l) => (
          <Pill key={l} label={l} active={language === l} onPress={() => setLanguage(l)} />
        ))}
      </View>

      <SectionLabel text="Instructions" />
      <TextInput
        style={[s.input, s.editorTextarea]}
        placeholder="Describe what the student should do..."
        value={instructions}
        onChangeText={setInstructions}
        multiline
        textAlignVertical="top"
        placeholderTextColor="#9CA3AF"
      />

      <SectionLabel text="Starter Code" />
      <TextInput
        style={[s.input, s.codeInput]}
        placeholder={`# starter code here\n`}
        value={starterCode}
        onChangeText={setStarterCode}
        multiline
        textAlignVertical="top"
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <SectionLabel text="Expected Output" />
      <TextInput
        style={[s.input, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}
        placeholder="Hello, World!"
        value={expectedOutput}
        onChangeText={setExpectedOutput}
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={[s.primaryBtn, { marginTop: 12 }]}
        onPress={save}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={s.primaryBtnText}>Save Exercise</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Content Editor Modal ─────────────────────────────────────────────────────
function ContentModal({
  lesson,
  courseId,
  instructorId,
  onClose,
  onSaved,
}: {
  lesson: Lesson;
  courseId: string;
  instructorId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  function handleDone() {
    onSaved();
    onClose();
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.modalClose}>✕ Close</Text>
          </TouchableOpacity>
          <Text style={s.modalTitle}>
            {LESSON_TYPES.find((t) => t.value === lesson.lessonType)?.emoji}{' '}
            {lesson.title}
          </Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          {lesson.lessonType === 'text' && (
            <TextEditor lessonId={lesson.id!} instructorId={instructorId} onDone={handleDone} />
          )}
          {lesson.lessonType === 'video' && (
            <VideoEditor
              lessonId={lesson.id!}
              courseId={courseId}
              instructorId={instructorId}
              onDone={handleDone}
            />
          )}
          {lesson.lessonType === 'pdf' && (
            <PdfEditor
              lessonId={lesson.id!}
              courseId={courseId}
              instructorId={instructorId}
              onDone={handleDone}
            />
          )}
          {lesson.lessonType === 'exercise' && (
            <ExerciseEditor
              lessonId={lesson.id!}
              instructorId={instructorId}
              onDone={handleDone}
            />
          )}
          {lesson.lessonType === 'mixed' && (
            <View style={s.editorBox}>
              <Text style={s.editorHint}>
                Mixed lessons support multiple content types. Add text or files using the
                individual editors.
              </Text>
              <TextEditor
                lessonId={lesson.id!}
                instructorId={instructorId}
                onDone={handleDone}
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Step 3: Content ──────────────────────────────────────────────────────────
function Step3({
  state,
  update,
  onBack,
  onNext,
  instructorId,
}: {
  state: CourseState;
  update: (p: Partial<CourseState>) => void;
  onBack: () => void;
  onNext: () => void;
  instructorId: string;
}) {
  const [activeLesson, setActiveLesson] = useState<{
    lesson: Lesson;
    ci: number;
    li: number;
  } | null>(null);

  function markDone(ci: number, li: number) {
    const chapters = state.chapters.map((c, cIdx) =>
      cIdx === ci
        ? {
            ...c,
            lessons: c.lessons.map((l, lIdx) =>
              lIdx === li ? { ...l, hasContent: true } : l,
            ),
          }
        : c,
    );
    update({ chapters });
  }

  const allLessons = state.chapters.flatMap((ch) => ch.lessons);
  const doneCount = allLessons.filter((l) => l.hasContent).length;

  return (
    <View>
      <Text style={s.stepTitle}>Add Lesson Content</Text>
      <Text style={s.stepSub}>
        {doneCount}/{allLessons.length} lessons have content
      </Text>

      {state.chapters.map((ch, ci) => (
        <View key={ci} style={s.chapterCard}>
          <View style={[s.chapterHeader, { paddingVertical: 10 }]}>
            <Text style={s.chapterIcon}>📚</Text>
            <Text style={[s.chapterInput, { flex: 1, padding: 0 }]}>{ch.title}</Text>
          </View>
          <View style={s.lessonsContainer}>
            {ch.lessons.length === 0 && (
              <Text style={{ color: '#9CA3AF', fontSize: 12, padding: 4 }}>
                No lessons in this chapter
              </Text>
            )}
            {ch.lessons.map((lesson, li) => (
              <TouchableOpacity
                key={li}
                style={[s.contentLessonRow, lesson.hasContent && s.contentLessonDone]}
                onPress={() => {
                  if (!lesson.id) {
                    Alert.alert('Not saved', 'Go back to Step 2 and save the structure first.');
                    return;
                  }
                  setActiveLesson({ lesson, ci, li });
                }}
              >
                <Text style={s.contentLessonEmoji}>
                  {LESSON_TYPES.find((t) => t.value === lesson.lessonType)?.emoji ?? '📝'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.contentLessonTitle}>{lesson.title}</Text>
                  <Text style={s.contentLessonType}>{lesson.lessonType}</Text>
                </View>
                <Text style={s.contentLessonStatus}>
                  {lesson.hasContent ? '✅' : '➕ Add'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <View style={s.navRow}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.primaryBtn} onPress={onNext} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>Review & Publish →</Text>
        </TouchableOpacity>
      </View>

      {activeLesson && (
        <ContentModal
          lesson={activeLesson.lesson}
          courseId={state.courseId!}
          instructorId={instructorId}
          onClose={() => setActiveLesson(null)}
          onSaved={() => markDone(activeLesson.ci, activeLesson.li)}
        />
      )}
    </View>
  );
}

// ─── Step 4: Publish ──────────────────────────────────────────────────────────
function Step4({
  state,
  onBack,
  instructorId,
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

  const totalLessons = state.chapters.reduce((sum, c) => sum + c.lessons.length, 0);
  const contentDone = state.chapters
    .flatMap((c) => c.lessons)
    .filter((l) => l.hasContent).length;

  return (
    <View>
      <Text style={s.stepTitle}>Ready to Publish?</Text>
      <Text style={s.stepSub}>Review your course before going live.</Text>

      <View style={s.card}>
        <Text style={s.reviewTitle}>{state.title}</Text>
        {[
          ['Level', state.level],
          ['Language', LANGUAGES.find((l) => l.value === state.language)?.label ?? state.language],
          ['Chapters', String(state.chapters.length)],
          ['Lessons', String(totalLessons)],
          ['Content added', `${contentDone}/${totalLessons}`],
          ['Type', state.isPremium ? `Premium · ${state.price}€` : 'Free'],
        ].map(([k, v]) => (
          <View key={k} style={s.reviewRow}>
            <Text style={s.reviewKey}>{k}</Text>
            <Text style={s.reviewVal}>{v}</Text>
          </View>
        ))}
      </View>

      {state.chapters.map((ch, ci) => (
        <View key={ci} style={[s.card, { paddingVertical: 12 }]}>
          <Text style={s.reviewChapter}>📚 {ch.title}</Text>
          {ch.lessons.map((l, li) => (
            <Text key={li} style={s.reviewLesson}>
              {'  '}
              {LESSON_TYPES.find((t) => t.value === l.lessonType)?.emoji} {l.title}{' '}
              {l.hasContent ? '✅' : '⬜'}
            </Text>
          ))}
        </View>
      ))}

      <View style={s.navRow}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ gap: 10 }}>
          <TouchableOpacity
            style={s.draftBtn}
            onPress={() => router.replace('/instructor/dashboard')}
          >
            <Text style={s.draftBtnText}>Save as Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.publishBtn}
            onPress={publish}
            disabled={publishing}
            activeOpacity={0.85}
          >
            {publishing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={s.primaryBtnText}>🚀 Publish Course</Text>
            )}
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
      <View style={s.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={s.topBarBack}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.topBarTitle}>{state.courseId ? 'Edit Course' : 'New Course'}</Text>
        {state.courseId ? (
          <Text style={s.topBarId}>ID: {state.courseId.slice(0, 6)}…</Text>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

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
              <View
                style={[
                  s.stepCircle,
                  active && s.stepCircleActive,
                  done && s.stepCircleDone,
                ]}
              >
                <Text style={[s.stepNum, (active || done) && { color: 'white' }]}>
                  {done ? '✓' : n}
                </Text>
              </View>
              <Text style={[s.stepLabel, active && s.stepLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && (
            <Step1
              state={state}
              update={update}
              onNext={() => setStep(2)}
              instructorId={instructorId}
            />
          )}
          {step === 2 && (
            <Step2
              state={state}
              update={update}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              instructorId={instructorId}
            />
          )}
          {step === 3 && (
            <Step3
              state={state}
              update={update}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
              instructorId={instructorId}
            />
          )}
          {step === 4 && (
            <Step4 state={state} onBack={() => setStep(3)} instructorId={instructorId} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  topBar: {
    backgroundColor: '#4c0884',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  topBarBack: { color: '#C4B5FD', fontSize: 13, fontWeight: '600' },
  topBarTitle: { color: 'white', fontSize: 15, fontWeight: '800' },
  topBarId: { color: '#C4B5FD', fontSize: 11 },

  stepBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 3,
  },
  stepItemActive: { borderBottomColor: '#7C3AED' },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: { backgroundColor: '#7C3AED' },
  stepCircleDone: { backgroundColor: '#059669' },
  stepNum: { fontSize: 10, fontWeight: '700', color: '#9CA3AF' },
  stepLabel: { fontSize: 9, fontWeight: '600', color: '#9CA3AF' },
  stepLabelActive: { color: '#7C3AED' },

  body: { padding: 20, paddingBottom: 60 },

  stepTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  stepSub: { fontSize: 13, color: '#6B7280', marginBottom: 20 },

  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  label: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 12 },
  labelSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: 'white',
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  pillActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  pillText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  pillTextActive: { color: 'white' },

  row: { flexDirection: 'row', alignItems: 'center' },

  error: { color: '#DC2626', fontSize: 13, marginBottom: 12 },

  primaryBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },

  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
    gap: 12,
  },
  backBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },

  draftBtn: {
    borderWidth: 1,
    borderColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  draftBtnText: { color: '#7C3AED', fontWeight: '700', fontSize: 14 },
  publishBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  // Chapter / Lesson builder
  chapterCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    overflow: 'hidden',
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: '#F9FAFB',
  },
  chapterIcon: { fontSize: 16, color: '#7C3AED', fontWeight: '700' },
  chapterInput: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827', padding: 0 },
  chapterCount: { fontSize: 11, color: '#9CA3AF', marginRight: 4 },
  removeBtn: { fontSize: 14, color: '#EF4444', fontWeight: '700' },

  lessonsContainer: { padding: 12, gap: 8 },
  lessonRow: {
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    gap: 6,
  },
  lessonRowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lessonRowBottom: { flexDirection: 'row', gap: 6 },
  lessonIcon: { fontSize: 16 },
  lessonInput: { flex: 1, fontSize: 13, padding: 8 },
  lessonTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  typePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  typePillActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  typePillText: { fontSize: 10, fontWeight: '600', color: '#7C3AED' },
  typePillTextActive: { color: 'white' },

  freeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  freeTagActive: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
  freeTagText: { fontSize: 10, fontWeight: '600', color: '#9CA3AF' },
  freeTagTextActive: { color: '#059669' },

  addLessonBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C4B5FD',
    borderRadius: 8,
    padding: 9,
    alignItems: 'center',
    marginTop: 4,
  },
  addLessonBtnText: { color: '#7C3AED', fontWeight: '600', fontSize: 13 },

  addChapterBtn: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#C4B5FD',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  addChapterBtnText: { color: '#7C3AED', fontWeight: '700', fontSize: 14 },

  // Content step
  contentLessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contentLessonDone: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  contentLessonEmoji: { fontSize: 20 },
  contentLessonTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  contentLessonType: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  contentLessonStatus: { fontSize: 13, fontWeight: '700', color: '#7C3AED' },

  // Modal
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#4c0884',
  },
  modalClose: { color: '#C4B5FD', fontSize: 13, fontWeight: '600' },
  modalTitle: { color: 'white', fontSize: 14, fontWeight: '700', flex: 1, textAlign: 'center' },

  // Editors
  editorBox: { gap: 6 },
  editorHint: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  editorTextarea: { minHeight: 160, textAlignVertical: 'top' },
  codeInput: {
    minHeight: 120,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    textAlignVertical: 'top',
  },
  pickedName: { fontSize: 12, color: '#374151', marginBottom: 6 },
  uploadPickBtn: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  uploadPickBtnText: { color: '#7C3AED', fontWeight: '700', fontSize: 15 },

  // Review
  reviewTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reviewKey: { fontSize: 13, color: '#6B7280' },
  reviewVal: { fontSize: 13, fontWeight: '600', color: '#111827' },
  reviewChapter: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 4 },
  reviewLesson: { fontSize: 12, color: '#6B7280', lineHeight: 22 },
});
