import * as React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import SureSureLogo from "../../../components/SureSureLogo";
import { Link } from "expo-router";

type Props = {
  title?: string;          // หัวข้อ (optional)
  right?: React.ReactNode; // เนื้อหาฝั่งขวา เช่น "Hi, Yada"
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
        {/* โลโก้ฝั่งซ้าย */}
        <Link href="/(tabs)/profile" asChild>
          <TouchableOpacity activeOpacity={0.7}>
            <SureSureLogo style={styles.logo} accessibilityLabel="SureSure logo" />
          </TouchableOpacity>
        </Link>

        {/* เว้นช่องตรงกลาง */}
        <View style={{ flex: 1 }} />

        {/* ฝั่งขวา เช่น "Hi, Yada" + ไอคอนร้าน */}
        {right}
      </View>

      {/* ถ้ามี title ให้แสดงด้านล่าง */}
      {title ? <Text style={styles.title}>{title}</Text> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 40, // รองรับ safe area
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 100, // ขนาดตามภาพ (สามารถปรับได้)
    height: 80,
    resizeMode: "contain",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 10,
  },
});
