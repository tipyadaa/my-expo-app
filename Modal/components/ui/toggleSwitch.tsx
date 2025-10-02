// components/ui/ToggleSwitch.tsx
import * as React from "react";
import { Switch, View, Text } from "react-native";

type Props = {
  label: string;                      // ข้อความกำกับ
  value: boolean;                     // ค่าปัจจุบัน true/false
  onValueChange: (v: boolean) => void; // ฟังก์ชันเมื่อเปลี่ยนค่า
};

export default function ToggleSwitch({ label, value, onValueChange }: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <Text>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}
