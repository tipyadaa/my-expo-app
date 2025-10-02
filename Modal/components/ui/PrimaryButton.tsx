// components/ui/PrimaryButton.tsx
import * as React from "react";
import { TouchableOpacity, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  title: string;       // ข้อความบนปุ่ม
  onPress: () => void; // ฟังก์ชันเมื่อกดปุ่ม
};

export default function PrimaryButton({ title, onPress }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={{ borderRadius: 12, overflow: "hidden" }}
    >
      <LinearGradient
        colors={["#014BFF", "#01C3AF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingVertical: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}
