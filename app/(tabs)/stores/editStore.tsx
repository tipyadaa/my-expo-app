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
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";

import GradientHeader from "../../../Modal/components/ui/GradientHeader";
import SectionCard from "../../../Modal/components/ui/SectionCard";
import PrimaryButton from "../../../Modal/components/ui/PrimaryButton";

type LinkedAccount = { id: string; bank: string; number: string; enabled: boolean };

// mock DB สำหรับเดโม่
const MOCK: Record<string, { name: string; linked: LinkedAccount[]; min: number; hideS: boolean; hideR: boolean }> = {
  "1": {
    name: "สาขาเชียงใหม่",
    linked: [
      { id: "a1", bank: "แอนด์ แอนด์", number: "4327999134", enabled: true },
      { id: "a2", bank: "แอนด์ แอนด์", number: "1115356122", enabled: true },
    ],
    min: 80,
    hideS: false,
    hideR: false,
  },
};

export default function EditStore() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [branchName, setBranchName] = React.useState("");
  const [linked, setLinked] = React.useState<LinkedAccount[]>([]);
  const [showRules, setShowRules] = React.useState(true);
  const [minAmount, setMinAmount] = React.useState<number>(80);
  const [hideSenderAcc, setHideSenderAcc] = React.useState(false);
  const [hideReceiverAcc, setHideReceiverAcc] = React.useState(false);

  React.useEffect(() => {
    const row = id ? MOCK[String(id)] : undefined;
    if (row) {
      setBranchName(row.name);
      setLinked(row.linked);
      setMinAmount(row.min);
      setHideSenderAcc(row.hideS);
      setHideReceiverAcc(row.hideR);
    } else {
      // fallback ถ้าไม่มีข้อมูล
      setBranchName("");
      setLinked([
        { id: "a1", bank: "แอนด์ แอนด์", number: "4327999134", enabled: true },
        { id: "a2", bank: "แอนด์ แอนด์", number: "1115356122", enabled: true },
      ]);
    }
  }, [id]);

  const toggleLinked = (lid: string) =>
    setLinked((prev) => prev.map((x) => (x.id === lid ? { ...x, enabled: !x.enabled } : x)));

  const plus = () => setMinAmount((v) => Math.min(999999, v + 1));
  const minus = () => setMinAmount((v) => Math.max(0, v - 1));

  const onSubmit = () => {
    if (!branchName.trim()) {
      Alert.alert("กรอกข้อมูลไม่ครบ", "โปรดระบุชื่อสาขาร้านค้า");
      return;
    }
    Alert.alert("บันทึกสำเร็จ", "แก้ไขสาขาเรียบร้อย", [{ text: "ตกลง", onPress: () => router.back() }]);
  };

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
          <PrimaryButton title="บันทึก" onPress={onSubmit} />
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
