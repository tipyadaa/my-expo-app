// app/(tabs)/stores/[id].tsx
import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useLocalSearchParams, useRouter } from "expo-router";

import GradientHeader from "../../../Modal/components/ui/GradientHeader";
import { useStores } from "../../../lib/service/storeService";
import { useLocalAuthQuery } from "../../../lib/authService";
import { useBanksMine } from "../../../lib/hooks/useBank";

export default function DetailStore() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Header: ชื่อผู้ใช้จริง
  const { data: auth } = useLocalAuthQuery();
  const displayName =
    auth?.user?.name_th || auth?.user?.username || auth?.user?.email || "ผู้ใช้งาน";

  // โหลดรายการสาขา แล้วหา item ตรงกับพาธ
  const { data, isLoading, isError, refetch, isFetching } = useStores();
  const item = React.useMemo(
    () => (data ?? []).find((x) => x.id === String(id)),
    [data, id]
  );

  // โหลดบัญชีธนาคารของผู้ใช้
  const {
    data: myBanks = [],
    isLoading: isLoadingBanks,
    isError: isBankError,
    refetch: refetchBanks,
  } = useBanksMine();

  const storeName = item?.name ?? "-";
  const statusText = item?.status ?? "ยังไม่ได้เชื่อมต่อ";
  const code = item?.code ?? "-";
  const storeNo = `#${String(item?.id ?? "").padStart(6, "0")}`;

  // ดึง bank_ids และแม็ปกับ myBanks
  const linkedBankIds: number[] = React.useMemo(() => {
    const raw =
      (item as any)?.bank_ids ?? (item as any)?.bankIds ?? (item as any)?.banks ?? [];
    if (!Array.isArray(raw)) return [];
    return raw.map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0);
  }, [item]);

  const linkedBanks = React.useMemo(() => {
    if (!linkedBankIds.length) return [];
    return myBanks.filter((b: any) => linkedBankIds.includes(Number(b.id)));
  }, [myBanks, linkedBankIds]);

  // ——— Bank/PromptPay logo helpers (explicit mapping from provided lists) ———
  const LIST_BANK = React.useMemo(
    () => [
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
    ],
    []
  );

  const LIST_PROMPTPAY = React.useMemo(
    () => [
      { label: 'เบอร์โทร', value: 'MSISDN', imageUrl: 'https://play-lh.googleusercontent.com/dVr2IZFMqilCP3pixPfH1djP_BPhwfjkQyNAjhhzhsFtKfXXh3BomzR3aGg2QMvhya4=w240-h480-rw' },
      { label: 'เลขประจำตัว', value: 'NATID', imageUrl: 'https://play-lh.googleusercontent.com/dVr2IZFMqilCP3pixPfH1djP_BPhwfjkQyNAjhhzhsFtKfXXh3BomzR3aGg2QMvhya4=w240-h480-rw' },
      { label: 'e-Wallet ID', value: 'EWALLETID', imageUrl: 'https://play-lh.googleusercontent.com/dVr2IZFMqilCP3pixPfH1djP_BPhwfjkQyNAjhhzhsFtKfXXh3BomzR3aGg2QMvhya4=w240-h480-rw' },
    ],
    []
  );

  const BANK_IMG_BY_CODE: Record<string, string> = React.useMemo(() => {
    const map: Record<string, string> = {};
    LIST_BANK.forEach((b) => (map[String(b.value).toUpperCase()] = b.imageUrl));
    return map;
  }, [LIST_BANK]);
  const PP_IMG_BY_TYPE: Record<string, string> = React.useMemo(() => {
    const map: Record<string, string> = {};
    LIST_PROMPTPAY.forEach((p) => (map[String(p.value).toUpperCase()] = p.imageUrl));
    return map;
  }, [LIST_PROMPTPAY]);

  const getBankLogoUri = (bank: any): string | null => {
    const type = String(bank?.account_type || '').toUpperCase();
    const code = String(bank?.bank_code || '').toUpperCase().trim();
    if (type === 'PROMPTPAY' || code === 'PROMPTPAY') {
      const ppType = String(bank?.prompt_pay_type || '').toUpperCase();
      return PP_IMG_BY_TYPE[ppType] || PP_IMG_BY_TYPE['MSISDN'] || null;
    }
    if (!code) return null;
    return BANK_IMG_BY_CODE[code] || null;
  };

  function BankLogo({ bank }: { bank: any }) {
    const [err, setErr] = React.useState(false);
    const uri = getBankLogoUri(bank);
    if (!uri || err) {
      return <View style={styles.bankIconBox} />;
    }
    return (
      <Image
        source={{ uri }}
        style={styles.bankLogo}
        onError={() => setErr(true)}
      />
    );
  }

  const copyCode = async () => {
    if (!code || code === "-") {
      Alert.alert("คัดลอกไม่สำเร็จ", "ยังไม่มีโค้ดสำหรับสาขานี้");
      return;
    }
    await Clipboard.setStringAsync(code);
    Alert.alert("คัดลอกสำเร็จ", "คัดลอก Code เรียบร้อย");
  };

  const onEdit = () => {
    router.push({ pathname: "/(tabs)/stores/editStore", params: { id: String(id) } });
  };

  if (isLoading || isFetching) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: "#64748B" }}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
        <Text style={{ color: "#DC2626", fontWeight: "700" }}>โหลดข้อมูลไม่สำเร็จ</Text>
        <TouchableOpacity
          onPress={() => refetch()}
          style={styles.retryBtn}
        >
          <Text>ลองอีกครั้ง</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
        <Text style={{ color: "#64748B" }}>ไม่พบสาขานี้</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
          <Text>กลับ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F6F8FB" }}>
      {/* Header gradient + ปุ่มไปโปรไฟล์ */}
      <GradientHeader
        right={
          <Link href="/(tabs)/profile" asChild>
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialCommunityIcons name="storefront-outline" size={18} color="#EAF4FF" />
              <Text style={{ color: "#EAF4FF" }}>Hi, {displayName}</Text>
            </TouchableOpacity>
          </Link>
        }
      />

      {/* แผงขาวโค้ง + ปุ่มปิดมุมขวา */}
      <ScrollView
        style={styles.panel}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />}
      >
        {/* ปุ่มปิด */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={18} color="#0F172A" />
        </TouchableOpacity>

        {/* การ์ดหัว */}
        <View style={[styles.headerCard, styles.shadowSm]}>
          <View style={styles.storeIconWrap}>
            <MaterialCommunityIcons name="storefront-outline" size={32} color="#10B981" />
          </View>

          <View style={{ marginTop: 6, alignItems: "center" }}>
            <Text style={styles.storeTopLabel}>ร้าน บนแพลตฟอร์ม</Text>
            <Text style={styles.storeTitle}>{storeName}</Text>
          </View>

          <View style={styles.rowGap}>
            {/* สถานะ */}
            <View
              style={[
                styles.badge,
                statusText === "เชื่อมต่อเรียบร้อย" ? styles.badgeGreen : styles.badgeRed,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: statusText === "เชื่อมต่อเรียบร้อย" ? "#065F46" : "#B91C1C" },
                ]}
              >
                {statusText}
              </Text>
            </View>

            {/* เลขสาขา */}
            <View style={[styles.badge, styles.badgeGray]}>
              <Text style={[styles.badgeText, { color: "#0F172A" }]}>{storeNo}</Text>
            </View>
          </View>

          {/* กล่องแจ้งเตือนชมพู */}
          {statusText !== "เชื่อมต่อเรียบร้อย" && (
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>
                กรุณาสร้าง/เชื่อมเข้า LINE Group โดยใช้ Code {"\n"}
                และบัญชี SureSure ที่ลงทะเบียนไว้
              </Text>
            </View>
          )}
        </View>

        {/* วิธีเชื่อมต่อ Line */}
        <View style={[styles.card, styles.shadowSm]}>
          <Text style={[styles.cardTitle, { textAlign: "center" }]}>วิธีเชื่อมต่อ Line</Text>

          <View style={styles.lineStepList}>
            <Text style={styles.stepText}>1. คัดลอก Code</Text>
            <Text style={styles.stepText}>2. กดสร้าง LINE Group, เชิญ LINE OA: SureSure กับทีมงาน เข้ากลุ่มที่ใช้ตรวจสลิป</Text>
            <Text style={styles.stepText}>3. ส่ง Code ใน LINE Group ที่ต้องการเชื่อมต่อ</Text>
            <Text style={styles.stepText}>4. เชื่อมต่อสำเร็จ เริ่มตรวจสลิปได้ทันที</Text>
          </View>

          <View style={styles.lineCodeCard}>
            <Text style={styles.lineCodeLabel}>Code สำหรับเชื่อมต่อ Line Group</Text>

            <View style={styles.lineCodeRow}>
              <View style={styles.lineCodeField}>
                <Text style={styles.lineCodeText} numberOfLines={1}>
                  {code}
                </Text>
              </View>
              <TouchableOpacity style={styles.lineCopyBtn} onPress={copyCode}>
                <Text style={styles.lineCopyBtnText}>คัดลอก</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.lineHint}>* 1 กลุ่มต่อ 1 Code เท่านั้น ไม่สามารถเปลี่ยนได้</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => Alert.alert("สร้าง LINE Group", "เร็วๆนี้")}
            style={styles.lineGroupBtnWrap}
          >
            <LinearGradient
              colors={["#0A57FF", "#01C3AF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>สร้าง LINE Group</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* บัญชีรับเงินที่เชื่อมต่อ */}
        <View style={[styles.card, styles.shadowSm]}>
          <Text style={styles.cardTitle}>บัญชีรับเงินที่เชื่อมต่อ</Text>
          <View style={{ height: 10 }} />

          {/* สถานะโหลด/ผิดพลาด */}
          {isLoadingBanks && (
            <View style={{ paddingVertical: 6 }}>
              <ActivityIndicator />
              <Text style={{ color: "#64748B", marginTop: 6 }}>กำลังโหลดบัญชี...</Text>
            </View>
          )}
          {isBankError && (
            <View style={{ paddingVertical: 6 }}>
              <Text style={{ color: "#DC2626" }}>โหลดบัญชีไม่สำเร็จ</Text>
              <TouchableOpacity onPress={refetchBanks}>
                <Text style={{ color: "#0A57FF", marginTop: 4 }}>ลองใหม่</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* รายการเป็น “การ์ดขาว” เหมือนภาพ */}
          {!isLoadingBanks && !isBankError && linkedBanks.length > 0 ? (
            <View style={{ gap: 10 }}>
              {linkedBanks.map((b: any) => {
                const bankName = b.name_th || b.name_en || b.bank_code || "ธนาคาร";
                const acc = String(b.account_no || "");
                return (
                  <View key={b.id} style={[styles.bankRow, styles.shadowXs]}>
                    <BankLogo bank={b} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bankName} numberOfLines={1}>
                        {bankName}
                      </Text>
                      <Text style={styles.bankAcc} numberOfLines={1}>
                        {acc}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            !isLoadingBanks &&
            !isBankError && <Text style={{ color: "#64748B" }}>ยังไม่มีบัญชีที่เชื่อมต่อสำหรับสาขานี้</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    paddingTop: 16,
    paddingHorizontal: 14,
  },
  closeBtn: {
    position: "absolute",
    right: 14,
    top: 14,
    zIndex: 5,
    height: 28,
    width: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  headerCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    alignItems: "center",
  },
  storeIconWrap: {
    height: 56,
    width: 56,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  storeTopLabel: { color: "#6B7280", fontSize: 11 },
  storeTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  rowGap: { flexDirection: "row", gap: 8, marginTop: 8 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeRed: { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" },
  badgeGreen: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  badgeGray: { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" },
  badgeText: { fontSize: 11, fontWeight: "800" },

  alertBox: {
    marginTop: 10,
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignSelf: "stretch",
  },
  alertText: { color: "#991B1B", fontSize: 12, lineHeight: 18, textAlign: "center" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    marginTop: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  stepText: { color: "#475569", fontSize: 12 },

  lineStepList: { marginTop: 8, gap: 4 },
  lineCodeCard: {
    marginTop: 12,
    backgroundColor: "#EAF2FF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#C7DCFF",
    gap: 12,
  },
  lineCodeLabel: { textAlign: "center", color: "#0F172A", fontWeight: "800", fontSize: 13 },
  lineCodeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  lineCodeField: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#D4E3FF",
  },
  lineCodeText: { color: "#0F172A", fontWeight: "700" },
  lineCopyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#0A57FF",
    alignItems: "center",
    justifyContent: "center",
  },
  lineCopyBtnText: { color: "#FFFFFF", fontWeight: "800" },
  lineHint: { color: "#64748B", fontSize: 11, textAlign: "center" },
  lineGroupBtnWrap: { marginTop: 14, borderRadius: 14, overflow: "hidden" },

  primaryBtn: {
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  // “การ์ดบัญชี” แบบในภาพ
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  bankIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#3B82F6",
  },
  bankLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  bankName: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  bankAcc: { fontSize: 12, color: "#64748B" },

  // ปุ่ม/การ์ดอื่น ๆ
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#2563EB",
    borderRadius: 8,
  },
  retryBtn: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#E2E8F0",
    borderRadius: 8,
  },

  // เงา
  shadowSm: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  shadowXs: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
