// app/(tabs)/_layout.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { Slot } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomTabBar from "../../Modal/components/ui/CustomTabBar";

export default function TabsLayout() {
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
});
