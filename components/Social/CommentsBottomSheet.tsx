import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Animated,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  FlatList
} from 'react-native';
import { useTheme } from '@/contexts/themeContext';
import CommentItem from './CommentItem';
import { images } from '@/constants';

interface Comment {
  id: string;
  userId: string;
  username: string;
  profileImage: string;
  text: string;
  timestamp: string;
  likes: number;
  replies?: Comment[];
}

interface CommentsBottomSheetProps {
  visible: boolean;
  comments: Comment[];
  postId: number | null;
  onClose: () => void;
  onAddComment?: (text: string, postId: number) => void;
}

const CommentsBottomSheet: React.FC<CommentsBottomSheetProps> = ({
  visible,
  comments,
  postId,
  onClose,
  onAddComment
}) => {
  const { dark } = useTheme();
  const [newComment, setNewComment] = React.useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Animate in when visible changes
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  if (!visible) return null;

  const handleSendComment = () => {
    if (newComment.trim() && postId !== null && onAddComment) {
      onAddComment(newComment, postId);
      setNewComment('');
      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const backgroundColor = dark ? '#121212' : '#FFFFFF';
  const textColor = dark ? '#FFFFFF' : '#000000';
  const inputBackgroundColor = dark ? '#333333' : '#F0F0F0';
  const borderColor = dark ? '#333333' : '#E0E0E0';

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
          backgroundColor: dark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)'
        }
      ]}
    >
      <TouchableOpacity
        style={styles.backdropTouchable}
        activeOpacity={1}
        onPress={onClose}
      />

      <Animated.View
        style={[
          styles.bottomSheet,
          {
            backgroundColor,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0]
                })
              }
            ]
          }
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <Text style={[styles.headerTitle, { color: textColor }]}>Comments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Image source={images.CreatePlus} style={{ height: 20, width: 20 ,transform:[{rotate:'45deg'}]}}  tintColor={textColor} />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.commentsList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <FlatList
              data={comments}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={({ item }) => (
                <CommentItem comment={item} darkMode={dark} />
              )}
              ListEmptyComponent={
                <View style={styles.noComments}>
                  <Text style={[styles.noCommentsText, { color: textColor }]}>
                    No comments yet. Be the first to comment!
                  </Text>
                </View>
              }
              contentContainerStyle={{ flexGrow: 1 }}
              scrollEnabled={false}
            />
            <View style={styles.bottomPadding} />
          </ScrollView>

          {/* Input Area */}
          <View style={[styles.inputContainer, { backgroundColor, borderTopColor: borderColor }]}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputBackgroundColor,
                  color: textColor,
                  borderColor: borderColor
                }
              ]}
              placeholder="Type a message"
              placeholderTextColor={dark ? '#999999' : '#777777'}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor:  dark ? '#333333' : '#DDDDDD',
                }
              ]}
              onPress={handleSendComment}
              disabled={!newComment.trim()}
            >
              <Image source={images.notifcationIcon} style={{ height: 20, width: 20 }} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingBottom: 50,
    overflow: 'hidden',
  },
  keyboardAvoidContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    position: 'relative',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  commentsList: {
    flex: 1,
  },
  noComments: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noCommentsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    marginBottom:20,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});

export default CommentsBottomSheet;