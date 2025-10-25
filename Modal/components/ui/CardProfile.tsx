// app/(tabs)/components/CardProfile.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SectionCard from "./SectionCard";
import { updateMyStoreInfo } from "../../../lib/service/profileService"; // ปรับ path ให้ตรงโปรเจกต์คุณ
import { useCategories } from "../../../lib/hooks/useProfile";

type SavePayload = {
  store_name: string;
  store_phone: string;
  store_email: string;
  website?: string;
  store_address?: string;
  store_type?: string;
};

type Props = {
  title?: string;

  storeName?: string | null;
  storePhone?: string | null;
  storeEmail?: string | null;
  storeWebsite?: string | null;
  /** ใหม่ */
  storeAddress?: string | null;
  storeType?: string | null;

  /** ให้ parent รู้เมื่อบันทึกเสร็จ (ใช้ invalidateQueries/ refetch ที่หน้า profile) */
  onSaved?: (payload: SavePayload) => void;

  /** ถ้าอยาก override service เอง */
  onSaveRequest?: (payload: SavePayload) => Promise<any>;
};

type Banner = { type: "success" | "error"; message: string } | null;

export default function CardProfile({
  title = "ข้อมูลร้านค้า",
  storeName,
  storePhone,
  storeEmail,
  storeWebsite,
  storeAddress,
  storeType,
  onSaved,
  onSaveRequest,
}: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // ฟอร์ม
  const [nameI, setNameI] = useState(storeName || "");
  const [phoneI, setPhoneI] = useState(storePhone || "");
  const [websiteI, setWebsiteI] = useState(storeEmail || "");
  const [contactEmailI, setContactEmailI] = useState(storeWebsite || "");
  const [addressI, setAddressI] = useState(storeAddress || "");
  const [typeI, setTypeI] = useState(storeType || "");
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  // โหลดรายการหมวดหมู่ร้านค้า (merchantcategory)
  const { data: categories = [], isLoading: isLoadingCats } = useCategories();

  // sync เมื่อ props เปลี่ยน
  useEffect(() => setNameI(storeName || ""), [storeName]);
  useEffect(() => setPhoneI(storePhone || ""), [storePhone]);
  useEffect(() => setWebsiteI(storeEmail || ""), [storeEmail]);
  useEffect(() => setContactEmailI(storeWebsite || ""), [storeWebsite]);
  useEffect(() => setAddressI(storeAddress || ""), [storeAddress]);

  const resolveCategoryLabel = useCallback(
    (raw: string) => {
      const trimmed = raw?.trim();
      if (!trimmed) return "";
      const lower = trimmed.toLowerCase();
      const match = (categories as any[]).find((item) => {
        if (!item) return false;
        const options = [
          item.iso_code,
          item.category_name_th,
          item.category_name_en,
          item.cat_id != null ? String(item.cat_id) : undefined,
        ];
        return options.some((val) => val && String(val).trim().toLowerCase() === lower);
      });
      if (match) {
        const th = match.category_name_th ? String(match.category_name_th).trim() : "";
        const en = match.category_name_en ? String(match.category_name_en).trim() : "";
        return th || en || trimmed;
      }
      return trimmed;
    },
    [categories]
  );

  const storeTypeLabel = useMemo(
    () => resolveCategoryLabel(storeType || ""),
    [storeType, resolveCategoryLabel]
  );

  useEffect(() => setTypeI(storeTypeLabel), [storeTypeLabel]);

  // แบนเนอร์แจ้งเตือนในการ์ด
  const [banner, setBanner] = useState<Banner>(null);
  const bannerTimer = useRef<NodeJS.Timeout | null>(null);
  function showBanner(b: Banner, ms = 2500) {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    setBanner(b);
    if (b) bannerTimer.current = setTimeout(() => setBanner(null), ms);
  }
  useEffect(() => () => { if (bannerTimer.current) clearTimeout(bannerTimer.current); }, []);

  const canSave = useMemo(() => {
    const nameOK = nameI.trim().length > 0;
    const phoneOK = /^\d{9,10}$/.test(phoneI.trim());
    const contactEmail = contactEmailI.trim();
    const emailOK =
      contactEmail.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail);
    return nameOK && phoneOK && emailOK;
  }, [nameI, phoneI, contactEmailI]);

  async function handleSave() {
    if (!canSave) {
      showBanner({ type: "error", message: "กรุณากรอกข้อมูลให้ถูกต้องครบถ้วน" });
      return;
    }
    try {
      setSaving(true);
      const payload: SavePayload = {
        store_name: nameI.trim(),
        store_phone: phoneI.trim(),
        store_email: websiteI.trim(),
        website: contactEmailI.trim() || undefined,
        store_address: addressI.trim(),
        store_type: typeI.trim(),
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

        <Text style={[styles.infoLabel, { marginTop: 6 }]}>เว็บไซต์ร้านค้า</Text>
        <Text style={styles.infoValue}>{storeEmail || "-"}</Text>

        <Text style={[styles.infoLabel, { marginTop: 6 }]}>อีเมลร้านค้า</Text>
        <Text style={styles.infoValue}>{storeWebsite || "-"}</Text>

        {/* ใหม่: ประเภท & ที่อยู่ */}
        <Text style={[styles.infoLabel, { marginTop: 6 }]}>ประเภทของร้านค้า</Text>
        <Text style={styles.infoValue}>{storeTypeLabel || "-"}</Text>

        <Text style={[styles.infoLabel, { marginTop: 6 }]}>ที่อยู่ร้านค้า</Text>
        <Text style={styles.infoValue}>{storeAddress || "-"}</Text>
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
                  <Text style={styles.inputLabel}>เว็บไซต์ร้านค้า (ไม่บังคับ)</Text>
                  <TextInput
                    style={styles.input}
                    value={websiteI}
                    onChangeText={setWebsiteI}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="https://yourshop.com"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>อีเมลร้านค้า (ไม่บังคับ)</Text>
                  <TextInput
                    style={styles.input}
                    value={contactEmailI}
                    onChangeText={setContactEmailI}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="shop@example.com"
                  />
                </View>

                {/* ใหม่: ประเภทของร้านค้า */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ประเภทของร้านค้า</Text>
                  {isLoadingCats ? (
                    <View style={[styles.input, styles.inputPad, { flexDirection: "row", justifyContent: "space-between" }]}>
                      <Text style={{ color: "#64748B" }}>กำลังโหลดรายการ...</Text>
                    </View>
                  ) : categories && categories.length > 0 ? (
                    <TouchableOpacity
                      style={[styles.input, styles.inputPad, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}
                      onPress={() => setTypePickerOpen(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: typeI ? "#0F172A" : "#94A3B8" }}>
                        {typeI || "เลือกประเภท (EN)"}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#64748B" />
                    </TouchableOpacity>
                  ) : (
                    // Fallback: หากโหลดหมวดหมู่ไม่ได้ ให้กรอกเองได้
                    <TextInput
                      style={styles.input}
                      value={typeI}
                      onChangeText={setTypeI}
                      placeholder="พิมพ์ประเภท (EN)"
                    />
                  )}
                </View>

                {/* ใหม่: ที่อยู่ร้านค้า */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ที่อยู่ร้านค้า</Text>
                  <TextInput
                    style={[styles.input, styles.inputArea]}
                    value={addressI}
                    onChangeText={setAddressI}
                    placeholder="เลขที่/ถนน/แขวง/เขต/จังหวัด/รหัสไปรษณีย์"
                    multiline
                    textAlignVertical="top"
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
      {/* Modal เลือกประเภท (Dropdown) */}
      <Modal
        transparent
        visible={typePickerOpen}
        animationType="fade"
        onRequestClose={() => setTypePickerOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setTypePickerOpen(false)}>
          <Pressable onPress={() => {}} style={{ width: "100%" }}>
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>เลือกประเภท (English)</Text>
              {categories && categories.length > 0 ? (
                <FlatList
                  style={{ maxHeight: 360 }}
                  data={categories as any[]}
                  keyExtractor={(c: any, idx) => String(c?.cat_id ?? c?.category_name_en ?? idx)}
                  renderItem={({ item }: { item: any }) => {
                    const label =
                      (item?.category_name_th && String(item.category_name_th)) ||
                      (item?.category_name_en && String(item.category_name_en)) ||
                      (item?.iso_code && String(item.iso_code)) ||
                      (item?.cat_id != null ? String(item.cat_id) : "");
                    const normalizedLabel = label.trim().toLowerCase();
                    const selected =
                      normalizedLabel.length > 0 &&
                      normalizedLabel === typeI.trim().toLowerCase();
                    return (
                      <TouchableOpacity
                        style={[styles.optionRow, selected ? styles.optionRowActive : null]}
                        onPress={() => {
                          setTypeI(label.trim());
                          setTypePickerOpen(false);
                        }}
                      >
                        <Text style={[styles.optionText, selected ? { fontWeight: "800" } : null]}>
                          {label || "-"}
                        </Text>
                        {selected && <Ionicons name="checkmark" size={16} color="#0A57FF" />}
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={<Text style={{ color: "#64748B" }}>ไม่พบรายการหมวดหมู่</Text>}
                />
              ) : (
                <Text style={{ color: "#64748B" }}>ไม่พบรายการหมวดหมู่</Text>
              )}
              <TouchableOpacity style={[styles.primaryBtn, { marginTop: 8 }]} onPress={() => setTypePickerOpen(false)}>
                <Text style={styles.primaryBtnText}>ปิด</Text>
              </TouchableOpacity>
            </View>
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
  inputPad: { justifyContent: "center" },
  inputArea: {
    height: 84,
    paddingTop: 10,
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
  optionRow: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  optionRowActive: {
    borderColor: "#93C5FD",
    backgroundColor: "#EEF2FF",
  },
  optionText: { color: "#0F172A" },
});
