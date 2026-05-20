import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import BulkScanScreen from './src/screens/BulkScanScreen';
import AddCardsScreen from './src/screens/AddCardsScreen';
import CardDetailsScreen from './src/screens/CardDetailsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { AuthProvider } from './src/context/AuthContext';
import { CollectionProvider } from './src/context/CollectionContext';
import useAuth from './src/hooks/useAuth';
import { colors, gradients } from './src/theme';
import type { RootStackParamList, AppTabsParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<AppTabsParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
    notification: colors.primary,
  },
};

const TAB_ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  Home: { active: 'albums', inactive: 'albums-outline' },
  Scan: { active: 'camera', inactive: 'camera-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

const LoadingView = (): React.JSX.Element => (
  <LinearGradient colors={gradients.background} style={styles.loading}>
    <ActivityIndicator size="large" color={colors.primaryAccent} />
  </LinearGradient>
);

const AppTabs = (): React.JSX.Element => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primaryAccent,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.tabBarLabel,
      tabBarIcon: ({ color, size, focused }) => {
        const icons = TAB_ICONS[route.name];
        if (!icons) return null;
        return (
          <Ionicons
            name={focused ? icons.active : icons.inactive}
            size={size}
            color={color}
          />
        );
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Scan" component={ScanScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const RootNavigator = (): React.JSX.Element => {
  const { user, initializing } = useAuth();

  if (initializing) return <LoadingView />;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="AppTabs" component={AppTabs} />
          <Stack.Screen
            name="CardDetails"
            component={CardDetailsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="BulkScan"
            component={BulkScanScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="AddCards"
            component={AddCardsScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
};

export default function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <View style={styles.flex}>
          <AuthProvider>
            <CollectionProvider>
              <NavigationContainer theme={navTheme}>
                <RootNavigator />
                <StatusBar style="light" />
              </NavigationContainer>
            </CollectionProvider>
          </AuthProvider>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    backgroundColor: colors.backgroundElevated,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
