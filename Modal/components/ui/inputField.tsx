// components/ui/InputField.tsx
import * as React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

type Props = {
  label: string;                     // ข้อความ label ด้านบน
  value: string;                     // ค่าในช่อง input
  onChangeText: (t: string) => void; // ฟังก์ชันเมื่อเปลี่ยนข้อความ
  placeholder?: string;              // ข้อความ placeholder
  keyboardType?: any;                // ประเภทคีย์บอร์ด (default = text)
};

export default function InputField({ label, value, onChangeText, placeholder, keyboardType }: Props) {
  return (
    <View style={{ marginBottom: 12 }}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Text Input */}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    marginBottom: 6,
    color: "#333",
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
});
