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
  FlatList,
  ActivityIndicator,
  BackHandler,
  Alert
} from 'react-native';
import { useTheme } from '@/contexts/themeContext';
import CommentItem from './CommentItem';
import { images } from '@/constants';
import * as SecureStore from 'expo-secure-store';
import { useMutation } from '@tanstack/react-query';
import { deleteComment } from '@/utils/mutations/comments';
import Toast from 'react-native-toast-message';

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
  onAddComment?: (text: string, postId: number, parentId?: string) => void;
  loading?: boolean; // <-- add this

}

const CommentsBottomSheet: React.FC<CommentsBottomSheetProps> = ({
  visible,
  comments,
  postId,
  onClose,
  onAddComment,
  loading = false
}) => {
  const { dark } = useTheme();
  const [newComment, setNewComment] = React.useState('');
  const [localComments, setLocalComments] = React.useState<Comment[]>(comments);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<FlatList>(null);
  const [replyToCommentId, setReplyToCommentId] = React.useState<string | null>(null);
  const [replyToUsername, setReplyToUsername] = React.useState<string | null>(null);

  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const userData = await SecureStore.getItemAsync('user_data');
        const parsed = userData ? JSON.parse(userData) : null;
        if (parsed?.id) {
          setCurrentUserId(parsed.id.toString());
        }
      } catch (err) {
        console.error('Failed to load user id', err);
      }
    };
    loadUserId();
  }, []);

  const deleteMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token');
      return deleteComment({ id: commentId, token });
    },
    onSuccess: (_, commentId) => {
      // Recursively remove comment from local state (handles nested replies)
      const removeCommentRecursively = (comments: Comment[]): Comment[] => {
        return comments
          .filter(item => item.id !== commentId.toString())
          .map(item => ({
            ...item,
            replies: item.replies ? removeCommentRecursively(item.replies) : undefined
          }));
      };
      
      setLocalComments(prev => removeCommentRecursively(prev));
      
      Toast.show({
        type: 'success',
        text1: 'Comment deleted',
        text2: 'The comment has been removed.',
      });
    },
    onError: (error: any) => {
      console.error('Delete comment error:', error);
      Alert.alert('Delete Failed', error?.message || 'Unable to delete comment. Please try again.');
    }
  });

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

  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [visible, onClose]);

  if (!visible) return null;

  const handleSendComment = () => {
    if (newComment.trim() && postId !== null && onAddComment) {
      onAddComment(newComment, postId, replyToCommentId);
      setNewComment(''); // Clear input immediately

      // Scroll to bottom to show the new comment
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const backgroundColor = dark ? '#121212' : '#FFFFFF';
  const textColor = dark ? '#FFFFFF' : '#000000';
  const inputBackgroundColor = dark ? '#333333' : '#F0F0F0';
  const borderColor = dark ? '#333333' : '#E0E0E0';
  const handleReplyPress = (commentId: string, username: string) => {
    setReplyToCommentId(commentId);
    setReplyToUsername(username);
  };
  const handleDeletePress = (commentId: string, userId: string) => {
    // Compare user IDs (handle both string and number formats)
    const currentUserIdStr = currentUserId?.toString();
    const commentUserIdStr = userId?.toString();
    
    if (currentUserIdStr && currentUserIdStr !== commentUserIdStr) {
      Alert.alert('Not allowed', 'You can only delete your own comments.');
      return;
    }
    
    if (!currentUserIdStr) {
      Alert.alert('Error', 'Unable to verify user. Please try again.');
      return;
    }
    
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(Number(commentId)),
        },
      ]
    );
  };

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
              <Image source={images.CreatePlus} style={{ height: 20, width: 20, transform: [{ rotate: '45deg' }] }} tintColor={textColor} />
            </TouchableOpacity>
          </View>

          {/* Comments List or Loader */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={textColor} style={{ marginVertical: 30 }} />
              <Text style={{ color: textColor, textAlign: 'center' }}>Loading comments...</Text>
            </View>
          ) : (
            <FlatList
              ref={scrollViewRef}
              style={styles.commentsList}
              data={localComments}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={({ item }) => (
                <CommentItem
                  comment={item}
                  darkMode={dark}
                  onReplyPress={handleReplyPress}
                  onDeletePress={handleDeletePress}
                />
              )}
              ListEmptyComponent={
                <View style={styles.noComments}>
                  <Text style={[styles.noCommentsText, { color: textColor }]}>
                    No comments yet. Be the first to comment!
                  </Text>
                </View>
              }
              contentContainerStyle={{ flexGrow: 1 }}
              scrollEnabled={true}
            />
          )}

          <View style={styles.bottomPadding} />

          {replyToUsername && (
            <View style={{ paddingHorizontal: 16, marginBottom: 6 }}>
              <Text style={{ color: textColor }}>
                Replying to <Text style={{ fontWeight: 'bold' }}>@{replyToUsername}</Text>
              </Text>
              <TouchableOpacity onPress={() => {
                setReplyToCommentId(null);
                setReplyToUsername(null);
              }}>
                <Text style={{ color: '#940304', marginTop: 4 }}>Cancel Reply</Text>
              </TouchableOpacity>
            </View>
          )}

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
                  backgroundColor: dark ? '#333333' : '#DDDDDD',
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
    marginBottom: 20,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120, // or whatever fits your design
  },

});

export default CommentsBottomSheet;