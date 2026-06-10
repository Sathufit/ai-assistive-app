import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import PhrasesScreen from '../screens/PhrasesScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const NAV = '#0B1437';

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: NAV,
          borderTopWidth: 0,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        tabBarActiveTintColor: '#60A5FA',
        tabBarInactiveTintColor: '#4B5E8A',
        headerStyle: {
          backgroundColor: NAV,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '700',
          letterSpacing: 0.4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'VoiceMe',
          tabBarLabel: 'Draw & Speak',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="mic" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Phrases"
        component={PhrasesScreen}
        options={{
          title: 'Quick Phrases',
          tabBarLabel: 'Phrases',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="chatbubbles-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
