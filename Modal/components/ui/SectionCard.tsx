// components/ui/SectionCard.tsx
import * as React from "react";
import { View, StyleSheet } from "react-native";

type Props = {
  children: React.ReactNode; // เนื้อหาที่จะใส่ใน Card
};

export default function SectionCard({ children }: Props) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",    // พื้นหลังขาว
    borderRadius: 16,           // มุมโค้ง
    padding: 16,                // เว้นระยะด้านใน
    shadowColor: "#000",        // เงา
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,               // เงาสำหรับ Android
    marginBottom: 12,           // เว้นระยะด้านล่างระหว่าง card
  },
});
