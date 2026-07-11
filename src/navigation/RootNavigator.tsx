import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { FeedIcon, LeaderboardIcon, NewEntryIcon, SquadIcon, ProfileIcon } from '@/components/TabIcons';

import FeedScreen from '@/screens/FeedScreen';
import LeaderboardScreen from '@/screens/LeaderboardScreen';
import NewEntryScreen from '@/screens/NewEntryScreen';
import CompleteStampScreen from '@/screens/CompleteStampScreen';
import SquadScreen from '@/screens/SquadScreen';
import LinkDuoScreen from '@/screens/LinkDuoScreen';
import ProfileScreen from '@/screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const EntryStack = createNativeStackNavigator();
const SquadStack = createNativeStackNavigator();

// New Entry tab actually contains a two-step flow: pick a task, then stamp it.
function EntryStackNavigator() {
  return (
    <EntryStack.Navigator screenOptions={{ headerShown: false }}>
      <EntryStack.Screen name="NewEntry" component={NewEntryScreen} />
      <EntryStack.Screen name="CompleteStamp" component={CompleteStampScreen} />
    </EntryStack.Navigator>
  );
}

// Squad tab also hosts the "link duo" sub-screen.
function SquadStackNavigator() {
  return (
    <SquadStack.Navigator screenOptions={{ headerShown: false }}>
      <SquadStack.Screen name="Squad" component={SquadScreen} />
      <SquadStack.Screen name="LinkDuo" component={LinkDuoScreen} />
    </SquadStack.Navigator>
  );
}

export default function RootNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.line,
            borderTopWidth: 1,
            height: 50 + insets.bottom,
            paddingTop: 8,
            paddingBottom: insets.bottom,
          },
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="Feed"
          component={FeedScreen}
          options={{ tabBarIcon: ({ focused }) => <FeedIcon active={focused} /> }}
        />
        <Tab.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{ tabBarIcon: ({ focused }) => <LeaderboardIcon active={focused} /> }}
        />
        <Tab.Screen
          name="Entry"
          component={EntryStackNavigator}
          options={{ tabBarIcon: ({ focused }) => <NewEntryIcon active={focused} /> }}
        />
        <Tab.Screen
          name="SquadTab"
          component={SquadStackNavigator}
          options={{ tabBarIcon: ({ focused }) => <SquadIcon active={focused} /> }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ tabBarIcon: ({ focused }) => <ProfileIcon active={focused} /> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
