import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import PostItem from './PostItem';
import { PostData } from './mockData';

interface PostContainerProps {
  posts: PostData[];
  showComment?:boolean
  onCommentPress: (comments: any[], postId: number) => void;
  handleMenu:(userId: number | string, postId: number) => void;
  activePostId?: number | null;
}

const PostContainer: React.FC<PostContainerProps> = ({ posts, onCommentPress, handleMenu, showComment=true, activePostId }) => {
  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <PostItem
          post={item}
          showComment={showComment}
          onCommentPress={onCommentPress}
          handleMenu={handleMenu}
          isFeedFocused={activePostId != null ? item.id === activePostId : undefined}
        />
      )}
      contentContainerStyle={{ paddingBottom: 100 }}
      scrollEnabled={false}
    />
  );
};

const styles = StyleSheet.create({

});

export default PostContainer;