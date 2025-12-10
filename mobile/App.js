import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import CardDetailsScreen from './src/screens/CardDetailsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { AuthProvider } from './src/context/AuthContext';
import { CollectionProvider } from './src/context/CollectionContext';
import useAuth from './src/hooks/useAuth';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const LoadingView = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <ActivityIndicator size="large" color="#7c3aed" />
  </View>
);

const AppTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#7c3aed',
      tabBarInactiveTintColor: '#4b5563',
      tabBarIcon: ({ color, size }) => {
        const icons = {
          Home: 'albums',
          Scan: 'camera',
          Profile: 'person'
        };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      }
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Scan" component={ScanScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const RootNavigator = () => {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <LoadingView />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="AppTabs" component={AppTabs} />
          <Stack.Screen name="CardDetails" component={CardDetailsScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CollectionProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="light" />
        </NavigationContainer>
      </CollectionProvider>
    </AuthProvider>
  );
}

