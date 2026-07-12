import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { FeedIcon, LeaderboardIcon, NewEntryIcon, SquadIcon, ProfileIcon } from '@/components/TabIcons';

import FeedScreen from '@/screens/FeedScreen';
import UserProfileScreen from '@/screens/UserProfileScreen';
import RanksScreen from '@/screens/RanksScreen';
import TasksScreen from '@/screens/TasksScreen';
import CompleteStampScreen from '@/screens/CompleteStampScreen';
import SquadScreen from '@/screens/SquadScreen';
import LinkDuoScreen from '@/screens/LinkDuoScreen';
import AddFriendsScreen from '@/screens/AddFriendsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import WrappedScreen from '@/screens/WrappedScreen';
import PreferencesScreen from '@/screens/auth/PreferencesScreen';

const Tab = createBottomTabNavigator();
const FeedStack = createNativeStackNavigator();
const TasksStack = createNativeStackNavigator();
const SquadStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// Feed tab also hosts the read-only profile view reached by tapping a post's author.
function FeedStackNavigator() {
  return (
    <FeedStack.Navigator screenOptions={{ headerShown: false }}>
      <FeedStack.Screen name="FeedHome" component={FeedScreen} />
      <FeedStack.Screen name="UserProfile" component={UserProfileScreen} />
    </FeedStack.Navigator>
  );
}

// Tasks tab hosts a two-step flow: the task list and stamping a task complete.
function TasksStackNavigator() {
  return (
    <TasksStack.Navigator screenOptions={{ headerShown: false }}>
      <TasksStack.Screen name="TasksList" component={TasksScreen} />
      <TasksStack.Screen name="CompleteStamp" component={CompleteStampScreen} />
    </TasksStack.Navigator>
  );
}

// Squad tab also hosts the "link duo" and "add friends" sub-screens.
function SquadStackNavigator() {
  return (
    <SquadStack.Navigator screenOptions={{ headerShown: false }}>
      <SquadStack.Screen name="Squad" component={SquadScreen} />
      <SquadStack.Screen name="LinkDuo" component={LinkDuoScreen} />
      <SquadStack.Screen name="AddFriends" component={AddFriendsScreen} />
    </SquadStack.Navigator>
  );
}

// Profile tab also hosts the "wrapped" monthly recap overlay.
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStack.Screen name="Wrapped" component={WrappedScreen} options={{ presentation: 'transparentModal', animation: 'fade' }} />
      <ProfileStack.Screen name="EditPreferences" component={PreferencesScreen} />
    </ProfileStack.Navigator>
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
            height: 58 + insets.bottom,
            paddingTop: 8,
            paddingBottom: insets.bottom,
          },
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="Feed"
          component={FeedStackNavigator}
          options={{ tabBarIcon: ({ focused }) => <FeedIcon active={focused} size={26} /> }}
        />
        <Tab.Screen
          name="Ranks"
          component={RanksScreen}
          options={{ tabBarIcon: ({ focused }) => <LeaderboardIcon active={focused} size={26} /> }}
        />
        <Tab.Screen
          name="Tasks"
          component={TasksStackNavigator}
          options={{ tabBarIcon: ({ focused }) => <NewEntryIcon active={focused} size={26} /> }}
        />
        <Tab.Screen
          name="SquadTab"
          component={SquadStackNavigator}
          options={{ tabBarIcon: ({ focused }) => <SquadIcon active={focused} size={26} /> }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStackNavigator}
          options={{ tabBarIcon: ({ focused }) => <ProfileIcon active={focused} size={26} /> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
