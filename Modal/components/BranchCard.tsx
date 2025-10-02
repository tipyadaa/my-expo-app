// components/BranchCard.tsx
import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  name: string;              // ชื่อสาขา เช่น "สาขาเชียงใหม่"
  code: string;              // รหัสสาขา เช่น "CM-9X2K"
  status: "ยังไม่ได้เชื่อมต่อ" | "เชื่อมต่อเรียบร้อย";
  onPress?: () => void;      // ฟังก์ชันเมื่อกดการ์ด
};

export default function BranchCard({ name, code, status, onPress }: Props) {
  const isConnected = status === "เชื่อมต่อเรียบร้อย";

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      {/* ไอคอนร้าน */}
      <View style={styles.iconWrap}>
        <Ionicons name="storefront-outline" size={20} color="#0A57FF" />
      </View>

      {/* เนื้อหาสาขา */}
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.code}>{code}</Text>
        <Text style={[styles.status, { color: isConnected ? "#16A34A" : "#DC2626" }]}>
          {status}
        </Text>
      </View>

      {/* ไอคอนลูกศร */}
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E6F0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  name: {
    fontWeight: "700",
    fontSize: 14,
  },
  code: {
    fontSize: 13,
    color: "#374151",
  },
  status: {
    fontSize: 12,
    marginTop: 2,
  },
});
