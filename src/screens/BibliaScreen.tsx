import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getBibleVersions, getBookVerses, getBooks, getChapters, getVerses, searchBible } from '../services/api';
import { colors } from '../theme/colors';
import { BibleVersion, Book, Chapter, Verse } from '../types';

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
    const cleanText = (item.text || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const key = `${item.book ?? ''}-${item.chapter ?? ''}-${item.verse ?? index}-${cleanText}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const isHorizontalChapterSwipe = (dx: number, dy: number) => Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) * 1.1;

const getVersionCode = (version: BibleVersion) => String(version.code ?? version.id ?? version.version ?? 'nvi').toLowerCase();

const getVersionLabel = (version?: BibleVersion | null) => {
  if (!version) {
    return 'NVI';
  }

  return String(version.name ?? version.abbreviation ?? version.abbrev ?? version.code ?? version.id).toUpperCase();
};

const chaptersFromVerses = (book: Book, items: Verse[], version: string): Chapter[] => {
  const chapterNumbers = Array.from(
    new Set(items.map(item => item.chapter).filter((chapter): chapter is number => typeof chapter === 'number')),
  ).sort((a, b) => a - b);

  return chapterNumbers.map(chapter => ({
    id: chapter,
    book: book.id,
    testament: book.testament,
    version,
    chapter,
  }));
};

export const BibliaScreen = () => {
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
  const selectedBookIdRef = useRef<number | null>(null);

  const displayedVerses = useMemo(() => uniqueVerses(verses), [verses]);
  const displayedSearchResults = useMemo(() => uniqueVerses(searchResults), [searchResults]);
  const selectedVersionDetails = useMemo(
    () => versions.find(version => getVersionCode(version) === selectedVersion),
    [selectedVersion, versions],
  );

  const loadVersions = useCallback(async () => {
    try {
      const loadedVersions = await getBibleVersions();
      setVersions(loadedVersions);

      if (loadedVersions.length && !loadedVersions.some(version => getVersionCode(version) === 'nvi')) {
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

          const loadedChapters = chaptersFromVerses(book, loadedVerses, selectedVersion);
          setBookVerses(loadedVerses);
          setChapters(currentChapters => (loadedChapters.length > currentChapters.length ? loadedChapters : currentChapters));
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

  const handleSelectChapter = async (chapterNumber: number) => {
    if (!selectedBook) {
      return;
    }

    const cachedChapterVerses = bookVerses.filter(verse => verse.chapter === chapterNumber);

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
      const loadedVerses = await getVerses(selectedBook.id, chapterNumber, undefined, selectedVersion);
      setVerses(loadedVerses);
      setBookVerses(currentVerses => uniqueVerses([...currentVerses, ...loadedVerses]));
      setStep('verses');
    } catch (requestError) {
      setError('Nao foi possivel carregar os versiculos.');
      console.error('Erro ao carregar versiculos:', requestError);
    } finally {
      setLoading(false);
    }
  };

  const currentChapterIndex = chapters.findIndex(chapter => chapter.chapter === selectedChapter);
  const previousChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null;

  const navigateChapter = async (direction: -1 | 1) => {
    const target = direction === -1 ? previousChapter : nextChapter;

    if (!target || loading) {
      return;
    }

    await handleSelectChapter(target.chapter);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => isHorizontalChapterSwipe(gestureState.dx, gestureState.dy),
        onMoveShouldSetPanResponderCapture: (_, gestureState) => isHorizontalChapterSwipe(gestureState.dx, gestureState.dy),
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
    [previousChapter, nextChapter, loading],
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
      setSearchResults(await searchBible(keyword, selectedBook?.id, selectedChapter ?? undefined, selectedVersion));
    } catch (requestError) {
      setSearchResults([]);
      setError('Nao foi possivel buscar na Biblia.');
      console.error('Erro ao buscar na Biblia:', requestError);
    } finally {
      setSearching(false);
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
        const loadedVerses = await getVerses(selectedBook.id, selectedChapter, undefined, version);
        setVerses(loadedVerses);
      }

      getBookVerses(selectedBook.id, version)
        .then(loadedVerses => {
          if (selectedBookIdRef.current !== selectedBook.id) {
            return;
          }

          const nextChapters = chaptersFromVerses(selectedBook, loadedVerses, version);
          setBookVerses(loadedVerses);
          setChapters(currentChapters => (nextChapters.length > currentChapters.length ? nextChapters : currentChapters));
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

  const goBack = () => {
    setError('');

    if (step === 'verses') {
      setStep('chapters');
      setSelectedChapter(null);
      setVerses([]);
      return;
    }

    if (step === 'chapters') {
      setStep('books');
      setSelectedBook(null);
      selectedBookIdRef.current = null;
      setSelectedChapter(null);
      setChapters([]);
      setBookVerses([]);
    }
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
      <View style={styles.topPanel}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.kicker}>Leitura e busca</Text>
            <Text style={styles.title}>Biblia {getVersionLabel(selectedVersionDetails)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.searchToggle, searchOpen && styles.searchToggleActive]}
            onPress={() => setSearchOpen(current => !current)}
            accessibilityRole="button"
            accessibilityLabel="Buscar na Biblia"
          >
            <SearchGlyph active={searchOpen} />
          </TouchableOpacity>
        </View>

        {versions.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.versionStrip}>
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
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={searching}>
              {searching ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.searchButtonText}>Buscar</Text>}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {step === 'books' ? (
        <>
          <View style={styles.filters}>
            <FilterChip label="Todos" active={testament === 'all'} onPress={() => loadBooks('all')} />
            <FilterChip label="Antigo" active={testament === 1} onPress={() => loadBooks(1)} />
            <FilterChip label="Novo" active={testament === 2} onPress={() => loadBooks(2)} />
          </View>
        </>
      ) : null}

      {displayedSearchResults.length ? (
        <View style={styles.searchResults}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Resultados</Text>
            <TouchableOpacity onPress={() => setSearchResults([])}>
              <Text style={styles.clearText}>Limpar</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={displayedSearchResults}
            keyExtractor={(item, index) => `${item.id || item.verse}-${index}`}
            renderItem={({ item, index }) => (
              <VerseItem verse={item} fallbackNumber={index + 1} />
            )}
          />
        </View>
      ) : (
        <>
          <View style={styles.breadcrumb}>
            <TouchableOpacity onPress={() => setStep('books')}>
              <Text style={[styles.breadcrumbText, step === 'books' && styles.activeBreadcrumb]}>Livros</Text>
            </TouchableOpacity>
            {selectedBook ? <Text style={styles.breadcrumbText}> / {selectedBook.name}</Text> : null}
            {selectedChapter ? <Text style={styles.breadcrumbText}> / Cap. {selectedChapter}</Text> : null}
          </View>

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
              ListEmptyComponent={<EmptyState text="Nenhum livro encontrado." onRetry={() => loadBooks(testament)} />}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.bookItem} onPress={() => handleSelectBook(item)}>
                  <View style={styles.bookTextBlock}>
                    <Text style={styles.bookName}>{item.name || 'Livro'}</Text>
                    <Text style={styles.bookMeta}>
                      {item.abbrev ? `${item.abbrev.toUpperCase()} - ` : ''}
                      {testamentLabel(item.testament)}
                    </Text>
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
              )}
            />
          ) : null}

          {!loading && step === 'chapters' ? (
            <FlatList
              data={chapters}
              numColumns={5}
              keyExtractor={(item, index) => `${item.id || item.chapter || index}`}
              contentContainerStyle={styles.gridContainer}
              ListEmptyComponent={<EmptyState text="Nenhum capitulo disponivel." onRetry={() => selectedBook && handleSelectBook(selectedBook)} />}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.chapterSquare} onPress={() => handleSelectChapter(item.chapter)}>
                  <Text style={styles.chapterNumber}>{item.chapter}</Text>
                </TouchableOpacity>
              )}
            />
          ) : null}

          {!loading && step === 'verses' ? (
            <View style={styles.versePane} {...panResponder.panHandlers}>
              <View style={styles.chapterNav}>
                <Text style={styles.chapterNavTitle}>Cap. {selectedChapter}</Text>
              </View>

              <ScrollView style={styles.verseScroll} contentContainerStyle={styles.verseContent}>
                {displayedVerses.length ? (
                  displayedVerses.map((verse, index) => (
                    <VerseItem
                      key={`${verse.book ?? selectedBook?.id ?? 'book'}-${verse.chapter ?? selectedChapter ?? 'chapter'}-${verse.verse ?? index}-${index}`}
                      verse={verse}
                      fallbackNumber={index + 1}
                    />
                  ))
                ) : (
                  <EmptyState text="Versiculos nao carregados." onRetry={() => selectedChapter && handleSelectChapter(selectedChapter)} />
                )}
              </ScrollView>
            </View>
          ) : null}
        </>
      )}

      {step !== 'books' && !searchResults.length ? (
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const SearchGlyph = ({ active }: { active: boolean }) => (
  <View style={styles.searchGlyph}>
    <View style={[styles.searchGlyphCircle, active && styles.searchGlyphCircleActive]} />
    <View style={[styles.searchGlyphHandle, active && styles.searchGlyphHandleActive]} />
  </View>
);

const VersionChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <TouchableOpacity style={[styles.versionChip, active && styles.versionChipActive]} onPress={onPress}>
    <Text style={[styles.versionChipText, active && styles.versionChipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const FilterChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <TouchableOpacity style={[styles.filterChip, active && styles.filterChipActive]} onPress={onPress}>
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const VerseItem = ({ verse, fallbackNumber }: { verse: Verse; fallbackNumber: number }) => (
  <View style={styles.verseContainer}>
    <Text style={styles.verseNumber}>{verse.verse || fallbackNumber}</Text>
    <View style={styles.verseTextBlock}>
      <Text style={styles.verseText}>{verse.text || 'Texto indisponivel'}</Text>
    </View>
  </View>
);

const EmptyState = ({ text, onRetry }: { text: string; onRetry: () => void }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyText}>{text}</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryText}>Tentar novamente</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
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
    padding: 40,
  },
  loadingText: {
    color: colors.textSecondary,
    fontWeight: '800',
    marginTop: 12,
  },
  topPanel: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: colors.white,
  },
  titleRow: {
    minHeight: 54,
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
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
  },
  searchToggle: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchToggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  searchGlyph: {
    width: 24,
    height: 24,
  },
  searchGlyphCircle: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 13,
    height: 13,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  searchGlyphCircleActive: {
    borderColor: colors.white,
  },
  searchGlyphHandle: {
    position: 'absolute',
    right: 4,
    bottom: 5,
    width: 9,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.primary,
    transform: [{ rotate: '45deg' }],
  },
  searchGlyphHandleActive: {
    backgroundColor: colors.white,
  },
  versionStrip: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  versionChip: {
    minHeight: 34,
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  versionChipActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  versionChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '900',
  },
  versionChipTextActive: {
    color: colors.white,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontWeight: '900',
    fontSize: 12,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    padding: 6,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontSize: 15,
  },
  searchButton: {
    minWidth: 86,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  searchButtonText: {
    color: colors.white,
    fontWeight: '900',
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 18,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  clearText: {
    color: colors.accent,
    fontWeight: '900',
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  breadcrumbText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
  },
  activeBreadcrumb: {
    color: colors.primary,
  },
  errorText: {
    marginHorizontal: 18,
    marginBottom: 10,
    color: colors.danger,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 90,
  },
  bookItem: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  bookName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
  },
  bookMeta: {
    color: colors.textSecondary,
    marginTop: 3,
  },
  arrow: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: '900',
  },
  gridContainer: {
    paddingHorizontal: 14,
    paddingBottom: 90,
  },
  chapterSquare: {
    width: '18%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chapterNumber: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  verseScroll: {
    flex: 1,
  },
  versePane: {
    flex: 1,
  },
  chapterNav: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  chapterNavTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  verseContent: {
    paddingHorizontal: 18,
    paddingBottom: 94,
  },
  verseContainer: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 0,
    marginBottom: 4,
    backgroundColor: colors.white,
  },
  verseNumber: {
    width: 30,
    color: colors.accent,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  verseTextBlock: {
    flex: 1,
  },
  verseText: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 25,
  },
  backButton: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    minWidth: 104,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.accent,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  backButtonText: {
    color: colors.white,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    padding: 22,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  retryText: {
    color: colors.white,
    fontWeight: '900',
  },
});
