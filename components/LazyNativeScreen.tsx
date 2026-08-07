import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type Loader = () => Promise<{ default: React.ComponentType<any> }>;

type Props = {
  loader: Loader;
  featureName?: string;
};

export default function LazyNativeScreen({
  loader,
  featureName = 'This feature',
}: Props) {
  const [Screen, setScreen] = useState<React.ComponentType<any> | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    loader()
      .then((mod) => {
        if (active) setScreen(() => mod.default);
      })
      .catch(() => {
        if (active) setUnavailable(true);
      });
    return () => {
      active = false;
    };
  }, [loader]);

  if (unavailable) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>
          {featureName} requires a development build (not Expo Go).
        </Text>
      </View>
    );
  }

  if (!Screen) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C61F3A" />
      </View>
    );
  }

  return <Screen />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#000',
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
});

export function lazyNativeRoute(
  loader: Loader,
  featureName?: string,
): React.ComponentType {
  return function LazyNativeRoute() {
    return <LazyNativeScreen loader={loader} featureName={featureName} />;
  };
}
