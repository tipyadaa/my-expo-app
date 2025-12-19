// app/appLogin.tsx
import * as React from "react";
import { View, Text, Pressable, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import SureSureLogo from "../components/SureSureLogo";
import { loginWithLine } from "../lib/service/lineLoginService";

export default function AppLogin() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  /**
   * ล็อกอินผ่าน LINE OAuth
   * ตาม flow ของ Svelte example
   */
  const onLoginWithLine = async () => {
    if (loading) return;

    setLoading(true);
    try {
      // เรียกใช้ LINE OAuth service
      const { token, user } = await loginWithLine();

      // Step 9: Redirect ตาม step (เหมือน Svelte บรรทัด 186-195)
      // if (datalogin.data.step < 10) redirectTo = /advice
      // else redirectTo = /dashboard
      if (user?.step && user.step < 10) {
        // ถ้ายังไม่ได้ setup ครบ ส่งไปหน้า setup
        router.replace(`/login/register/pageRegisterStore`);
      } else {
        // ถ้า setup ครบแล้ว ส่งไปหน้าหลัก
        router.replace("/(tabs)/report");
      }

    } catch (error: any) {
      console.error('❌ LINE login failed:', error);

      Alert.alert(
        'ล็อกอินไม่สำเร็จ',
        error?.message || 'กรุณาลองใหม่อีกครั้ง',
        [{ text: 'ตกลง' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const onLoginWithEmail = () => {
    router.push("/login/register/pageLogin"); // ไปหน้าอีเมลล็อกอิน
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
            <SureSureLogo style={styles.logo} />
          </View>
          <Text style={styles.subtitle}>บริการเช็คสลิปผ่านไลน์</Text>

          <View style={{ height: 48 }} />

          {/* ปุ่ม: ล็อกอินผ่าน LINE */}
          <Pressable
            style={[styles.btn, styles.btnLine, loading && styles.btnDisabled]}
            onPress={onLoginWithLine}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0B3B2D" />
            ) : (
              <Text style={[styles.btnText, { color: "#0B3B2D", fontWeight: "800" }]}>
                ล็อกอินผ่าน Line
              </Text>
            )}
          </Pressable>

          {/* ปุ่ม: ล็อกอินผ่านเมล */}
          <Pressable style={[styles.btn, styles.btnWhite]} onPress={onLoginWithEmail} disabled={loading}>
            <Text style={[styles.btnText, { color: "#0F172A" }]}>ล็อกอินผ่านเมล</Text>
          </Pressable>

          {/* เส้นคั่น + หรือ */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.orText}>หรือ</Text>
            <View style={styles.divider} />
          </View>

          {/* ปุ่ม: สมัครสมาชิก */}
          <Pressable style={[styles.btn, styles.btnWhite]} onPress={onRegister} disabled={loading}>
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
  logo: {
    width: 220,
    height: 220,
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
  btnDisabled: {
    opacity: 0.6,
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

