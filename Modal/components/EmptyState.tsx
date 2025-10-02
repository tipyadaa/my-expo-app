// components/EmptyState.tsx
import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  message?: string;  // ข้อความที่จะแสดง (default = "ยังไม่มีข้อมูล")
};

export default function EmptyState({ message = "ยังไม่มีข้อมูล" }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="file-tray-outline" size={40} color="#9CA3AF" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  text: {
    fontSize: 14,
    color: "#6B7280",
  },
});
