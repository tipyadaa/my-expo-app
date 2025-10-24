import * as React from "react";
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRegisterMutation } from "../../../lib/service/loginService";
import SureSureLogo from "../../../components/SureSureLogo";

export default function PageRegister() {
  const router = useRouter();
  const { mutateAsync: doRegister, isPending } = useRegisterMutation();

  const [username, setUsername] = React.useState("");
  const [nameTh, setNameTh] = React.useState("");
  const [nameEn, setNameEn] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");

  const validate = () => {
    if (!username || !nameTh || !phone || !email || !password || !confirm) {
      Alert.alert("กรอกข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return false;
    }
    const digits = phone.replace(/\D/g, "");
    if (!/^\d{9,10}$/.test(digits)) {
      Alert.alert("เบอร์โทรไม่ถูกต้อง", "กรุณากรอกตัวเลข 9-10 หลัก");
      return false;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
    if (!emailOk) {
      Alert.alert("อีเมลไม่ถูกต้อง", "กรุณาตรวจสอบรูปแบบอีเมลอีกครั้ง");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("รหัสผ่านสั้นเกินไป", "กรุณาตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร");
      return false;
    }
    if (password !== confirm) {
      Alert.alert("รหัสผ่านไม่ตรงกัน", "กรุณากรอกรหัสผ่านให้ตรงกันทั้งสองช่อง");
      return false;
    }
    return true;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    try {
      const emailNormalized = email.trim().toLowerCase();
      const phoneDigits = phone.replace(/\D/g, "");
      await doRegister({
        username: username.trim(),
        password,
        email: emailNormalized,
        phone: phoneDigits,
        name_th: nameTh.trim(),
        name_en: nameEn.trim() || undefined,
        user_type: "merchant-register",
      });
      router.replace("/login/register/pageRegisterStore");
    } catch (err: any) {
      Alert.alert(
        "สมัครสมาชิกไม่สำเร็จ",
        err?.message ?? "ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง"
      );
    }
  };

  return (
    <LinearGradient
      colors={["#0A4BFF", "#01C3AF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bg}
    >
      <SafeAreaView style={styles.safe}>
        <Pressable
          onPress={() => router.replace("/login/register/pageLogin")}
          style={styles.closeBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </Pressable>

        <View style={styles.logoWrap}>
          <SureSureLogo style={styles.logo} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>สมัครสมาชิก</Text>

            <View style={styles.form}>
              <Label>ชื่อผู้ใช้</Label>
              <TextInput
                style={styles.input}
                placeholder="ชื่อผู้ใช้"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />

              <Label>ชื่อ-นามสกุล</Label>
              <TextInput
                style={styles.input}
                placeholder="ชื่อ-นามสกุล"
                value={nameTh}
                onChangeText={setNameTh}
              />

              <Label>ชื่อ-นามสกุล ภาษาอังกฤษ</Label>
              <TextInput
                style={styles.input}
                placeholder="ชื่อ-นามสกุล ภาษาอังกฤษ"
                value={nameEn}
                onChangeText={setNameEn}
                autoCapitalize="words"
              />

              <Label>เบอร์โทร</Label>
              <TextInput
                style={styles.input}
                placeholder="เบอร์โทร"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/[^\d]/g, ""))}
                maxLength={10}
              />

              <Label>Email</Label>
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Label>รหัสผ่าน</Label>
              <TextInput
                style={styles.input}
                placeholder="รหัสผ่าน"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <Label>ยืนยันรหัสผ่าน</Label>
              <TextInput
                style={styles.input}
                placeholder="ยืนยันรหัสผ่าน"
                secureTextEntry
                value={confirm}
                onChangeText={setConfirm}
              />
            </View>

            <Pressable
              style={[styles.submitBtn, isPending && styles.disabledBtn]}
              onPress={onSubmit}
              disabled={isPending}
            >
              <Text style={styles.submitText}>
                {isPending ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 56,
    paddingBottom: 12,
  },
  logo: {
    width: 180,
    height: 180,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOpacity: 0.08,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 4 },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    color: "#0F172A",
  },
  form: {
    marginTop: 18,
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    color: "#0F172A",
    fontWeight: "700",
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  submitBtn: {
    marginTop: 24,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A4BFF",
  },
  disabledBtn: {
    opacity: 0.7,
  },
  submitText: {
    color: "#FFFFFF",
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
});
