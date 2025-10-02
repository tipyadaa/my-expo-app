// components/ui/SearchBar.tsx
import * as React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  value: string;                      // ค่าที่พิมพ์ในช่องค้นหา
  onChangeText: (t: string) => void;  // ฟังก์ชันเวลาพิมพ์
  placeholder?: string;               // ข้อความ placeholder
};

export default function SearchBar({ value, onChangeText, placeholder = "ค้นหา/Transfer ID" }: Props) {
  return (
    <View style={styles.wrap}>
      {/* ไอคอนค้นหา */}
      <Ionicons name="search" size={18} color="#777" />

      {/* กล่อง input */}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,

    // เงาสำหรับ iOS + Android
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
});
