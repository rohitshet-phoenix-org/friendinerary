import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { observer } from "mobx-react-lite";
import { useStore } from "../stores/RootStore";
import { ActivityIndicator, View } from "react-native";

// Auth screens
import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";

// Main screens
import DashboardScreen from "../screens/trips/DashboardScreen";
import TripDetailScreen from "../screens/trips/TripDetailScreen";
import TripItineraryScreen from "../screens/trips/TripItineraryScreen";
import TripMapScreen from "../screens/trips/TripMapScreen";
import TripBudgetScreen from "../screens/trips/TripBudgetScreen";
import TripBookingsScreen from "../screens/trips/TripBookingsScreen";
import CreateTripScreen from "../screens/trips/CreateTripScreen";
import PlaceSearchScreen from "../screens/trips/PlaceSearchScreen";
import AIAssistantScreen from "../screens/trips/AIAssistantScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ExploreScreen from "../screens/ExploreScreen";
import PinboardScreen from "../screens/PinboardScreen";
import InviteCollaboratorsScreen from "../screens/trips/InviteCollaboratorsScreen";

import type { AuthStackParams, TripStackParams, MainTabParams } from "./types";

// ─── Tab icons ────────────────────────────────────────────────────────────────
import Icon from "react-native-vector-icons/Feather";
import { COLORS } from "../theme/colors";

const AuthStack = createNativeStackNavigator<AuthStackParams>();
const TripStack = createNativeStackNavigator<TripStackParams>();
const Tab = createBottomTabNavigator<MainTabParams>();

function TripStackNavigator() {
  return (
    <TripStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.white },
        headerTintColor: COLORS.gray900,
        headerShadowVisible: false,
      }}
    >
      <TripStack.Screen name="Dashboard" component={DashboardScreen} options={{ title: "My Trips" }} />
      <TripStack.Screen name="TripDetail" component={TripDetailScreen} options={({ route }) => ({ title: route.params.tripName })} />
      <TripStack.Screen name="TripItinerary" component={TripItineraryScreen} options={{ title: "Itinerary" }} />
      <TripStack.Screen name="TripMap" component={TripMapScreen} options={{ title: "Map", headerShown: false }} />
      <TripStack.Screen name="TripBudget" component={TripBudgetScreen} options={{ title: "Budget" }} />
      <TripStack.Screen name="TripBookings" component={TripBookingsScreen} options={{ title: "Bookings" }} />
      <TripStack.Screen name="CreateTrip" component={CreateTripScreen} options={{ title: "New Trip", presentation: "modal" }} />
      <TripStack.Screen name="PlaceSearch" component={PlaceSearchScreen} options={{ title: "Add Place", presentation: "modal" }} />
      <TripStack.Screen name="AIAssistant" component={AIAssistantScreen} options={{ title: "AI Assistant", presentation: "modal" }} />
      <TripStack.Screen name="InviteCollaborators" component={InviteCollaboratorsScreen} options={{ title: "Invite People", presentation: "modal" }} />
    </TripStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.brand500,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: { borderTopColor: COLORS.gray100 },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Trips"
        component={TripStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="map-pin" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="compass" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Pinboard"
        component={PinboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="globe" color={color} size={size} />,
          tabBarLabel: "World",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="user" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

const AppNavigator = observer(() => {
  const { auth } = useStore();

  if (!auth.initialized) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={COLORS.brand500} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {auth.isAuthenticated ? (
        <MainTabNavigator />
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Signup" component={SignupScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
});

export default AppNavigator;
