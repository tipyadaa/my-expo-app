import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useLocalAuthQuery } from "../lib/authService";

export default function Index() {
  const { data, isLoading, isFetching } = useLocalAuthQuery();
  const loading = isLoading || isFetching;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (data?.token) {
    return <Redirect href="/(tabs)/report" />;
  }

  return <Redirect href="/appLogin" />;
}
