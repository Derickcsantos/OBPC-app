import { Search, ChevronRight, ChevronLeft, Highlighter, Underline, NotebookPen, X, Eraser } from 'lucide-react-native';
import { Icon } from '../components/Icon';
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  PanResponder,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  View,
} from 'react-native';
import {
  AppText as Text,
  AppTextInput as TextInput,
} from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getBibleVersions,
  getBookVerses,
  getBooks,
  getChapters,
  getVerses,
  getHighlights,
  putHighlight,
  deleteHighlight,
  searchBible,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AnnotationEditor } from './AnnotationsScreen';
import { colors } from '../theme/colors';
import { spacing, typography, radius } from '../theme/tokens';
import { BibleHighlight, BibleReference, BibleVersion, Book, Chapter, HighlightColor, HighlightStyle, Verse } from '../types';

type Step = 'books' | 'chapters' | 'verses';
type TestamentFilter = 'all' | 1 | 2;

const testamentLabel = (testament?: number) => {
  if (testament === 1) {
    return 'Antigo Testamento';
  }

  if (testament === 2) {
    return 'Novo Testamento';
  }

  return 'Biblia';
};

const uniqueVerses = (items: Verse[]) => {
  const seen = new Set<string>();

  return items.filter((item, index) => {
    const cleanText = (item.text || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    const key = `${item.book ?? ''}-${item.chapter ?? ''}-${item.verse ?? index}-${cleanText}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const isHorizontalChapterSwipe = (dx: number, dy: number) =>
  Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) * 1.1;

const getVersionCode = (version: BibleVersion) =>
  String(version.code ?? version.id ?? version.version ?? 'nvi').toLowerCase();

const getVersionLabel = (version?: BibleVersion | null) => {
  if (!version) {
    return 'NVI';
  }

  return String(
    version.name ??
      version.abbreviation ??
      version.abbrev ??
      version.code ??
      version.id,
  ).toUpperCase();
};

const normalizeBookName = (value?: string) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const chaptersFromVerses = (
  book: Book,
  items: Verse[],
  version: string,
): Chapter[] => {
  const chapterNumbers = Array.from(
    new Set(
      items
        .map(item => item.chapter)
        .filter((chapter): chapter is number => typeof chapter === 'number'),
    ),
  ).sort((a, b) => a - b);

  return chapterNumbers.map(chapter => ({
    id: chapter,
    book: book.id,
    testament: book.testament,
    version,
    chapter,
  }));
};

export interface BibliaScreenHandle {
  handleBack: () => boolean;
}

export const BibliaScreen = React.forwardRef<BibliaScreenHandle, {
  onReadingModeChange?: (active: boolean) => void;
}>(({
  onReadingModeChange,
}, ref) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomSafeSpacing = Math.max(insets.bottom, 12);
  const [testament, setTestament] = useState<TestamentFilter>('all');
  const [books, setBooks] = useState<Book[]>([]);
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState('nvi');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [bookVerses, setBookVerses] = useState<Verse[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [step, setStep] = useState<Step>('books');
  const [error, setError] = useState('');
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [highlights, setHighlights] = useState<BibleHighlight[]>([]);
  const [highlightStyle, setHighlightStyle] = useState<HighlightStyle | null>(null);
  const [savingHighlight, setSavingHighlight] = useState(false);
  const [annotationOpen, setAnnotationOpen] = useState(false);
  const selectedBookIdRef = useRef<number | null>(null);
  const verseScrollRef = useRef<ScrollView>(null);

  const displayedVerses = useMemo(() => uniqueVerses(verses), [verses]);
  const displayedSearchResults = useMemo(
    () => uniqueVerses(searchResults),
    [searchResults],
  );
  const selectedVersionDetails = useMemo(
    () => versions.find(version => getVersionCode(version) === selectedVersion),
    [selectedVersion, versions],
  );

  const loadVersions = useCallback(async () => {
    try {
      const loadedVersions = await getBibleVersions();
      setVersions(loadedVersions);

      if (
        loadedVersions.length &&
        !loadedVersions.some(version => getVersionCode(version) === 'nvi')
      ) {
        setSelectedVersion(getVersionCode(loadedVersions[0]));
      }
    } catch (requestError) {
      console.error('Erro ao carregar versoes:', requestError);
    }
  }, []);

  const loadBooks = useCallback(async (nextTestament: TestamentFilter) => {
    setLoading(true);
    setError('');

    try {
      const testamentId = nextTestament === 'all' ? undefined : nextTestament;
      setBooks(await getBooks(testamentId));
      setTestament(nextTestament);
      setStep('books');
      setSelectedBook(null);
      selectedBookIdRef.current = null;
      setSelectedChapter(null);
      setChapters([]);
      setBookVerses([]);
      setVerses([]);
      setSearchResults([]);
    } catch (requestError) {
      setError('Nao foi possivel carregar os livros da Biblia.');
      console.error('Erro ao carregar livros:', requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  useEffect(() => {
    loadBooks('all');
  }, [loadBooks]);

  useEffect(() => {
    onReadingModeChange?.(step === 'verses');

    return () => onReadingModeChange?.(false);
  }, [onReadingModeChange, step]);

  useEffect(() => {
    if (step !== 'verses') {
      return;
    }

    requestAnimationFrame(() => {
      verseScrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  }, [selectedChapter, step]);

  useEffect(() => {
    setSelectedVerses(new Set());
    setHighlightStyle(null);
  }, [selectedBook?.id, selectedChapter, selectedVersion]);

  useEffect(() => {
    if (!user || step !== 'verses' || !selectedBook || !selectedChapter) {
      setHighlights([]);
      return;
    }
    let active = true;
    getHighlights(selectedVersion, selectedBook.id, selectedChapter)
      .then(items => { if (active) setHighlights(items); })
      .catch(loadError => console.error('Erro ao carregar destaques:', loadError));
    return () => { active = false; };
  }, [selectedBook, selectedChapter, selectedVersion, step, user]);

  const handleSelectBook = async (book: Book) => {
    setSelectedBook(book);
    selectedBookIdRef.current = book.id;
    setSelectedChapter(null);
    setLoading(true);
    setError('');

    try {
      setChapters(await getChapters(book.id, selectedVersion));
      setStep('chapters');
      getBookVerses(book.id, selectedVersion)
        .then(loadedVerses => {
          if (selectedBookIdRef.current !== book.id) {
            return;
          }

          const loadedChapters = chaptersFromVerses(
            book,
            loadedVerses,
            selectedVersion,
          );
          setBookVerses(loadedVerses);
          setChapters(currentChapters =>
            loadedChapters.length > currentChapters.length
              ? loadedChapters
              : currentChapters,
          );
        })
        .catch(requestError => {
          console.error('Erro ao pre-carregar livro:', requestError);
        });
    } catch (requestError) {
      setError('Nao foi possivel carregar os capitulos.');
      console.error('Erro ao carregar capitulos:', requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChapter = useCallback(async (chapterNumber: number) => {
    if (!selectedBook) {
      return;
    }

    const cachedChapterVerses = bookVerses.filter(
      verse => verse.chapter === chapterNumber,
    );

    setSelectedChapter(chapterNumber);
    setError('');

    if (cachedChapterVerses.length) {
      setVerses(cachedChapterVerses);
      setStep('verses');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const loadedVerses = await getVerses(
        selectedBook.id,
        chapterNumber,
        undefined,
        selectedVersion,
      );
      setVerses(loadedVerses);
      setBookVerses(currentVerses =>
        uniqueVerses([...currentVerses, ...loadedVerses]),
      );
      setStep('verses');
    } catch (requestError) {
      setError('Nao foi possivel carregar os versiculos.');
      console.error('Erro ao carregar versiculos:', requestError);
    } finally {
      setLoading(false);
    }
  }, [bookVerses, selectedBook, selectedVersion]);

  const currentChapterIndex = chapters.findIndex(
    chapter => chapter.chapter === selectedChapter,
  );
  const previousChapter =
    currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter =
    currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1
      ? chapters[currentChapterIndex + 1]
      : null;

  const navigateChapter = useCallback(async (direction: -1 | 1) => {
    const target = direction === -1 ? previousChapter : nextChapter;

    if (!target || loading) {
      return;
    }

    await handleSelectChapter(target.chapter);
  }, [handleSelectChapter, loading, nextChapter, previousChapter]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          isHorizontalChapterSwipe(gestureState.dx, gestureState.dy),
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          isHorizontalChapterSwipe(gestureState.dx, gestureState.dy),
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -28) {
            navigateChapter(1);
          }

          if (gestureState.dx > 28) {
            navigateChapter(-1);
          }
        },
      }),
    [navigateChapter],
  );

  const handleSearch = async () => {
    const keyword = searchTerm.trim();
    if (keyword.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError('');

    try {
      setSearchResults(
        await searchBible(
          keyword,
          selectedBook?.id,
          selectedChapter ?? undefined,
          selectedVersion,
        ),
      );
    } catch (requestError) {
      setSearchResults([]);
      setError('Nao foi possivel buscar na Biblia.');
      console.error('Erro ao buscar na Biblia:', requestError);
    } finally {
      setSearching(false);
    }
  };

  const openSearchResult = async (verse: Verse) => {
    const chapterNumber = verse.chapter ?? verse.chapter_id;
    const resultBookId = verse.book_id ?? verse.book;

    if (!chapterNumber) {
      setError('Não foi possível identificar o capítulo deste resultado.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let availableBooks = books;
      let targetBook = availableBooks.find(book => book.id === resultBookId);

      if (!targetBook && verse.book_name) {
        const resultBookName = normalizeBookName(verse.book_name);
        targetBook = availableBooks.find(
          book => normalizeBookName(book.name) === resultBookName,
        );
      }

      if (!targetBook) {
        availableBooks = await getBooks();
        targetBook =
          availableBooks.find(book => book.id === resultBookId) ??
          availableBooks.find(
            book =>
              normalizeBookName(book.name) ===
              normalizeBookName(verse.book_name),
          );
      }

      if (!targetBook) {
        throw new Error('Livro do resultado não encontrado.');
      }

      const sameBook = selectedBook?.id === targetBook.id;
      const cachedVerses = sameBook
        ? bookVerses.filter(item => item.chapter === chapterNumber)
        : [];
      const [loadedChapters, loadedVerses] = await Promise.all([
        sameBook && chapters.length
          ? Promise.resolve(chapters)
          : getChapters(targetBook.id, selectedVersion),
        cachedVerses.length
          ? Promise.resolve(cachedVerses)
          : getVerses(targetBook.id, chapterNumber, undefined, selectedVersion),
      ]);

      setSelectedBook(targetBook);
      selectedBookIdRef.current = targetBook.id;
      setSelectedChapter(chapterNumber);
      setChapters(loadedChapters);
      setVerses(loadedVerses);
      setBookVerses(current =>
        sameBook
          ? uniqueVerses([...current, ...loadedVerses])
          : uniqueVerses(loadedVerses),
      );
      setSearchResults([]);
      setSearchOpen(false);
      setStep('verses');
    } catch (requestError) {
      setError('Não foi possível abrir o capítulo deste resultado.');
      console.error('Erro ao abrir resultado da busca bíblica:', requestError);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVersion = async (version: string) => {
    if (version === selectedVersion || loading) {
      return;
    }

    setSelectedVersion(version);
    setSearchResults([]);
    setSearchTerm('');
    setError('');
    setBookVerses([]);
    setVerses([]);

    if (!selectedBook) {
      return;
    }

    setLoading(true);

    try {
      const loadedChapters = await getChapters(selectedBook.id, version);
      setChapters(loadedChapters);

      if (step === 'verses' && selectedChapter) {
        const loadedVerses = await getVerses(
          selectedBook.id,
          selectedChapter,
          undefined,
          version,
        );
        setVerses(loadedVerses);
      }

      getBookVerses(selectedBook.id, version)
        .then(loadedVerses => {
          if (selectedBookIdRef.current !== selectedBook.id) {
            return;
          }

          const nextChapters = chaptersFromVerses(
            selectedBook,
            loadedVerses,
            version,
          );
          setBookVerses(loadedVerses);
          setChapters(currentChapters =>
            nextChapters.length > currentChapters.length
              ? nextChapters
              : currentChapters,
          );
        })
        .catch(requestError => {
          console.error('Erro ao pre-carregar livro:', requestError);
        });
    } catch (requestError) {
      setError('Nao foi possivel trocar a versao da Biblia.');
      console.error('Erro ao trocar versao:', requestError);
    } finally {
      setLoading(false);
    }
  };

  const goBack = useCallback(() => {
    setError('');

    if (annotationOpen) {
      setAnnotationOpen(false);
      return true;
    }

    if (selectedVerses.size || highlightStyle) {
      setSelectedVerses(new Set());
      setHighlightStyle(null);
      return true;
    }

    if (searchResults.length) {
      setSearchResults([]);
      return true;
    }

    if (searchOpen) {
      setSearchOpen(false);
      setSearchTerm('');
      return true;
    }

    if (step === 'verses') {
      setStep('chapters');
      setSelectedChapter(null);
      setVerses([]);
      return true;
    }

    if (step === 'chapters') {
      setStep('books');
      setSelectedBook(null);
      selectedBookIdRef.current = null;
      setSelectedChapter(null);
      setChapters([]);
      setBookVerses([]);
      return true;
    }

    return false;
  }, [annotationOpen, highlightStyle, searchOpen, searchResults.length, selectedVerses.size, step]);

  useImperativeHandle(ref, () => ({ handleBack: goBack }), [goBack]);

  const goToBooks = () => {
    setSelectedVerses(new Set());
    setStep('books');
    setSelectedBook(null);
    selectedBookIdRef.current = null;
    setSelectedChapter(null);
    setChapters([]);
    setBookVerses([]);
    setVerses([]);
  };

  const toggleVerse = (verseNumber: number, startSelection = false) => {
    if (!user) {
      setError('Entre no perfil para destacar ou anotar versículos.');
      return;
    }
    if (!startSelection && !selectedVerses.size) return;
    setSelectedVerses(current => {
      const next = new Set(current);
      next.has(verseNumber) ? next.delete(verseNumber) : next.add(verseNumber);
      return next;
    });
  };

  const selectedReferences: BibleReference[] = displayedVerses
    .filter(verse => selectedVerses.has(verse.verse))
    .map(verse => ({ version: selectedVersion, book: selectedBook?.id ?? verse.book ?? 0, chapter: selectedChapter ?? verse.chapter ?? 0, verse: verse.verse }));

  const applyHighlight = async (color: HighlightColor) => {
    if (!selectedReferences.length || !highlightStyle || savingHighlight) return;
    const previous = highlights;
    const optimistic = selectedReferences.map((reference, index) => ({ ...reference, id: `pending-${index}`, style: highlightStyle, color }));
    setHighlights(current => [...current.filter(item => !selectedVerses.has(item.verse) || item.style !== highlightStyle), ...optimistic]);
    setSavingHighlight(true);
    try {
      const saved = await Promise.all(selectedReferences.map(reference => putHighlight({ ...reference, style: highlightStyle, color })));
      setHighlights(current => [...current.filter(item => !optimistic.some(pending => pending.id === item.id)), ...saved]);
      setSelectedVerses(new Set());
      setHighlightStyle(null);
    } catch {
      setHighlights(previous);
      setError('Não foi possível salvar o destaque.');
    } finally { setSavingHighlight(false); }
  };

  const removeHighlights = async () => {
    const targets = highlights.filter(item => selectedVerses.has(item.verse));
    if (!targets.length) { setSelectedVerses(new Set()); return; }
    const previous = highlights;
    setHighlights(current => current.filter(item => !targets.some(target => target.id === item.id)));
    setSavingHighlight(true);
    try {
      await Promise.all(targets.map(item => deleteHighlight(item.id)));
      setSelectedVerses(new Set());
    } catch {
      setHighlights(previous);
      setError('Não foi possível remover os destaques.');
    } finally { setSavingHighlight(false); }
  };

  const getVerseBookName = (verse: Verse) => {
    if (verse.book_name) {
      return verse.book_name;
    }

    const verseBookId = verse.book_id ?? verse.book;
    return (
      books.find(book => book.id === verseBookId)?.name ??
      selectedBook?.name ??
      'Livro'
    );
  };

  if (loading && !books.length) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Abrindo Biblia</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {step !== 'verses' ? (
        <View style={styles.topPanel}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.kicker}>Leitura e busca</Text>
              <Text style={styles.title}>
                Biblia {getVersionLabel(selectedVersionDetails)}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.searchToggle,
                searchOpen && styles.searchToggleActive,
              ]}
              onPress={() => setSearchOpen(current => !current)}
              accessibilityRole="button"
              accessibilityLabel="Buscar na Biblia"
            >
              <SearchGlyph active={searchOpen} />
            </TouchableOpacity>
          </View>

          {versions.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.versionStrip}
            >
              {versions.map(version => {
                const code = getVersionCode(version);

                return (
                  <VersionChip
                    key={code}
                    label={getVersionLabel(version)}
                    active={code === selectedVersion}
                    onPress={() => handleSelectVersion(code)}
                  />
                );
              })}
            </ScrollView>
          ) : null}

          {searchOpen ? (
            <View style={styles.searchBox}>
              <TextInput
                value={searchTerm}
                onChangeText={setSearchTerm}
                onSubmitEditing={handleSearch}
                placeholder={`Buscar em ${getVersionLabel(selectedVersionDetails)}`}
                placeholderTextColor={colors.textSecondary}
                style={styles.searchInput}
                returnKeyType="search"
                autoFocus
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearch}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.searchButtonText}>Buscar</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : null}

      {step === 'books' ? (
        <>
          <View style={styles.filters}>
            <FilterChip
              label="Todos"
              active={testament === 'all'}
              onPress={() => loadBooks('all')}
            />
            <FilterChip
              label="Antigo"
              active={testament === 1}
              onPress={() => loadBooks(1)}
            />
            <FilterChip
              label="Novo"
              active={testament === 2}
              onPress={() => loadBooks(2)}
            />
          </View>
        </>
      ) : null}

      {displayedSearchResults.length ? (
        <View style={styles.searchResults}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Resultados</Text>
            <TouchableOpacity
              style={styles.minTouchTarget}
              onPress={() => setSearchResults([])}
            >
              <Text style={styles.clearText}>Limpar</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={displayedSearchResults}
            keyExtractor={(item, index) => `${item.id || item.verse}-${index}`}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                activeOpacity={0.72}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${getVerseBookName(item)} capítulo ${item.chapter ?? item.chapter_id ?? ''}`}
                onPress={() => openSearchResult(item)}
              >
                <VerseItem
                  verse={item}
                  fallbackNumber={index + 1}
                  reference={`${getVerseBookName(item)} ${item.chapter ?? item.chapter_id ?? selectedChapter ?? ''}`}
                />
                <Text style={styles.searchResultHint}>Abrir capítulo</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      ) : (
        <>
          {step !== 'verses' ? (
            <View style={styles.breadcrumb}>
              <TouchableOpacity
                style={styles.minTouchTarget}
                onPress={() => setStep('books')}
              >
                <Text
                  style={[
                    styles.breadcrumbText,
                    step === 'books' && styles.activeBreadcrumb,
                  ]}
                >
                  Livros
                </Text>
              </TouchableOpacity>
              {selectedBook ? (
                <Text style={styles.breadcrumbText}>
                  {' '}
                  / {selectedBook.name}
                </Text>
              ) : null}
              {selectedChapter ? (
                <Text style={styles.breadcrumbText}>
                  {' '}
                  / Cap. {selectedChapter}
                </Text>
              ) : null}
            </View>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {loading ? (
            <View style={styles.centeredInline}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : null}

          {!loading && step === 'books' ? (
            <FlatList
              data={books}
              keyExtractor={(item, index) => `${item.id || index}`}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <EmptyState
                  text="Nenhum livro encontrado."
                  onRetry={() => loadBooks(testament)}
                />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.bookItem}
                  onPress={() => handleSelectBook(item)}
                >
                  <View style={styles.bookTextBlock}>
                    <Text style={styles.bookName}>{item.name || 'Livro'}</Text>
                    <Text style={styles.bookMeta}>
                      {item.abbrev ? `${item.abbrev.toUpperCase()} - ` : ''}
                      {testamentLabel(item.testament)}
                    </Text>
                  </View>
                  <Icon as={ChevronRight} />
                </TouchableOpacity>
              )}
            />
          ) : null}

          {!loading && step === 'chapters' ? (
            <FlatList
              data={chapters}
              numColumns={5}
              keyExtractor={(item, index) =>
                `${item.id || item.chapter || index}`
              }
              contentContainerStyle={styles.gridContainer}
              ListEmptyComponent={
                <EmptyState
                  text="Nenhum capitulo disponivel."
                  onRetry={() => selectedBook && handleSelectBook(selectedBook)}
                />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.chapterSquare}
                  onPress={() => handleSelectChapter(item.chapter)}
                >
                  <Text style={styles.chapterNumber}>{item.chapter}</Text>
                </TouchableOpacity>
              )}
            />
          ) : null}

          {!loading && step === 'verses' ? (
            <View style={styles.versePane} {...panResponder.panHandlers}>
              <View style={styles.chapterNav}>
                <Text style={styles.readingHint}>Pressione um versículo para selecionar</Text>
              </View>

              <ScrollView
                ref={verseScrollRef}
                style={styles.verseScroll}
                contentContainerStyle={styles.verseContent}
              >
                {displayedVerses.length ? (
                  displayedVerses.map((verse, index) => (
                    <VerseItem
                      key={`${verse.book ?? selectedBook?.id ?? 'book'}-${verse.chapter ?? selectedChapter ?? 'chapter'}-${verse.verse ?? index}-${index}`}
                      verse={verse}
                      fallbackNumber={index + 1}
                      selected={selectedVerses.has(verse.verse)}
                      highlights={highlights.filter(item => item.verse === verse.verse)}
                      onPress={() => toggleVerse(verse.verse)}
                      onLongPress={() => toggleVerse(verse.verse, true)}
                    />
                  ))
                ) : (
                  <EmptyState
                    text="Versiculos nao carregados."
                    onRetry={() =>
                      selectedChapter && handleSelectChapter(selectedChapter)
                    }
                  />
                )}
              </ScrollView>
              <View
                style={[
                  styles.readingBar,
                  {
                    minHeight: 62 + bottomSafeSpacing,
                    paddingBottom: bottomSafeSpacing,
                  },
                ]}
              >
                {selectedVerses.size ? (
                  <>
                    <Text style={styles.selectionCount}>{selectedVerses.size}</Text>
                    <ToolbarButton icon={Highlighter} label="Destacar fundo" active={highlightStyle === 'background'} onPress={() => setHighlightStyle('background')} />
                    <ToolbarButton icon={Underline} label="Sublinhar" active={highlightStyle === 'underline'} onPress={() => setHighlightStyle('underline')} />
                    <ToolbarButton icon={NotebookPen} label="Criar anotação" onPress={() => setAnnotationOpen(true)} />
                    <ToolbarButton icon={Eraser} label="Remover destaque" onPress={removeHighlights} />
                    <ToolbarButton icon={X} label="Cancelar seleção" onPress={() => { setSelectedVerses(new Set()); setHighlightStyle(null); }} />
                  </>
                ) : (
                  <>
                    <ToolbarButton icon={ChevronLeft} label="Capítulo anterior" disabled={!previousChapter || loading} onPress={() => navigateChapter(-1)} />
                    <Pressable accessibilityRole="button" accessibilityLabel="Voltar para a lista de livros" style={styles.bookChapterButton} onPress={goToBooks}><Text style={styles.bookChapterText} numberOfLines={1}>{selectedBook?.name} · {selectedChapter}</Text></Pressable>
                    <ToolbarButton icon={ChevronRight} label="Próximo capítulo" disabled={!nextChapter || loading} onPress={() => navigateChapter(1)} />
                  </>
                )}
              </View>
              {highlightStyle && selectedVerses.size ? <ColorPalette onSelect={applyHighlight} disabled={savingHighlight} bottomInset={bottomSafeSpacing} /> : null}
              <AnnotationEditor visible={annotationOpen} references={selectedReferences} onClose={() => setAnnotationOpen(false)} onSaved={() => { setAnnotationOpen(false); setSelectedVerses(new Set()); }} />
            </View>
          ) : null}
        </>
      )}

      {step !== 'books' && step !== 'verses' && !searchResults.length ? (
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

const SearchGlyph = ({ active }: { active: boolean }) => (
  <Icon as={Search} color={active ? colors.white : colors.primary} />
);

const VersionChip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    style={[styles.versionChip, active && styles.versionChipActive]}
    onPress={onPress}
  >
    <Text
      style={[styles.versionChipText, active && styles.versionChipTextActive]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const FilterChip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    style={[styles.filterChip, active && styles.filterChipActive]}
    onPress={onPress}
  >
    <Text
      style={[styles.filterChipText, active && styles.filterChipTextActive]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const VerseItem = ({
  verse,
  fallbackNumber,
  reference,
  selected = false,
  highlights = [],
  onPress,
  onLongPress,
}: {
  verse: Verse;
  fallbackNumber: number;
  reference?: string;
  selected?: boolean;
  highlights?: BibleHighlight[];
  onPress?: () => void;
  onLongPress?: () => void;
}) => (
  <Pressable delayLongPress={500} onPress={onPress} onLongPress={onLongPress} style={[styles.verseContainer, selected && styles.verseSelected]}>
    <Text style={styles.verseNumber}>{verse.verse || fallbackNumber}</Text>
    <View style={styles.verseTextBlock}>
      {reference ? (
        <Text style={styles.verseReference}>{reference}</Text>
      ) : null}
      <Text style={[styles.verseText, highlightTextStyle(highlights)]}>{verse.text || 'Texto indisponivel'}</Text>
    </View>
  </Pressable>
);

const highlightColors: Record<HighlightColor, string> = { yellow: '#F4D35E', green: '#8FCB9B', blue: '#83B9E6', pink: '#E8A0BF', purple: '#B8A1D9' };
const highlightTextStyle = (items: BibleHighlight[]) => {
  const background = items.find(item => item.style === 'background');
  const underline = items.find(item => item.style === 'underline');
  return {
    ...(background ? { backgroundColor: highlightColors[background.color], color: '#111111' } : {}),
    ...(underline ? { textDecorationLine: 'underline' as const, textDecorationColor: highlightColors[underline.color], textDecorationStyle: 'solid' as const } : {}),
  };
};
const ToolbarButton = ({ icon, label, active, disabled, onPress }: { icon: typeof Search; label: string; active?: boolean; disabled?: boolean; onPress: () => void }) => <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} style={[styles.toolbarButton, active && styles.toolbarButtonActive, disabled && styles.toolbarButtonDisabled]} onPress={onPress}><Icon as={icon} size={20} /></Pressable>;
const ColorPalette = ({ onSelect, disabled, bottomInset }: { onSelect: (color: HighlightColor) => void; disabled: boolean; bottomInset: number }) => <View style={[styles.palette, { bottom: 68 + bottomInset }]}>{(Object.keys(highlightColors) as HighlightColor[]).map(color => <Pressable key={color} accessibilityLabel={`Cor ${color}`} disabled={disabled} style={[styles.colorDot, { backgroundColor: highlightColors[color] }]} onPress={() => onSelect(color)} />)}</View>;

const EmptyState = ({
  text,
  onRetry,
}: {
  text: string;
  onRetry: () => void;
}) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyText}>{text}</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryText}>Tentar novamente</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  minTouchTarget: { minHeight: 44, justifyContent: 'center' },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  centeredInline: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 12,
  },
  topPanel: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.section,
    paddingBottom: 8,
    backgroundColor: colors.white,
  },
  titleRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    paddingRight: 14,
  },
  kicker: {
    color: colors.accent,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: '600',
    marginTop: 4,
  },
  searchToggle: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  searchToggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  versionStrip: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  versionChip: {
    minHeight: 44,
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    paddingHorizontal: 13,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  versionChipActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  versionChipText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  versionChipTextActive: {
    color: colors.white,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.page,
    paddingBottom: 12,
  },
  filterChip: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: typography.caption,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    padding: 4,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: colors.textPrimary,
    fontSize: typography.body,
  },
  searchButton: {
    minWidth: 78,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  searchButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: spacing.page,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultTitle: {
    color: colors.textPrimary,
    fontSize: typography.heading,
    fontWeight: '600',
  },
  clearText: {
    color: colors.accent,
    fontWeight: '600',
  },
  searchResultItem: {
    paddingBottom: 7,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchResultHint: {
    alignSelf: 'flex-end',
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '600',
    marginTop: -2,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingBottom: 12,
  },
  breadcrumbText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontWeight: '600',
  },
  activeBreadcrumb: {
    color: colors.primary,
  },
  errorText: {
    marginHorizontal: spacing.page,
    marginBottom: 10,
    color: colors.danger,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.bottom,
  },
  bookItem: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  bookTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  bookName: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: '600',
  },
  bookMeta: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginTop: 3,
  },
  gridContainer: {
    paddingHorizontal: 14,
    paddingBottom: 80,
  },
  chapterSquare: {
    minHeight: 44,
    width: '18%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  chapterNumber: {
    color: colors.primary,
    fontSize: typography.heading,
    fontWeight: '600',
  },
  verseScroll: {
    flex: 1,
  },
  versePane: {
    flex: 1,
  },
  chapterNav: {
    paddingTop: 8,
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingBottom: 10,
  },
  readingHint: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  chapterNavTitle: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: '600',
  },
  verseContent: {
    paddingHorizontal: spacing.page,
    paddingBottom: 24,
  },
  verseContainer: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 0,
    marginBottom: 0,
    backgroundColor: colors.white,
  },
  verseSelected: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
  },
  verseNumber: {
    width: 30,
    color: colors.accent,
    fontSize: typography.body,
    fontWeight: '600',
    marginTop: 2,
  },
  verseTextBlock: {
    flex: 1,
  },
  verseReference: {
    color: colors.accent,
    fontSize: typography.caption,
    fontWeight: '600',
    marginBottom: 3,
  },
  verseText: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    lineHeight: 24,
  },
  readingBar: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  toolbarButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  toolbarButtonActive: { backgroundColor: colors.surfaceMuted },
  toolbarButtonDisabled: { opacity: 0.3 },
  bookChapterButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  bookChapterText: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectionCount: {
    minWidth: 32,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  palette: {
    position: 'absolute',
    right: spacing.page,
    bottom: 68,
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#777777',
  },
  backButton: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    minWidth: 104,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  backButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  retryText: {
    color: colors.white,
    fontWeight: '600',
  },
});
