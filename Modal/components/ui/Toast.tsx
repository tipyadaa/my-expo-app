// components/ui/Toast.tsx
import * as React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = { text?: string };

export function ToastSuccess({ text = "บันทึกสำเร็จ" }: Props) {
  return (
    <View
      style={{
        backgroundColor: "#E8FBE8", // เขียวอ่อน
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
      }}
    >
      <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
      <Text style={{ color: "#166534", fontWeight: "700" }}>{text}</Text>
    </View>
  );
}

export function ToastError({ text = "ทำรายการไม่สำเร็จ" }: Props) {
  return (
    <View
      style={{
        backgroundColor: "#FEE2E2", // แดงอ่อน
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
      }}
    >
      <Ionicons name="alert-circle" size={20} color="#DC2626" />
      <Text style={{ color: "#7F1D1D", fontWeight: "700" }}>{text}</Text>
    </View>
  );
}
