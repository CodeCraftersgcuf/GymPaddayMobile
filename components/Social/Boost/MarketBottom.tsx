import { StyleSheet, Text, View } from 'react-native'
import React, { useCallback, useRef } from 'react'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@/contexts/themeContext';
import { Pressable } from 'react-native';
import { images as Icons } from '@/constants';
import { Image } from 'react-native';
import ThemedView from '@/components/ThemedView';
import ThemeText from '@/components/ThemedText';
import { useRouter } from 'expo-router';

interface props {
    selectedItem: { id: number, image: string } | null;
    setSelectedItem: (data: any) => void;
    onBoost: () => void;
}


const MarketBottom: React.FC<props> = ({ selectedItem, setSelectedItem, onBoost }) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const router = useRouter();
    const { dark } = useTheme();

    const handleClick = () => {
        console.log('clicked!!')
    }
    const handleBoost = () => {
        console.log("Boosting post with ID:", selectedItem?.id
            , "and image:", selectedItem?.image
        );
        if (!selectedItem) return;
        router.push({
            pathname: '/BoostPostScreen',
            params: {
                id: selectedItem.id,
                image: selectedItem.image,
            },
        });
        setSelectedItem(null); // close bottom sheet
    };

    const handleDelete = () => {
        if (!selectedItem) return;
        // Implement delete logic with selectedItem.id
        // e.g., call an API or open a confirmation modal
        setSelectedItem(null); // close bottom sheet
    };

    const Options = [
        {
            icon: Icons.BoostIcon,
            title: 'Boost Listing',
            handleFunction: handleBoost,
        },
        {
            icon: Icons.DeleteIcon,
            title: 'Delete Post',
            handleFunction: handleDelete,
        },
    ];

    const handleSheetChanges = useCallback((index: number) => {
        console.log('handleSheetChanges', index);
    }, []);
    return (
        <>
            <BottomSheet
                ref={bottomSheetRef}
                snapPoints={['20%']}
                index={selectedItem ? 0 : -1}
                onClose={() => setSelectedItem(null)}
                onChange={handleSheetChanges}
                enablePanDownToClose
                backgroundStyle={{
                    backgroundColor: dark ? "#252525" : 'white',
                }}
                handleIndicatorStyle={{
                    backgroundColor: dark ? "#666" : 'gray',
                }}
                handleComponent={() => (
                    <View style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingTop: 10,
                        backgroundColor: dark ? "#252525" : 'white',
                        borderTopLeftRadius: 10,
                        borderTopRightRadius: 10,
                    }}>
                        <Text style={{
                            color: dark ? 'white' : 'black',
                            fontSize: 16,
                            fontWeight: 'bold',
                        }}>
                            More Options
                        </Text>
                    </View>
                )}
            >
                <BottomSheetView
                    style={{
                        padding: 20,
                        backgroundColor: dark ? "#252525" : 'white',
                    }}
                >
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
                </BottomSheetView>
            </BottomSheet>
        </>
    )
}

export default MarketBottom