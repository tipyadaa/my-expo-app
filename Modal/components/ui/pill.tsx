// components/ui/Pill.tsx
import * as React from "react";
import { Text, View } from "react-native";

type Props = {
  text: string;        // ข้อความในป้าย เช่น "สำเร็จ"
  color?: string;      // สีตัวอักษร (default = เขียว)
  bg?: string;         // สีพื้นหลัง (default = เขียวอ่อน)
};

export default function Pill({ text, color = "#16A34A", bg = "#EAFBEF" }: Props) {
  return (
    <View
      style={{
        paddingHorizontal: 10,
        height: 28,
        borderRadius: 999, // วงรี
        backgroundColor: bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color, fontWeight: "700" }}>{text}</Text>
    </View>
  );
}
