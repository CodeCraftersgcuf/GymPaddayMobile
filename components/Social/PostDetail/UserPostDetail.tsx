import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { images } from '@/constants'
import ThemedView from '@/components/ThemedView'
import { useTheme } from '@/contexts/themeContext'
import ThemeText from '@/components/ThemedText'
import { useRouter } from 'expo-router'
import BoostAdModal from '../Boost/BoostAdModal'
import axios from 'axios'
import * as SecureStore from 'expo-secure-store';
import { useQueryClient } from '@tanstack/react-query'

const UserPostDetail: React.FC<{
  idCan: {
    userId: any;
    postId: any;
  }
}> = ({ idCan }) => {
  const router = useRouter();
  const { dark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const clientQuery = useQueryClient();
  console.log("Post Id in UserPostDetail:", idCan.postId);

  const post_id = idCan.postId; // Assuming postId is passed as a prop

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleProceed = () => {
    setModalVisible(false);
  };
  const handleClick = () => {
    console.log('clicked!!')
  }
  const hanldeEditPost = () => {
    // router.push({ pathname: '/createpost', params: { postId: idCan.postId } })
    router.push("/createpost");
  }
  const handleDeletePost = async () => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this post?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('auth_token');
              if (!token) {
                Alert.alert('Error', 'Authentication token not found');
                return;
              }

              await axios.delete(`https://gympaddy.hmstech.xyz/api/user/posts/${idCan.postId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              await clientQuery.invalidateQueries(['userPosts']); // ✅ fixed typo from invalidateQuerie → invalidateQueries
              Alert.alert('Success', 'Post deleted successfully');
              router.back(); // or navigate somewhere else if needed
            } catch (error) {
              console.error('Delete Error:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };


  const Options = [
    {
      icon: images.EditIcon,
      title: 'Edit Profile',
      handleFunction: hanldeEditPost,
    },
    {
      icon: images.BoostIcon,
      title: 'Boost Post',
      handleFunction: handleOpenModal,
    },
    {
      icon: images.DeleteIcon,
      title: 'Delete Post',
      handleFunction: handleDeletePost,
    },
  ]
  return (
    <>
      <View style={{ gap: 20 }}>
        {
          Options.map((item, index) => (
            <Pressable onPress={item.handleFunction} key={index}>
              <ThemedView darkColor='#252525' style={[{ flexDirection: 'row', gap: 10 }]}>
                <Image source={item.icon} style={{ width: 25, height: 25 }} tintColor={item.title == 'Delete Post' ? 'red' : dark ? 'white' : 'black'} />
                <ThemeText
                  lightColor={item.title == 'Delete Post' ? 'red' : 'black'}
                  darkColor={item.title == 'Delete Post' ? 'red' : 'white'}
                >
                  {item.title}
                </ThemeText>
              </ThemedView>
            </Pressable>
          ))
        }
      </View>

      <BoostAdModal
        visible={modalVisible}
        onClose={handleCloseModal}
        dark={dark}
        post_id={post_id}
      />
    </>
  )
}

export default UserPostDetail