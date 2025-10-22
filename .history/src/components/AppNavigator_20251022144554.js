import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import MainNavigator from './MainNavigator';
import RechargeMethodScreen from '../screens/RechargeMethodScreen';
import BankTransferScreen from '../screens/BankTransferScreen';
import USDTTransferScreen from '../screens/USDTTransferScreen';
import PaymentInstructionsScreen from '../screens/PaymentInstructionsScreen';
import USDTPaymentInstructionsScreen from '../screens/USDTPaymentInstructionsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainNavigator} />
      <Stack.Screen name="RechargeMethod" component={RechargeMethodScreen} />
      <Stack.Screen name="BankTransfer" component={BankTransferScreen} />
      <Stack.Screen name="USDTTransfer" component={USDTTransferScreen} />
      <Stack.Screen name="PaymentInstructions" component={PaymentInstructionsScreen} />
      <Stack.Screen name="USDTPaymentInstructions" component={USDTPaymentInstructionsScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;