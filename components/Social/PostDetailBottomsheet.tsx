import { StyleSheet, Text, View } from 'react-native'
import React, { useCallback, useRef, useState, useEffect } from 'react'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@/contexts/themeContext';
import ThemedView from '../ThemedView';
import UserPostDetail from './PostDetail/UserPostDetail';
import ViewpostDetail from './PostDetail/ViewpostDetail';

import * as SecureStore from 'expo-secure-store';

interface props {
    BottomIndex: any;
    setbottomIndex: (data: any) => void;
    type: string;
    idCan: {
        userId: any;
        postId: any;
    } | {}
    onHidePost?: () => void; // add this!
    onClose?: () => void; // add this
    hiddenPostIds?: number[]; // Array of hidden post IDs
}


const PostDetailBottomsheet: React.FC<props> = ({ BottomIndex, setbottomIndex, type, idCan, onHidePost, onClose, hiddenPostIds = [] }) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const { dark } = useTheme();
    const [userId, setUserId] = useState<string | null>(null);
    // console.log("PostDetailBottomSheet IdCan:", idCan);

    useEffect(() => {
        const fetchUserId = async () => {
            // If you stored the whole user object
            const userDataRaw = await SecureStore.getItemAsync("user_data");
            if (userDataRaw) {
                try {
                    const userData = JSON.parse(userDataRaw);
                    setUserId(userData.id?.toString() ?? null);
                } catch (e) {
                    setUserId(null);
                }
            } else {
                // Or if you stored only user_id
                const id = await SecureStore.getItemAsync("user_id");
                setUserId(id);
            }
        };
        fetchUserId();
    }, []);

    useEffect(() => {
        if (userId !== null) {
            console.log("User ID from SecureStore:", userId);
        }
    }, [userId]);

    // Close bottom sheet when BottomIndex becomes -1
    useEffect(() => {
        if (BottomIndex === -1) {
            bottomSheetRef.current?.close();
        } else if (BottomIndex >= 0) {
            bottomSheetRef.current?.snapToIndex(BottomIndex);
        }
    }, [BottomIndex]);


    const handleSheetChanges = useCallback((index: number) => {
        console.log('handleSheetChanges', index);
        // Close the sheet when index becomes -1
        if (index === -1) {
            setbottomIndex(-1);
        }
    }, [setbottomIndex]);

    // Close the bottom sheet programmatically
    const closeBottomSheet = useCallback(() => {
        bottomSheetRef.current?.close();
        setbottomIndex(-1);
        if (onClose) {
            onClose();
        }
    }, [onClose, setbottomIndex]);
    return (
        <BottomSheet
            ref={bottomSheetRef}
            snapPoints={['34%']}
            index={BottomIndex}
            onClose={() => setbottomIndex(-1)}
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
                {
                    userId && idCan.userId && userId === idCan.userId.toString()
                        ? <UserPostDetail idCan={idCan} onClose={closeBottomSheet} />
                        : <ViewpostDetail 
                            onHide={onHidePost} 
                            onClose={closeBottomSheet} 
                            userId={idCan.userId} 
                            postId={idCan.postId}
                            hiddenPostIds={hiddenPostIds}
                          />

                }

            </BottomSheetView>
        </BottomSheet>
    )
}

export default PostDetailBottomsheet

const styles = StyleSheet.create({})