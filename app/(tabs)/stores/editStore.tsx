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
import { useQueryClient } from "@tanstack/react-query";

import GradientHeader from "../../../Modal/components/ui/GradientHeader";
import SectionCard from "../../../Modal/components/ui/SectionCard";
import PrimaryButton from "../../../Modal/components/ui/PrimaryButton";

import { useLocalAuthQuery } from "../../../lib/authService";
import { useStores, type StoreBranch } from "../../../lib/service/storeService";
import { useBanksMine } from "../../../lib/hooks/useBank";
import type { BankItem } from "../../../lib/hooks/useBank";
import { API_BASE } from "../../../lib/http";

export default function EditStore() {
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  // ผู้ใช้
  const { data: auth } = useLocalAuthQuery();
  const displayName =
    auth?.user?.name_th || auth?.user?.username || auth?.user?.email || "ผู้ใช้งาน";

  // โหลดรายการสาขาและหา current
  const { data: list = [], isLoading: isLoadingStores } = useStores();
  const current = React.useMemo<StoreBranch | undefined>(
    () => list.find((x) => x.id === String(id)),
    [list, id]
  );

  // ฟอร์ม state (prefill จาก current)
  const [branchName, setBranchName] = React.useState("");
  const [showRules, setShowRules] = React.useState(true);
  const [minAmount, setMinAmount] = React.useState<number>(0);
  const [hideSenderAcc, setHideSenderAcc] = React.useState(false);
  const [hideReceiverAcc, setHideReceiverAcc] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!current) return;
    setBranchName(current.name ?? "");
    setMinAmount(Number(current.minAmount ?? 0));
    setHideSenderAcc(!!current.hideSenderAcc);
    setHideReceiverAcc(!!current.hideReceiverAcc);
  }, [current?.id]);

  // บัญชีธนาคารของผู้ใช้
  const { data: bankList = [], isLoading: isLoadingBanks, isError: isBankError, refetch: refetchBanks } = useBanksMine();

  type LinkedAccount = { id: number; bank: string; number: string; enabled: boolean };
  const [linked, setLinked] = React.useState<LinkedAccount[]>([]);

  // map bank list -> linked พร้อมสถานะเลือกจาก current.bankIds
  React.useEffect(() => {
    const selected = new Set((current?.bankIds ?? []).map((n) => Number(n)));
    const arr: BankItem[] = Array.isArray(bankList) ? (bankList as BankItem[]) : [];
    const mapped: LinkedAccount[] = arr.map((b) => ({
      id: Number(b.id),
      bank: b.name_th || b.name_en || b.bank_code || "ธนาคาร",
      number: String(b.account_no || ''),
      enabled: selected.has(Number(b.id)),
    }));
    setLinked(mapped);
  }, [bankList, current?.id]);

  const toggleLinked = (id: number) =>
    setLinked((prev) => prev.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)));

  const plus = () => setMinAmount((v) => Math.min(999999, v + 1));
  const minus = () => setMinAmount((v) => Math.max(0, v - 1));

  const onSubmit = async () => {
    if (!branchName.trim()) {
      Alert.alert("กรอกข้อมูลไม่ครบ", "โปรดระบุชื่อสาขาร้านค้า");
      return;
    }
    const userId = Number(auth?.user?.id ?? 0);
    if (!userId || !id) {
      Alert.alert("ไม่สามารถบันทึกได้", "กรุณาเข้าสู่ระบบและลองใหม่");
      return;
    }
    const selectedIds = linked.filter((x) => x.enabled).map((x) => x.id);

    setIsSaving(true);
    try {
      const url = `${API_BASE}/room2/update`;
      const headers = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        apikey: String((auth as any)?.token ?? ''),
      } as const;
      const body = {
        id: Number(id),
        user_id: userId,
        room_name: branchName.trim(),
        min_amount_receive: Number(minAmount || 0),
        hide_sender_detail: hideSenderAcc,
        hide_receiver_detail: hideReceiverAcc,
        list_bank: JSON.stringify(selectedIds),
      };
      const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
      const data = await safeParse<any>(res);
      if (data?.message === 'Success') {
        qc.invalidateQueries({ queryKey: ["stores"] });
        const showList =
          selectedIds.length === 0
            ? "-"
            : linked
                .filter((x) => selectedIds.includes(x.id))
                .map((x) => x.number)
                .join(", ");
        Alert.alert(
          "บันทึกสำเร็จ",
          `ชื่อสาขา: ${branchName}\nบัญชีที่เชื่อมต่อ: ${showList}\nเตือนขั้นต่ำ: ${minAmount}`,
          [{ text: "ตกลง", onPress: () => router.back() }]
        );
      } else {
        Alert.alert("บันทึกไม่สำเร็จ", data?.message || 'กรุณาลองใหม่');
      }
    } catch (e: any) {
      Alert.alert("บันทึกไม่สำเร็จ", e?.message ?? 'Internal Processing Error');
    } finally {
      setIsSaving(false);
    }
  };

  // UI เดิม: ใช้ SectionCard / PrimaryButton และโครงแบบเดียวกับ addStore
  return (
    <View style={{ flex: 1, backgroundColor: "#F6F8FB" }}>
      <GradientHeader
        right={
          <Link href="/(tabs)/profile" asChild>
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialCommunityIcons name="storefront-outline" size={18} color="#EAF4FF" />
              <Text style={{ color: "#EAF4FF" }}>{displayName}</Text>
            </TouchableOpacity>
          </Link>
        }
      />

      <View style={styles.panel}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color="#111827" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.h1}>แก้ไขสาขา</Text>

          <SectionCard>
            <Text style={styles.groupTitle}>ชื่อสาขา</Text>
            <Text style={styles.helper}>ปรับชื่อเพื่อใช้งานภายในระบบ</Text>
            <TextInput
              style={styles.input}
              placeholder="เช่น สาขาแรก หรือ สาขาหลัก"
              value={branchName}
              onChangeText={setBranchName}
            />

            {/* บัญชีรับเงินที่เชื่อมต่อ (จริง) */}
            <Text style={[styles.groupTitle, { marginTop: 12 }]}>บัญชีรับเงินที่เชื่อมต่อ</Text>

            {isLoadingBanks && (
              <View style={{ paddingVertical: 10 }}>
                <ActivityIndicator />
                <Text style={{ color: "#64748B", marginTop: 6 }}>กำลังโหลดบัญชีธนาคาร...</Text>
              </View>
            )}

            {isBankError && (
              <View style={{ paddingVertical: 10 }}>
                <Text style={{ color: "#DC2626" }}>โหลดบัญชีธนาคารไม่สำเร็จ</Text>
                <TouchableOpacity onPress={refetchBanks}>
                  <Text style={{ color: "#0A57FF", marginTop: 4 }}>ลองใหม่</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isLoadingBanks && !isBankError && linked.length === 0 && (
              <Text style={{ color: "#64748B" }}>ยังไม่มีบัญชีที่เชื่อมต่อ</Text>
            )}

            {!isLoadingBanks &&
              !isBankError &&
              linked.map((a) => (
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
            title={isSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            onPress={onSubmit}
            disabled={isSaving}
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

async function safeParse<T>(res: Response): Promise<T | null> {
  try {
    const text = await res.text();
    if (!text) return null as any;
    return JSON.parse(text) as T;
  } catch {
    return null as any;
  }
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
