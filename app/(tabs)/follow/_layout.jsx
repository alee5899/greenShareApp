import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import followList from "./followList";
import FollowList from "./followList";

const SearchLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="follow/WebSocketClient" />
      <Stack.Screen name="follow/FollowList" />
    </Stack>
  );
};

export default SearchLayout;

const styles = StyleSheet.create({});
