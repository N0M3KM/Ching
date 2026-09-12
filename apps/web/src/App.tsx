import { useCallback, useEffect, useRef, useState } from 'react';
import { GAME_TYPES, LOCALES } from '@ching/contracts';
import type {
  GameSession,
  GameType,
  LessonResponse,
  Locale,
  RoundAnswer,
  RoundResult,
  SessionResult,
  TrackSummary,
} from '@ching/contracts';

import { api, lessonSchema, resultSchema, sessionSchema, tracksSchema } from './schemas.js';
import { copy, gameHint, gameName } from './i18n.js';
import { emptyProgress, LocalStorageProgressStore, recordResult } from './progress.js';
import { Round } from './Round.js';
import { Dictionary } from './Dictionary.js';

type Screen = 'learn' | 'review' | 'dictionary' | 'launch' | 'play' | 'results';

const GAME_SYMBOLS: Record<GameType, string> = {
  'tone-match': '↗',
  'pinyin-match': 'pīn',
  'listen-pick': '◖',
  'character-trace': '字',
};

export default function App() {
  const [locale, setLocale] = useState<Locale>('en');
  const [tracks, setTracks] = useState<readonly TrackSummary[]>([]);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [screen, setScreen] = useState<Screen>('learn');

  const [lesson, setLesson] = useState<LessonResponse | null>(null);
  const [game, setGame] = useState<GameType>('tone-match');
  const [session, setSession] = useState<GameSession | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);

  const [answers, setAnswers] = useState<RoundAnswer[]>([]);
  const [feedback, setFeedback] = useState<RoundResult | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const [store] = useState(() => new LocalStorageProgressStore(() => window.localStorage));
  const [progress, setProgress] = useState(() => store.load());

  const headingRef = useRef<HTMLDivElement>(null);
  const copyText = copy(locale);

  // Synchronize document language and focus on screen navigation
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [screen, roundIndex]);

  // Data fetching
  const refreshTracks = useCallback(async () => {
    setError(false);
    try {
      const data = await api('tracks', tracksSchema);
      setTracks(data.tracks);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void refreshTracks();
  }, [refreshTracks]);

  // Navigation Guard
  const navigate = (nextScreen: 'learn' | 'review' | 'dictionary') => {
    if (screen === 'play' && !window.confirm(copyText.confirmExit)) return;
    setScreen(nextScreen);
    setError(false);
  };

  // Game Lifecycle Handlers
  async function handleLaunch(lessonId: string, chosenGame: GameType) {
    setBusy(true);
    setError(false);
    try {
      const data = await api(`lessons/${encodeURIComponent(lessonId)}`, lessonSchema);
      setLesson(data);
      setGame(chosenGame);
      setScreen('launch');
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function handleStartSession(chosenGame = game, seed?: number) {
    if (!lesson) return;
    setBusy(true);
    setError(false);
    try {
      const payload = {
        lessonId: lesson.lesson.id,
        game: chosenGame,
        ...(seed !== undefined && { seed }),
      };
      const newSession = await api('minigames/sessions', sessionSchema, payload);

      setSession(newSession);
      setGame(chosenGame);
      setRoundIndex(0);
      setAnswers([]);
      setFeedback(null);
      setResult(null);
      setScreen('play');
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const handleAnswer = useCallback(
    async (roundAnswer: RoundAnswer) => {
      if (!session) throw new Error('Missing active session');

      const endpoint = `minigames/sessions/${encodeURIComponent(session.id)}/grade`;
      const response = await api(endpoint, resultSchema, { answers: [roundAnswer] });

      setFeedback(response.rounds[0]!);
      setAnswers((prev) => [...prev.filter((a) => a.roundId !== roundAnswer.roundId), roundAnswer]);
    },
    [session]
  );

  async function handleNextRound() {
    if (!session) return;

    if (roundIndex < session.rounds.length - 1) {
      setRoundIndex((prev) => prev + 1);
      setFeedback(null);
      return;
    }

    setBusy(true);
    setError(false);
    try {
      const endpoint = `minigames/sessions/${encodeURIComponent(session.id)}/grade`;
      const finishedResult = await api(endpoint, resultSchema, { answers });
      const updatedProgress = recordResult(progress, session, finishedResult);

      store.save(updatedProgress);
      setProgress(updatedProgress);
      setResult(finishedResult);
      setScreen('results');
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  function handleResetProgress() {
    if (window.confirm(copyText.resetConfirm)) {
      store.clear();
      setProgress(emptyProgress());
      setScreen('learn');
    }
  }

  const selectedTrack = tracks[activeTrackIndex];

  return (
    <div className="app-shell">
      <a className="skip-link" href="#content">
        Skip to content / 跳至内容 / 跳至內容
      </a>

      <AppSidebar
        copyText={copyText}
        screen={screen}
        reviewCount={Object.keys(progress.review).length}
        onNavigate={navigate}
        onReset={handleResetProgress}
      />

      <div className="workspace">
        <header className="topbar">
          <span className="breadcrumb">
            Ching <span>/</span>{' '}
            {screen === 'dictionary'
              ? copyText.dictionary
              : screen === 'review'
              ? copyText.review
              : copyText.learn}
          </span>
          <div className="top-actions">
            <span className="xp-pill">✧ {progress.xp} XP</span>
            <label className="sr-only" htmlFor="locale">
              {copyText.language}
            </label>
            <select
              id="locale"
              value={locale}
              onChange={(e) => {
                const val = e.target.value;
                if (LOCALES.includes(val as Locale)) setLocale(val as Locale);
              }}
            >
              <option value="en">English</option>
              <option value="zh-Hans">简体中文</option>
              <option value="zh-Hant">繁體中文</option>
            </select>
          </div>
        </header>

        <main id="content" ref={headingRef} tabIndex={-1}>
          {store.warning && (
            <p role="status" className="notice">
              {copyText.savingError}
            </p>
          )}

          {error && (
            <div role="alert" className="notice">
              {copyText.error}{' '}
              <button
                onClick={() =>
                  void (screen === 'results' || screen === 'play' ? handleNextRound() : refreshTracks())
                }
              >
                {copyText.retry}
              </button>
            </div>
          )}

          {screen === 'learn' && (
            <LearnScreen
              copyText={copyText}
              locale={locale}
              progress={progress}
              tracks={tracks}
              activeTrack={selectedTrack}
              activeTrackIndex={activeTrackIndex}
              busy={busy}
              onSelectTrack={setActiveTrackIndex}
              onLaunchLesson={handleLaunch}
            />
          )}

          {screen === 'launch' && lesson && (
            <LaunchScreen
              copyText={copyText}
              locale={locale}
              lesson={lesson}
              game={game}
              busy={busy}
              onNavigate={navigate}
              onStart={() => void handleStartSession()}
            />
          )}

          {screen === 'play' && session && lesson && (
            <PlayScreen
              copyText={copyText}
              locale={locale}
              session={session}
              lesson={lesson}
              game={game}
              roundIndex={roundIndex}
              feedback={feedback}
              busy={busy}
              onNavigate={navigate}
              onAnswer={handleAnswer}
              onNextRound={() => {
                if (!busy) void handleNextRound();
              }}
            />
          )}

          {screen === 'results' && session && result && (
            <ResultsScreen
              copyText={copyText}
              locale={locale}
              game={game}
              session={session}
              result={result}
              busy={busy}
              onNavigate={navigate}
              onStartSession={(chosenGame, seed) => void handleStartSession(chosenGame, seed)}
            />
          )}

          {screen === 'dictionary' && <Dictionary locale={locale} />}

          {screen === 'review' && (
            <ReviewScreen copyText={copyText} progress={progress} onNavigate={navigate} />
          )}

          <AppFooter copyText={copyText} />
        </main>
      </div>
    </div>
  );
}

// Sub-components for visual separation and maintainability

interface AppSidebarProps {
  copyText: ReturnType<typeof copy>;
  screen: Screen;
  reviewCount: number;
  onNavigate: (screen: 'learn' | 'review' | 'dictionary') => void;
  onReset: () => void;
}

function AppSidebar({ copyText, screen, reviewCount, onNavigate, onReset }: AppSidebarProps) {
  const navItems = [
    { key: 'learn', icon: '▦' },
    { key: 'review', icon: '↻' },
    { key: 'dictionary', icon: '文' },
  ] as const;

  return (
    <aside className="sidebar">
      <button className="brand" aria-label={copyText.home} onClick={() => onNavigate('learn')}>
        <span className="brand-mark">青</span>
        <span>
          ching<span className="brand-dot">.</span>
        </span>
      </button>
      <div className="brand-sub">MANDARIN, IN PLAY</div>

      <nav aria-label={copyText.courses}>
        {navItems.map(({ key, icon }) => {
          const isActive =
            screen === key || (key === 'learn' && ['launch', 'play', 'results'].includes(screen));

          return (
            <button
              key={key}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(key)}
            >
              <span aria-hidden="true">{icon}</span>
              {copyText[key]}
              {key === 'review' && reviewCount > 0 && <span className="count">{reviewCount}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="tiny-sprout" aria-hidden="true">
          ✳
        </div>
        <p>{copyText.local}</p>
        <button className="quiet" onClick={onReset}>
          {copyText.reset}
        </button>
      </div>
    </aside>
  );
}

function LearnScreen({
  copyText,
  locale,
  progress,
  tracks,
  activeTrack,
  activeTrackIndex,
  busy,
  onSelectTrack,
  onLaunchLesson,
}: {
  copyText: ReturnType<typeof copy>;
  locale: Locale;
  progress: any;
  tracks: readonly TrackSummary[];
  activeTrack?: TrackSummary;
  activeTrackIndex: number;
  busy: boolean;
  onSelectTrack: (index: number) => void;
  onLaunchLesson: (lessonId: string, game: GameType) => void;
}) {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">小步前进 · SMALL STEPS, REAL PROGRESS</p>
          <h1>{copyText.tagline}</h1>
          <p className="hero-copy">{copyText.intro}</p>
          <div className="hero-stats">
            <span>
              <strong>{progress.streak}</strong> {copyText.streak}
            </span>
            <span>
              <strong>{progress.completedLessonIds.length}</strong> {copyText.completed}
            </span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <div className="character-tile">
            好<span>hǎo</span>
          </div>
          <div className="float-tone">↗</div>
          <div className="float-star">✳</div>
          <div className="float-label">你好，世界</div>
        </div>
      </section>

      <section className="course-section">
        <div className="section-heading">
          <div>
            <h2>{copyText.courses}</h2>
            <p className="muted">{copyText.courseHint}</p>
          </div>
          <span className="small-label">01 — 03</span>
        </div>

        <div className="track-tabs" role="group" aria-label={copyText.courses}>
          {tracks.map((t, i) => (
            <button key={t.id} aria-pressed={activeTrackIndex === i} onClick={() => onSelectTrack(i)}>
              <span className="tab-index">0{i + 1}</span>
              {t.title[locale]}
            </button>
          ))}
        </div>

        {activeTrack ? (
          <div className="course-card">
            <div className="course-intro">
              <span className="eyebrow">{activeTrack.title[locale]}</span>
              <h3>{activeTrack.lessons[0]?.title[locale]}</h3>
              <p>{activeTrack.description[locale]}</p>
              <div className="tags">
                <span>
                  {activeTrack.difficulty.roundCount} {copyText.round}
                </span>
                <span>
                  {Math.round(activeTrack.difficulty.completionAccuracy * 100)}% {copyText.threshold}
                </span>
                <span>
                  {activeTrack.difficulty.timeLimitSeconds === null
                    ? copyText.untimed
                    : `${activeTrack.difficulty.timeLimitSeconds}s`}
                </span>
              </div>
              <p className="muted">{copyText.allGames}</p>
            </div>

            {activeTrack.lessons.map((lesson) => (
              <div className="games-grid" key={lesson.id}>
                {GAME_TYPES.map((g) => {
                  const isCompleted = progress.completedGameKeys?.includes(`${lesson.id}|${g}`);
                  return (
                    <button
                      className="game-card"
                      key={g}
                      disabled={busy}
                      onClick={() => void onLaunchLesson(lesson.id, g)}
                    >
                      <span className={`game-symbol ${g}`}>{GAME_SYMBOLS[g]}</span>
                      <span className="game-name">{gameName(g, copyText)}</span>
                      <span className="game-hint">{gameHint(g, copyText)}</span>
                      <span className="game-action">
                        {isCompleted ? `✓ ${copyText.completed}` : `${copyText.study} →`}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <p role="status">{copyText.loading}</p>
        )}
      </section>
    </>
  );
}

function LaunchScreen({
  copyText,
  locale,
  lesson,
  game,
  busy,
  onNavigate,
  onStart,
}: {
  copyText: ReturnType<typeof copy>;
  locale: Locale;
  lesson: LessonResponse;
  game: GameType;
  busy: boolean;
  onNavigate: (screen: 'learn') => void;
  onStart: () => void;
}) {
  return (
    <section className="panel launch">
      <button className="quiet" onClick={() => onNavigate('learn')}>
        ← {copyText.back}
      </button>
      <p className="eyebrow">{copyText.goal}</p>
      <h1>{lesson.lesson.title[locale]}</h1>
      <p className="lead">{lesson.lesson.goal[locale]}</p>
      <p>{copyText.referenceHint}</p>

      <div className="launch-game">
        <span className="game-symbol">{GAME_SYMBOLS[game]}</span>
        <div>
          <h2>{gameName(game, copyText)}</h2>
          <p>{gameHint(game, copyText)}</p>
        </div>
      </div>

      <div className="tags">
        <span>
          {lesson.difficulty.roundCount} {copyText.round}
        </span>
        <span>
          {Math.round(lesson.difficulty.completionAccuracy * 100)}% {copyText.threshold}
        </span>
      </div>

      <p className="muted">{copyText.timeNotice}</p>
      <button className="primary" disabled={busy} onClick={onStart}>
        {busy ? copyText.loading : copyText.start} →
      </button>
      <button disabled={busy} onClick={onStart}>
        {copyText.skipCard}
      </button>
    </section>
  );
}

function PlayScreen({
  copyText,
  locale,
  session,
  lesson,
  game,
  roundIndex,
  feedback,
  busy,
  onNavigate,
  onAnswer,
  onNextRound,
}: {
  copyText: ReturnType<typeof copy>;
  locale: Locale;
  session: GameSession;
  lesson: LessonResponse;
  game: GameType;
  roundIndex: number;
  feedback: RoundResult | null;
  busy: boolean;
  onNavigate: (screen: 'learn') => void;
  onAnswer: (a: RoundAnswer) => void;
  onNextRound: () => void;
}) {
  return (
    <section className="panel play-panel" aria-busy={busy}>
      <div className="session-header">
        <button className="quiet" onClick={() => onNavigate('learn')}>
          ← {copyText.exit}
        </button>
        <span>
          {gameName(game, copyText)} · {copyText.round} {roundIndex + 1} {copyText.of}{' '}
          {session.rounds.length}
        </span>
      </div>

      <progress value={roundIndex} max={session.rounds.length} aria-label={copyText.round} />

      <Round
        key={`${session.id}-${roundIndex}`}
        round={session.rounds[roundIndex]!}
        game={game}
        level={lesson.lesson.track}
        locale={locale}
        feedback={feedback}
        onAnswer={onAnswer}
        onNext={onNextRound}
        last={roundIndex === session.rounds.length - 1}
      />
    </section>
  );
}

function ResultsScreen({
  copyText,
  locale,
  game,
  session,
  result,
  busy,
  onNavigate,
  onStartSession,
}: {
  copyText: ReturnType<typeof copy>;
  locale: Locale;
  game: GameType;
  session: GameSession;
  result: SessionResult;
  busy: boolean;
  onNavigate: (screen: 'learn') => void;
  onStartSession: (game: GameType, seed?: number) => void;
}) {
  const currentGameIndex = GAME_TYPES.indexOf(game);
  const nextGame = GAME_TYPES[currentGameIndex + 1];

  return (
    <section className="panel results">
      <div className="result-emblem" aria-hidden="true">
        {result.completed ? '✳' : '↻'}
      </div>
      <p className="eyebrow">{copyText.finish}</p>
      <h1>{result.completed ? copyText.passed : copyText.notPassed}</h1>

      <div className="result-stats">
        <div>
          <strong>{Math.round(result.accuracy * 100)}%</strong>
          <span>{copyText.accuracy}</span>
        </div>
        <div>
          <strong>+{result.earnedXp}</strong>
          <span>{copyText.xp}</span>
        </div>
        <div>
          <strong>{result.speedBonus}</strong>
          <span>{copyText.bonus}</span>
        </div>
      </div>

      <h2>{copyText.mistakes}</h2>
      {result.mistakes.length ? (
        result.mistakes.map((m) => (
          <div className="mistake" key={m.roundId}>
            <p>{m.explanation[locale]}</p>
          </div>
        ))
      ) : (
        <p>{copyText.noMistakes}</p>
      )}

      <div className="button-row">
        <button className="primary" disabled={busy} onClick={() => onStartSession(game, session.seed)}>
          {copyText.retrySame}
        </button>
        <button disabled={busy} onClick={() => onStartSession(game)}>
          {copyText.newRound}
        </button>
        {currentGameIndex < 3 && nextGame && (
          <button disabled={busy} onClick={() => onStartSession(nextGame)}>
            {copyText.nextGame} →
          </button>
        )}
        <button onClick={() => onNavigate('learn')}>{copyText.back}</button>
      </div>
    </section>
  );
}

function ReviewScreen({
  copyText,
  progress,
  onNavigate,
}: {
  copyText: ReturnType<typeof copy>;
  progress: any;
  onNavigate: (screen: 'learn') => void;
}) {
  const reviewCards = Object.values(progress.review) as Array<{ vocabularyId: string; mistakes: number }>;

  return (
    <section className="panel">
      <p className="eyebrow">{copyText.review}</p>
      <h1>{copyText.reviewIntro}</h1>

      {reviewCards.length ? (
        reviewCards.map((card) => (
          <div className="dictionary-entry" key={card.vocabularyId}>
            <h2>{card.vocabularyId.replaceAll('-', ' ')}</h2>
            <p>
              {copyText.mistakes}: {card.mistakes}
            </p>
          </div>
        ))
      ) : (
        <p>{copyText.reviewEmpty}</p>
      )}

      <button className="primary" onClick={() => onNavigate('learn')}>
        {copyText.back}
      </button>
    </section>
  );
}

function AppFooter({ copyText }: { copyText: ReturnType<typeof copy> }) {
  return (
    <footer>
      <span>Ching · 0.0.1 pre-alpha</span>
      <details>
        <summary>{copyText.credits}</summary>
        <p>
          <a href="https://www.mdbg.net/chinese/dictionary?page=cedict" target="_blank" rel="noreferrer">
            CC-CEDICT contributors
          </a>{' '}
          ·{' '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">
            CC BY-SA 4.0
          </a>{' '}
          · curated subset, adapted pinyin and metadata.
        </p>
        <p>
          <a href="https://tatoeba.org/en/sentences/show/4869782" target="_blank" rel="noreferrer">
            Tatoeba #4869782 · zvzuibqx
          </a>{' '}
          · CC BY 2.0 FR; Ching translation and pinyin. Other practice sentences: Ching.
        </p>
        <p>Hanzi Writer · MIT. Stroke data: Make Me a Hanzi, Arphic Public License.</p>
      </details>
    </footer>
  );
}