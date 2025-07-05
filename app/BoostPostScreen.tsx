import React from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle, TextStyle } from 'react-native';
import { colors } from '@/components/Social/Boost/colors';
import Header from '@/components/Social/Boost/Header';
import ProgressBar from '@/components/Social/Boost/ProgressBar';
import PostPreview from '@/components/Social/Boost/PostPreview';
import Button from '@/components/Social/Boost/Button';
import { useTheme } from '@/contexts/themeContext';
import { useRouter, useLocalSearchParams } from 'expo-router';

const BoostPostScreen: React.FC = () => {
  const { dark } = useTheme();
  const isDark = dark;
  const theme = isDark ? colors.dark : colors.light;
  const router = useRouter();

  // Get id and image from navigation params
  const params = useLocalSearchParams();
  const post_id = params.id;
  const image = params.image;

  // For debug
  console.log('BoostPostScreen params:', { post_id, image });

  const handleNext = () => {
    router.push({
      pathname: '/BoostPostScreen_audience',
      params: { post_id, image }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Boost Post"
        onBack={() => router.back()}
        isDark={isDark}
      />

      <ProgressBar progress={25} isDark={isDark} />

      <ScrollView style={styles.content}>
        <Text style={[styles.subtitle, { color: theme.text }]}>
          Boost your post to reach more audience
        </Text>

        {/* Pass both image and id to PostPreview */}
        <PostPreview isDark={isDark} image={image} id={post_id} />
      </ScrollView>

      <Button
        title="Next"
        onPress={handleNext}
        isDark={isDark}
      />
    </View>
  );
};

type Styles = {
  container: ViewStyle;
  content: ViewStyle;
  subtitle: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
});

export default BoostPostScreen;
