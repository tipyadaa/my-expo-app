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

type LinkedAccount = { id: string; bank: string; number: string; enabled: boolean };

export default function EditStore() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // ดึงรายการห้องทั้งหมด แล้วหาอันที่ id ตรงกับพารามิเตอร์
  const { data: list, isLoading, isError, isFetching, refetch } = useStores();
  const current = React.useMemo(
    () => (list ?? []).find((x) => x.id === String(id)),
    [list, id]
  );

  const { mutate: updateMutate, isPending: isSaving } = useUpdateStore();

  const [branchName, setBranchName] = React.useState("");
  const [linked, setLinked] = React.useState<LinkedAccount[]>([]);
  const [showRules, setShowRules] = React.useState(true);

  // ค่าตั้งค่า (ต้องบันทึก)
  const [minAmount, setMinAmount] = React.useState<number>(80);
  const [hideSenderAcc, setHideSenderAcc] = React.useState(false);
  const [hideReceiverAcc, setHideReceiverAcc] = React.useState(false);

  // เติมค่าจาก backend เมื่อ current เปลี่ยน
  React.useEffect(() => {
    if (!current) return;

    setBranchName(current.name ?? "");
    setLinked([]); // ยังไม่มี endpoint บัญชีเชื่อมต่อในหน้านี้

    // map จาก service: minAmount / hideSenderAcc / hideReceiverAcc
    setMinAmount(typeof current.minAmount === "number" ? current.minAmount : 80);
    setHideSenderAcc(!!current.hideSenderAcc);
    setHideReceiverAcc(!!current.hideReceiverAcc);
  }, [current?.id]);

  const toggleLinked = (lid: string) =>
    setLinked((prev) => prev.map((x) => (x.id === lid ? { ...x, enabled: !x.enabled } : x)));

  const plus = () => setMinAmount((v) => Math.min(999999, v + 1));
  const minus = () => setMinAmount((v) => Math.max(0, v - 1));

  const onSubmit = () => {
    if (!id) {
      Alert.alert("ไม่พบไอดีสาขา");
      return;
    }
    if (!branchName.trim()) {
      Alert.alert("กรอกข้อมูลไม่ครบ", "โปรดระบุชื่อสาขาร้านค้า");
      return;
    }

    // patch ที่ service จะ map เป็น:
    // - minAmount      -> min_receive (number)
    // - hideSenderAcc  -> show_transferor = !hideSenderAcc
    // - hideReceiverAcc-> show_recipient  = !hideReceiverAcc
    const patch: Partial<StoreBranch> = {
      name: branchName.trim(),
      minAmount,
      hideSenderAcc,
      hideReceiverAcc,
    };

    console.log("[EditStore] submit patch:", { id: String(id), ...patch });

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
              <Text style={{ color: "#EAF4FF" }}>Hi, Yada</Text>
            </TouchableOpacity>
          </Link>
        }
      />

      <View style={styles.panel}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.h1}>แก้ไขสาขาร้านค้า</Text>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="storefront-outline" size={36} color="#10B981" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <SectionCard>
            <Text style={styles.groupTitle}>ชื่อสาขาร้านค้า</Text>
            <TextInput
              style={styles.input}
              placeholder="ชื่อสาขา"
              value={branchName}
              onChangeText={setBranchName}
            />

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
            title={isSaving ? "กำลังบันทึก..." : "บันทึก"}
            onPress={onSubmit}
            disabled={isSaving}
          />
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
