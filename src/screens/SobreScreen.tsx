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
import InstagramIcon from '../assets/instagram-svgrepo-com.svg';
import WhatsappIcon from '../assets/whatsapp-svgrepo-com.svg';
import { getPessoas } from '../services/api';
import { colors } from '../theme/colors';
import { Pessoa } from '../types';

const logo = require('../assets/logo-completo1.png');
const personFallback = require('../../logo.jpg');
const cardWidth = 176;
const cardGap = 12;

const address = 'Av. João Paulo I, 1400 - Parque São Luís, São Paulo - SP, 02842-280';
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

export const SobreScreen = ({ onSelectPerson }: { onSelectPerson: (person: Pessoa) => void }) => {
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
    void loadPeople();
  }, [loadPeople]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.logoCircle}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </View>

      <Text style={styles.title}>OBPC Freguesia do Ó</Text>
      <Text style={styles.subtitle}>Uma igreja para viver a fé, a comunhão e o serviço.</Text>

      <View style={styles.socialRow}>
        <TouchableOpacity style={styles.socialButton} onPress={() => openUrl(instagramUrl)}>
          <InstagramIcon width={24} height={24} />
          <Text style={styles.socialText}>Instagram</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton} onPress={() => openUrl(whatsappUrl)}>
          <WhatsappIcon width={24} height={24} />
          <Text style={styles.socialText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.sectionLabel}>Endereço</Text>
        <Text style={styles.address}>{address}</Text>
        <TouchableOpacity style={styles.mapButton} onPress={() => openUrl(mapsUrl)}>
          <Text style={styles.mapButtonText}>Abrir no Maps</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.peopleSection}>
        <Text style={styles.peopleTitle}>Conheça nossa equipe</Text>
        <Text style={styles.peopleSubtitle}>Pessoas que servem e cuidam da nossa comunidade.</Text>
        {loading ? <ActivityIndicator style={styles.peopleLoading} color={colors.primary} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {!loading && people.length ? <InfinitePeopleCarousel people={people} onSelect={onSelectPerson} /> : null}
      </View>
    </ScrollView>
  );
};

const InfinitePeopleCarousel = ({ people, onSelect }: { people: Pessoa[]; onSelect: (person: Pessoa) => void }) => {
  const listRef = useRef<FlatList<Pessoa>>(null);
  const loopingPeople = people.length > 1 ? [...people, ...people, ...people] : people;
  const middleStart = people.length;

  useEffect(() => {
    if (people.length > 1) {
      requestAnimationFrame(() => listRef.current?.scrollToIndex({ index: middleStart, animated: false }));
    }
  }, [middleStart, people.length]);

  const keepCarouselInfinite = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (people.length <= 1) {
      return;
    }

    const index = Math.round(event.nativeEvent.contentOffset.x / (cardWidth + cardGap));
    if (index < people.length) {
      listRef.current?.scrollToIndex({ index: index + people.length, animated: false });
    } else if (index >= people.length * 2) {
      listRef.current?.scrollToIndex({ index: index - people.length, animated: false });
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
      ItemSeparatorComponent={() => <View style={{ width: cardGap }} />}
      getItemLayout={(_, index) => ({ length: cardWidth + cardGap, offset: (cardWidth + cardGap) * index, index })}
      onMomentumScrollEnd={keepCarouselInfinite}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.personCard} activeOpacity={0.82} onPress={() => onSelect(item)}>
          <Image source={item.url_imagem ? { uri: item.url_imagem } : personFallback} style={styles.personImage} resizeMode="cover" />
          <View style={styles.personBody}>
            <Text style={styles.personName} numberOfLines={2}>{item.nome || 'Nome não informado'}</Text>
            <Text style={styles.personRole} numberOfLines={2}>{item.cargo || 'Cargo não informado'}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { alignItems: 'center', paddingTop: 24, paddingBottom: 110 },
  logoCircle: {
    width: 142,
    height: 142,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 71,
    backgroundColor: colors.white,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  logo: { width: 118, height: 118, borderRadius: 59 },
  title: { marginTop: 18, paddingHorizontal: 18, color: colors.textPrimary, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  subtitle: { marginTop: 6, paddingHorizontal: 18, color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  socialRow: { width: '100%', flexDirection: 'row', marginTop: 22, paddingHorizontal: 13 },
  socialButton: {
    flex: 1,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
  },
  socialText: { marginLeft: 8, color: colors.primary, fontWeight: '900' },
  infoBlock: {
    width: 'auto',
    alignSelf: 'stretch',
    marginHorizontal: 18,
    marginTop: 22,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: { color: colors.accent, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  address: { marginTop: 8, color: colors.textPrimary, fontSize: 15, lineHeight: 22, fontWeight: '700' },
  mapButton: { alignSelf: 'flex-start', marginTop: 14, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.primary },
  mapButtonText: { color: colors.white, fontWeight: '900' },
  peopleSection: { width: '100%', marginTop: 28 },
  peopleTitle: { paddingHorizontal: 18, color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
  peopleSubtitle: { paddingHorizontal: 18, marginTop: 5, color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  peopleLoading: { marginTop: 24 },
  errorText: { paddingHorizontal: 18, marginTop: 16, color: colors.danger, fontWeight: '800' },
  peopleCarousel: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8 },
  personCard: {
    width: cardWidth,
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: colors.surface,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  personImage: { width: '100%', height: 178, backgroundColor: colors.surfaceMuted },
  personBody: { minHeight: 92, padding: 13 },
  personName: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  personRole: { color: colors.accent, fontSize: 13, fontWeight: '800', marginTop: 5 },
});
