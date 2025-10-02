// app/(tabs)/report.tsx
import * as React from "react";
import { View, ScrollView, Text, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import GradientHeader from "../../Modal/components/ui/GradientHeader";
import SectionCard from "../../Modal/components/ui/SectionCard";
import StatCard from "../../Modal/components/ui/StatCard";
import ProgressBar from "../../Modal/components/ui/ProgressBar";
import PrimaryButton from "../../Modal/components/ui/PrimaryButton";

export default function Report() {
  // mock data
  const totalAll = 10;
  const totalValid = 10;
  const totalInvalid = 10;

  const quotaMax = 100;
  const quotaUsed = 50;
  const expireText = "หมดอายุ 3 ก.ย. 2025";

  return (
    <ScrollView
      style={{
        flex: 1, 
        backgroundColor: "#F6F8FB",
        }}
      contentContainerStyle={{ paddingBottom: 96 }} // กันแท็บบัง
    >
      {/* Header gradient (โลโก้ + Hi,Yada) */}
  <GradientHeader
  right={
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Ionicons name="search" size={18} color="#EAF4FF" />

      {/* Hi, Yada กดได้ → ไปหน้า profile */}
      <Link href="/(tabs)/profile" asChild>
        <TouchableOpacity>
          <Text style={{ color: "#EAF4FF" }}>Hi, Yada</Text>
        </TouchableOpacity>
      </Link>
    </View>
  }
/>

{/* ==== แผงพื้นหลังโค้ง (panel) ใต้ header ==== */}
<View
  style={{
    backgroundColor: "#F6F8FB",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,          // ดึงขึ้นทับใต้หัว (ปรับ -12 ถึง -24 ตามชอบ)
    paddingTop: 24,
    paddingHorizontal: 16,
    
  }}
>
  {/* แถว 'รายงาน' + ช่องเวลา + ปุ่มค้นหา */}
  <View
    style={{
      backgroundColor: "#fff",
      borderRadius: 18,
      padding: 14,
      
      borderWidth: 1,
      borderColor: "#EEF2F7",
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "800", flex: 1 }}>รายงาน</Text>

      <View
        style={{
          height: 36, width: 130, borderRadius: 10,
          backgroundColor: "#F1F5F9", marginRight: 8,
          borderWidth: 1, borderColor: "#E5E7EB",
          justifyContent: "center", paddingHorizontal: 10,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="calendar-outline" size={16} color="#475569" />
          <Text style={{ color: "#64748B", fontSize: 12 }}>เลือกช่วงเวลา</Text>
        </View>
      </View>

      <Link href="/(tabs)/history" asChild>
        <TouchableOpacity
          style={{
            height: 36, width: 40, borderRadius: 10,
            backgroundColor: "#0A57FF", alignItems: "center", justifyContent: "center",
          }}
        >
          <Ionicons name="search" size={18} color="#fff" />
        </TouchableOpacity>
      </Link>
    </View>
  </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 12 }}>
        {/* การ์ดใหญ่: สลิปที่ตรวจสอบทั้งหมด */}
        <SectionCard>
          {/* หัวข้อกลางฟ้า */}
          <Text
            style={{
              color: "#0A57FF",
              fontWeight: "800",
              textAlign: "center",
              marginBottom: 6,
            }}
          >
            สลิปที่ตรวจสอบทั้งหมด
          </Text>

          {/* ตัวเลขใหญ่กลาง */}
          <Text style={{ fontSize: 36, fontWeight: "800", textAlign: "center" }}>
            {totalAll}
          </Text>

          {/* ปุ่มดาวน์โหลดไฟล์ */}
          <View style={{ marginTop: 10 }}>
            <PrimaryButton title="ดาวน์โหลดไฟล์" onPress={() => {}} />
          </View>
        </SectionCard>

        {/* สถิติ 2 ใบ + % ใต้การ์ด */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <StatCard
              label="สลิปที่ถูกต้อง"
              value={String(totalValid)}
              icon={<Ionicons name="checkmark-circle" size={18} color="#16A34A" />}
            />
            <Text
              style={{
                fontSize: 12,
                color: "#94A3B8",
                textAlign: "center",
                marginTop: 6,
              }}
            >
              10.0 % ของสลิปทั้งหมด
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <StatCard
              label="สลิปที่ไม่ถูกต้อง"
              value={String(totalInvalid)}
              icon={<Ionicons name="close-circle" size={18} color="#DC2626" />}
            />
            <Text
              style={{
                fontSize: 12,
                color: "#94A3B8",
                textAlign: "center",
                marginTop: 6,
              }}
            >
              10.0 % ของสลิปทั้งหมด
            </Text>
          </View>
        </View>

        {/* การใช้งานแพ็กเกจ */}
        <SectionCard>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontWeight: "700" }}>การใช้งาน</Text>
            <View style={{ flex: 1 }} />
            <Text style={{ color: "#0A57FF", fontWeight: "700" }}>
              {quotaUsed} / {quotaMax}
            </Text>
          </View>

          <ProgressBar value={quotaUsed} max={quotaMax} />
          <Text style={{ marginTop: 8, color: "#64748B", fontSize: 12 }}>
            แพ็กเกจ : <Text style={{ fontWeight: "700" }}>free trail</Text>
          </Text>
          <Text style={{ color: "#64748B", fontSize: 12 }}>วันหมดอายุ : {expireText}</Text>
        </SectionCard>
      </View>
    </ScrollView>
  );
}
