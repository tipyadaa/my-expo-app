// components/ui/CustomTabBar.tsx
import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";

const tabs = [
  { name: "report", label: "รายงาน", icon: "bar-chart-outline", href: "/(tabs)/report" },
  { name: "history", label: "ย้อนหลัง", icon: "time-outline", href: "/(tabs)/history" },
  { name: "banks", label: "บัญชีรับเงิน", icon: "wallet-outline", href: "/(tabs)/banks" },
  { name: "stores", label: "ร้านค้า", icon: "home-outline", href: "/(tabs)/stores" },
];

export default function CustomTabBar() {
  const router = useRouter();
  const segments = useSegments();
  const current = segments[segments.length - 1];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = current === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => router.push(tab.href)}
          >
            <Ionicons
              name={tab.icon as any}
              size={22}
              color={isActive ? "#0A57FF" : "#666"}
            />
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ...ภายใน CustomTabBar.tsx
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingVertical: 8,
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  tab: { flex: 1, alignItems: "center" },
  label: { fontSize: 12, marginTop: 4, color: "#666" },
  activeLabel: { color: "#0A57FF", fontWeight: "600" },
});

