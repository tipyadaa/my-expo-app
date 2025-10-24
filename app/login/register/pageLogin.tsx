import * as React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import SureSureLogo from "../../../components/SureSureLogo";
import { useRouter } from "expo-router";
import { useLoginMutation } from "lib/service/loginService"; // ✅ import service

export default function EmailLoginScreen() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  // ✅ hook สำหรับยิง login API
  const { mutateAsync: doLogin, isPending } = useLoginMutation();

  const onSubmit = async () => {
    if (!username || !password) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }
    try {
      // เรียก login จาก service
      const auth = await doLogin({ username, password });
      console.log("✅ Login success:", auth);
      // auth.token ถูกเก็บไว้ใน AsyncStorage แล้ว
      router.replace("/(tabs)/report"); // ไปหน้าหลักหลังล็อกอินสำเร็จ
    } catch (err: any) {
      console.warn("❌ Login failed:", err);
      Alert.alert("เข้าสู่ระบบไม่สำเร็จ", err?.message || "กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <LinearGradient
      colors={["#0A4BFF", "#01C3AF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.container}>
            {/* โลโก้ */}
            <View style={styles.logoWrap}>
              <SureSureLogo style={styles.logo} />
            </View>

            {/* หัวข้อ */}
            <Text style={styles.title}>เข้าสู่ระบบ</Text>

            {/* ฟอร์ม */}
            <View style={{ width: "86%", marginTop: 16 }}>
              <Text style={styles.label}>username</Text>
              <TextInput
                style={styles.input}
                placeholder="username"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>password</Text>
              <TextInput
                style={styles.input}
                placeholder="password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <Pressable
                style={[styles.btn, isPending && { opacity: 0.7 }]}
                onPress={onSubmit}
                disabled={isPending}
              >
                <Text style={styles.btnText}>
                  {isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 32,
  },
  logoWrap: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  logo: {
    width: 180,
    height: 180,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
  },
  label: {
    color: "#FFFFFF",
    opacity: 0.95,
    marginBottom: 6,
    fontSize: 14,
  },
  input: {
    height: 44,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
  },
  btn: {
    marginTop: 18,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 16,
  },
});
