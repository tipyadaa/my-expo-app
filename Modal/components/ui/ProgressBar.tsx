// components/ui/ProgressBar.tsx
import * as React from "react";
import { View } from "react-native";

type Props = {
  value: number;   // ค่าปัจจุบัน เช่น 50
  max?: number;    // ค่าสูงสุด (default = 100)
};

export default function ProgressBar({ value = 0, max = 100 }: Props) {
  // คำนวณเปอร์เซ็นต์ (0 - 100)
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <View
      style={{
        height: 10,
        backgroundColor: "#E9F0FF", // สีพื้นหลังอ่อน
        borderRadius: 999,
      }}
    >
      <View
        style={{
          width: `${pct}%`,
          height: "100%",
          backgroundColor: "#0A57FF", // สีหลักฟ้า
          borderRadius: 999,
        }}
      />
    </View>
  );
}
