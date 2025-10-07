// app/appLogin.tsx
import * as React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function AppLogin() {
  const router = useRouter();

  const onLoginWithLine = () => {
    // TODO: ต่อ SDK ของ LINE ภายหลัง
    router.replace("/(tabs)/report"); // เข้าหน้าหลักหลังล็อกอิน
  };

  const onLoginWithEmail = () => {
    router.push("/auth/email-login"); // ไปหน้าอีเมลล็อกอิน
  };

  const onRegister = () => {
    router.push("/login/register/pageRegister"); // ไปหน้าสมัครสมาชิก
  };

  return (
    <LinearGradient
      colors={["#0A4BFF", "#01C3AF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.fill}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.fill}>
        <View style={styles.container}>
          {/* โลโก้ข้อความ */}
          <View style={styles.logoWrap}>
            <Text style={styles.logoTop}>Sure</Text>
            <Text style={styles.logoBottom}>Sure</Text>
          </View>
          <Text style={styles.subtitle}>บริการเช็คสลิปผ่านไลน์</Text>

          <View style={{ height: 48 }} />

          {/* ปุ่ม: ล็อกอินผ่าน LINE */}
          <Pressable style={[styles.btn, styles.btnLine]} onPress={onLoginWithLine}>
            <Text style={[styles.btnText, { color: "#0B3B2D", fontWeight: "800" }]}>
              ล็อกอินผ่าน Line
            </Text>
          </Pressable>

          {/* ปุ่ม: ล็อกอินผ่านเมล */}
          <Pressable style={[styles.btn, styles.btnWhite]} onPress={onLoginWithEmail}>
            <Text style={[styles.btnText, { color: "#0F172A" }]}>ล็อกอินผ่านเมล</Text>
          </Pressable>

          {/* เส้นคั่น + หรือ */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.orText}>หรือ</Text>
            <View style={styles.divider} />
          </View>

          {/* ปุ่ม: สมัครสมาชิก */}
          <Pressable style={[styles.btn, styles.btnWhite]} onPress={onRegister}>
            <Text style={[styles.btnText, { color: "#0F172A" }]}>สมัครสมาชิก</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  /* โลโก้ข้อความสองบรรทัด */
  logoWrap: {
    alignItems: "center",
    marginBottom: 8,
  },
  logoTop: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "900",
    lineHeight: 44,
  },
  logoBottom: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "900",
    lineHeight: 44,
  },
  subtitle: {
    color: "#EAF4FF",
    fontSize: 16,
    marginTop: 8,
  },

  /* ปุ่ม */
  btn: {
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "86%",
    marginBottom: 12,
  },
  btnText: { fontSize: 16, fontWeight: "700" },

  btnLine: {
    backgroundColor: "#34D399",
  },
  btnWhite: {
    backgroundColor: "#FFFFFF",
  },

  /* เส้นคั่น หรือ */
  dividerRow: {
    width: "86%",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 999,
  },
  orText: {
    color: "#EAF4FF",
    marginHorizontal: 8,
    fontWeight: "700",
  },
});
