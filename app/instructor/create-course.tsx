import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

// ─── Types for saved blocks ───────────────────────────────────────────────────
type SavedBlock = { id: string; kind: 'content' | 'exercise' | 'asset'; label: string; emoji: string };

const ADD_BLOCK_TYPES = [
  { value: 'text',     emoji: '📝', label: 'Text' },
  { value: 'video',    emoji: '🎥', label: 'Video' },
  { value: 'pdf',      emoji: '📄', label: 'PDF' },
  { value: 'file',     emoji: '🗜️', label: 'File / ZIP' },
  { value: 'exercise', emoji: '💻', label: 'Exercise' },
];

// ─── Inline Text Block ────────────────────────────────────────────────────────
function InlineTextBlock({
  lessonId, instructorId, blockCount, onSaved,
}: { lessonId: string; instructorId: string; blockCount: number; onSaved: (b: SavedBlock) => void }) {
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!body.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/instructor/${instructorId}/lessons/${lessonId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: 'text', body: body.trim(), orderIndex: blockCount }),
      });
      const data = await res.json();
      setBody('');
      onSaved({ id: data.id, kind: 'content', emoji: '📝', label: `Text · ${body.trim().slice(0, 40)}…` });
    } catch {
      Alert.alert('Error', 'Failed to save text block.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={s.inlineEditor}>
      <TextInput
        style={[s.input, s.editorTextarea]}
        placeholder="Write lesson text, code snippets, explanations..."
        value={body}
        onChangeText={setBody}
        multiline
        textAlignVertical="top"
        placeholderTextColor="#9CA3AF"
      />
      <TouchableOpacity style={s.saveBlockBtn} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="white" size="small" /> : <Text style={s.saveBlockBtnText}>+ Add Text Block</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ─── Inline Video Block ───────────────────────────────────────────────────────
function InlineVideoBlock({
  lessonId, courseId, instructorId, blockCount, onSaved,
}: { lessonId: string; courseId: string; instructorId: string; blockCount: number; onSaved: (b: SavedBlock) => void }) {
  const [uploading, setUploading] = useState(false);

  async function pick() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const name = asset.fileName ?? asset.uri.split('/').pop() ?? 'video.mp4';
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', { uri: asset.uri, name, type: asset.mimeType ?? 'video/mp4' } as any);
      const res = await fetch(
        `${BASE}/instructor/${instructorId}/courses/${courseId}/lessons/${lessonId}/upload?contentType=video`,
        { method: 'POST', body: form },
      );
      const data = await res.json();
      if (res.ok) onSaved({ id: data.id ?? Date.now().toString(), kind: 'asset', emoji: '🎥', label: `Video · ${name}` });
      else Alert.alert('Upload failed', 'Try again.');
    } catch {
      Alert.alert('Error', 'Network error during upload.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={s.inlineEditor}>
      <TouchableOpacity style={[s.uploadPickBtn, uploading && { opacity: 0.6 }]} onPress={pick} disabled={uploading}>
        {uploading
          ? <><ActivityIndicator color="#7C3AED" size="small" /><Text style={[s.uploadPickBtnText, { marginTop: 6 }]}>Uploading…</Text></>
          : <Text style={s.uploadPickBtnText}>🎥 Pick Video from Library</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ─── Inline PDF Block ─────────────────────────────────────────────────────────
function InlinePdfBlock({
  lessonId, courseId, instructorId, blockCount, onSaved,
}: { lessonId: string; courseId: string; instructorId: string; blockCount: number; onSaved: (b: SavedBlock) => void }) {
  const [uploading, setUploading] = useState(false);

  async function pick() {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/pdf' } as any);
      const res = await fetch(
        `${BASE}/instructor/${instructorId}/courses/${courseId}/lessons/${lessonId}/upload?contentType=pdf`,
        { method: 'POST', body: form },
      );
      const data = await res.json();
      if (res.ok) onSaved({ id: data.id ?? Date.now().toString(), kind: 'asset', emoji: '📄', label: `PDF · ${asset.name}` });
      else Alert.alert('Upload failed', 'Try again.');
    } catch {
      Alert.alert('Error', 'Network error during upload.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={s.inlineEditor}>
      <TouchableOpacity style={[s.uploadPickBtn, uploading && { opacity: 0.6 }]} onPress={pick} disabled={uploading}>
        {uploading
          ? <><ActivityIndicator color="#7C3AED" size="small" /><Text style={[s.uploadPickBtnText, { marginTop: 6 }]}>Uploading…</Text></>
          : <Text style={s.uploadPickBtnText}>📄 Pick PDF from Device</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ─── Inline File/ZIP Block ────────────────────────────────────────────────────
function InlineFileBlock({
  lessonId, courseId, instructorId, onSaved,
}: { lessonId: string; courseId: string; instructorId: string; onSaved: (b: SavedBlock) => void }) {
  const [uploading, setUploading] = useState(false);

  async function pick() {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/octet-stream' } as any);
      const isZip = asset.name.endsWith('.zip') || asset.name.endsWith('.tar') || asset.name.endsWith('.gz');
      const res = await fetch(
        `${BASE}/instructor/${instructorId}/courses/${courseId}/lessons/${lessonId}/upload?contentType=${isZip ? 'zip' : 'file'}`,
        { method: 'POST', body: form },
      );
      const data = await res.json();
      if (res.ok) onSaved({ id: data.id ?? Date.now().toString(), kind: 'asset', emoji: isZip ? '🗜️' : '📎', label: `File · ${asset.name}` });
      else Alert.alert('Upload failed', 'Try again.');
    } catch {
      Alert.alert('Error', 'Network error during upload.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={s.inlineEditor}>
      <TouchableOpacity style={[s.uploadPickBtn, uploading && { opacity: 0.6 }]} onPress={pick} disabled={uploading}>
        {uploading
          ? <><ActivityIndicator color="#7C3AED" size="small" /><Text style={[s.uploadPickBtnText, { marginTop: 6 }]}>Uploading…</Text></>
          : <Text style={s.uploadPickBtnText}>🗜️ Pick File / ZIP from Device</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ─── Inline Exercise Block ────────────────────────────────────────────────────
function InlineExerciseBlock({
  lessonId, instructorId, blockCount, onSaved,
}: { lessonId: string; instructorId: string; blockCount: number; onSaved: (b: SavedBlock) => void }) {
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [language, setLanguage] = useState('python');
  const [starterCode, setStarterCode] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) { Alert.alert('Validation', 'Exercise title is required.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/instructor/${instructorId}/lessons/${lessonId}/exercise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          instructions: instructions.trim() || undefined,
          language,
          starterCode: starterCode.trim() || undefined,
          expectedOutput: expectedOutput.trim() || undefined,
          orderIndex: blockCount,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTitle(''); setInstructions(''); setStarterCode(''); setExpectedOutput('');
        onSaved({ id: data.id, kind: 'exercise', emoji: '💻', label: `Exercise · ${title.trim()}` });
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
    <View style={s.inlineEditor}>
      <SectionLabel text="Exercise Title *" />
      <TextInput style={s.input} placeholder="e.g. Print Hello World" value={title} onChangeText={setTitle} placeholderTextColor="#9CA3AF" />

      <SectionLabel text="Language" />
      <View style={[s.pillRow, { flexWrap: 'wrap' }]}>
        {CODE_LANGUAGES.map((l) => (
          <Pill key={l} label={l} active={language === l} onPress={() => setLanguage(l)} />
        ))}
      </View>

      <SectionLabel text="Instructions" />
      <TextInput style={[s.input, s.editorTextarea]} placeholder="What should the student do?" value={instructions} onChangeText={setInstructions} multiline textAlignVertical="top" placeholderTextColor="#9CA3AF" />

      <SectionLabel text="Starter Code" />
      <TextInput style={[s.input, s.codeInput]} placeholder="# starter code" value={starterCode} onChangeText={setStarterCode} multiline textAlignVertical="top" placeholderTextColor="#9CA3AF" autoCapitalize="none" autoCorrect={false} />

      <SectionLabel text="Expected Output" />
      <TextInput style={[s.input, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]} placeholder="Hello, World!" value={expectedOutput} onChangeText={setExpectedOutput} placeholderTextColor="#9CA3AF" autoCapitalize="none" autoCorrect={false} />

      <TouchableOpacity style={s.saveBlockBtn} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="white" size="small" /> : <Text style={s.saveBlockBtnText}>+ Add Exercise</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ─── Content Editor Modal (multi-block) ──────────────────────────────────────
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
  const [blocks, setBlocks] = useState<SavedBlock[]>([]);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);

  // Load already-saved blocks so instructor sees what's there
  useEffect(() => {
    if (!lesson.id) { setLoadingExisting(false); return; }
    Promise.all([
      fetch(`${BASE}/instructor/${instructorId}/lessons/${lesson.id}/content`).then((r) => r.json()).catch(() => []),
      fetch(`${BASE}/instructor/${instructorId}/lessons/${lesson.id}/exercises`).then((r) => r.json()).catch(() => []),
    ]).then(([contents, exercises]) => {
      const existing: SavedBlock[] = [
        ...(Array.isArray(contents) ? contents.map((c: any) => ({
          id: c.id,
          kind: 'content' as const,
          emoji: c.contentType === 'video' ? '🎥' : c.contentType === 'pdf' ? '📄' : '📝',
          label: c.contentType === 'text' ? `Text · ${(c.body ?? '').slice(0, 40)}` : `${c.contentType} · ${(c.mediaUrl ?? '').split('/').pop()}`,
        })) : []),
        ...(Array.isArray(exercises) ? exercises.map((e: any) => ({
          id: e.id,
          kind: 'exercise' as const,
          emoji: '💻',
          label: `Exercise · ${e.title}`,
        })) : []),
      ];
      setBlocks(existing);
    }).finally(() => setLoadingExisting(false));
  }, [lesson.id]);

  function addBlock(block: SavedBlock) {
    setBlocks((prev) => [...prev, block]);
    setActiveType(null);
    onSaved();
  }

  function handleDone() {
    onSaved();
    onClose();
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        {/* Header */}
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.modalClose}>✕ Close</Text>
          </TouchableOpacity>
          <Text style={s.modalTitle} numberOfLines={1}>
            {LESSON_TYPES.find((t) => t.value === lesson.lessonType)?.emoji} {lesson.title}
          </Text>
          <TouchableOpacity onPress={handleDone} style={s.modalDoneBtn}>
            <Text style={s.modalDoneText}>Done ✓</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">

          {/* Saved blocks list */}
          {loadingExisting
            ? <ActivityIndicator color="#7C3AED" style={{ marginVertical: 20 }} />
            : blocks.length > 0 && (
              <View style={s.blockList}>
                <Text style={s.blockListHeader}>Content in this lesson ({blocks.length} block{blocks.length !== 1 ? 's' : ''})</Text>
                {blocks.map((block, i) => (
                  <View key={block.id} style={s.blockRow}>
                    <Text style={s.blockRowEmoji}>{block.emoji}</Text>
                    <Text style={s.blockRowLabel} numberOfLines={1}>{block.label}</Text>
                    <Text style={s.blockRowIndex}>#{i + 1}</Text>
                  </View>
                ))}
              </View>
            )}

          {/* Add more block — type picker */}
          <Text style={s.addBlockTitle}>
            {blocks.length === 0 ? 'Add your first content block:' : 'Add another block:'}
          </Text>
          <View style={s.typeGrid}>
            {ADD_BLOCK_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[s.typeCard, activeType === t.value && s.typeCardActive]}
                onPress={() => setActiveType(activeType === t.value ? null : t.value)}
              >
                <Text style={s.typeCardEmoji}>{t.emoji}</Text>
                <Text style={[s.typeCardLabel, activeType === t.value && s.typeCardLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Inline editor for selected type */}
          {activeType === 'text' && (
            <InlineTextBlock lessonId={lesson.id!} instructorId={instructorId} blockCount={blocks.length} onSaved={addBlock} />
          )}
          {activeType === 'video' && (
            <InlineVideoBlock lessonId={lesson.id!} courseId={courseId} instructorId={instructorId} blockCount={blocks.length} onSaved={addBlock} />
          )}
          {activeType === 'pdf' && (
            <InlinePdfBlock lessonId={lesson.id!} courseId={courseId} instructorId={instructorId} blockCount={blocks.length} onSaved={addBlock} />
          )}
          {activeType === 'file' && (
            <InlineFileBlock lessonId={lesson.id!} courseId={courseId} instructorId={instructorId} onSaved={addBlock} />
          )}
          {activeType === 'exercise' && (
            <InlineExerciseBlock lessonId={lesson.id!} instructorId={instructorId} blockCount={blocks.length} onSaved={addBlock} />
          )}

          {blocks.length > 0 && (
            <TouchableOpacity style={[s.primaryBtn, { marginTop: 24 }]} onPress={handleDone}>
              <Text style={s.primaryBtnText}>✓ Done — {blocks.length} block{blocks.length !== 1 ? 's' : ''} saved</Text>
            </TouchableOpacity>
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

  // Multi-block editor
  blockList: { backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16, overflow: 'hidden' },
  blockListHeader: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  blockRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  blockRowEmoji: { fontSize: 18 },
  blockRowLabel: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '500' },
  blockRowIndex: { fontSize: 11, color: '#9CA3AF', backgroundColor: '#F3F4F6', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },

  addBlockTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeCard: { width: '30%', alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: 'white', gap: 4 },
  typeCardActive: { borderColor: '#7C3AED', backgroundColor: '#F5F3FF' },
  typeCardEmoji: { fontSize: 22 },
  typeCardLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  typeCardLabelActive: { color: '#7C3AED' },

  inlineEditor: { backgroundColor: 'white', borderRadius: 14, borderWidth: 1, borderColor: '#DDD6FE', padding: 16, marginBottom: 16, gap: 8 },
  saveBlockBtn: { backgroundColor: '#7C3AED', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  saveBlockBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },

  modalDoneBtn: { backgroundColor: '#059669', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  modalDoneText: { color: 'white', fontWeight: '700', fontSize: 13 },

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
