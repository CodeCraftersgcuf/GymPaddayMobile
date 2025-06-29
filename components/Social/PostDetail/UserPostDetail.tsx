import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { images } from '@/constants'
import ThemedView from '@/components/ThemedView'
import { useTheme } from '@/contexts/themeContext'
import ThemeText from '@/components/ThemedText'
import { useRouter } from 'expo-router'
import BoostAdModal from '../Boost/BoostAdModal'

const UserPostDetail = () => {
  const router = useRouter();
  const { dark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

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
    router.push({ pathname: '/createpost', params: { postId: 12 } })
  }
  const handleDeletePost = () => {
    Alert.alert('Post deleted');
  }

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
      />
    </>
  )
}

export default UserPostDetail