import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { useAppearance } from '../context/AppearanceContext';
import InstagramIcon from '../assets/instagram-svgrepo-com.svg';
import WhatsappIcon from '../assets/whatsapp-svgrepo-com.svg';
import { getPessoas } from '../services/api';
import { colors } from '../theme/colors';
import { spacing, typography, radius } from '../theme/tokens';
import { Pessoa } from '../types';

const lightLogo = require('../assets/logo-completo1.png');
const darkLogo = require('../assets/logo-completo-dark.jpeg');
const personFallback = require('../../logo.jpg');
const cardWidth = 176;
const cardGap = 12;

const address =
  'Av. João Paulo I, 1400 - Parque São Luís, São Paulo - SP, 02842-280';
const whatsappUrl = 'https://w.app/obpc';
const instagramUrl = 'https://www.instagram.com/obpcfreguesiaoficial/';
const mapsUrl =
  'https://www.google.com/maps/search/?api=1&query=Av.%20Joao%20Paulo%20I%2C%201400%20-%20Parque%20Sao%20Luis%2C%20Sao%20Paulo%20-%20SP%2C%2002842-280';

const openUrl = async (url: string) => {
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  }
};

export const SobreScreen = ({
  onSelectPerson,
}: {
  onSelectPerson: (person: Pessoa) => void;
}) => {
  const { themePreference } = useAppearance();
  const logo = themePreference === 'dark' ? darkLogo : lightLogo;
  const [people, setPeople] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPeople = useCallback(async () => {
    try {
      setError('');
      setPeople(await getPessoas());
    } catch (requestError) {
      setError('Não foi possível carregar as pessoas.');
      console.error('Erro ao carregar pessoas:', requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.logoCircle}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </View>

      <Text style={styles.title}>OBPC Freguesia do Ó</Text>
      <Text style={styles.subtitle}>
        Uma igreja para viver a fé, a comunhão e o serviço.
      </Text>

      <View style={styles.socialRow}>
        <TouchableOpacity
          style={styles.socialButton}
          onPress={() => openUrl(instagramUrl)}
        >
          <InstagramIcon width={24} height={24} />
          <Text style={styles.socialText}>Instagram</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.socialButton}
          onPress={() => openUrl(whatsappUrl)}
        >
          <WhatsappIcon width={24} height={24} />
          <Text style={styles.socialText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.sectionLabel}>Endereço</Text>
        <Text style={styles.address}>{address}</Text>
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => openUrl(mapsUrl)}
        >
          <Text style={styles.mapButtonText}>Abrir no Maps</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.peopleSection}>
        <Text style={styles.peopleTitle}>Conheça nossa equipe</Text>
        <Text style={styles.peopleSubtitle}>
          Pessoas que servem e cuidam da nossa comunidade.
        </Text>
        {loading ? (
          <ActivityIndicator
            style={styles.peopleLoading}
            color={colors.primary}
          />
        ) : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {!loading && people.length ? (
          <InfinitePeopleCarousel people={people} onSelect={onSelectPerson} />
        ) : null}
      </View>
    </ScrollView>
  );
};

const PeopleSeparator = () => <View style={styles.peopleSeparator} />;

const InfinitePeopleCarousel = ({
  people,
  onSelect,
}: {
  people: Pessoa[];
  onSelect: (person: Pessoa) => void;
}) => {
  const listRef = useRef<FlatList<Pessoa>>(null);
  const loopingPeople =
    people.length > 1 ? [...people, ...people, ...people] : people;
  const middleStart = people.length;

  useEffect(() => {
    if (people.length > 1) {
      requestAnimationFrame(() =>
        listRef.current?.scrollToIndex({ index: middleStart, animated: false }),
      );
    }
  }, [middleStart, people.length]);

  const keepCarouselInfinite = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (people.length <= 1) {
      return;
    }

    const index = Math.round(
      event.nativeEvent.contentOffset.x / (cardWidth + cardGap),
    );
    if (index < people.length) {
      listRef.current?.scrollToIndex({
        index: index + people.length,
        animated: false,
      });
    } else if (index >= people.length * 2) {
      listRef.current?.scrollToIndex({
        index: index - people.length,
        animated: false,
      });
    }
  };

  return (
    <FlatList
      ref={listRef}
      horizontal
      nestedScrollEnabled
      data={loopingPeople}
      keyExtractor={(item, index) => `${item.pessoa_id}-${index}`}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.peopleCarousel}
      ItemSeparatorComponent={PeopleSeparator}
      getItemLayout={(_, index) => ({
        length: cardWidth + cardGap,
        offset: (cardWidth + cardGap) * index,
        index,
      })}
      onMomentumScrollEnd={keepCarouselInfinite}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.personCard}
          activeOpacity={0.82}
          onPress={() => onSelect(item)}
        >
          <Image
            source={item.url_imagem ? { uri: item.url_imagem } : personFallback}
            style={styles.personImage}
            resizeMode="cover"
          />
          <View style={styles.personBody}>
            <Text style={styles.personName} numberOfLines={2}>
              {item.nome || 'Nome não informado'}
            </Text>
            <Text style={styles.personRole} numberOfLines={2}>
              {item.cargo || 'Cargo não informado'}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  peopleSeparator: { width: cardGap },
  container: { flex: 1, backgroundColor: colors.white },
  content: {
    alignItems: 'center',
    paddingTop: spacing.section,
    paddingBottom: spacing.bottom,
  },
  logoCircle: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  logo: { width: 88, height: 88, borderRadius: radius.md },
  title: {
    marginTop: spacing.section,
    paddingHorizontal: spacing.page,
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    paddingHorizontal: spacing.page,
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 21,
    textAlign: 'center',
  },
  socialRow: {
    width: '100%',
    flexDirection: 'row',
    marginTop: spacing.section,
    paddingHorizontal: 13,
  },
  socialButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  socialText: { marginLeft: 8, color: colors.primary, fontWeight: '600' },
  infoBlock: {
    width: 'auto',
    alignSelf: 'stretch',
    marginHorizontal: spacing.page,
    marginTop: spacing.section,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  sectionLabel: {
    color: colors.accent,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  address: {
    marginTop: 8,
    color: colors.textPrimary,
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: '600',
  },
  mapButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  mapButtonText: { color: colors.white, fontWeight: '600' },
  peopleSection: { width: '100%', marginTop: spacing.section },
  peopleTitle: {
    paddingHorizontal: spacing.page,
    color: colors.textPrimary,
    fontSize: typography.heading,
    fontWeight: '600',
  },
  peopleSubtitle: {
    paddingHorizontal: spacing.page,
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 20,
  },
  peopleLoading: { marginTop: spacing.section },
  errorText: {
    paddingHorizontal: spacing.page,
    marginTop: 16,
    color: colors.danger,
    fontWeight: '600',
  },
  peopleCarousel: {
    paddingHorizontal: spacing.page,
    paddingTop: 16,
    paddingBottom: 8,
  },
  personCard: {
    width: cardWidth,
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  personImage: {
    width: '100%',
    height: 178,
    backgroundColor: colors.surfaceMuted,
  },
  personBody: { minHeight: 92, padding: 13 },
  personName: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: '600',
  },
  personRole: {
    color: colors.accent,
    fontSize: typography.body,
    fontWeight: '600',
    marginTop: 5,
  },
});
