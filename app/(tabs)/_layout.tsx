import { Redirect, Tabs, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  ActivityIndicator,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { name: 'home',    label: 'Home',    icon: '🏠' },
  { name: 'courses', label: 'Browse',  icon: '🔍' },
  { name: 'profile', label: 'Profile', icon: '👤' },
] as const;

// ─── Animated custom tab bar ──────────────────────────────────────────────────
function AnimatedTabBar({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const tabWidthRef = useRef(0);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(TABS.map((_, i) => new Animated.Value(i === 0 ? 1.08 : 1))).current;
  const opacityAnims = useRef(TABS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.5))).current;

  // Map route name → tab index
  const activeIndex = TABS.findIndex((t) => t.name === state.routes[state.index]?.name) ?? 0;

  useEffect(() => {
    const w = tabWidthRef.current;
    if (!w) return;

    // Slide the indicator
    Animated.spring(indicatorX, {
      toValue: activeIndex * w + w / 2 - 16,
      useNativeDriver: true,
      tension: 130,
      friction: 9,
    }).start();

    // Scale + opacity for each tab
    TABS.forEach((_, i) => {
      const isActive = i === activeIndex;
      Animated.parallel([
        Animated.spring(scaleAnims[i], {
          toValue: isActive ? 1.08 : 0.96,
          useNativeDriver: true,
          tension: 160,
          friction: 8,
        }),
        Animated.timing(opacityAnims[i], {
          toValue: isActive ? 1 : 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [activeIndex]);

  function onLayout(e: LayoutChangeEvent) {
    const totalWidth = e.nativeEvent.layout.width;
    tabWidthRef.current = totalWidth / TABS.length;

    // Set initial indicator position without animation
    indicatorX.setValue(activeIndex * tabWidthRef.current + tabWidthRef.current / 2 - 16);
  }

  function handlePress(index: number, routeName: string) {
    if (index === activeIndex) return;

    // Tap bounce
    Animated.sequence([
      Animated.timing(scaleAnims[index], { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnims[index], { toValue: 1.08, useNativeDriver: true, tension: 200, friction: 6 }),
    ]).start();

    const event = navigation.emit({ type: 'tabPress', target: state.routes[state.index]?.key, canPreventDefault: true });
    if (!event.defaultPrevented) {
      router.push(`/(tabs)/${routeName}` as any);
    }
  }

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: insets.bottom || 8 }]}>
      <View style={styles.tabBar} onLayout={onLayout}>
        {/* Sliding indicator pill */}
        <Animated.View
          style={[styles.indicator, { transform: [{ translateX: indicatorX }] }]}
        />

        {/* Tab buttons */}
        {TABS.map((tab, i) => {
          const isActive = i === activeIndex;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => handlePress(i, tab.name)}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[styles.tabInner, { transform: [{ scale: scaleAnims[i] }], opacity: opacityAnims[i] }]}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' }}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      tabBar={(props: any) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="courses" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabInner: {
    alignItems: 'center',
    gap: 2,
  },
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#1E3A8A',
    fontWeight: '800',
  },
});
