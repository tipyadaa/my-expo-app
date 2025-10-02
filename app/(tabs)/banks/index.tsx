import * as React from "react";
import { useState, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import GradientHeader from "../../../Modal/components/ui/GradientHeader";
import SectionCard from "../../../Modal/components/ui/SectionCard";

// ── mock data แทนฐานข้อมูล ────────────────────────────────────────────────
export type BankRow = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
};

const MOCK: BankRow[] = [
  { id: "1", bankName: "ธนาคารกรุงเทพ", accountName: "นาย ซี ทะเล", accountNumber: "xxxx-xxxxx-xxxxx" },
  { id: "2", bankName: "ธนาคารกสิกรไทย", accountName: "นาย ซี ทะเล", accountNumber: "xxxx-xxxxx-xxxxx" },
  { id: "3", bankName: "ธนาคารกรุงไทย", accountName: "นาย ซี ทะเล", accountNumber: "xxxx-xxxxx-xxxxx" },
];

export default function BankList() {
  const [items, setItems] = useState<BankRow[]>(MOCK);
  const router = useRouter();

 // ภายใน renderItem ของ index.tsx

const renderItem = ({ item }: { item: BankRow }) => (
<View style={{ padding:0,paddingHorizontal: 16}}>
  <SectionCard>
    <View style={{ flexDirection: "row", gap: 12 }}>
      {/* avatar */}
      <View style={styles.avatar} />

      {/* ข้อมูลบัญชี */}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: "#64748B" }}>บัญชี</Text>
        <Text style={{ fontWeight: "700" }}>{item.bankName}</Text>
        <View style={{ height: 8 }} />
        <Text>{item.accountName}</Text>
        <Text style={{ letterSpacing: 1 }}>{item.accountNumber}</Text>
      </View>

      {/* ปุ่มแก้ไข + ลบ (แนวนอน) */}
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
          onPress={() => confirmDelete(item.id)}
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



  function confirmDelete(id: string) {
    Alert.alert("ยืนยันการลบ", "คุณต้องการลบบัญชีนี้หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: () => setItems((prev) => prev.filter((x) => x.id !== id)),
      },
    ]);
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: "#F6F8FB" }}
      contentContainerStyle={{ paddingBottom: 96 }}
      data={items}
      keyExtractor={(it) => it.id}
      ListHeaderComponent={
        <>
<GradientHeader
  right={
    <Link href="/(tabs)/profile" asChild>
      <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name="storefront-outline" size={18} color="#EAF4FF" />
        <Text style={{ color: "#EAF4FF" }}>Hi, Yada</Text>
      </TouchableOpacity>
    </Link>
  }
/>

          {/* แผงพื้นหลังโค้ง + หัวเรื่อง + ปุ่มเพิ่ม */}
          <View style={styles.panel}>
            <View style={{ flexDirection: "row", alignItems: "center" ,paddingBottom:8}}>
              <Text style={styles.title }>บัญชีรับเงินร้านค้า</Text>

              <View style={{ flex: 1 }} />

              <Link href="/(tabs)/banks/addBank" asChild>
                <TouchableOpacity style={styles.fabSmall} accessibilityLabel="เพิ่มบัญชี">
                  <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
              </Link>
            </View>

            <View style={{ height: 8 }} />
          </View>
        </>
      }
      renderItem={renderItem}
      ListFooterComponent={<View style={{ height: 16 }} />}
    />
  );
}

const styles = StyleSheet.create({
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E5E7EB",
  },
  iconBtn: {
    height: 28,
    width: 28,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
});
