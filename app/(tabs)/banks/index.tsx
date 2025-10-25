// app/(tabs)/banks/index.tsx
import * as React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import GradientHeader from "../../../Modal/components/ui/GradientHeader";
import SectionCard from "../../../Modal/components/ui/SectionCard";

// 🟢 service + hooks
import { useBanksMine, useDeleteBank } from "../../../lib/hooks/useBank";
import { getStoredAuth } from "../../../lib/authService";

// ✅ นำเข้า DeleteAlert
import DeleteAlert from "../../../Modal/components/ui/deleteAlert";

/* =========================================================
 *  รายชื่อธนาคาร (code -> image/name)
 * =======================================================*/
const listBank = [
  { value: "002", label: "ธนาคารกรุงเทพ", imageUrl: "https://moneyexpo.net/wp-content/uploads/2023/05/BBL.jpg" },
  { value: "004", label: "ธนาคารกสิกรไทย", imageUrl: "https://i.pinimg.com/736x/cb/7c/ca/cb7cca77e49eece5ce042aa9f25ad27c.jpg" },
  { value: "006", label: "ธนาคารกรุงไทย", imageUrl: "https://moneyexpo.net/wp-content/uploads/2023/05/KTB.jpg" },
  { value: "009", label: "ธนาคารโอเวอร์ซี", imageUrl: "https://www.dpa.or.th/storage/uploads/bank/dpa_bank_ocbc@2x.png" },
  { value: "011", label: "ธนาคารทหารไทยธนชาต", imageUrl: "https://media.ttbbank.com/1/global/ttb.jpg" },
  { value: "014", label: "ธนาคารไทยพาณิชย์", imageUrl: "https://www.dpa.or.th/storage/uploads/bank/dpa_bank_sb@2x.png" },
  { value: "017", label: "ธนาคารซิตี้แบงก์", imageUrl: "https://moneyandbanking.co.th/wp-content/uploads/2024/04/Citi-Bank-905x613.webp" },
  { value: "018", label: "ธนาคารซูมิโตโม มิตซุย", imageUrl: "https://www.dpa.or.th/storage/uploads/bank/dpa_bank_smbc@2x.png" },
  { value: "020", label: "ธนาคารสแตนดาร์ดชาร์เตอร์ด", imageUrl: "https://www.dpa.or.th/storage/uploads/bank/dpa_bank_scthai@2x.png" },
  { value: "022", label: "ธนาคารซีไอเอ็มบี ไทย", imageUrl: "https://www.dpa.or.th/storage/uploads/bank/dpa_bank_cimbthai@2x.png" },
  { value: "024", label: "ธนาคารยูโอบี", imageUrl: "https://cms-tpq.theparq.com/wp-content/uploads/2020/07/UOB_LOGO_800x800.png" },
  { value: "025", label: "ธนาคารกรุงศรี", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhQjvxKz4c3kDRgXc3YS1gVDAv1rlVu6NIEA&s" },
  { value: "030", label: "ธนาคารออมสิน", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKB3R_1uIDD6IOdNF0ASnynXcUrrdxs3OUVw&s" },
  { value: "031", label: "ธนาคารฮ่องกงและเซี่ยงไฮ้แบงกิ้ง", imageUrl: "https://www.dpa.or.th/storage/uploads/bank/dpa_bank_hsbc@2x.png" },
  { value: "032", label: "ธนาคารดอยซ์แบงก์", imageUrl: "https://www.dpa.or.th/storage/uploads/bank/dpa_bank_deutsche@2x.png" },
  { value: "033", label: "ธนาคารอาคารสงเคราะห์", imageUrl: "https://ghbloyalty.ghbank.co.th/logo_ghb.png" },
  { value: "034", label: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร", imageUrl: "https://s.isanook.com/mn/0/ud/175/877323/fack.jpg" },
  { value: "039", label: "ธนาคารมิซูโฮ", imageUrl: "https://www.dpa.or.th/storage/uploads/bank/dpa_bank_mizuho@2x.png" },
  { value: "045", label: "ธนาคารบีเอ็นพี พารีบาส์", imageUrl: "https://www.dpa.or.th/storage/uploads/bank/dpa_bank_bnpparibas@2x.png" },
  { value: "052", label: "ธนาคารประเทศจีน", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMrfV_dWH9d6FO7JrEw11bWRbiIx0izN_I5g&s" },
  { value: "066", label: "ธนาคารอิสลาม", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIzQBxnxe1oqnWPkll8vmLqnxJcaRanB23ow&s" },
  { value: "067", label: "ธนาคารทิสโก้", imageUrl: "https://www.dpa.or.th/storage/uploads/bank/dpa_bank_tisco@2x.png" },
  { value: "069", label: "ธนาคารเกียรตินาคิน", imageUrl: "https://www.dpa.or.th/storage/uploads/bank/dpa_bank_kkp@2x.png" },
  { value: "070", label: "ธนาคารไอซีบีซี ไทย", imageUrl: "https://www.dpa.or.th/storage/uploads/bank/dpa_bank_icbc@2x.png" },
  { value: "071", label: "ธนาคารไทยเครดิต", imageUrl: "https://www.dpa.or.th/storage/uploads/bank/dpa_bank_thaicredit@2x.png" },
  { value: "073", label: "ธนาคารแลนด์ แอนด์ เฮ้าส์", imageUrl: "https://www.dpa.or.th/storage/uploads/bank/dpa_bank_lhbank@2x.png" },
  { value: "098", label: "ธนาคารพัฒนาวิสาหกิจขนาดกลางและขนาดย่อม", imageUrl: "https://csrgroup.co.th/img/Client258-6.png" },
];

// alias
const BANK_ALIAS: Record<string, string> = {
  KBANK: "004", KASIKORN: "004",
  SCB: "014", SIAMCOMMERCIAL: "014",
  KTB: "006", KRUNGTHAI: "006",
  BBL: "002", BANGKOKBANK: "002",
  BAY: "025", KRUNGSRI: "025",
  UOB: "024", GSB: "030", GHB: "033", BAAC: "034",
  ธนาคารกสิกรไทย: "004",
  ธนาคารไทยพาณิชย์: "014",
  ธนาคารกรุงเทพ: "002",
  ธนาคารกรุงไทย: "006",
  ธนาคารกรุงศรี: "025",
  ธนาคารประเทศจีน: "052",
};

function normalizeCode(raw?: string) {
  if (!raw) return "";
  const first = String(raw).trim().split(/[^\p{L}\p{N}]+/u)[0] || "";
  return first.toUpperCase();
}
function getBankMetaSmart(bank_code?: string) {
  if (!bank_code) return null;
  const byCode = listBank.find(b => b.value === bank_code);
  if (byCode) return byCode;
  const norm = normalizeCode(bank_code);
  if (BANK_ALIAS[norm]) {
    const viaAlias = listBank.find(b => b.value === BANK_ALIAS[norm]);
    if (viaAlias) return viaAlias;
  }
  const byLabel = listBank.find(b => b.label === bank_code);
  if (byLabel) return byLabel;
  const byNorm = listBank.find(b => normalizeCode(b.label) === norm);
  if (byNorm) return byNorm;
  return null;
}

// 🔒 มาส์กเลขบัญชี: โชว์ท้าย 4 ตัว
const mask = (s?: string) => {
  const d = String(s || "").replace(/\D/g, "");
  if (!d) return "-";
  if (d.length <= 4) return d;
  return "xxxx-xxxx-" + d.slice(-4);
};

export default function BankList() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useBanksMine();
  const deleteMut = useDeleteBank();

  const [username, setUsername] = React.useState("User");
  React.useEffect(() => {
    (async () => {
      const auth = await getStoredAuth();
      if (auth?.user?.name_th) setUsername(auth.user.name_th);
      else if (auth?.user?.username) setUsername(auth.user.username);
    })();
  }, []);

  // ✅ state สำหรับ DeleteAlert
  const [deleteTarget, setDeleteTarget] = React.useState<{
    id: number;
    subtitle: string;
  } | null>(null);
  const openDelete = (item: any) => {
    const isPP = item.account_type === "PROMPTPAY" || item.bank_code === "PROMPTPAY";
    const meta = isPP ? null : getBankMetaSmart(item.bank_code);
    const name = isPP
      ? (item.prompt_pay_type === "MSISDN" ? "PromptPay (เบอร์โทร)"
        : item.prompt_pay_type === "NATID" ? "PromptPay (เลขบัตร)"
        : item.prompt_pay_type === "EWALLETID" ? "PromptPay (e-Wallet ID)" : "PromptPay")
      : (meta?.label ?? item.bank_code ?? "ธนาคาร");
    const sub = `${name} • ${mask(item.account_no)}`;
    setDeleteTarget({ id: Number(item.id), subtitle: sub });
  };
  const closeDelete = () => setDeleteTarget(null);

  // ─── renderItem ────────────────────────────────────────
  const renderItem = ({ item }: any) => {
    const isPromptPay = item.account_type === "PROMPTPAY" || item.bank_code === "PROMPTPAY";

    if (isPromptPay) {
      const ppIcon = "https://upload.wikimedia.org/wikipedia/commons/2/2b/PromptPay_Logo.png";
      const ppTypeLabel =
        item.prompt_pay_type === "MSISDN"
          ? "PromptPay - เบอร์โทร"
          : item.prompt_pay_type === "NATID"
          ? "PromptPay - เลขบัตรประชาชน"
          : item.prompt_pay_type === "EWALLETID"
          ? "PromptPay - e-Wallet ID"
          : "PromptPay";

      return (
        <View style={{ paddingHorizontal: 16 }}>
          <SectionCard>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Image source={{ uri: ppIcon }} style={styles.logo} resizeMode="contain" />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: "#64748B" }}>บัญชี</Text>
                <Text style={{ fontWeight: "700" }}>{ppTypeLabel}</Text>
                <View style={{ height: 8 }} />
                <Text>{item.name_th || item.name_en}</Text>
                <Text style={{ letterSpacing: 1 }}>{item.account_no}</Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({ pathname: "/(tabs)/banks/editBank", params: { id: item.id } })
                  }
                  style={styles.iconBtn}
                  accessibilityLabel="แก้ไขบัญชี"
                >
                  <Ionicons name="create-outline" size={16} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openDelete(item)}   // ✅ ใช้ DeleteAlert
                  style={styles.iconBtn}
                  accessibilityLabel="ลบบัญชี"
                >
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          </SectionCard>
        </View>
      );
    }

    // ธนาคารปกติ
    const meta = getBankMetaSmart(item.bank_code);
    const bankLabel = meta?.label ?? item.bank_code ?? "ไม่ทราบธนาคาร";
    const bankLogo =
      meta?.imageUrl ?? "https://cdn-icons-png.flaticon.com/512/3135/3135673.png";

    return (
      <View style={{ paddingHorizontal: 16 }}>
        <SectionCard>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {/* โลโก้ธนาคาร */}
            <Image source={{ uri: bankLogo }} style={styles.logo} resizeMode="contain" />

            {/* ข้อมูลบัญชี */}
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: "#64748B" }}>บัญชี</Text>
              <Text style={{ fontWeight: "700" }}>{bankLabel}</Text>
              <View style={{ height: 8 }} />
              <Text>{item.name_th || item.name_en}</Text>
              <Text style={{ letterSpacing: 1 }}>{item.account_no}</Text>
            </View>

            {/* ปุ่มแก้ไข + ลบ */}
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
              <TouchableOpacity
                onPress={() =>
                  router.push({ pathname: "/(tabs)/banks/editBank", params: { id: item.id } })
                }
                style={styles.iconBtn}
                accessibilityLabel="แก้ไขบัญชี"
              >
                <Ionicons name="create-outline" size={16} color="#2563EB" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => openDelete(item)}   // ✅ ใช้ DeleteAlert
                style={styles.iconBtn}
                accessibilityLabel="ลบบัญชี"
              >
                <Ionicons name="trash-outline" size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        </SectionCard>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>กำลังโหลดบัญชี...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text>โหลดข้อมูลไม่สำเร็จ</Text>
        <TouchableOpacity onPress={refetch}>
          <Text style={{ color: "#2563EB", marginTop: 8 }}>ลองใหม่</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <FlatList
        style={{ flex: 1, backgroundColor: "#F6F8FB" }}
        contentContainerStyle={{ paddingBottom: 96 }}
        data={data ?? []}
        keyExtractor={(it) => String(it.id)}
        ListHeaderComponent={
          <>
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
            <View style={styles.panel}>
              <View style={{ flexDirection: "row", alignItems: "center", paddingBottom: 8 }}>
                <Text style={styles.title}>บัญชีรับเงินร้านค้า</Text>
                <View style={{ flex: 1 }} />
                <Link href="/(tabs)/banks/addBank" asChild>
                  <TouchableOpacity style={styles.fabSmall} accessibilityLabel="เพิ่มบัญชี">
                    <Ionicons name="add" size={22} color="#fff" />
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </>
        }
        renderItem={renderItem}
        ListFooterComponent={<View style={{ height: 16 }} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text>ยังไม่มีบัญชีธนาคาร</Text>
          </View>
        }
      />

      {/* ✅ DeleteAlert สำหรับยืนยันลบ + แสดง "ลบสำเร็จ" */}
      <DeleteAlert
        visible={!!deleteTarget}
        title="ลบบัญชีนี้"
        subtitle={deleteTarget?.subtitle ?? "ยืนยันการลบบัญชีนี้"}
        confirmLabel="ยืนยัน"
        cancelLabel="ยกเลิก"
        onCancel={closeDelete}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMut.mutateAsync(deleteTarget.id);
        }}
        onDone={async () => {
          closeDelete();
          await refetch();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  panel: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  title: { fontSize: 26, fontWeight: "800" },
  fabSmall: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtn: {
    height: 28,
    width: 28,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
});
