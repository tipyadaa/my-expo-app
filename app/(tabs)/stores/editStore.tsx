// app/(tabs)/stores/editStore.tsx
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
import { Link, useLocalSearchParams, useRouter } from "expo-router";

import GradientHeader from "../../../Modal/components/ui/GradientHeader";
import SectionCard from "../../../Modal/components/ui/SectionCard";
import PrimaryButton from "../../../Modal/components/ui/PrimaryButton";

import {
  useStores,
  useUpdateStore,
  type StoreBranch,
} from "../../../lib/service/storeService";
import { useLocalAuthQuery } from "../../../lib/authService";

type LinkedAccount = { id: string; bank: string; number: string; enabled: boolean };

export default function EditStore() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // ชื่อผู้ใช้บนเฮดเดอร์
  const { data: auth } = useLocalAuthQuery();
  const displayName =
    auth?.user?.name_th || auth?.user?.username || auth?.user?.email || "ผู้ใช้งาน";

  // โหลดรายการสาขา แล้วหา item ตาม id
  const { data: list, isLoading, isError, isFetching, refetch } = useStores();
  const current = React.useMemo(
    () => (list ?? []).find((x) => x.id === String(id)),
    [list, id]
  );

  const { mutate: updateMutate, isPending: isSaving } = useUpdateStore();

  // ฟอร์ม state
  const [branchName, setBranchName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [connected, setConnected] = React.useState<boolean>(false);
  const [linked, setLinked] = React.useState<LinkedAccount[]>([]);
  const [showRules, setShowRules] = React.useState(true);
  const [minAmount, setMinAmount] = React.useState<number>(80);
  const [hideSenderAcc, setHideSenderAcc] = React.useState(false);
  const [hideReceiverAcc, setHideReceiverAcc] = React.useState(false);

  // เก็บ snapshot สำหรับเช็ค unsaved changes
  const [initial, setInitial] = React.useState<Partial<StoreBranch> | null>(null);

  // เติมค่าเริ่มจาก backend
  React.useEffect(() => {
    if (!current) return;

    setBranchName(current.name ?? "");
    setCode(current.code ?? "");
    setConnected(current.status === "เชื่อมต่อเรียบร้อย");

    setLinked([]); // ยังไม่ต่อ endpoint บัญชีในหน้านี้
    setMinAmount(typeof current.minAmount === "number" ? current.minAmount : 80);
    setHideSenderAcc(!!current.hideSenderAcc);
    setHideReceiverAcc(!!current.hideReceiverAcc);

    // บันทึก snapshot เทียบตอนเปิดมา
    setInitial({
      name: current.name,
      code: current.code,
      status: current.status,
      minAmount: current.minAmount,
      hideSenderAcc: current.hideSenderAcc,
      hideReceiverAcc: current.hideReceiverAcc,
    });
  }, [current?.id]);

  // helper
  const toggleLinked = (lid: string) =>
    setLinked((prev) => prev.map((x) => (x.id === lid ? { ...x, enabled: !x.enabled } : x)));
  const plus = () => setMinAmount((v) => Math.min(999999, v + 1));
  const minus = () => setMinAmount((v) => Math.max(0, v - 1));

  // สร้าง patch สำหรับส่งอัปเดต
  const buildPatch = (): Partial<StoreBranch> => ({
    name: branchName.trim(),
    code: code.trim(),
    status: connected ? "เชื่อมต่อเรียบร้อย" : "ยังไม่ได้เชื่อมต่อ",
    minAmount,
    hideSenderAcc,
    hideReceiverAcc,
  });

  // ตรวจว่ามีการแก้ไขจาก initial หรือยัง
  const isDirty = React.useMemo(() => {
    if (!initial) return false;
    const a = {
      name: initial.name ?? "",
      code: initial.code ?? "",
      status: initial.status ?? "ยังไม่ได้เชื่อมต่อ",
      minAmount: initial.minAmount ?? 0,
      hideSenderAcc: !!initial.hideSenderAcc,
      hideReceiverAcc: !!initial.hideReceiverAcc,
    };
    const b = {
      name: branchName.trim(),
      code: code.trim(),
      status: connected ? "เชื่อมต่อเรียบร้อย" : "ยังไม่ได้เชื่อมต่อ",
      minAmount,
      hideSenderAcc,
      hideReceiverAcc,
    };
    return JSON.stringify(a) !== JSON.stringify(b);
  }, [
    initial,
    branchName,
    code,
    connected,
    minAmount,
    hideSenderAcc,
    hideReceiverAcc,
  ]);

  const confirmLeaveIfDirty = (onOk: () => void) => {
    if (!isDirty || isSaving) {
      onOk();
      return;
    }
    Alert.alert("ยังไม่ได้บันทึก", "ต้องการออกจากหน้านี้โดยไม่บันทึกหรือไม่?", [
      { text: "อยู่หน้านี้ต่อ", style: "cancel" },
      { text: "ออก", style: "destructive", onPress: onOk },
    ]);
  };

  const onPressClose = () => confirmLeaveIfDirty(() => router.back());

  const onSubmit = () => {
    if (!id) {
      Alert.alert("ไม่พบไอดีสาขา");
      return;
    }
    if (!branchName.trim()) {
      Alert.alert("กรอกข้อมูลไม่ครบ", "โปรดระบุชื่อสาขาร้านค้า");
      return;
    }
    // ความปลอดภัยเล็กน้อย: normalize minAmount
    const safeMin = Number.isFinite(minAmount) ? Math.max(0, Math.min(999999, minAmount)) : 0;

    const patch: Partial<StoreBranch> = {
      ...buildPatch(),
      minAmount: safeMin,
    };

    updateMutate(
      { id: String(id), patch },
      {
        onSuccess: () => {
          Alert.alert("บันทึกสำเร็จ", "แก้ไขสาขาเรียบร้อย", [
            { text: "ตกลง", onPress: () => router.back() },
          ]);
        },
        onError: (e: any) => {
          Alert.alert("บันทึกไม่สำเร็จ", e?.message ?? "เกิดข้อผิดพลาด");
        },
      }
    );
  };

  // Loading / Error states
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
          style={{
            marginTop: 10,
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: "#E2E8F0",
            borderRadius: 8,
          }}
        >
          <Text>ลองอีกครั้ง</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!current) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
        <Text style={{ color: "#64748B" }}>ไม่พบสาขาที่ต้องการแก้ไข</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F6F8FB" }}>
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

      <View style={styles.panel}>
        <TouchableOpacity onPress={onPressClose} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.h1}>แก้ไขสาขาร้านค้า</Text>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="storefront-outline" size={36} color="#10B981" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <SectionCard>
            {/* ชื่อสาขา */}
            <Text style={styles.groupTitle}>ชื่อสาขาร้านค้า</Text>
            <TextInput
              style={styles.input}
              placeholder="ชื่อสาขา"
              value={branchName}
              onChangeText={setBranchName}
            />

            {/* Code (QRToken) */}
            <Text style={[styles.groupTitle, { marginTop: 12 }]}>Code (QR Token)</Text>
            <TextInput
              style={styles.input}
              placeholder="เช่น ABC123XYZ"
              value={code}
              onChangeText={setCode}
              autoCapitalize="none"
            />

            {/* สถานะเชื่อมต่อ */}
            <View style={[styles.rowBetween, { marginTop: 10 }]}>
              <Text style={{ color: "#0F172A" }}>เชื่อมต่อ LINE Group แล้ว</Text>
              <Switch
                value={connected}
                onValueChange={setConnected}
                trackColor={{ false: "#CBD5E1", true: "#93C5FD" }}
                thumbColor={connected ? "#2563EB" : "#f4f3f4"}
              />
            </View>

            {/* บัญชีเชื่อมต่อ (เดโม่) */}
            <Text style={[styles.groupTitle, { marginTop: 12 }]}>บัญชีรับเงินที่เชื่อมต่อ</Text>
            {linked.length === 0 && (
              <Text style={{ color: "#94A3B8", marginBottom: 8 }}>
                ยังไม่มีบัญชีเชื่อมต่อ (เชื่อมต่อได้ในหน้าจัดการบัญชี)
              </Text>
            )}
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

            {/* ตั้งค่าระบบการตรวจสอบ */}
            <TouchableOpacity style={styles.accordionHead} onPress={() => setShowRules((s) => !s)}>
              <Text style={styles.groupTitle}>ตั้งค่าระบบการตรวจสอบ</Text>
              <Ionicons name={showRules ? "chevron-up" : "chevron-down"} size={18} color="#64748B" />
            </TouchableOpacity>

            {showRules && (
              <View style={{ marginTop: 6 }}>
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
            title={isSaving ? "กำลังบันทึก..." : isDirty ? "บันทึก" : "ไม่มีการเปลี่ยนแปลง"}
            onPress={onSubmit}
            disabled={isSaving || !isDirty}
          />
          {isSaving && (
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
