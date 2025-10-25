import * as React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import SureSureLogo from "../../../components/SureSureLogo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useLoginMutation } from "lib/service/loginService"; // ✅ import service

export default function EmailLoginScreen() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // ✅ hook สำหรับยิง login API
  const { mutateAsync: doLogin, isPending } = useLoginMutation();

  const onSubmit = async () => {
    if (!username || !password) {
      setErrorMessage("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
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
      let raw =
        typeof err?.message === "string" ? err.message.trim() : "";
      if (!raw || raw.toLowerCase() === "internal processing error") {
        raw = "ชื่อผู้ใช้หรือรหัสผ่านผิดพลาด";
      }
      setErrorMessage(raw);
    }
  };

  const closeError = () => setErrorMessage(null);

  return (
    <LinearGradient
      colors={["#0A4BFF", "#01C3AF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <Pressable
          onPress={() => router.replace("/appLogin")}
          style={styles.closeBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </Pressable>

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

      <Modal visible={!!errorMessage} animationType="fade" transparent onRequestClose={closeError}>
        <View style={styles.modalBackdrop}>
          <View style={styles.alertBox}>
            <View style={styles.alertIcon}>
              <Text style={styles.alertIconText}>!</Text>
            </View>
            <Text style={styles.alertMessage}>{errorMessage}</Text>
            <TouchableOpacity style={styles.alertButton} onPress={closeError}>
              <Text style={styles.alertButtonText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  alertBox: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  alertIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  alertIconText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#EF4444",
    marginTop: -4,
  },
  alertMessage: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  alertButton: {
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#0F172A",
  },
  alertButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
