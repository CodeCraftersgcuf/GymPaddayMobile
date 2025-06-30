import { Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { images } from '@/constants'
import ThemedView from '@/components/ThemedView'
import { useTheme } from '@/contexts/themeContext'
import ThemeText from '@/components/ThemedText'
import { TouchableOpacity } from 'react-native';

// Accept onHide and onReport as props
interface ViewpostDetailProps {
    onHide?: () => void;
    onReport?: () => void;
    onClose?: () => void; // accept

}

const ViewpostDetail: React.FC<ViewpostDetailProps> = ({ onHide, onReport, onClose }) => {
    const { dark } = useTheme();
    const handleClick = () => {
        console.log('clicked!!')
    }
    const handleFollow = () => {
        // ...follow logic
        if (onClose) onClose();
    };
    const handleHide = () => {
        if (onHide) onHide();
        if (onClose) onClose();
    };
    const handleReport = () => {
        if (onReport) onReport();
        if (onClose) onClose();
    };
    const Options = [
        {
            icon: images.followIcon,
            title: 'Follow User',
            handleFunction: handleFollow,
        },
        {
            icon: images.eysIcon,
            title: 'Hide Post',
            handleFunction: handleHide,
        },
        {
            icon: images.reportIcons,
            title: 'Report post',
            handleFunction: handleReport,
        },
    ]
    return (
        <View style={{ gap: 20 }}>
            {Options.map((item, index) => (
                <TouchableOpacity key={index} onPress={item.handleFunction}>
                    <ThemedView darkColor='#252525' style={[{ flexDirection: 'row', gap: 10 }]}>
                        <Image source={item.icon} style={{ width: 25, height: 25 }} tintColor={item.title == 'Repost post' ? 'red' : dark ? 'white' : 'black'} />
                        <ThemeText
                            lightColor={item.title == 'Repost post' ? 'red' : 'black'}
                            darkColor={item.title == 'Repost post' ? 'red' : 'white'}
                        >
                            {item.title}
                        </ThemeText>
                    </ThemedView>
                </TouchableOpacity>
            ))}
        </View>
    )
}

export default ViewpostDetail

const styles = StyleSheet.create({})