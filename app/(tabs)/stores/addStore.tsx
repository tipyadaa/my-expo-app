// app/(tabs)/stores/addStore.tsx
import * as React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";

import GradientHeader from "../../../Modal/components/ui/GradientHeader";
import SectionCard from "../../../Modal/components/ui/SectionCard";
import PrimaryButton from "../../../Modal/components/ui/PrimaryButton";

import {
  useCreateStore,
  type StoreBranch,
} from "../../../lib/service/storeService";
import { getJSON } from "../../../lib/storage";

type LinkedAccount = { id: string; bank: string; number: string; enabled: boolean };

export default function AddStore() {
  const router = useRouter();

  // ── โหลด userId จาก AsyncStorage ─────────────────────────────
  // คาดหวังเก็บไว้ที่ key: "app.user" เป็น { id: number, ... }
  const [userId, setUserId] = React.useState<number | null>(null);
  const [loadingUser, setLoadingUser] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const user = await getJSON<{ id?: number }>("app.user", {});
        if (typeof user?.id === "number" && user.id > 0) {
          setUserId(user.id);
        } else {
          console.warn("[AddStore] ⚠️ ไม่พบ app.user.id ใน storage — fallback 1 ชั่วคราว");
          setUserId(1); // TODO: ให้ auth เก็บ user.id ที่ถูกต้อง แล้วลบบรรทัดนี้
        }
      } catch (e) {
        console.warn("[AddStore] อ่าน userId ไม่ได้:", e);
        setUserId(1); // fallback
      } finally {
        setLoadingUser(false);
      }
    })();
  }, []);

  // ใช้ hook สำหรับสร้าง (ผูกกับ userId)
  const { mutate: createMutate, isPending: isCreating } = useCreateStore(userId ?? undefined);

  // ── form state ────────────────────────────────────────────────
  const [branchName, setBranchName] = React.useState("");
  const [linked, setLinked] = React.useState<LinkedAccount[]>([
    // เดโม่ UI – ยังไม่ผูกกับ backend บัญชีธนาคารในหน้านี้
    { id: "a1", bank: "แอนด์ แอนด์", number: "4327999134", enabled: true },
    { id: "a2", bank: "แอนด์ แอนด์", number: "1115356122", enabled: false },
  ]);
  const [showRules, setShowRules] = React.useState(true);
  const [minAmount, setMinAmount] = React.useState<number>(80);
  const [hideSenderAcc, setHideSenderAcc] = React.useState(false);
  const [hideReceiverAcc, setHideReceiverAcc] = React.useState(false);

  const toggleLinked = (id: string) =>
    setLinked((prev) => prev.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)));

  const plus = () => setMinAmount((v) => Math.min(999999, v + 1));
  const minus = () => setMinAmount((v) => Math.max(0, v - 1));

  const onSubmit = () => {
    if (!branchName.trim()) {
      Alert.alert("กรอกข้อมูลไม่ครบ", "โปรดระบุชื่อสาขาร้านค้า");
      return;
    }
    if (!userId || userId <= 0) {
      Alert.alert("ไม่พบผู้ใช้", "ไม่สามารถระบุผู้ใช้สำหรับสร้างสาขาได้");
      return;
    }

    // payload สำหรับ service (service จะ map เป็น body ของ /room2/create)
    const payload: Omit<StoreBranch, "id"> = {
      name: branchName.trim(),
      status: "ยังไม่ได้เชื่อมต่อ", // เริ่มต้นยังไม่เชื่อมต่อ (line_group_id = "")
      code: "",                      // ถ้ายังไม่มี QRToken ให้เว้นว่างได้
      minAmount,
      hideSenderAcc,
      hideReceiverAcc,
    };

    console.log("[AddStore] userId =", userId, "payload =", payload);

    createMutate(payload, {
      onSuccess: () => {
        const enabled = linked.filter((x) => x.enabled).map((x) => x.number);
        Alert.alert(
          "สร้างสาขาสำเร็จ",
          `ชื่อสาขา: ${branchName}\nบัญชีที่เชื่อมต่อ: ${enabled.join(", ") || "-"}\nเตือนขั้นต่ำ: ${minAmount}`,
          [{ text: "ตกลง", onPress: () => router.back() }]
        );
      },
      onError: (e: any) => {
        Alert.alert("สร้างสาขาไม่สำเร็จ", e?.message ?? "Internal Processing Error");
      },
    });
  };

  // แสดงโหลดระหว่างดึง userId
  if (loadingUser) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: "#64748B" }}>กำลังเตรียมข้อมูลผู้ใช้...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F6F8FB" }}>
      {/* Gradient header (โปรไฟล์ด้านขวา) */}
      <GradientHeader
        right={
          <Link href="/(tabs)/profile" asChild>
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialCommunityIcons name="storefront-outline" size={18} color="#EAF4FF" />
              <Text style={{ color: "#EAF4FF" }}>Hi, Yada</Text>
            </TouchableOpacity>
          </Link>
        }
      />

      {/* Panel ขาวโค้ง + ปุ่มปิด X */}
      <View style={styles.panel}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#111827" />
        </TouchableOpacity>

        {/* หัวเรื่อง + ไอคอนร้าน */}
        <Text style={styles.h1}>สร้างสาขาร้านค้า</Text>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="storefront-outline" size={36} color="#10B981" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <SectionCard>
            {/* กล่อง: ชื่อสาขา */}
            <Text style={styles.groupTitle}>ชื่อสาขาร้านค้า</Text>
            <TextInput
              style={styles.input}
              placeholder="ชื่อสาขา"
              value={branchName}
              onChangeText={setBranchName}
            />

            {/* กล่อง: บัญชีรับเงินที่เชื่อมต่อ (เดโม่ UI) */}
            <Text style={[styles.groupTitle, { marginTop: 12 }]}>บัญชีรับเงินที่เชื่อมต่อ</Text>
            {linked.map((a) => (
              <View key={a.id} style={styles.rowBetween}>
                <View>
                  <Text style={{ fontWeight: "700" }}>{a.bank}</Text>
                  <Text style={{ color: "#64748B" }}>{a.number}</Text>
                </View>
                <Switch
                  value={a.enabled}
                  onValueChange={() => toggleLinked(a.id)}
                  trackColor={{ false: "#CBD5E1", true: "#93C5FD" }}
                  thumbColor={a.enabled ? "#2563EB" : "#f4f3f4"}
                />
              </View>
            ))}

            {/* กล่อง: ตั้งค่าระบบการตรวจสอบ */}
            <TouchableOpacity style={styles.accordionHead} onPress={() => setShowRules((s) => !s)}>
              <Text style={styles.groupTitle}>ตั้งค่าระบบการตรวจสอบ</Text>
              <Ionicons name={showRules ? "chevron-up" : "chevron-down"} size={18} color="#64748B" />
            </TouchableOpacity>

            {showRules && (
              <View style={{ marginTop: 6 }}>
                {/* เตือนยอดขั้นต่ำ + stepper */}
                <Text style={styles.helper}>เตือน ยอดเงินขั้นต่ำ *</Text>
                <View style={styles.stepper}>
                  <TextInput
                    style={{ flex: 1, paddingHorizontal: 12 }}
                    keyboardType="number-pad"
                    value={String(minAmount)}
                    onChangeText={(t) => setMinAmount(Number(t.replace(/\D/g, "")) || 0)}
                    placeholder="0"
                  />
                  <TouchableOpacity style={styles.stepBtn} onPress={minus}>
                    <Ionicons name="remove" size={16} color="#111827" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.stepBtn} onPress={plus}>
                    <Ionicons name="add" size={16} color="#111827" />
                  </TouchableOpacity>
                </View>

                {/* switches */}
                <View style={styles.rowBetween}>
                  <Text style={{ color: "#0F172A" }}>ซ่อนเลขบัญชีผู้โอน</Text>
                  <Switch
                    value={hideSenderAcc}
                    onValueChange={setHideSenderAcc}
                    trackColor={{ false: "#CBD5E1", true: "#93C5FD" }}
                    thumbColor={hideSenderAcc ? "#2563EB" : "#f4f3f4"}
                  />
                </View>
                <View style={styles.rowBetween}>
                  <Text style={{ color: "#0F172A" }}>ซ่อนเลขบัญชีผู้รับ</Text>
                  <Switch
                    value={hideReceiverAcc}
                    onValueChange={setHideReceiverAcc}
                    trackColor={{ false: "#CBD5E1", true: "#93C5FD" }}
                    thumbColor={hideReceiverAcc ? "#2563EB" : "#f4f3f4"}
                  />
                </View>
              </View>
            )}
          </SectionCard>

          <View style={{ height: 12 }} />
          <PrimaryButton
            title={isCreating ? "กำลังสร้าง..." : "สร้างสาขา"}
            onPress={onSubmit}
            disabled={isCreating}
          />
          {isCreating && (
            <View style={{ marginTop: 8, alignItems: "center" }}>
              <ActivityIndicator />
              <Text style={{ marginTop: 6, color: "#64748B" }}>กำลังส่งข้อมูล...</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 14,
    zIndex: 10,
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  h1: { fontSize: 22, fontWeight: "800", paddingRight: 40 },
  iconWrap: {
    alignSelf: "center",
    marginVertical: 10,
    height: 64,
    width: 64,
    borderRadius: 12,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },

  groupTitle: { fontWeight: "700", marginBottom: 6 },
  helper: { color: "#64748B", marginBottom: 6 },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  accordionHead: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowBetween: {
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  stepper: {
    height: 44,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stepBtn: {
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderColor: "#E2E8F0",
  },
});
