// app/(tabs)/components/CardProfile.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SectionCard from "../../../Modal/components/ui/SectionCard";
import { updateMyStoreInfo } from "../../../lib/service/profileService"; // ปรับ path ให้ตรงโปรเจกต์คุณ

type Props = {
  title?: string;
  storeName?: string | null;
  storePhone?: string | null;
  storeEmail?: string | null;

  /** ให้ parent รู้เมื่อบันทึกเสร็จ (ใช้ invalidateQueries/ refetch ที่หน้า profile) */
  onSaved?: (payload: {
    store_name: string;
    store_phone: string;
    store_email: string;
  }) => void;

  /** ถ้าอยาก override service เอง */
  onSaveRequest?: (payload: {
    store_name: string;
    store_phone: string;
    store_email: string;
  }) => Promise<any>;
};

type Banner = { type: "success" | "error"; message: string } | null;

export default function CardProfile({
  title = "ข้อมูลร้านค้า",
  storeName,
  storePhone,
  storeEmail,
  onSaved,
  onSaveRequest,
}: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // ฟอร์ม
  const [nameI, setNameI] = useState(storeName || "");
  const [phoneI, setPhoneI] = useState(storePhone || "");
  const [emailI, setEmailI] = useState(storeEmail || "");

  // sync เมื่อ props เปลี่ยน
  useEffect(() => setNameI(storeName || ""), [storeName]);
  useEffect(() => setPhoneI(storePhone || ""), [storePhone]);
  useEffect(() => setEmailI(storeEmail || ""), [storeEmail]);

  // แบนเนอร์แจ้งเตือนในการ์ด
  const [banner, setBanner] = useState<Banner>(null);
  const bannerTimer = useRef<NodeJS.Timeout | null>(null);
  function showBanner(b: Banner, ms = 2500) {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    setBanner(b);
    if (b) {
      bannerTimer.current = setTimeout(() => setBanner(null), ms);
    }
  }
  useEffect(() => {
    return () => {
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    };
  }, []);

  const canSave = useMemo(() => {
    const nameOK = nameI.trim().length > 0;
    const phoneOK = /^\d{9,10}$/.test(phoneI.trim());
    const emailOK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailI.trim());
    return nameOK && phoneOK && emailOK;
  }, [nameI, phoneI, emailI]);

  async function handleSave() {
    if (!canSave) {
      showBanner({ type: "error", message: "กรุณากรอกข้อมูลให้ถูกต้องครบถ้วน" });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        store_name: nameI.trim(),
        store_phone: phoneI.trim(),
        store_email: emailI.trim(),
      };
      const requester = onSaveRequest || updateMyStoreInfo;
      await requester(payload);

      setOpen(false);
      showBanner({ type: "success", message: "บันทึกข้อมูลร้านค้าเรียบร้อย" });
      onSaved?.(payload);
    } catch (e: any) {
      showBanner({
        type: "error",
        message: e?.message || "บันทึกไม่สำเร็จ กรุณาลองใหม่",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard>
      {/* แบนเนอร์แจ้งเตือน */}
      {banner && (
        <View
          style={[
            styles.banner,
            banner.type === "success" ? styles.bannerSuccess : styles.bannerError,
          ]}
        >
          <Ionicons
            name={banner.type === "success" ? "checkmark-circle" : "alert-circle"}
            size={16}
            color={banner.type === "success" ? "#065F46" : "#991B1B"}
          />
          <Text
            style={[
              styles.bannerText,
              { color: banner.type === "success" ? "#065F46" : "#991B1B" },
            ]}
          >
            {banner.message}
          </Text>
        </View>
      )}

      {/* หัวการ์ด + ดินสอแก้ไข */}
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity
          onPress={() => setOpen(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="pencil-outline" size={18} color="#0A57FF" />
        </TouchableOpacity>
      </View>

      {/* เนื้อหา */}
      <View style={{ marginTop: 10, gap: 4 }}>
        <Text style={styles.infoLabel}>ชื่อร้านค้า</Text>
        <Text style={styles.infoValue}>{storeName || "-"}</Text>

        <Text style={[styles.infoLabel, { marginTop: 6 }]}>เบอร์โทรศัพท์</Text>
        <Text style={styles.infoValue}>{storePhone || "-"}</Text>

        <Text style={[styles.infoLabel, { marginTop: 6 }]}>อีเมล</Text>
        <Text style={styles.infoValue}>{storeEmail || "-"}</Text>
      </View>

      {/* Modal แก้ไข */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable onPress={() => {}} style={{ width: "100%" }}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.sheetWrap}
            >
              <View style={styles.sheet}>
                <Text style={styles.sheetTitle}>แก้ไขข้อมูลร้านค้า</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ชื่อร้านค้า</Text>
                  <TextInput
                    style={styles.input}
                    value={nameI}
                    onChangeText={setNameI}
                    placeholder="เช่น ขิมเบเกอรี่"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>เบอร์โทรศัพท์</Text>
                  <TextInput
                    style={styles.input}
                    value={phoneI}
                    onChangeText={setPhoneI}
                    keyboardType="phone-pad"
                    placeholder="เช่น 0611567906"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>อีเมล</Text>
                  <TextInput
                    style={styles.input}
                    value={emailI}
                    onChangeText={setEmailI}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="เช่น admin11111@example.com"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, !canSave || saving ? { opacity: 0.6 } : null]}
                  onPress={handleSave}
                  disabled={!canSave || saving}
                >
                  <Text style={styles.primaryBtnText}>
                    {saving ? "กำลังบันทึก..." : "บันทึก"}
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontWeight: "800", fontSize: 16, color: "#0F172A" },

  infoLabel: { color: "#64748B", fontSize: 13 },
  infoValue: { fontWeight: "700", color: "#0F172A" },

  // banner
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  bannerSuccess: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  bannerError: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  bannerText: { fontSize: 12, fontWeight: "600" },

  // modal
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 24,
  },
  sheetWrap: { width: "100%", alignItems: "center" },
  sheet: { width: "100%", backgroundColor: "#fff", borderRadius: 16, padding: 16 },
  sheetTitle: { fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 12 },
  inputGroup: { marginBottom: 10 },
  inputLabel: { color: "#64748B", marginBottom: 6 },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    color: "#0F172A",
  },
  primaryBtn: {
    height: 46,
    backgroundColor: "#0A57FF",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
});
