import { StyleSheet, Text, View } from 'react-native'
import React, { useCallback, useRef } from 'react'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@/contexts/themeContext';
import ThemedView from '../ThemedView';
import UserPost from './PostDetail/UserPostDetail';
import UserPostDetail from './PostDetail/UserPostDetail';
import ViewpostDetail from './PostDetail/ViewpostDetail';

interface props {
    BottomIndex: any;
    setbottomIndex: (data: any) => void;
    type: string;
}


const PostDetailBottomsheet: React.FC<props> = ({ BottomIndex, setbottomIndex, type }) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const { dark } = useTheme();

    const handleSheetChanges = useCallback((index: number) => {
        console.log('handleSheetChanges', index);
    }, []);
    return (
        <BottomSheet
            ref={bottomSheetRef}
            snapPoints={['34%']}
            index={BottomIndex}
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
                {type == 'userpost' ?
                    <UserPostDetail /> :
                    <ViewpostDetail />
                }
            </BottomSheetView>
        </BottomSheet>
    )
}

export default PostDetailBottomsheet

const styles = StyleSheet.create({})