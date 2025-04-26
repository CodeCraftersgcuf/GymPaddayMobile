import { images } from '@/constants';
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

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

interface CommentItemProps {
  comment: Comment;
  darkMode: boolean;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, darkMode, isReply = false }) => {
  const textColor = darkMode ? '#FFFFFF' : '#000000';
  const subtextColor = darkMode ? '#AAAAAA' : '#777777';
  const accentColor = '#3B82F6';
  const replyPadding = isReply ? 40 : 0;
  console.log("Replies : ",comment.replies)

  return (
    <View style={[styles.commentContainer, { marginLeft: replyPadding }]}>
      <View style={styles.commentHeader}>
        <Image source={{ uri: comment.profileImage }} style={styles.avatar} />
        <View style={styles.commentContent}>
          <View style={styles.userInfo}>
            <Text style={[styles.username, { color: textColor }]}>
              {comment.username}
            </Text>
            <Text style={[styles.timestamp, { color: subtextColor }]}>
              {comment.timestamp}
            </Text>
          </View>
          <Text style={[styles.commentText, { color: textColor }]}>
            {comment.text}
          </Text>
          <View style={styles.commentActions}>
            <TouchableOpacity style={styles.replyButton}>
              <Text style={[styles.replyText, { color: subtextColor }]}>Reply</Text>
            </TouchableOpacity>
            <View style={styles.likesContainer}>
              <Image source={images.SocialIcons} style={{ height: 20, width: 20 }} />
              <Text style={[styles.likesCount, { color: subtextColor }]}>
                {comment.replies?.length}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply, index) => (
            <CommentItem
              key={`${reply.id}-${index}`}
              comment={reply}
              darkMode={darkMode}
              isReply={true}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  commentContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontWeight: '600',
    fontSize: 15,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 13,
  },
  commentText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 6,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  replyButton: {
    marginRight: 16,
  },
  replyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likesCount: {
    marginLeft: 4,
    fontSize: 14,
  },
  repliesContainer: {
    marginTop: 8,
  },
});

export default CommentItem;