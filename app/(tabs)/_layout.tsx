// app/(tabs)/_layout.tsx
import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Slot, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomTabBar from "../../Modal/components/ui/CustomTabBar";
import { useLocalAuthQuery } from "../../lib/authService";

export default function TabsLayout() {
  const router = useRouter();
  const { data, isLoading, isFetching } = useLocalAuthQuery();
  const loading = isLoading || isFetching;

  React.useEffect(() => {
    if (!loading && !data?.token) {
      router.replace("/appLogin");
    }
  }, [loading, data?.token, router]);

  if (loading) {
    return (
      <View style={[styles.root, styles.loading]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!data?.token) {
    return null;
  }

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Slot />
      </View>

      {/* ถม safe area ล่าง + วางแท็บทับไว้ */}
      <SafeAreaView
        edges={['bottom']}
        style={styles.tabSafeArea}
      >
        <CustomTabBar />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1 },
  tabSafeArea: {
    backgroundColor: "#fff",      // สีเดียวกับแท็บ
  },
  loading: { alignItems: "center", justifyContent: "center" },
});
