// app/(tabs)/profile.tsx
import * as React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";

import GradientHeader from "../../Modal/components/ui/GradientHeader";
import SectionCard from "../../Modal/components/ui/SectionCard";
import ProgressBar from "../../Modal/components/ui/ProgressBar";
import PrimaryButton from "../../Modal/components/ui/PrimaryButton";

export default function ProfileScreen() {
  const router = useRouter();

  // mock data
  const [username, setUsername] = React.useState("");
  const [usercode, setUsercode] = React.useState("");
  const quotaMax = 100;
  const quotaUsed = 50;
  const expireText = "3 ก.ย. 2025";
  const storeName = "มินมาร์ท";
  const phone = "0611567906";
  const email = "admin11111@example.com";
  const apiKey =
    "2341f4523999c116b907892b9bf3627\ncd93050b849e7bc9";

  const copyApi = async () => {
    try {
      await Clipboard.setStringAsync(apiKey.replace(/\n/g, ""));
      Alert.alert("คัดลอกแล้ว", "คัดลอก API Key สำเร็จ");
    } catch {
      Alert.alert("คัดลอกไม่สำเร็จ");
    }
  };

  const logout = () => {
    Alert.alert("ยืนยัน", "ต้องการออกจากระบบหรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ออกจากระบบ", style: "destructive", onPress: () => router.replace("/(tabs)/report") },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F6F8FB" }}>
      {/* Header gradient */}
      <GradientHeader
        right={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons name="storefront-outline" size={18} color="#EAF4FF" />
            <Text style={{ color: "#EAF4FF" }}>Hi, Yada</Text>
          </View>
        }
      />

      {/* Panel */}
      <View style={styles.panel}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color="#111827" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.title}>โปรไฟล์ผู้ใช้งาน</Text>

          {/* Avatar + user info */}
          <SectionCard>
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <View style={styles.avatar} />
            </View>

            <Text style={styles.label}>ชื่อผู้ใช้</Text>
            <TextInput
              style={styles.input}
              placeholder="ชื่อผู้ใช้"
              value={username}
              onChangeText={setUsername}
            />

            <Text style={[styles.label, { marginTop: 10 }]}>รหัสผู้ใช้</Text>
            <TextInput
              style={styles.input}
              placeholder="รหัสผู้ใช้"
              value={usercode}
              onChangeText={setUsercode}
            />
          </SectionCard>

          {/* Package usage */}
          <View style={{ height: 10 }} />
          <SectionCard>
            <View style={styles.rowBetween}>
              <Text style={{ fontWeight: "800" }}>แพ็กเกจที่ใช้งาน</Text>
              <Text style={{ color: "#0A57FF", fontWeight: "700" }}>
                {quotaUsed} / {quotaMax}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
              <View style={styles.dot} />
              <Text style={{ color: "#0A57FF", fontWeight: "700" }}>การใช้งาน</Text>
            </View>

            <View style={{ marginTop: 8 }}>
              <ProgressBar value={quotaUsed} max={quotaMax} />
            </View>

            <View style={{ marginTop: 10 }}>
              <Text style={{ color: "#475569" }}>
                แพ็กเกจ : <Text style={{ fontWeight: "700" }}>free trail</Text>
              </Text>
              <Text style={{ color: "#475569" }}>วันหมดอายุ : {expireText}</Text>
            </View>

            <View style={{ marginTop: 12 }}>
              <PrimaryButton title="อัปแพ็กเกจ" onPress={() => {}} />
            </View>
          </SectionCard>

          {/* Store info */}
          <View style={{ height: 10 }} />
          <SectionCard>
            <Text style={{ fontWeight: "800", marginBottom: 10 }}>ข้อมูลร้านค้า</Text>

            <View style={{ marginBottom: 6 }}>
              <Text style={styles.contactLabel}>ชื่อร้านค้า</Text>
              <Text style={styles.contactValue}>{storeName}</Text>
            </View>

            <View style={{ marginBottom: 6 }}>
              <Text style={styles.contactLabel}>เบอร์โทรศัพท์</Text>
              <Text style={styles.contactValue}>{phone}</Text>
            </View>

            <View>
              <Text style={styles.contactLabel}>อีเมล</Text>
              <Text style={styles.contactValue}>{email}</Text>
            </View>
          </SectionCard>

          {/* API Key */}
          <View style={{ height: 10 }} />
          <SectionCard>
            <Text style={{ fontWeight: "800", marginBottom: 8 }}>API Key</Text>
            <View style={styles.apiBox}>
              <Text style={styles.apiText} selectable>{apiKey}</Text>
            </View>
            <View style={{ marginTop: 10 }}>
              <PrimaryButton title="คัดลอก" onPress={copyApi} />
            </View>
          </SectionCard>

          {/* Logout */}
          <View style={{ height: 12 }} />
          <TouchableOpacity onPress={logout} activeOpacity={0.9}>
            <View style={styles.logoutBtn}>
              <Text style={{ color: "#fff", fontWeight: "800" }}>ออกจากระบบ</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

/* Styles */
const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  closeBtn: {
    position: "absolute",
    right: 14,
    top: 10,
    zIndex: 10,
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "900", marginTop: 6, marginBottom: 8, paddingRight: 40 },

  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#E5E7EB",
  },

  label: { color: "#0F172A", marginBottom: 6, fontWeight: "700" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#0A57FF" },

  contactLabel: { color: "#64748B", fontWeight: "600" },
  contactValue: { color: "#0F172A", fontWeight: "700", marginBottom: 2 },

  apiBox: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
  },
  apiText: { fontFamily: "monospace", color: "#0F172A" },

  logoutBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
});
