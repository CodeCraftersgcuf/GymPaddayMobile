import { Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { images } from '@/constants'
import ThemedView from '@/components/ThemedView'
import { useTheme } from '@/contexts/themeContext'
import ThemeText from '@/components/ThemedText'

const ViewpostDetail = () => {
    const { dark } = useTheme();
    const handleClick = () => {
        console.log('clicked!!')
    }
    const Options = [
        {
            icon: images.followIcon,
            title: 'Follow User',
            handleFunction: handleClick,
        },
        {
            icon: images.eysIcon,
            title: 'Hide Post',
            handleFunction: handleClick,
        },
        {
            icon: images.reportIcons,
            title: 'Report post',
            handleFunction: handleClick,
        },
    ]
    return (
        <View style={{ gap: 20 }}>
            {
                Options.map((item, index) => (
                    <ThemedView darkColor='#252525' key={index} style={[{ flexDirection: 'row', gap: 10 }]}>
                        <Image source={item.icon} style={{ width: 25, height: 25 }} tintColor={item.title == 'Repost post' ? 'red' : dark ? 'white' : 'black'} />
                        <ThemeText
                            lightColor={item.title == 'Repost post' ? 'red' : 'black'}
                            darkColor={item.title == 'Repost post' ? 'red' : 'white'}
                        >
                            {item.title}
                        </ThemeText>
                    </ThemedView>
                ))
            }
        </View>
    )
}

export default ViewpostDetail

const styles = StyleSheet.create({})