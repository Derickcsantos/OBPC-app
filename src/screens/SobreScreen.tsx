import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import InstagramIcon from '../assets/instagram-svgrepo-com.svg';
import WhatsappIcon from '../assets/whatsapp-svgrepo-com.svg';
import { colors } from '../theme/colors';

const logo = require('../assets/logo-completo.png');

const address = 'Av. Joao Paulo I, 1400 - Parque Sao Luis, Sao Paulo - SP, 02842-280';
const whatsappUrl = 'https://w.app/obpc';
const instagramUrl = 'https://www.instagram.com/obpcfreguesiaoficial/';
const mapsUrl =
  'https://www.google.com/maps/search/?api=1&query=Av.%20Joao%20Paulo%20I%2C%201400%20-%20Parque%20Sao%20Luis%2C%20Sao%20Paulo%20-%20SP%2C%2002842-280';

const openUrl = async (url: string) => {
  const supported = await Linking.canOpenURL(url);

  if (supported) {
    Linking.openURL(url);
  }
};

export const SobreScreen = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.logoCircle}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />
    </View>

    <Text style={styles.title}>OBPC Freguesia do O</Text>
    <Text style={styles.subtitle}>Uma igreja para viver a fe, a comunhao e o servico.</Text>

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
      <Text style={styles.sectionLabel}>Endereco</Text>
      <Text style={styles.address}>{address}</Text>
      <TouchableOpacity style={styles.mapButton} onPress={() => openUrl(mapsUrl)}>
        <Text style={styles.mapButtonText}>Abrir no Maps</Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 110,
  },
  logoCircle: {
    width: 142,
    height: 142,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 71,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  logo: {
    width: 118,
    height: 118,
    borderRadius: 59,
  },
  title: {
    marginTop: 18,
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  socialRow: {
    width: '100%',
    flexDirection: 'row',
    marginTop: 22,
  },
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
  socialText: {
    marginLeft: 8,
    color: colors.primary,
    fontWeight: '900',
  },
  infoBlock: {
    width: '100%',
    marginTop: 22,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  address: {
    marginTop: 8,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  mapButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  mapButtonText: {
    color: colors.white,
    fontWeight: '900',
  },
});
