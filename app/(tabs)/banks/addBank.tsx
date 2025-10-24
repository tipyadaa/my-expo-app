// app/(tabs)/banks/addBank.tsx
import * as React from "react";
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Modal, Pressable, Alert, ScrollView, Image
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";

import GradientHeader from "../../../Modal/components/ui/GradientHeader";
import PrimaryButton from "../../../Modal/components/ui/PrimaryButton";

// hooks/service ที่ใช้เหมือนหน้า index.tsx
import { useCreateBank } from "../../../lib/hooks/useBank";
import { getStoredAuth } from "../../../lib/authService";
import { encryptAccountNo } from "../../../lib/utils/crypt";

type TabType = "bank" | "promptpay";
type PromptPayType = "MSISDN" | "NATID" | "EWALLETID";

type BankItem = { value: string; label: string; imageUrl: string };
type PPItem = { label: string; value: PromptPayType; imageUrl: string };

const listBank: BankItem[] = [
  { value: '002', label: 'ธนาคารกรุงเทพ', imageUrl: 'https://moneyexpo.net/wp-content/uploads/2023/05/BBL.jpg' },
  { value: '004', label: 'ธนาคารกสิกรไทย', imageUrl: 'https://i.pinimg.com/736x/cb/7c/ca/cb7cca77e49eece5ce042aa9f25ad27c.jpg' },
  { value: '006', label: 'ธนาคารกรุงไทย', imageUrl: 'https://moneyexpo.net/wp-content/uploads/2023/05/KTB.jpg' },
  { value: '009', label: 'ธนาคารโอเวอร์ซี', imageUrl: 'https://www.dpa.or.th/storage/uploads/bank/dpa_bank_ocbc@2x.png' },
  { value: '011', label: 'ธนาคารทหารไทยธนชาต', imageUrl: 'https://media.ttbbank.com/1/global/ttb.jpg' },
  { value: '014', label: 'ธนาคารไทยพาณิชย์', imageUrl: 'https://www.dpa.or.th/storage/uploads/bank/dpa_bank_sb@2x.png' },
  { value: '017', label: 'ธนาคารซิตี้แบงก์', imageUrl: 'https://moneyandbanking.co.th/wp-content/uploads/2024/04/Citi-Bank-905x613.webp' },
  { value: '018', label: 'ธนาคารซูมิโตโม มิตซุย', imageUrl: 'https://www.dpa.or.th/storage/uploads/bank/dpa_bank_smbc@2x.png' },
  { value: '020', label: 'ธนาคารสแตนดาร์ดชาร์เตอร์ด', imageUrl: 'https://www.dpa.or.th/storage/uploads/bank/dpa_bank_scthai@2x.png' },
  { value: '022', label: 'ธนาคารซีไอเอ็มบี ไทย', imageUrl: 'https://www.dpa.or.th/storage/uploads/bank/dpa_bank_cimbthai@2x.png' },
  { value: '024', label: 'ธนาคารยูโอบี', imageUrl: 'https://cms-tpq.theparq.com/wp-content/uploads/2020/07/UOB_LOGO_800x800.png' },
  { value: '025', label: 'ธนาคารกรุงศรี', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhQjvxKz4c3kDRgXc3YS1gVDAv1rlVu6NIEA&s' },
  { value: '030', label: 'ธนาคารออมสิน', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKB3R_1uIDD6IOdNF0ASnynXcUrrdxs3OUVw&s' },
  { value: '031', label: 'ธนาคารฮ่องกงและเซี่ยงไฮ้แบงกิ้ง', imageUrl: 'https://www.dpa.or.th/storage/uploads/bank/dpa_bank_hsbc@2x.png' },
  { value: '032', label: 'ธนาคารดอยซ์แบงก์', imageUrl: 'https://www.dpa.or.th/storage/uploads/bank/dpa_bank_deutsche@2x.png' },
  { value: '033', label: 'ธนาคารอาคารสงเคราะห์', imageUrl: 'https://ghbloyalty.ghbank.co.th/logo_ghb.png' },
  { value: '034', label: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร', imageUrl: 'https://s.isanook.com/mn/0/ud/175/877323/fack.jpg' },
  { value: '039', label: 'ธนาคารมิซูโฮ', imageUrl: 'https://www.dpa.or.th/storage/uploads/bank/dpa_bank_mizuho@2x.png' },
  { value: '045', label: 'ธนาคารบีเอ็นพี พารีบาส์', imageUrl: 'https://www.dpa.or.th/storage/uploads/bank/dpa_bank_bnpparibas@2x.png' },
  { value: '052', label: 'ธนาคารประเทศจีน', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMrfV_dWH9d6FO7JrEw11bWRbiIx0izN_I5g&s' },
  { value: '066', label: 'ธนาคารอิสลาม', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIzQBxnxe1oqnWPkll8vmLqnxJcaRanB23ow&s' },
  { value: '067', label: 'ธนาคารทิสโก้', imageUrl: 'https://www.dpa.or.th/storage/uploads/bank/dpa_bank_tisco@2x.png' },
  { value: '069', label: 'ธนาคารเกียรตินาคิน', imageUrl: 'https://www.dpa.or.th/storage/uploads/bank/dpa_bank_kkp@2x.png' },
  { value: '070', label: 'ธนาคารไอซีบีซี ไทย', imageUrl: 'https://www.dpa.or.th/storage/uploads/bank/dpa_bank_icbc@2x.png' },
  { value: '071', label: 'ธนาคารไทยเครดิต', imageUrl: 'https://www.dpa.or.th/storage/uploads/bank/dpa_bank_thaicredit@2x.png' },
  { value: '073', label: 'ธนาคารแลนด์ แอนด์ เฮ้าส์', imageUrl: 'https://www.dpa.or.th/storage/uploads/bank/dpa_bank_lhbank@2x.png' },
  { value: '098', label: 'ธนาคารพัฒนาวิสาหกิจขนาดกลางและขนาดย่อม', imageUrl: 'https://csrgroup.co.th/img/Client258-6.png' },
];

const listPromptpay: PPItem[] = [
  {
    label: 'เบอร์โทร',
    value: 'MSISDN',
    imageUrl: 'https://play-lh.googleusercontent.com/dVr2IZFMqilCP3pixPfH1djP_BPhwfjkQyNAjhhzhsFtKfXXh3BomzR3aGg2QMvhya4=w240-h480-rw'
  },
  {
    label: 'เลขประจำตัว',
    value: 'NATID',
    imageUrl: 'https://play-lh.googleusercontent.com/dVr2IZFMqilCP3pixPfH1djP_BPhwfjkQyNAjhhzhsFtKfXXh3BomzR3aGg2QMvhya4=w240-h480-rw'
  },
  {
    label: 'e-Wallet ID',
    value: 'EWALLETID',
    imageUrl: 'https://play-lh.googleusercontent.com/dVr2IZFMqilCP3pixPfH1djP_BPhwfjkQyNAjhhzhsFtKfXXh3BomzR3aGg2QMvhya4=w240-h480-rw'
  },
];

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

  // BANK
  const [bankPickerOpen, setBankPickerOpen] = React.useState(false);
  const [selectedBank, setSelectedBank] = React.useState<BankItem | null>(null);
  const [accountNo, setAccountNo] = React.useState("");
  const [accNameTH, setAccNameTH] = React.useState("");
  const [accNameEN, setAccNameEN] = React.useState("");

  // PROMPTPAY
  const [ppTypePickerOpen, setPpTypePickerOpen] = React.useState(false);
  const [selectedPP, setSelectedPP] = React.useState<PPItem>(listPromptpay[0]);
  const [ppValue, setPpValue] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);

  function validate(): string | null {
    if (tab === "bank") {
      if (!selectedBank) return "โปรดเลือกธนาคาร";
      if (!accountNo) return "โปรดกรอกเลขบัญชี";
      if (!accNameTH) return "โปรดกรอกชื่อบัญชีภาษาไทย";
      return null;
    }
    // promptpay
    if (!ppValue) return "โปรดกรอกข้อมูล PromptPay";
    if (!accNameTH) return "โปรดกรอกชื่อบัญชีภาษาไทย";
    switch (selectedPP.value) {
      case "MSISDN":
        if (!/^\d{9,10}$/.test(ppValue)) return "เบอร์โทรต้องเป็นตัวเลข 9–10 หลัก";
        break;
      case "NATID":
        if (!/^\d{13}$/.test(ppValue)) return "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก";
        break;
      case "EWALLETID":
        if (!/^\d+$/.test(ppValue)) return "e-Wallet ID ต้องเป็นตัวเลข";
        break;
    }
    return null;
  }

  async function onSubmit() {
    const err = validate();
    if (err) {
      Alert.alert("กรอกข้อมูลไม่ครบ", err);
      return;
    }

    let payload: any = {
      name_th: accNameTH,
      name_en: accNameEN,
      is_active: 1,
    };

    // build encrypted account number using user token/uid as secret
    const auth = await getStoredAuth();
    const secret = String(auth?.token || auth?.user?.uid || auth?.user?.id || 'SURE_SURE');
    const plain = tab === 'bank' ? accountNo : ppValue;
    const enc = encryptAccountNo(String(plain || ''), secret);

    if (tab === "bank") {
      payload = {
        ...payload,
        bank_code: selectedBank!.value,    // ใช้รหัส 3 หลักตาม listBank
        prompt_pay_type: "",
        account_no: accountNo,
        account_no_crypt: enc,
        account_type: "BANK",
      };
    } else {
      payload = {
        ...payload,
        bank_code: "PROMPTPAY",
        prompt_pay_type: selectedPP.value, // MSISDN | NATID | EWALLETID
        account_no: ppValue,
        account_no_crypt: enc,
        account_type: "PROMPTPAY",
      };
    }

    try {
      setSubmitting(true);
      await createMut.mutateAsync(payload);
      Alert.alert(
        tab === "bank" ? "เพิ่มบัญชีสำเร็จ" : "เพิ่ม PromptPay สำเร็จ",
        tab === "bank"
          ? `${selectedBank?.label}\n${accountNo}`
          : `${selectedPP.label}: ${ppValue}`,
        [{ text: "ตกลง", onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert("ผิดพลาด", e?.message ?? "ไม่สามารถบันทึกได้");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F6F8FB" }}>
      {/* Header: Hi, {username} → ไปหน้าโปรไฟล์ */}
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

      {/* ==== PANEL ==== */}
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} style={styles.panel}>
        {/* หัวข้อ + ปิด */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <Text style={styles.h1}>บัญชีรับเงินร้านค้า</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="ปิด">
            <Ionicons name="close" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
        <Text style={styles.sub}>สำหรับใช้ตรวจสอบสลิปโอนเงิน</Text>

        {/* เลือกประเภท */}
        <View style={styles.selectorRow}>
          <TouchableOpacity
            style={[styles.selectCard, tab === "bank" && styles.selectCardActive]}
            onPress={() => setTab("bank")}
            activeOpacity={0.85}
          >
            <Ionicons name="business-outline" size={28} color={tab === "bank" ? "#fff" : "#0A57FF"} />
            <Text style={[styles.selectText, tab === "bank" && styles.selectTextActive]}>
              ธนาคาร
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.selectCard, tab === "promptpay" && styles.selectCardActive]}
            onPress={() => setTab("promptpay")}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="qrcode-scan"
              size={28}
              color={tab === "promptpay" ? "#fff" : "#0A57FF"}
            />
            <Text style={[styles.selectText, tab === "promptpay" && styles.selectTextActive]}>
              PromptPay
            </Text>
          </TouchableOpacity>
        </View>

        {/* ฟอร์ม */}
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
              placeholder={
                selectedPP.value === "MSISDN"
                  ? "กรอกเบอร์โทร (9–10 หลัก)"
                  : selectedPP.value === "NATID"
                  ? "กรอกเลขบัตรประชาชน (13 หลัก)"
                  : "กรอก e-Wallet ID"
              }
              keyboardType="number-pad"
              value={ppValue}
              onChangeText={(t) => setPpValue(t.replace(/[^0-9]/g, ""))}
              maxLength={selectedPP.value === "MSISDN" ? 10 : selectedPP.value === "NATID" ? 13 : 30}
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
        <PrimaryButton title={submitting ? "กำลังบันทึก..." : "เพิ่มบัญชี"} onPress={onSubmit} disabled={submitting} />
      </ScrollView>

      {/* Modal: เลือกธนาคาร (โชว์รูป + ชื่อ) */}
      <Modal
        visible={bankPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setBankPickerOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setBankPickerOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={{ paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
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
                    <Image
                      source={{ uri: b.imageUrl }}
                      style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: "#f1f5f9" }}
                    />
                    <Text style={styles.optionText}>{b.label}</Text>
                  </View>
                  {selectedBank?.value === b.value && (
                    <Ionicons name="checkmark" size={18} color="#0A57FF" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Modal: เลือกประเภท PromptPay */}
      <Modal
        visible={ppTypePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPpTypePickerOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setPpTypePickerOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={{ paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
              {listPromptpay.map(pp => (
                <Pressable
                  key={pp.value}
                  style={styles.optionRow}
                  onPress={() => {
                    setSelectedPP(pp);
                    setPpTypePickerOpen(false);
                    setPpValue("");
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Image
                      source={{ uri: pp.imageUrl }}
                      style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: "#f1f5f9" }}
                    />
                    <Text style={styles.optionText}>{pp.label}</Text>
                  </View>
                  {selectedPP.value === pp.value && (
                    <Ionicons name="checkmark" size={18} color="#0A57FF" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
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
    paddingBottom: 8,
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
