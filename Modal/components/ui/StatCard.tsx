// components/ui/StatCard.tsx
import * as React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  label: string;          // คำอธิบาย เช่น "สลิปที่ถูกต้อง"
  value: string;          // ค่าตัวเลข เช่น "10"
  icon?: React.ReactNode; // ไอคอนด้านบน (optional)
};

export default function StatCard({ label, value, icon }: Props) {
  return (
    <View style={styles.box}>
      {/* ไอคอน */}
      <View style={{ marginBottom: 6 }}>{icon}</View>

      {/* ค่าตัวเลข */}
      <Text style={styles.value}>{value}</Text>

      {/* คำอธิบาย */}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,                // ให้การ์ดขยายเต็มที่ใน row
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",   // จัดให้อยู่ตรงกลาง
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,           // เงาบน Android
  },
  value: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    opacity: 0.6,          // สีอ่อนลงเล็กน้อย
    textAlign: "center",
  },
});
