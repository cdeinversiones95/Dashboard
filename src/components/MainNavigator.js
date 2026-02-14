import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeScreen from "../screens/HomeScreen";
import EventsScreen from "../screens/EventsScreen";
import MyBetsScreen from "../screens/MyBetsScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

const MainNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Inicio") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Inversiones") {
            iconName = focused ? "trending-up" : "trending-up-outline";
          } else if (route.name === "Mis Trades") {
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "Perfil") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: "#1d4ed8",
        tabBarInactiveTintColor: "#4b5563",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          // Usar insets.bottom para adaptarse a teléfonos con/sin botones de navegación
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          // Altura dinámica: base + safe area inferior del dispositivo
          height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
          borderTopWidth: 1,
          borderTopColor: "#d1d5db",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Inversiones" component={EventsScreen} />
      <Tab.Screen name="Mis Trades" component={MyBetsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
