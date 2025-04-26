import { images } from "@/constants";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
  Share,
  Pressable
} from "react-native";
import ThemedView from "../ThemedView";
import ThemeText from "../ThemedText";
import { useTheme } from "@/contexts/themeContext";
import { dummyImage } from "@/constants/help";
import PostDetailBottomsheet from "./PostDetailBottomsheet";
// import { Heart, MessageCircle, Star, Share2, MoveVertical as MoreVertical } from 'lucide-react-native';

const { width, height } = Dimensions.get("window");

interface PostItemProps {
  post: {
    comments_count: number;
    content: string;
    id: number;
    likes_count: number;
    recent_comments: any[];
    timestamp: string;
    imagesUrl: string[];
    view_count: number;
    share_count: number;
    user: {
      id: number;
      username: string;
      profile_picture: string
    };
  };
  onCommentPress: (value: any[], postId: number) => void;
  handleMenu:(userId: number | string, postId: number) => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, onCommentPress,handleMenu }) => {
  const { dark } = useTheme();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalVisibleBottomSheet, setModalVisibleBottomSheet] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [ImagesData, setImagesData] = useState<string[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);

  // Extract images from post
  const imagesUrl = post.imagesUrl;

  useEffect(() => {
    setImagesData(imagesUrl);
  }, [post]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
  };

  const handlePress = () => {
    // Map recent comments to the correct structure
    const commentsForThisPost = post.recent_comments.map(comment => ({
      id: comment.id.toString(),
      username: comment.user.username,
      profileImage: dummyImage(),
      text: comment.text,
      time: "Just now",
      replies: Array.isArray(comment.replies) ? comment.replies.map((comment: any) => ({
        id: comment.id.toString(),
        username: comment.user.username,
        profileImage: dummyImage(),
        text: comment.text,
        time: "Just now",
        likes: 0,
      })) : [],
      likes: 0,
    }));

    onCommentPress(commentsForThisPost, post.id);
  };

  const openImageSlider = (index: number) => {
    setSelectedImage(index);
    setCurrentIndex(index);
    setModalVisible(true);
  };

  const handleScroll = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(newIndex);
  };
  
  return (
    <View style={styles.postContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7}>
          <View style={styles.headerLeft}>
            <Image source={{ uri: post.user.profile_picture }} style={styles.profileImage} />
            <View>
              <ThemeText style={styles.username}>{post.user.username}</ThemeText>
              <Text style={styles.time}>{post.timestamp}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={()=>handleMenu(post.user.id,post.id)}>
          <Image source={images.menuIcon} style={{ width: 25, height: 25 }} tintColor={dark ? "white" : 'black'} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ThemeText style={styles.content}>{post.content}</ThemeText>

      {/* Image Grid */}
      {ImagesData && ImagesData.length > 0 && (
        <View style={styles.imageGrid}>
          {imagesUrl.length === 1 ? (
            <TouchableOpacity onPress={() => openImageSlider(0)}>
              <Image source={{ uri: ImagesData[0] }} style={styles.fullWidthImage} />
            </TouchableOpacity>
          ) : imagesUrl.length === 3 ? (
            <View style={styles.threeImagesGrid}>
              <TouchableOpacity onPress={() => openImageSlider(0)} style={styles.largeImageWrapper}>
                <Image source={{ uri: ImagesData[0] }} style={styles.largeImage} />
              </TouchableOpacity>
              <View style={styles.smallImagesWrapper}>
                <TouchableOpacity onPress={() => openImageSlider(1)} style={styles.smallImageWrapper}>
                  <Image source={{ uri: ImagesData[1] }} style={styles.smallImage} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openImageSlider(2)} style={styles.smallImageWrapper}>
                  <Image source={{ uri: ImagesData[2] }} style={styles.smallImage} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.twoColumnGrid}>
              {ImagesData.slice(0, 4).map((image, index) => (
                <TouchableOpacity key={index} onPress={() => openImageSlider(index)} style={styles.imageWrapper}>
                  <Image source={{ uri: image }} style={styles.gridImage} />
                  {imagesUrl.length > 4 && index === 3 && (
                    <View style={styles.overlay}>
                      <Text style={styles.overlayText}>+{imagesUrl.length - 4}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Post Actions */}
      <View style={styles.actions}>
        <ThemedView style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={handleLike} style={styles.actionItem}>
            <Image source={images.ConnectIcons} tintColor={dark ? 'white' : 'black'} style={{ width: 25, height: 25 }} />
            <ThemeText style={styles.actionText}>{likesCount}</ThemeText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handlePress}>
            <Image source={images.comment} tintColor={dark ? 'white' : 'black'} style={{ width: 25, height: 25 }} />
            <ThemeText style={styles.actionText}>{post.recent_comments.length}</ThemeText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Image source={images.Share} tintColor={dark ? 'white' : 'black'} style={{ width: 25, height: 25 }} />
            <ThemeText style={styles.actionText}>100</ThemeText>
          </TouchableOpacity>
        </ThemedView>
        <ThemedView>
          <TouchableOpacity style={styles.actionItem}>
            <Image source={images.downloadIcon} tintColor={dark ? 'white' : 'black'} style={{ width: 25, height: 25 }} />
          </TouchableOpacity>
        </ThemedView>
      </View>
      <ThemedView style={{ marginTop: 10 }}>
        <ThemeText>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Eligendi, repellendus?
        </ThemeText>
      </ThemedView>

      {/* Full-Screen Image Slider Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBackground}>
          <FlatList
            data={ImagesData}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={selectedImage}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.fullscreenImage} />
            )}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />

          {/* Pagination Dots */}
          {imagesUrl && imagesUrl.length > 1 && (
            <View style={styles.pagination}>
              {imagesUrl?.map((_, index) => (
                <View key={index} style={[styles.dot, currentIndex === index && styles.activeDot]} />
              ))}
            </View>
          )}

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <View style={styles.closeButtonCircle}>
              <Image source={images.CreatePlus} style={styles.closeButtonImage} />
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
      
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    paddingVertical: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  username: {
    fontWeight: "bold",
    fontSize: 16,
  },
  time: {
    color: "gray",
    fontSize: 12,
  },
  content: {
    marginTop: 10,
    marginBottom: 10,
  },
  imageGrid: {
    marginTop: 10,
  },
  fullWidthImage: {
    width: "100%",
    height: 300,
    borderRadius: 8,
  },
  threeImagesGrid: {
    flexDirection: "row",
    gap: 5,
  },
  largeImageWrapper: {
    flex: 2,
  },
  largeImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
  },
  smallImagesWrapper: {
    flex: 1,
    justifyContent: "space-between",
  },
  smallImageWrapper: {
    flex: 1,
  },
  smallImage: {
    width: "100%",
    height: 87,
    borderRadius: 8,
    marginBottom: 5,
  },
  twoColumnGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  gridImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
  },
  imageWrapper: {
    flexBasis: "48%",
    position: "relative",
    overflow: "hidden",
    marginBottom: 5,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  overlayText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionText: {
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width,
    height: height * 0.8,
    resizeMode: "contain",
  },
  pagination: {
    marginBottom: 20,
    flexDirection: "row",
    alignSelf: "center",
    padding: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "gray",
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#ff0000",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
  },
  closeButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  closeButtonImage: {
    width: 20,
    height: 20,
    transform: [{ rotate: '45deg' }]
  }
});

export default PostItem;