// app/auth/register.tsx
import * as React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const validate = () => {
    if (!fullName || !phone || !email || !password || !confirm) {
      Alert.alert("กรอกข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return false;
    }
    if (!/^\d{9,10}$/.test(phone.replace(/\D/g, ""))) {
      Alert.alert("เบอร์โทรไม่ถูกต้อง", "กรุณากรอกตัวเลข 9–10 หลัก");
      return false;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
    if (!emailOk) {
      Alert.alert("อีเมลไม่ถูกต้อง", "กรุณาตรวจสอบรูปแบบอีเมลอีกครั้ง");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("รหัสผ่านสั้นเกินไป", "อย่างน้อย 6 ตัวอักษร");
      return false;
    }
    if (password !== confirm) {
      Alert.alert("รหัสผ่านไม่ตรงกัน", "กรุณากรอกให้ตรงกันทั้งสองช่อง");
      return false;
    }
    return true;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      Alert.alert("สมัครสมาชิกสำเร็จ", "เข้าสู่ระบบเพื่อเริ่มใช้งาน", [
        { text: "ตกลง", onPress: () => router.replace("/login") },
      ]);
    } finally {
      setLoading(false);
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
        {/* โลโก้ตรงกลางด้านบน */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoTop}>Sure</Text>
          <Text style={styles.logoBottom}>Sure</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* การ์ดฟอร์มสีขาว */}
          <View style={styles.card}>
            <Text style={styles.title}>สมัครสมาชิก</Text>

            <View style={{ marginTop: 10 }}>
              <Label>ชื่อ–นามสกุล</Label>
              <TextInput
                style={styles.input}
                placeholder="ชื่อ–นามสกุล"
                value={fullName}
                onChangeText={setFullName}
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
                placeholder="อีเมล"
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
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              onPress={onSubmit}
              disabled={loading}
            >
              <Text style={styles.submitText}>
                {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
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

  /* โลโก้ตรงกลาง */
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60, // ✅ เพิ่มระยะจากขอบบน
    paddingBottom:16
  },
  logoTop: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 28,
  },
  logoBottom: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 28,
    marginTop: -2,
  },

  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    alignItems: "center",
  },

  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 4 },
    }),
  },

  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
    color: "#0F172A",
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    color: "#0F172A",
    fontWeight: "700",
  },
  input: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  submitBtn: {
    marginTop: 16,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A57FF",
  },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
