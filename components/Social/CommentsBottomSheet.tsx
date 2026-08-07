import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  Platform,
  FlatList,
  ActivityIndicator,
  BackHandler,
  Alert,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { keyboardInputOffset, useKeyboardHeight } from '@/utils/useKeyboardHeight';
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
  const insets = useSafeAreaInsets();
  const [newComment, setNewComment] = React.useState('');
  const [localComments, setLocalComments] = React.useState<Comment[]>(comments);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = React.useState('You');
  const [currentUserImage, setCurrentUserImage] = React.useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<FlatList>(null);
  const [replyToCommentId, setReplyToCommentId] = React.useState<string | null>(null);
  const [replyToUsername, setReplyToUsername] = React.useState<string | null>(null);
  const keyboardHeight = useKeyboardHeight(visible);

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
        setCurrentUsername(parsed?.username || parsed?.fullname || 'You');
        setCurrentUserImage(parsed?.profile_picture_url || '');
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

  const handleReplyPress = useCallback((commentId: string, username: string) => {
    setReplyToCommentId(commentId);
    setReplyToUsername(username);
  }, []);

  const handleDeletePress = useCallback((commentId: string, userId: string) => {
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
  }, [currentUserId, deleteMutation]);

  const renderCommentItem = useCallback(
    ({ item }: { item: Comment }) => (
      <CommentItem
        comment={item}
        darkMode={dark}
        onReplyPress={handleReplyPress}
        onDeletePress={handleDeletePress}
      />
    ),
    [dark, handleReplyPress, handleDeletePress]
  );

  // Must stay after all hooks — early return before useCallbacks caused crash on open
  if (!visible) return null;

  const inputBottomPadding = keyboardInputOffset(keyboardHeight, insets.bottom, 10);

  const handleSendComment = () => {
    if (newComment.trim() && postId !== null && onAddComment) {
      const text = newComment.trim();
      const optimisticComment: Comment = {
        id: `temp_${Date.now()}`,
        userId: currentUserId || 'current_user',
        username: currentUsername,
        profileImage: currentUserImage,
        text,
        timestamp: new Date().toISOString(),
        likes: 0,
        replies: [],
      };

      const insertReply = (items: Comment[]): Comment[] =>
        items.map((item) => {
          if (item.id?.toString() === replyToCommentId?.toString()) {
            return {
              ...item,
              replies: [...(item.replies || []), optimisticComment],
            };
          }
          return {
            ...item,
            replies: item.replies ? insertReply(item.replies) : item.replies,
          };
        });

      setLocalComments((prev) => {
        if (!replyToCommentId) return [...prev, optimisticComment];
        return insertReply(prev);
      });

      onAddComment(text, postId, replyToCommentId || undefined);
      setNewComment('');
      setReplyToCommentId(null);
      setReplyToUsername(null);

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
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
    <KeyboardAvoidingView
      style={styles.modalRoot}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
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
            marginBottom: 0,
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
        <View style={styles.keyboardAvoidContainer}>
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
              keyExtractor={(item) => item.id}
              renderItem={renderCommentItem}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={7}
              removeClippedSubviews
              ListEmptyComponent={
                <View style={styles.noComments}>
                  <Text style={[styles.noCommentsText, { color: textColor }]}>
                    No comments yet. Be the first to comment!
                  </Text>
                </View>
              }
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
              scrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
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
                <Text style={{ color: '#C61F3A', marginTop: 4 }}>Cancel Reply</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Input Area */}
          <View style={[styles.inputContainer, {
            backgroundColor,
            borderTopColor: borderColor,
            paddingBottom: inputBottomPadding,
          }]}>
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
                  backgroundColor: newComment.trim() ? '#C61F3A' : (dark ? '#333333' : '#DDDDDD'),
                }
              ]}
              onPress={handleSendComment}
              disabled={!newComment.trim()}
            >
              <Image
                source={images.notifcationIcon}
                style={{ height: 20, width: 20 }}
                tintColor={newComment.trim() ? '#FFFFFF' : (dark ? '#888' : '#666')}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
    </KeyboardAvoidingView>
    </Modal>
  );

};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
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
    paddingHorizontal: 10,
    paddingTop: 10,
    alignItems: 'center',
    borderTopWidth: 1,
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