import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

// ─── Types ────────────────────────────────────────────────────────────────────
type LessonContent = {
  id: string;
  contentType: string;
  body: string | null;
  mediaUrl: string | null;
  orderIndex: number;
};

type Exercise = {
  id: string;
  title: string;
  instructions: string | null;
  language: string;
  starterCode: string | null;
  solutionCode: string | null;
  expectedOutput: string | null;
  orderIndex: number;
};

type Asset = {
  id: string;
  assetType: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  fileSize: number | null;
};

type LessonData = {
  id: string;
  title: string;
  lessonType: string;
  lessonContents: LessonContent[];
  exercises: Exercise[];
  assets: Asset[];
  chapter: {
    title: string;
    course: { title: string; slug: string };
  };
};

// ─── Video Player ─────────────────────────────────────────────────────────────
function VideoPlayer({ url }: { url: string }) {
  const videoRef = useRef(null);
  return (
    <View style={vs.container}>
      <Video
        ref={videoRef}
        source={{ uri: url }}
        style={vs.video}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
      />
    </View>
  );
}

const vs = StyleSheet.create({
  container: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#000', marginBottom: 16 },
  video: { width: '100%', height: 220 },
});

// ─── PDF / File Block ─────────────────────────────────────────────────────────
function FileBlock({ url, fileName, mimeType }: { url: string; fileName: string; mimeType?: string | null }) {
  const isPdf = mimeType?.includes('pdf') || fileName.endsWith('.pdf');
  const isZip =
    mimeType?.includes('zip') ||
    fileName.endsWith('.zip') ||
    fileName.endsWith('.tar') ||
    fileName.endsWith('.gz');

  const emoji = isPdf ? '📄' : isZip ? '🗜️' : '📎';
  const label = isPdf ? 'Open PDF' : isZip ? 'Download ZIP' : 'Open File';

  return (
    <TouchableOpacity style={fb.card} onPress={() => Linking.openURL(url)}>
      <Text style={fb.emoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={fb.name} numberOfLines={2}>
          {fileName}
        </Text>
        <Text style={fb.sub}>Tap to {label.toLowerCase()}</Text>
      </View>
      <Text style={fb.arrow}>→</Text>
    </TouchableOpacity>
  );
}

const fb = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0F4FF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C7D7F5',
  },
  emoji: { fontSize: 32 },
  name: { fontSize: 14, fontWeight: '700', color: '#1E3A8A' },
  sub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  arrow: { fontSize: 18, color: '#3B82F6' },
});

// ─── Text Content ─────────────────────────────────────────────────────────────
function TextBlock({ body }: { body: string }) {
  const paragraphs = body.split('\n').filter((l) => l.trim().length > 0);
  return (
    <View style={tb.card}>
      {paragraphs.map((p, i) => {
        const isHeading = p.startsWith('## ') || p.startsWith('# ');
        const isCode =
          p.startsWith('`') || p.startsWith('    ') || p.startsWith('\t');
        const text = p.replace(/^#{1,3}\s/, '').replace(/^`+|`+$/g, '');
        if (isHeading) {
          return <Text key={i} style={tb.heading}>{text}</Text>;
        }
        if (isCode) {
          return (
            <View key={i} style={tb.codeBlock}>
              <Text style={tb.code}>{text}</Text>
            </View>
          );
        }
        return <Text key={i} style={tb.para}>{p}</Text>;
      })}
    </View>
  );
}

const tb = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  heading: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 8, marginTop: 4 },
  para: { fontSize: 14, color: '#374151', lineHeight: 24, marginBottom: 10 },
  codeBlock: { backgroundColor: '#1e1e1e', borderRadius: 8, padding: 12, marginBottom: 10 },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#d4d4d4',
    lineHeight: 20,
  },
});

// ─── Exercise Block ───────────────────────────────────────────────────────────
const JUDGE0_LANG: Record<string, number> = {
  java: 62,
  python: 71,
  c: 50,
  javascript: 63,
  typescript: 74,
};

function ExerciseBlock({ exercise }: { exercise: Exercise }) {
  const [code, setCode] = useState(exercise.starterCode ?? '');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  async function runCode() {
    setRunning(true);
    setOutput('');
    const langId = JUDGE0_LANG[exercise.language] ?? 71;
    try {
      const res = await fetch(`${BASE}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, languageId: langId }),
      });
      const data = await res.json();
      const result = data.stdout ?? data.stderr ?? data.compileOutput ?? '(no output)';
      setOutput(result.trim());
    } catch {
      setOutput('Network error — check connection.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <View style={ex.card}>
      <Text style={ex.title}>💻 {exercise.title}</Text>

      {exercise.instructions ? (
        <Text style={ex.instructions}>{exercise.instructions}</Text>
      ) : null}

      <Text style={ex.label}>Language: {exercise.language}</Text>

      <Text style={ex.label}>Your Code:</Text>
      <TextInput
        style={ex.codeEditor}
        value={code}
        onChangeText={setCode}
        multiline
        textAlignVertical="top"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        placeholderTextColor="#9CA3AF"
      />

      <TouchableOpacity
        style={[ex.runBtn, running && { opacity: 0.6 }]}
        onPress={runCode}
        disabled={running}
      >
        {running ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={ex.runBtnText}>▶ Run Code</Text>
        )}
      </TouchableOpacity>

      {!!output && (
        <View style={ex.outputBox}>
          <Text style={ex.outputLabel}>Output:</Text>
          <Text style={ex.outputText}>{output}</Text>
          {exercise.expectedOutput && (
            <Text
              style={[
                ex.feedbackText,
                output.trim() === exercise.expectedOutput.trim()
                  ? { color: '#16A34A' }
                  : { color: '#DC2626' },
              ]}
            >
              {output.trim() === exercise.expectedOutput.trim()
                ? '✓ Correct output!'
                : '✗ Output does not match expected'}
            </Text>
          )}
        </View>
      )}

      {exercise.solutionCode && (
        <TouchableOpacity
          style={ex.solutionBtn}
          onPress={() => {
            if (!showSolution) {
              Alert.alert(
                'Show Solution?',
                'This will reveal the answer.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Show', onPress: () => { setShowSolution(true); setCode(exercise.solutionCode!); } },
                ],
              );
            } else {
              setShowSolution(false);
              setCode(exercise.starterCode ?? '');
            }
          }}
        >
          <Text style={ex.solutionBtnText}>
            {showSolution ? '🙈 Hide Solution' : '👁 Show Solution'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const ex = StyleSheet.create({
  card: {
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    gap: 10,
  },
  title: { fontSize: 15, fontWeight: '800', color: '#4C1D95' },
  instructions: { fontSize: 13, color: '#374151', lineHeight: 22 },
  label: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  codeEditor: {
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    borderRadius: 10,
    padding: 12,
    minHeight: 160,
    lineHeight: 20,
  },
  runBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  runBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  outputBox: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  outputLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  outputText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#d4d4d4',
    lineHeight: 20,
  },
  feedbackText: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  solutionBtn: { alignItems: 'center', paddingVertical: 8 },
  solutionBtnText: { color: '#7C3AED', fontWeight: '700', fontSize: 13 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LessonScreen() {
  const { slug, lessonId } = useLocalSearchParams<{ slug: string; lessonId: string }>();
  const router = useRouter();

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${BASE}/courses/${slug}/lessons/${lessonId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(setLesson)
      .catch(() => setError('Could not load lesson content.'))
      .finally(() => setLoading(false));
  }, [lessonId]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !lesson) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.errorText}>{error || 'Lesson not found.'}</Text>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtnFallback}>
            <Text style={s.backBtnFallbackText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasContent =
    lesson.lessonContents.length > 0 ||
    lesson.exercises.length > 0 ||
    lesson.assets.length > 0;

  const typeIcon =
    lesson.lessonType === 'video'
      ? '🎥'
      : lesson.lessonType === 'pdf'
        ? '📄'
        : lesson.lessonType === 'exercise'
          ? '💻'
          : lesson.lessonType === 'mixed'
            ? '📚'
            : '📝';

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.backBtn}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.chapterLabel} numberOfLines={1}>
            {lesson.chapter.course.title} · {lesson.chapter.title}
          </Text>
          <Text style={s.lessonTitle} numberOfLines={2}>
            {typeIcon} {lesson.title}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!hasContent && (
          <View style={s.emptyCard}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyTitle}>No content yet</Text>
            <Text style={s.emptyDesc}>
              The instructor hasn't uploaded content for this lesson yet. Check back soon!
            </Text>
          </View>
        )}

        {/* Render each content block in order */}
        {lesson.lessonContents.map((content) => {
          if (content.contentType === 'text' && content.body) {
            return <TextBlock key={content.id} body={content.body} />;
          }
          if (content.contentType === 'video' && content.mediaUrl) {
            return <VideoPlayer key={content.id} url={content.mediaUrl} />;
          }
          // PDF, ZIP, file, image, or any other type with a URL → downloadable card
          if (content.mediaUrl) {
            const fileName = content.mediaUrl.split('/').pop() ?? 'file';
            const mimeMap: Record<string, string> = {
              pdf: 'application/pdf',
              image: 'image/jpeg',
              zip: 'application/zip',
              file: 'application/octet-stream',
            };
            return (
              <FileBlock
                key={content.id}
                url={content.mediaUrl}
                fileName={fileName}
                mimeType={mimeMap[content.contentType] ?? 'application/octet-stream'}
              />
            );
          }
          return null;
        })}

        {/* Exercises */}
        {lesson.exercises.map((exercise) => (
          <ExerciseBlock key={exercise.id} exercise={exercise} />
        ))}

        {/* Extra assets not already shown via lessonContents */}
        {lesson.assets
          .filter((a) => !lesson.lessonContents.some((c) => c.mediaUrl === a.fileUrl && c.mediaUrl != null))
          .map((asset) => (
            <FileBlock
              key={asset.id}
              url={asset.fileUrl}
              fileName={asset.fileName}
              mimeType={asset.mimeType}
            />
          ))}

        {/* Footer spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },

  header: {
    backgroundColor: '#4c0884',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { color: '#C4B5FD', fontSize: 13, fontWeight: '600' },
  chapterLabel: { fontSize: 11, color: '#C4B5FD', marginBottom: 2 },
  lessonTitle: { fontSize: 15, fontWeight: '800', color: 'white' },

  body: { padding: 16, paddingBottom: 40 },

  emptyCard: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#374151', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },

  errorText: { fontSize: 15, color: '#DC2626', marginBottom: 16, textAlign: 'center' },
  backBtnFallback: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backBtnFallbackText: { color: 'white', fontWeight: '700', fontSize: 14 },
});
