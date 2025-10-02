// components/BankAccountCard.tsx
import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  bankName: string;           // ชื่อธนาคาร
  accountNumber: string;      // เลขบัญชี (อาจ mask ได้)
  holderName: string;         // ชื่อผู้ถือบัญชี
  onPress?: () => void;       // เวลากดการ์ด
};

export default function BankAccountCard({ bankName, accountNumber, holderName, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      {/* โลโก้ธนาคารหรือไอคอน */}
      <View style={styles.iconWrap}>
        <Ionicons name="card-outline" size={20} color="#0A57FF" />
      </View>

      {/* เนื้อหาบัญชี */}
      <View style={{ flex: 1 }}>
        <Text style={styles.bankName}>{bankName}</Text>
        <Text style={styles.account}>{accountNumber}</Text>
        <Text style={styles.holder}>{holderName}</Text>
      </View>

      {/* ไอคอนลูกศร */}
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E6F0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  bankName: {
    fontWeight: "700",
    fontSize: 14,
  },
  account: {
    fontSize: 13,
    color: "#374151",
  },
  holder: {
    fontSize: 12,
    color: "#6B7280",
  },
});
