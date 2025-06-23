import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { colors } from './colors';

type PostPreviewProps = {
  isDark: boolean;
};

const PostPreview: React.FC<PostPreviewProps> = ({ isDark }) => {
  const theme = isDark ? colors.dark : colors.light;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1' }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: theme.text }]}>Maleekfrenzy</Text>
          <Text style={[styles.sponsored, { color: colors.light.primary }]}>Sponsored post</Text>
        </View>
      </View>

      <Image 
        source={{ uri: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1' }}
        style={styles.postImage}
      />

      <View style={[styles.descriptionContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.descriptionLabel, { color: theme.textSecondary }]}>Description</Text>
        <Text style={[styles.description, { color: theme.text }]}>
          Always try to be the best you can be, strive for the best, put in the work and you will achieve your goals.
        </Text>
      </View>
    </View>
  );
};

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  avatar: ImageStyle;
  userInfo: ViewStyle;
  username: TextStyle;
  sponsored: TextStyle;
  postImage: ImageStyle;
  descriptionContainer: ViewStyle;
  descriptionLabel: TextStyle;
  description: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  sponsored: {
    fontSize: 14,
    marginTop: 2,
  },
  postImage: {
    width: '100%',
    height: 300,
  },
  descriptionContainer: {
    padding: 16,
  },
  descriptionLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
  },
});

export default PostPreview;
