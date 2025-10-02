import * as React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Link } from "expo-router";

type Props = { 
  title?: string;          // ข้อความหัวเรื่อง (optional)
  right?: React.ReactNode; // องค์ประกอบด้านขวา (icon, text, ปุ่ม)
};

export default function GradientHeader({ title, right }: Props) {
  return (
    <LinearGradient
      colors={["#014BFF", "#01C3AF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.wrap}
    >
      <View style={styles.row}>
        {/* โลโก้หรือชื่อแอป → กดได้ไปหน้า profile */}
        <Link href="/(tabs)/profile" asChild>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.logo}>Sure{"\n"}Sure</Text>
          </TouchableOpacity>
        </Link>

        {/* เว้นพื้นที่ตรงกลาง */}
        <View style={{ flex: 1 }} />

        {/* เนื้อหาฝั่งขวา (เช่น Hi, Yada, icon) */}
        {right}
      </View>

      {/* ถ้ามี Title ให้โชว์ */}
      {title ? <Text style={styles.title}>{title}</Text> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 56,           // รองรับ safe area
    paddingHorizontal: 16,
    paddingBottom: 32,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  row: { 
    flexDirection: "row", 
    alignItems: "flex-start" 
  },
  logo: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "800", 
    lineHeight: 18 
  },
  title: { 
    color: "#fff", 
    fontSize: 20, 
    fontWeight: "700", 
    marginTop: 12 
  },
});
