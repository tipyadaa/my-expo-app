// app/(tabs)/profile.tsx
import * as React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import GradientHeader from "../../Modal/components/ui/GradientHeader";
import SectionCard from "../../Modal/components/ui/SectionCard";
import ProgressBar from "../../Modal/components/ui/ProgressBar";
import PrimaryButton from "../../Modal/components/ui/PrimaryButton";

export default function ProfileScreen() {
  const router = useRouter();

  // mock data
  const quotaUsed = 50;
  const quotaMax = 100;
  const expireText = "3 ก.ย. 2025";

  const handleLogout = () => {
    Alert.alert("ออกจากระบบ", "คุณต้องการออกจากระบบใช่หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ออกจากระบบ",
        style: "destructive",
        onPress: () => router.replace("/appLogin"), // <-- เปลี่ยนปลายทางมาที่ /appLogin
      },
    ]);
  };

  const handleCopy = () => {
    Alert.alert("คัดลอกสำเร็จ", "API Key ถูกคัดลอกแล้ว");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F6F8FB" }}>
      {/* Header */}
      <GradientHeader
        right={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons name="storefront-outline" size={18} color="#EAF4FF" />
            <Text style={{ color: "#EAF4FF" }}>Hi, Yada</Text>
          </View>
        }
      />

      <View style={styles.panel}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color="#111827" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header title */}
          <Text style={styles.h1}>โปรไฟล์ผู้ใช้งาน</Text>

          {/* Profile Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatar} />
          </View>

          {/* Username + Password */}
          <SectionCard>
            <Text style={styles.label}>ชื่อผู้ใช้</Text>
            <View style={styles.inputMock} />
            <Text style={[styles.label, { marginTop: 12 }]}>รหัสผู้ใช้</Text>
            <View style={styles.inputMock} />
          </SectionCard>

          {/* Usage */}
          <SectionCard>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>แพ็กเกจที่ใช้งาน</Text>
              <Text style={{ color: "#0A57FF", fontWeight: "700" }}>
                {quotaUsed} / {quotaMax}
              </Text>
            </View>

            <View style={styles.row}>
              <View style={styles.dot} />
              <Text style={styles.packageLabel}>การใช้งาน</Text>
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
              <PrimaryButton
                title="อัปแพ็กเกจ"
                onPress={() => router.push("/(tabs)/packageUp")}
              />
            </View>
          </SectionCard>

          {/* Store Info */}
          <SectionCard>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>ข้อมูลร้านค้า</Text>
            </View>

            <View style={{ marginTop: 10, gap: 4 }}>
              <Text style={styles.infoLabel}>ชื่อร้านค้า</Text>
              <Text style={styles.infoValue}>มิเนียนสโตร์</Text>

              <Text style={[styles.infoLabel, { marginTop: 6 }]}>เบอร์โทรศัพท์</Text>
              <Text style={styles.infoValue}>0611567906</Text>

              <Text style={[styles.infoLabel, { marginTop: 6 }]}>อีเมล</Text>
              <Text style={styles.infoValue}>admin11111@example.com</Text>
            </View>
          </SectionCard>

          {/* API Key */}
          <SectionCard>
            <Text style={styles.sectionTitle}>API Key</Text>
            <Text style={styles.apiText}>
              234f1452399ec116190879829b9bf3627cd93035b0849e7bc9
            </Text>

            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>คัดลอก</Text>
            </TouchableOpacity>
          </SectionCard>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>ออกจากระบบ</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: -16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 16,
    flex: 1,
  },
  closeBtn: {
    position: "absolute",
    right: 20,
    top: 16,
    zIndex: 5,
  },
  h1: { fontSize: 20, fontWeight: "800", marginBottom: 10, marginTop: 20 },
  avatarWrap: { alignItems: "center", marginBottom: 16 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E2E8F0",
  },
  label: { fontWeight: "700", color: "#1E293B", fontSize: 14 },
  inputMock: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    height: 36,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: { fontWeight: "800", fontSize: 16, color: "#0F172A" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#0A57FF" },
  packageLabel: { color: "#0A57FF", fontWeight: "700" },
  infoLabel: { color: "#64748B", fontSize: 13 },
  infoValue: { fontWeight: "700", color: "#0F172A" },
  apiText: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    fontSize: 12,
    marginTop: 8,
    color: "#0F172A",
  },
  copyBtn: {
    marginTop: 10,
    backgroundColor: "#0A57FF",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  logoutBtn: {
    marginTop: 20,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
