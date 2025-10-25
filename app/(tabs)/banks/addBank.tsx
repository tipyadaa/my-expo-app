// app/(tabs)/banks/addBank.tsx
import * as React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";

import GradientHeader from "../../../Modal/components/ui/GradientHeader";
import PrimaryButton from "../../../Modal/components/ui/PrimaryButton";
import AlertModal from "../../../Modal/components/ui/AlertModal";
import SuccessModal from "../../../Modal/components/ui/SuccessModal";

import { useCreateBank } from "../../../lib/hooks/useBank";
import { getStoredAuth } from "../../../lib/authService";
import { encryptAccountNo } from "../../../lib/utils/crypt";

/* ──────────────── Types ──────────────── */
type TabType = "bank" | "promptpay";
type PromptPayType = "MSISDN" | "NATID" | "EWALLETID";
type BankItem = { value: string; label: string; imageUrl: string };
type PPItem = { label: string; value: PromptPayType; imageUrl: string };

/* ──────────────── Bank & PromptPay Lists ──────────────── */
const listBank: BankItem[] = [
  { value: "002", label: "ธนาคารกรุงเทพ", imageUrl: "https://moneyexpo.net/wp-content/uploads/2023/05/BBL.jpg" },
  { value: "004", label: "ธนาคารกสิกรไทย", imageUrl: "https://i.pinimg.com/736x/cb/7c/ca/cb7cca77e49eece5ce042aa9f25ad27c.jpg" },
  { value: "006", label: "ธนาคารกรุงไทย", imageUrl: "https://moneyexpo.net/wp-content/uploads/2023/05/KTB.jpg" },
  { value: "011", label: "ธนาคารทหารไทยธนชาต", imageUrl: "https://media.ttbbank.com/1/global/ttb.jpg" },
  { value: "014", label: "ธนาคารไทยพาณิชย์", imageUrl: "https://www.dpa.or.th/storage/uploads/bank/dpa_bank_sb@2x.png" },
  { value: "025", label: "ธนาคารกรุงศรี", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhQjvxKz4c3kDRgXc3YS1gVDAv1rlVu6NIEA&s" },
  { value: "030", label: "ธนาคารออมสิน", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKB3R_1uIDD6IOdNF0ASnynXcUrrdxs3OUVw&s" },
  { value: "033", label: "ธนาคารอาคารสงเคราะห์", imageUrl: "https://ghbloyalty.ghbank.co.th/logo_ghb.png" },
];

const listPromptpay: PPItem[] = [
  {
    label: "เบอร์โทร",
    value: "MSISDN",
    imageUrl:
      "https://play-lh.googleusercontent.com/dVr2IZFMqilCP3pixPfH1djP_BPhwfjkQyNAjhhzhsFtKfXXh3BomzR3aGg2QMvhya4=w240-h480-rw",
  },
  {
    label: "เลขประจำตัว",
    value: "NATID",
    imageUrl:
      "https://play-lh.googleusercontent.com/dVr2IZFMqilCP3pixPfH1djP_BPhwfjkQyNAjhhzhsFtKfXXh3BomzR3aGg2QMvhya4=w240-h480-rw",
  },
  {
    label: "e-Wallet ID",
    value: "EWALLETID",
    imageUrl:
      "https://play-lh.googleusercontent.com/dVr2IZFMqilCP3pixPfH1djP_BPhwfjkQyNAjhhzhsFtKfXXh3BomzR3aGg2QMvhya4=w240-h480-rw",
  },
];

/* ──────────────── Mask Helper ──────────────── */
const mask = (s: string) => {
  const digits = (s || "").replace(/\D/g, "");
  if (!digits) return "-";
  if (digits.length <= 4) return digits;
  const tail = digits.slice(-4);
  return "xxxx-xxxx-" + tail;
};

/* ──────────────── Component ──────────────── */
export default function AddBank() {
  const router = useRouter();
  const createMut = useCreateBank();

  const [username, setUsername] = React.useState("User");
  React.useEffect(() => {
    (async () => {
      const auth = await getStoredAuth();
      if (auth?.user?.name_th) setUsername(auth.user.name_th);
      else if (auth?.user?.username) setUsername(auth.user.username);
    })();
  }, []);

  const [tab, setTab] = React.useState<TabType>("bank");
  const [bankPickerOpen, setBankPickerOpen] = React.useState(false);
  const [selectedBank, setSelectedBank] = React.useState<BankItem | null>(null);
  const [accountNo, setAccountNo] = React.useState("");
  const [accNameTH, setAccNameTH] = React.useState("");
  const [accNameEN, setAccNameEN] = React.useState("");
  const [ppTypePickerOpen, setPpTypePickerOpen] = React.useState(false);
  const [selectedPP, setSelectedPP] = React.useState<PPItem>(listPromptpay[0]);
  const [ppValue, setPpValue] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [successInfo, setSuccessInfo] = React.useState<{ lines: string[] } | null>(null);

  /* ──────────────── Validate ──────────────── */
  function validate(): string | null {
    if (tab === "bank") {
      if (!selectedBank) return "กรุณาเลือกธนาคาร";
      if (!accountNo.trim()) return "กรุณากรอกหมายเลขบัญชี";
      if (!accNameTH.trim()) return "กรุณากรอกชื่อบัญชีภาษาไทย";
      return null;
    }

    if (!ppValue.trim()) return "กรุณากรอกหมายเลข PromptPay";
    if (!accNameTH.trim()) return "กรุณากรอกชื่อบัญชีภาษาไทย";
    return null;
  }

  /* ──────────────── Submit ──────────────── */
  async function onSubmit() {
    const err = validate();
    if (err) return setFormError(err);

    setFormError(null);
    let payload: any = {
      name_th: accNameTH,
      name_en: accNameEN,
      is_active: 1,
    };

    const auth = await getStoredAuth();
    const secret = String(auth?.token || auth?.user?.uid || auth?.user?.id || "SURE_SURE");
    const plain = tab === "bank" ? accountNo : ppValue;
    const enc = encryptAccountNo(String(plain || ""), secret);

    if (tab === "bank") {
      payload = {
        ...payload,
        bank_code: selectedBank!.value,
        prompt_pay_type: "",
        account_no: accountNo,
        account_no_crypt: enc,
        account_type: "BANK",
      };
    } else {
      payload = {
        ...payload,
        bank_code: "PROMPTPAY",
        prompt_pay_type: selectedPP.value,
        account_no: ppValue,
        account_no_crypt: enc,
        account_type: "PROMPTPAY",
      };
    }

    try {
      setSubmitting(true);
      await createMut.mutateAsync(payload);

      // ✅ แสดงเฉพาะชื่อธนาคารและเลขบัญชี
      const lines =
        tab === "bank"
          ? [`ธนาคาร: ${selectedBank?.label ?? "-"}`, `เลขบัญชี: ${mask(accountNo)}`]
          : [`หมายเลข: ${mask(ppValue)}`];

      setSuccessInfo({ lines });
    } catch (e: any) {
      Alert.alert("ผิดพลาด", e?.message ?? "ไม่สามารถบันทึกได้");
    } finally {
      setSubmitting(false);
    }
  }

  /* ──────────────── UI ──────────────── */
  return (
    <View style={{ flex: 1, backgroundColor: "#F6F8FB" }}>
      <AlertModal visible={!!formError} message={formError ?? ""} onClose={() => setFormError(null)} />

      <SuccessModal
        visible={!!successInfo}
        lines={successInfo?.lines ?? []}
        onClose={() => {
          setSuccessInfo(null);
          router.back();
        }}
      />

      <GradientHeader
        right={
          <Link href="/(tabs)/profile" asChild>
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialCommunityIcons name="storefront-outline" size={18} color="#EAF4FF" />
              <Text style={{ color: "#EAF4FF" }}>Hi, {username}</Text>
            </TouchableOpacity>
          </Link>
        }
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} style={styles.panel}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <Text style={styles.h1}>บัญชีรับเงินร้านค้า</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
        <Text style={styles.sub}>สำหรับใช้ตรวจสอบสลิปโอนเงิน</Text>

        <View style={styles.selectorRow}>
          <TouchableOpacity
            style={[styles.selectCard, tab === "bank" && styles.selectCardActive]}
            onPress={() => setTab("bank")}
          >
            <Ionicons name="business-outline" size={28} color={tab === "bank" ? "#fff" : "#0A57FF"} />
            <Text style={[styles.selectText, tab === "bank" && styles.selectTextActive]}>ธนาคาร</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.selectCard, tab === "promptpay" && styles.selectCardActive]}
            onPress={() => setTab("promptpay")}
          >
            <MaterialCommunityIcons
              name="qrcode-scan"
              size={28}
              color={tab === "promptpay" ? "#fff" : "#0A57FF"}
            />
            <Text style={[styles.selectText, tab === "promptpay" && styles.selectTextActive]}>PromptPay</Text>
          </TouchableOpacity>
        </View>

        {tab === "bank" ? (
          <View style={{ gap: 12 }}>
            <TouchableOpacity style={styles.dropdown} onPress={() => setBankPickerOpen(true)}>
              <Text style={{ color: selectedBank ? "#111827" : "#94A3B8" }}>
                {selectedBank ? selectedBank.label : "เลือกธนาคาร"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="เลขบัญชีธนาคาร"
              keyboardType="number-pad"
              value={accountNo}
              onChangeText={setAccountNo}
            />
            <TextInput
              style={styles.input}
              placeholder="ชื่อบัญชีภาษาไทย"
              value={accNameTH}
              onChangeText={setAccNameTH}
            />
            <TextInput
              style={styles.input}
              placeholder="ชื่อบัญชีภาษาอังกฤษ"
              value={accNameEN}
              onChangeText={setAccNameEN}
            />
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <TouchableOpacity style={styles.dropdown} onPress={() => setPpTypePickerOpen(true)}>
              <Text style={{ color: "#111827" }}>{selectedPP.label}</Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="กรอกหมายเลข PromptPay"
              keyboardType="number-pad"
              value={ppValue}
              onChangeText={(t) => setPpValue(t.replace(/[^0-9]/g, ""))}
            />
            <TextInput
              style={styles.input}
              placeholder="ชื่อบัญชีภาษาไทย"
              value={accNameTH}
              onChangeText={setAccNameTH}
            />
            <TextInput
              style={styles.input}
              placeholder="ชื่อบัญชีภาษาอังกฤษ"
              value={accNameEN}
              onChangeText={setAccNameEN}
            />
          </View>
        )}

        <View style={{ height: 20 }} />
        <PrimaryButton
          title={submitting ? "กำลังบันทึก..." : "เพิ่มบัญชี"}
          onPress={onSubmit}
          disabled={submitting}
        />
      </ScrollView>

      {/* ─────────── Bank Picker ─────────── */}
      <Modal visible={bankPickerOpen} transparent animationType="fade" onRequestClose={() => setBankPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setBankPickerOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <ScrollView style={styles.sheetScroll}>
              {listBank.map((b) => (
                <Pressable
                  key={b.value}
                  style={styles.optionRow}
                  onPress={() => {
                    setSelectedBank(b);
                    setBankPickerOpen(false);
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Image source={{ uri: b.imageUrl }} style={{ width: 28, height: 28, borderRadius: 6 }} />
                    <Text style={styles.optionText}>{b.label}</Text>
                  </View>
                  {selectedBank?.value === b.value && <Ionicons name="checkmark" size={18} color="#0A57FF" />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ──────────────── Styles ──────────────── */
const styles = StyleSheet.create({
  panel: {
    marginTop: -16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  h1: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
  sub: { color: "#64748B", marginBottom: 16 },
  selectorRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  selectCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectCardActive: { backgroundColor: "#0A57FF", borderColor: "#0A57FF" },
  selectText: { marginTop: 6, fontWeight: "700", color: "#0A57FF" },
  selectTextActive: { color: "#fff" },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    marginTop: 8,
    marginBottom: 4,
  },
  sheetScroll: { paddingHorizontal: 0 },
  optionRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: { fontSize: 16 },
});
