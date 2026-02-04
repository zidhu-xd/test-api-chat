import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import CalculatorScreen from "@/screens/CalculatorScreen";
import PairingChoiceScreen from "@/screens/PairingChoiceScreen";
import CodeDisplayScreen from "@/screens/CodeDisplayScreen";
import CodeEntryScreen from "@/screens/CodeEntryScreen";
import ChatScreen from "@/screens/ChatScreen";

export type RootStackParamList = {
  Calculator: undefined;
  PairingChoice: undefined;
  CodeDisplay: undefined;
  CodeEntry: undefined;
  Chat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Calculator"
      screenOptions={{
        headerShown: false,
        animation: "fade",
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="Calculator" component={CalculatorScreen} />
      <Stack.Screen
        name="PairingChoice"
        component={PairingChoiceScreen}
        options={{
          animation: "fade_from_bottom",
        }}
      />
      <Stack.Screen
        name="CodeDisplay"
        component={CodeDisplayScreen}
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="CodeEntry"
        component={CodeEntryScreen}
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          animation: "fade",
        }}
      />
    </Stack.Navigator>
  );
}
