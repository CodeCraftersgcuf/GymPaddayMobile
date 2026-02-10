import React, { useState } from 'react';
import {
    View,
    TextInput,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Text,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/themeContext';
import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import PostContainer from '@/components/Social/PostContainer';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';


const SearchScreen = () => {
    const [query, setQuery] = useState('');
    const [triggerSearch, setTriggerSearch] = useState(false);
    const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');
    const { dark } = useTheme();
    const router = useRouter();

    const { data, isLoading } = useQuery({
        queryKey: ['searchResults', query],
        queryFn: async () => {
            const token = await SecureStore.getItemAsync('auth_token');
            const res = await fetch(`https://gympaddy.skillverse.com.pk/api/user/search?q=${query}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return res.json();
        },
        enabled: triggerSearch && query.length > 1,
    });

    const handleSearchSubmit = () => {
        if (query.length > 1) setTriggerSearch(true);
    };
    const handleClear = () => {
        setQuery('');
        setTriggerSearch(false);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: dark ? '#000' : '#fff' }}>
            <View style={styles.searchRow}>
                <TextInput
                    placeholder="Search users or posts..."
                    placeholderTextColor="#888"
                    style={[
                        styles.input,
                        { color: dark ? '#fff' : '#000', borderColor: dark ? '#444' : '#ccc' },
                    ]}
                    value={query}
                    onChangeText={(text) => {
                        setQuery(text);
                        if (text.length === 0) {
                            setTriggerSearch(false);
                        }
                    }}
                    onSubmitEditing={handleSearchSubmit}
                />
                {!!query && (
                    <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                        <Ionicons name="close-circle" size={20} color={dark ? '#ccc' : '#666'} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'users' && styles.activeTab]}
                    onPress={() => setActiveTab('users')}
                >
                    <Text style={{ color: dark ? '#fff' : '#000' }}>Users</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
                    onPress={() => setActiveTab('posts')}
                >
                    <Text style={{ color: dark ? '#fff' : '#000' }}>Posts</Text>
                </TouchableOpacity>
            </View>

            {isLoading && <ActivityIndicator color="red" size="large" style={{ marginTop: 20 }} />}

            {triggerSearch && !isLoading && data && (
                <View style={{ flex: 1 }}>
                    {activeTab === 'users' ? (
                        data.users && data.users.length > 0 ? (
                            <FlatList
                                data={data.users}
                                keyExtractor={(item) => item.id.toString()}
                                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
                                renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.userItem]}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/UserProfile',
                                            params: { user_id: item.id },
                                        })
                                    }
                                >
                                    <Image
                                        source={
                                            item.profile_picture_url
                                                ? { uri: item.profile_picture_url }
                                                : require('@/assets/icons/more/User.png') // adjust path if needed
                                        }
                                        style={styles.avatar}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.userInfo}>
                                        <Text style={[styles.fullname, { color: dark ? '#fff' : '#000' }]}>
                                            {item.fullname ?? 'Unnamed User'}
                                        </Text>
                                        <Text style={[styles.username, { color: dark ? '#ccc' : '#666' }]}>
                                            @{item.username}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            />
                        ) : (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 }}>
                                <Ionicons name="search-outline" size={64} color={dark ? '#666' : '#ccc'} />
                                <Text style={{ textAlign: 'center', marginTop: 16, fontSize: 16, color: dark ? '#ccc' : '#666' }}>
                                    No users found
                                </Text>
                                <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 14, color: dark ? '#888' : '#999' }}>
                                    Try searching with a different username
                                </Text>
                            </View>
                        )
                    ) : (
                        <View style={{ flex: 1 }}>
                            {data.posts && data.posts.length > 0 ? (
                                <FlatList
                                    data={data.posts}
                                    keyExtractor={(item) => item.id.toString()}
                                    contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 120 }}
                                    renderItem={({ item }) => (
                                    <PostContainer
                                        showComment={false}
                                        posts={[
                                            {
                                                id: item.id,
                                                content: item.content,
                                                title: item.title,
                                                user: {
                                                    id: item.user?.id,
                                                    username: item.user?.username,
                                                    profile_picture: item.user?.profile_picture_url ?? null,
                                                },
                                                imagesUrl:
                                                    item.media?.filter((m) => m.media_type === 'image')?.map((m) => m.url) || [],
                                                videoUrl: item.media?.find((m) => m.media_type === 'video')?.url || null,
                                                timestamp: item.created_at,
                                                likes_count: item.likes?.length || 0,
                                                comments_count: item.comments?.length || 0,
                                                view_count: 0,
                                                share_count: 0,
                                                recent_comments:
                                                    item.comments?.slice(0, 2).map((comment) => ({
                                                        id: comment.id,
                                                        content: comment.content,
                                                        user: {
                                                            id: comment.user.id,
                                                            username: comment.user.username,
                                                            profile_picture: comment.user.profile_picture_url,
                                                        },
                                                    })) || [],
                                            },
                                        ]}
                                        onCommentPress={() => { }}
                                        handleMenu={() => { }}
                                    />
                                )}
                                />
                            ) : (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 }}>
                                    <Ionicons name="document-text-outline" size={64} color={dark ? '#666' : '#ccc'} />
                                    <Text style={{ textAlign: 'center', marginTop: 16, fontSize: 16, color: dark ? '#ccc' : '#666' }}>
                                        No posts found
                                    </Text>
                                    <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 14, color: dark ? '#888' : '#999' }}>
                                        Try searching with different keywords
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            )}

            {triggerSearch && !isLoading && !data && (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 }}>
                    <Ionicons name="search-outline" size={64} color={dark ? '#666' : '#ccc'} />
                    <Text style={{ textAlign: 'center', marginTop: 16, fontSize: 16, color: dark ? '#ccc' : '#666' }}>
                        No results found
                    </Text>
                    <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 14, color: dark ? '#888' : '#999' }}>
                        Try searching with different keywords
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    searchRow: {
        position: 'relative',
        justifyContent: 'center',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        margin: 10,
        paddingRight: 36,
    },
    clearButton: {
        position: 'absolute',
        right: 18,
        top: 18,
    },
    tabRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    tab: {
        padding: 10,
        borderBottomWidth: 2,
        borderColor: 'transparent',
    },
    activeTab: {
        borderColor: 'red',
    },
    item: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },

    avatar: {
        width: 45,
        height: 45,
        borderRadius: 45,
        marginRight: 12,
        backgroundColor: '#ccc',
    },

    userInfo: {
        flexDirection: 'column',
    },

    fullname: {
        fontSize: 16,
        fontWeight: '600',
    },

    username: {
        fontSize: 14,
    },

});

export default SearchScreen;
