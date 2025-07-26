import AsyncStorage from '@react-native-async-storage/async-storage';

const BLOCKED_USERS_KEY = 'blocked_users';
const RESTRICTED_USERS_KEY = 'restricted_users';

export const blockUser = async (userId: string) => {
  const data = await AsyncStorage.getItem(BLOCKED_USERS_KEY);
  const list = data ? JSON.parse(data) : [];
  if (!list.includes(userId)) {
    list.push(userId);
    await AsyncStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(list));
  }
};

export const restrictUser = async (userId: string) => {
  const data = await AsyncStorage.getItem(RESTRICTED_USERS_KEY);
  const list = data ? JSON.parse(data) : [];
  if (!list.includes(userId)) {
    list.push(userId);
    await AsyncStorage.setItem(RESTRICTED_USERS_KEY, JSON.stringify(list));
  }
};

export const isUserBlocked = async (userId: string): Promise<boolean> => {
  const data = await AsyncStorage.getItem(BLOCKED_USERS_KEY);
  const list = data ? JSON.parse(data) : [];
  return list.includes(userId);
};

export const isUserRestricted = async (userId: string): Promise<boolean> => {
  const data = await AsyncStorage.getItem(RESTRICTED_USERS_KEY);
  const list = data ? JSON.parse(data) : [];
  return list.includes(userId);
};
