import { Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { images } from '@/constants'
import ThemedView from '@/components/ThemedView'
import { useTheme } from '@/contexts/themeContext'
import ThemeText from '@/components/ThemedText'

const UserPostDetail = () => {
  const { dark } = useTheme();
  const handleClick = () => {
    console.log('clicked!!')
  }
  const Options = [
    {
      icon: images.EditIcon,
      title: 'Edit Profile',
      handleFunction: handleClick,
    },
    {
      icon: images.BoostIcon,
      title: 'Boost Post',
      handleFunction: handleClick,
    },
    {
      icon: images.DeleteIcon,
      title: 'Delete Post',
      handleFunction: handleClick,
    },
  ]
  return (
    <View style={{ gap: 20 }}>
      {
        Options.map((item, index) => (
          <ThemedView darkColor='#252525' key={index} style={[{ flexDirection: 'row', gap: 10 }]}>
            <Image source={item.icon} style={{ width: 25, height: 25 }} tintColor={item.title == 'Delete Post' ? 'red' : dark ? 'white' : 'black'} />
            <ThemeText
              lightColor={item.title == 'Delete Post' ? 'red' : 'black'}
              darkColor={item.title == 'Delete Post' ? 'red' : 'white'}
            >
              {item.title}
            </ThemeText>
          </ThemedView>
        ))
      }
    </View>
  )
}

export default UserPostDetail

const styles = StyleSheet.create({})