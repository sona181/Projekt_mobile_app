import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Dialog,
  Divider,
  Portal,
  ProgressBar,
  RadioButton,
  Snackbar,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { getCourse } from '../../../lib/course';
import type { Course, Exercise, ExerciseProgress, Lesson, Unit } from '../../../lib/types';
import { api } from '../../../src/services/api';

// ─── Progress Store ────────────────────────────────────────────────────────────

interface ProgressStore {
  progress: Record<string, Record<string, ExerciseProgress>>;
  mark: (courseId: string, exerciseId: string, viewed?: boolean) => void;
}

const useProgress = create<ProgressStore>((set) => ({
  progress: {},
  mark: (courseId, exerciseId, viewed = false) =>
    set((s) => ({
      progress: {
        ...s.progress,
        [courseId]: {
          ...s.progress[courseId],
          [exerciseId]: { completed: true, viewedSolution: viewed },
        },
      },
    })),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function checkOutput(expected: string | undefined, actual: string, matchType?: string): boolean {
  if (!expected) return true;
  const a = actual.trim();
  const e = expected.trim();
  if (matchType === 'contains') return a.includes(e);
  if (matchType === 'startsWith') return a.startsWith(e);
  if (matchType === 'runs') return true;
  return a === e;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LearnScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const theme = useTheme();

  const course = getCourse(slug ?? '');

  const [unitIdx, setUnitIdx] = useState(0);
  const [lessonIdx, setLessonIdx] = useState(0);
  const [exIdx, setExIdx] = useState(0);

  if (!course) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ margin: 24 }}>Course not found.</Text>
      </SafeAreaView>
    );
  }

  const unit: Unit = course.units[unitIdx];
  const lesson: Lesson = unit.lessons[lessonIdx];
  const exercise: Exercise = lesson.exercises[exIdx];

  const totalExercises = course.units.reduce(
    (s, u) => s + u.lessons.reduce((ls, l) => ls + l.exercises.length, 0),
    0,
  );
  const { progress, mark } = useProgress();
  const courseProgress = progress[course.id] ?? {};
  const completed = Object.keys(courseProgress).filter((k) => courseProgress[k]?.completed).length;
  const progressFraction = totalExercises > 0 ? completed / totalExercises : 0;

  function goNext() {
    const exs = lesson.exercises;
    if (exIdx < exs.length - 1) { setExIdx(exIdx + 1); return; }
    const lessons = unit.lessons;
    if (lessonIdx < lessons.length - 1) { setLessonIdx(lessonIdx + 1); setExIdx(0); return; }
    const units = course.units;
    if (unitIdx < units.length - 1) { setUnitIdx(unitIdx + 1); setLessonIdx(0); setExIdx(0); return; }
    router.back();
  }

  function goPrev() {
    if (exIdx > 0) { setExIdx(exIdx - 1); return; }
    if (lessonIdx > 0) {
      const prevLesson = unit.lessons[lessonIdx - 1];
      setLessonIdx(lessonIdx - 1);
      setExIdx(prevLesson.exercises.length - 1);
      return;
    }
    if (unitIdx > 0) {
      const prevUnit = course.units[unitIdx - 1];
      const prevLesson = prevUnit.lessons[prevUnit.lessons.length - 1];
      setUnitIdx(unitIdx - 1);
      setLessonIdx(prevUnit.lessons.length - 1);
      setExIdx(prevLesson.exercises.length - 1);
    }
  }

  const isFirst = unitIdx === 0 && lessonIdx === 0 && exIdx === 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: theme.colors.primary }}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerMeta}>
          <Text variant="labelSmall" style={styles.breadcrumb}>
            {unit.title} · {lesson.title}
          </Text>
          <Text variant="labelSmall" style={styles.counter}>
            {completed}/{totalExercises}
          </Text>
        </View>
        <ProgressBar
          progress={progressFraction}
          color={theme.colors.primary}
          style={styles.progressBar}
        />
      </View>

      {/* Exercise */}
      <ExerciseView
        key={exercise.id}
        exercise={exercise}
        course={course}
        isCompleted={!!courseProgress[exercise.id]?.completed}
        onComplete={(viewedSolution) => mark(course.id, exercise.id, viewedSolution)}
        onNext={goNext}
        onPrev={isFirst ? undefined : goPrev}
      />
    </SafeAreaView>
  );
}

// ─── Exercise View ─────────────────────────────────────────────────────────────

function ExerciseView({
  exercise,
  course,
  isCompleted,
  onComplete,
  onNext,
  onPrev,
}: {
  exercise: Exercise;
  course: Course;
  isCompleted: boolean;
  onComplete: (viewedSolution: boolean) => void;
  onNext: () => void;
  onPrev?: () => void;
}) {
  const theme = useTheme();
  const [answered, setAnswered] = useState(isCompleted);
  const [correct, setCorrect] = useState(isCompleted);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [hintIdx, setHintIdx] = useState(-1);
  const [snackMsg, setSnackMsg] = useState('');

  function handleCorrect() {
    setAnswered(true);
    setCorrect(true);
    if (!isCompleted) onComplete(false);
  }

  function handleWrong(msg?: string) {
    setSnackMsg(msg ?? 'Not quite — try again!');
  }

  function handleShowSolution() {
    setShowSolution(true);
    setAnswered(true);
    setCorrect(true);
    onComplete(true);
  }

  function showNextHint() {
    if (hintIdx < (exercise.hints?.length ?? 0) - 1) {
      setHintIdx((h) => h + 1);
      setSnackMsg(exercise.hints![hintIdx + 1]);
    }
  }

  const type = exercise.type;
  const isMCQ = type === 'multiple_choice' || type === 'mcq';
  const isTF = type === 'true_false';
  const isFill = type === 'fill_blank' || type === 'fill';
  const isPredict = type === 'predict_output';
  const isCode = type === 'code_exercise' || type === 'write' || type === 'fix';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.exScroll} keyboardShouldPersistTaps="handled">
        {/* Title + description */}
        <Surface style={styles.exCard} elevation={1}>
          <Text variant="titleMedium" style={styles.exTitle}>{exercise.title}</Text>
          <Text variant="bodyMedium" style={styles.exDesc}>{exercise.description}</Text>
        </Surface>

        {/* Exercise body */}
        {isMCQ && (
          <MCQExercise
            exercise={exercise}
            answered={answered}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            onExplain={() => setShowExplanation(true)}
          />
        )}
        {isTF && (
          <TrueFalseExercise
            exercise={exercise}
            answered={answered}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            onExplain={() => setShowExplanation(true)}
          />
        )}
        {isFill && (
          <FillBlankExercise
            exercise={exercise}
            answered={answered}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
          />
        )}
        {isPredict && (
          <PredictOutputExercise
            exercise={exercise}
            answered={answered}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
          />
        )}
        {isCode && (
          <CodeExercise
            exercise={exercise}
            course={course}
            answered={answered}
            showSolution={showSolution}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            onShowSolution={handleShowSolution}
          />
        )}

        {/* Hint + Solution buttons */}
        {!answered && (
          <View style={styles.hintRow}>
            {exercise.hints && exercise.hints.length > 0 && hintIdx < exercise.hints.length - 1 && (
              <Button mode="text" onPress={showNextHint} compact icon="lightbulb-outline">
                Hint
              </Button>
            )}
            {(isCode || isPredict || isFill) && exercise.solutionCode && (
              <Button mode="text" onPress={handleShowSolution} compact icon="eye-outline">
                Show solution
              </Button>
            )}
          </View>
        )}

        {/* Nav buttons */}
        <View style={styles.navRow}>
          {onPrev && (
            <Button mode="outlined" onPress={onPrev} style={styles.navBtn}>
              Previous
            </Button>
          )}
          <Button
            mode="contained"
            onPress={onNext}
            disabled={!answered}
            style={[styles.navBtn, { flex: 1 }]}
          >
            {correct ? 'Continue →' : 'Skip'}
          </Button>
        </View>
      </ScrollView>

      {/* Explanation dialog */}
      <Portal>
        <Dialog visible={showExplanation} onDismiss={() => setShowExplanation(false)}>
          <Dialog.Title>Explanation</Dialog.Title>
          <Dialog.Content>
            <Text>{exercise.explanation}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowExplanation(false)}>Got it</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!snackMsg}
        onDismiss={() => setSnackMsg('')}
        duration={2500}
      >
        {snackMsg}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

// ─── MCQ ──────────────────────────────────────────────────────────────────────

function MCQExercise({ exercise, answered, onCorrect, onWrong, onExplain }: {
  exercise: Exercise; answered: boolean;
  onCorrect: () => void; onWrong: (m?: string) => void; onExplain: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  function submit() {
    if (selected === null) return;
    if (selected === exercise.correctOption) {
      onCorrect();
      if (exercise.explanation) onExplain();
    } else {
      onWrong('Wrong answer — try again!');
      setSelected(null);
    }
  }

  return (
    <Surface style={styles.exCard} elevation={0}>
      <Text variant="bodyMedium" style={{ fontWeight: '600', marginBottom: 10 }}>
        {exercise.question}
      </Text>
      <RadioButton.Group
        onValueChange={(v) => !answered && setSelected(Number(v))}
        value={selected?.toString() ?? ''}
      >
        {exercise.options?.map((opt, i) => (
          <TouchableOpacity key={i} onPress={() => !answered && setSelected(i)}>
            <View style={[styles.optionRow, selected === i && styles.optionSelected]}>
              <RadioButton value={i.toString()} disabled={answered} />
              <Text style={styles.optionText}>{opt}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </RadioButton.Group>
      {!answered && (
        <Button mode="contained" onPress={submit} style={{ marginTop: 12 }} disabled={selected === null}>
          Check
        </Button>
      )}
      {answered && <Text style={styles.correct}>✓ Correct!</Text>}
    </Surface>
  );
}

// ─── True/False ───────────────────────────────────────────────────────────────

function TrueFalseExercise({ exercise, answered, onCorrect, onWrong, onExplain }: {
  exercise: Exercise; answered: boolean;
  onCorrect: () => void; onWrong: (m?: string) => void; onExplain: () => void;
}) {
  function submit(answer: boolean) {
    if (answer === exercise.correctAnswer) {
      onCorrect();
      if (exercise.explanation) onExplain();
    } else {
      onWrong('Not quite — think again!');
    }
  }

  return (
    <Surface style={styles.exCard} elevation={0}>
      <Text variant="bodyMedium" style={{ fontWeight: '600', marginBottom: 16 }}>
        {exercise.question}
      </Text>
      {!answered ? (
        <View style={styles.tfRow}>
          <Button mode="contained" onPress={() => submit(true)} style={styles.tfBtn} buttonColor="#16A34A">
            True
          </Button>
          <Button mode="contained" onPress={() => submit(false)} style={styles.tfBtn} buttonColor="#DC2626">
            False
          </Button>
        </View>
      ) : (
        <Text style={styles.correct}>✓ Correct!</Text>
      )}
    </Surface>
  );
}

// ─── Fill in the Blank ────────────────────────────────────────────────────────

function FillBlankExercise({ exercise, answered, onCorrect, onWrong }: {
  exercise: Exercise; answered: boolean;
  onCorrect: () => void; onWrong: (m?: string) => void;
}) {
  const blanks = exercise.blanks ?? [];
  const [values, setValues] = useState<string[]>(blanks.map(() => ''));

  function submit() {
    const allCorrect = blanks.every((b, i) =>
      values[i].trim().toLowerCase() === b.answer.toLowerCase(),
    );
    if (allCorrect) onCorrect();
    else onWrong('Some blanks are wrong — check again!');
  }

  const parts = (exercise.codeTemplate ?? '').split('___');

  return (
    <Surface style={styles.exCard} elevation={0}>
      <Text variant="labelSmall" style={styles.codeLabel}>Fill in the blanks:</Text>
      <View style={styles.codeBlock}>
        {parts.map((part, i) => (
          <View key={i} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
            <Text style={styles.code}>{part}</Text>
            {i < blanks.length && (
              <TextInput
                value={values[i]}
                onChangeText={(t) => {
                  const next = [...values];
                  next[i] = t;
                  setValues(next);
                }}
                style={styles.blankInput}
                mode="outlined"
                dense
                editable={!answered}
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
          </View>
        ))}
      </View>
      {!answered ? (
        <Button mode="contained" onPress={submit} style={{ marginTop: 12 }}>
          Check
        </Button>
      ) : (
        <Text style={styles.correct}>✓ Correct!</Text>
      )}
    </Surface>
  );
}

// ─── Predict Output ───────────────────────────────────────────────────────────

function PredictOutputExercise({ exercise, answered, onCorrect, onWrong }: {
  exercise: Exercise; answered: boolean;
  onCorrect: () => void; onWrong: (m?: string) => void;
}) {
  const [answer, setAnswer] = useState('');

  function submit() {
    if (checkOutput(exercise.expectedOutput, answer, exercise.matchType)) onCorrect();
    else onWrong('Not quite — check your prediction!');
  }

  return (
    <Surface style={styles.exCard} elevation={0}>
      {exercise.code && (
        <>
          <Text variant="labelSmall" style={styles.codeLabel}>Code:</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.code}>{exercise.code}</Text>
          </View>
          <Divider style={{ marginVertical: 12 }} />
        </>
      )}
      <Text variant="labelSmall" style={styles.codeLabel}>What will this print?</Text>
      <TextInput
        value={answer}
        onChangeText={setAnswer}
        mode="outlined"
        multiline
        placeholder="Type your prediction…"
        style={styles.predictInput}
        editable={!answered}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {!answered ? (
        <Button mode="contained" onPress={submit} style={{ marginTop: 12 }} disabled={!answer.trim()}>
          Check
        </Button>
      ) : (
        <Text style={styles.correct}>✓ Correct!</Text>
      )}
    </Surface>
  );
}

// ─── Code Exercise ────────────────────────────────────────────────────────────

function CodeExercise({ exercise, course, answered, showSolution, onCorrect, onWrong, onShowSolution }: {
  exercise: Exercise; course: Course; answered: boolean; showSolution: boolean;
  onCorrect: () => void; onWrong: (m?: string) => void; onShowSolution: () => void;
}) {
  const [code, setCode] = useState(
    showSolution ? (exercise.solutionCode ?? exercise.starterCode ?? '') : (exercise.starterCode ?? ''),
  );
  const [output, setOutput] = useState<{ stdout: string | null; stderr: string | null; compileOutput: string | null; status: string } | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (showSolution && exercise.solutionCode) setCode(exercise.solutionCode);
  }, [showSolution]);

  async function runCode() {
    setRunning(true);
    setOutput(null);
    try {
      const res = await api.post('/execute', { code, languageId: course.languageId });
      const data = res.data;
      setOutput(data);
      const stdout = data.stdout?.trim() ?? '';
      if (checkOutput(exercise.expectedOutput, stdout, exercise.matchType)) {
        onCorrect();
      } else if (exercise.matchType !== 'runs') {
        onWrong('Output does not match — keep trying!');
      } else {
        onCorrect();
      }
    } catch {
      setOutput({ stdout: null, stderr: 'Network error — check your connection.', compileOutput: null, status: 'Error' });
    } finally {
      setRunning(false);
    }
  }

  return (
    <View>
      <Surface style={styles.exCard} elevation={0}>
        <Text variant="labelSmall" style={styles.codeLabel}>Your code:</Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          mode="outlined"
          multiline
          style={styles.codeEditor}
          editable={!answered || showSolution}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
        />
        <Button
          mode="contained"
          onPress={runCode}
          loading={running}
          disabled={running || answered}
          icon="play"
          style={{ marginTop: 10 }}
        >
          Run
        </Button>
      </Surface>

      {output && (
        <Surface style={[styles.exCard, { marginTop: 8 }]} elevation={0}>
          <Text variant="labelSmall" style={styles.codeLabel}>Output:</Text>
          {output.compileOutput ? (
            <Text style={[styles.code, { color: '#DC2626' }]}>{output.compileOutput}</Text>
          ) : null}
          {output.stderr ? (
            <Text style={[styles.code, { color: '#DC2626' }]}>{output.stderr}</Text>
          ) : null}
          {output.stdout ? (
            <Text style={styles.code}>{output.stdout}</Text>
          ) : null}
          {!output.stdout && !output.stderr && !output.compileOutput && (
            <Text style={[styles.code, { color: '#999' }]}>(no output)</Text>
          )}
          {answered && <Text style={styles.correct}>✓ Correct!</Text>}
        </Surface>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, backgroundColor: '#fff', elevation: 2 },
  backBtn: { marginBottom: 4 },
  headerMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  breadcrumb: { color: '#555', flex: 1 },
  counter: { color: '#888' },
  progressBar: { height: 6, borderRadius: 3 },
  exScroll: { padding: 16, paddingBottom: 40 },
  exCard: { borderRadius: 12, padding: 16, marginBottom: 12, backgroundColor: '#fff' },
  exTitle: { fontWeight: '700', marginBottom: 6 },
  exDesc: { color: '#555', lineHeight: 22 },
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, marginBottom: 4, borderWidth: 1, borderColor: '#e0e0e0' },
  optionSelected: { borderColor: '#1a56db', backgroundColor: '#f0f5ff' },
  optionText: { flex: 1, fontSize: 14 },
  tfRow: { flexDirection: 'row', gap: 12 },
  tfBtn: { flex: 1 },
  correct: { color: '#16A34A', fontWeight: '700', marginTop: 10, fontSize: 16 },
  codeLabel: { color: '#888', marginBottom: 6, letterSpacing: 0.5 },
  codeBlock: { backgroundColor: '#1e1e1e', borderRadius: 8, padding: 12, marginBottom: 4 },
  code: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13, color: '#d4d4d4', lineHeight: 20 },
  blankInput: { minWidth: 80, maxWidth: 120, marginHorizontal: 4, backgroundColor: '#fff', height: 36 },
  predictInput: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', minHeight: 80, backgroundColor: '#fff' },
  codeEditor: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', minHeight: 160, backgroundColor: '#fff', fontSize: 12 },
  hintRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  navBtn: {},
});
