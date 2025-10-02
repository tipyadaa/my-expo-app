import * as React from "react";
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Modal, Pressable, Alert, ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import GradientHeader from "../../../Modal/components/ui/GradientHeader";
import PrimaryButton from "../../../Modal/components/ui/PrimaryButton";

type TabType = "bank" | "promptpay";
type PPayType = "phone" | "cid";

type AccountRow =
  | { id:string; type:"bank"; bankName:string; accountNo:string; accNameTH:string; accNameEN?:string }
  | { id:string; type:"promptpay"; ppType:PPayType; ppValue:string; accNameTH:string; accNameEN?:string };

const MOCK_DB: Record<string, AccountRow> = {
  "1": { id:"1", type:"bank", bankName:"ธนาคารกรุงเทพ", accountNo:"1234567890", accNameTH:"นาย ซี ทะเล", accNameEN:"Mr. Sea Thale" },
  "2": { id:"2", type:"promptpay", ppType:"phone", ppValue:"0891234567", accNameTH:"น.ส. ฟ้า ทะเล", accNameEN:"Ms. Fah Thale" },
};

const BANKS = ["ธนาคารกรุงเทพ","ธนาคารกสิกรไทย","ธนาคารกรุงไทย","ธนาคารไทยพาณิชย์","ธนาคารกรุงศรีอยุธยา","พร้อมเพย์ (บัญชีบุคคล)"];

export default function EditBank() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [tab, setTab] = React.useState<TabType>("bank");

  // bank
  const [bankName, setBankName] = React.useState("");
  const [bankPickerOpen, setBankPickerOpen] = React.useState(false);
  const [accountNo, setAccountNo] = React.useState("");
  const [accNameTH, setAccNameTH] = React.useState("");
  const [accNameEN, setAccNameEN] = React.useState("");

  // promptpay
  const [ppType, setPpType] = React.useState<PPayType>("phone");
  const [ppTypePickerOpen, setPpTypePickerOpen] = React.useState(false);
  const [ppValue, setPpValue] = React.useState("");

  React.useEffect(()=>{
    if(!id) return;
    const row = MOCK_DB[id];
    if(!row) return;
    if(row.type==="bank"){
      setTab("bank");
      setBankName(row.bankName);
      setAccountNo(row.accountNo);
      setAccNameTH(row.accNameTH);
      setAccNameEN(row.accNameEN ?? "");
    }else{
      setTab("promptpay");
      setPpType(row.ppType);
      setPpValue(row.ppValue);
      setAccNameTH(row.accNameTH);
      setAccNameEN(row.accNameEN ?? "");
    }
  },[id]);

  function onSubmit(){
    if(tab==="bank"){
      if(!bankName || !accountNo || !accNameTH){
        Alert.alert("กรอกข้อมูลไม่ครบ","โปรดเลือกธนาคาร และกรอกเลขบัญชี / ชื่อบัญชีภาษาไทย"); 
        return;
      }
      Alert.alert("บันทึกสำเร็จ","แก้ไขบัญชีธนาคารเรียบร้อย",[{text:"ตกลง", onPress:()=>router.back()}]);
      return;
    }
    if(!ppValue || !accNameTH){
      Alert.alert("กรอกข้อมูลไม่ครบ","โปรดกรอกข้อมูล PromptPay และชื่อบัญชีภาษาไทย"); 
      return;
    }
    if(ppType==="phone" && !/^\d{9,10}$/.test(ppValue)){
      Alert.alert("รูปแบบไม่ถูกต้อง","เบอร์โทรต้องเป็นตัวเลข 9–10 หลัก"); 
      return;
    }
    if(ppType==="cid" && !/^\d{13}$/.test(ppValue)){
      Alert.alert("รูปแบบไม่ถูกต้อง","เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก"); 
      return;
    }
    Alert.alert("บันทึกสำเร็จ","แก้ไข PromptPay เรียบร้อย",[{text:"ตกลง", onPress:()=>router.back()}]);
  }

  return (
    <View style={{ flex:1, backgroundColor:"#F6F8FB" }}>
      {/* Header gradient: ขวาเป็น Hi,Yada → ไปหน้าโปรไฟล์ */}
      <GradientHeader
        right={
          <Link href="/(tabs)/profile" asChild>
            <TouchableOpacity style={{ flexDirection:"row", alignItems:"center", gap:10 }}>
              <Ionicons name="storefront-outline" size={18} color="#EAF4FF" />
              <Text style={{ color:"#EAF4FF" }}>Hi, Yada</Text>
            </TouchableOpacity>
          </Link>
        }
      />

      {/* ==== PANEL (มีปุ่ม close ข้างหัวเรื่อง) ==== */}
      <ScrollView contentContainerStyle={{ paddingBottom:24 }} style={styles.panel}>
        <View style={{ flexDirection:"row", alignItems:"center", marginBottom:4 }}>
          <Text style={styles.h1}>แก้ไขบัญชีรับเงินร้านค้า</Text>
          <View style={{ flex:1 }} />
          <TouchableOpacity onPress={()=>router.back()} accessibilityLabel="ปิด">
            <Ionicons name="close" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
        <Text style={styles.sub}>ปรับข้อมูลบัญชีรับเงินของร้านค้า</Text>

        {/* เลือกประเภทบัญชี */}
        <View style={styles.selectorRow}>
          <TouchableOpacity
            style={[styles.selectCard, tab==="bank" && styles.selectCardActive]}
            onPress={()=>setTab("bank")} activeOpacity={0.85}
          >
            <Ionicons name="business-outline" size={28} color={tab==="bank"?"#fff":"#0A57FF"} />
            <Text style={[styles.selectText, tab==="bank" && styles.selectTextActive]}>ธนาคาร</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.selectCard, tab==="promptpay" && styles.selectCardActive]}
            onPress={()=>setTab("promptpay")} activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={28} color={tab==="promptpay"?"#fff":"#0A57FF"} />
            <Text style={[styles.selectText, tab==="promptpay" && styles.selectTextActive]}>Prompay</Text>
          </TouchableOpacity>
        </View>

        {/* ฟอร์มตามแท็บ */}
        {tab==="bank" ? (
          <View style={{ gap:12 }}>
            <TouchableOpacity style={styles.dropdown} onPress={()=>setBankPickerOpen(true)}>
              <Text style={{ color: bankName ? "#111827" : "#94A3B8" }}>
                {bankName || "เลือกธนาคาร"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>

            <TextInput style={styles.input} placeholder="เลขบัญชีธนาคาร"
              keyboardType="number-pad" value={accountNo} onChangeText={setAccountNo} />
            <TextInput style={styles.input} placeholder="ชื่อบัญชีภาษาไทย"
              value={accNameTH} onChangeText={setAccNameTH} />
            <TextInput style={styles.input} placeholder="ชื่อบัญชีภาษาอังกฤษ"
              value={accNameEN} onChangeText={setAccNameEN} />
          </View>
        ) : (
          <View style={{ gap:12 }}>
            <TouchableOpacity style={styles.dropdown} onPress={()=>setPpTypePickerOpen(true)}>
              <Text style={{ color:"#111827" }}>
                {ppType==="phone" ? "เบอร์โทรศัพท์" : "เลขบัตรประชาชน"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder={ppType==="phone" ? "กรอกเบอร์โทร (9–10 หลัก)" : "กรอกเลขบัตรประชาชน (13 หลัก)"}
              keyboardType="number-pad"
              value={ppValue}
              onChangeText={(t)=>setPpValue(t.replace(/[^0-9]/g,""))}
              maxLength={ppType==="phone" ? 10 : 13}
            />
            <TextInput style={styles.input} placeholder="ชื่อบัญชีภาษาไทย"
              value={accNameTH} onChangeText={setAccNameTH} />
            <TextInput style={styles.input} placeholder="ชื่อบัญชีภาษาอังกฤษ"
              value={accNameEN} onChangeText={setAccNameEN} />
          </View>
        )}

        <View style={{ height:20 }} />
        <PrimaryButton title="บันทึก" onPress={onSubmit} />
      </ScrollView>

      {/* Modals */}
      <Modal visible={bankPickerOpen} transparent animationType="fade" onRequestClose={()=>setBankPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={()=>setBankPickerOpen(false)}>
          <View style={styles.sheet}>
            {BANKS.map(b=>(
              <Pressable key={b} style={styles.option} onPress={()=>{ setBankName(b); setBankPickerOpen(false); }}>
                <Text style={styles.optionText}>{b}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={ppTypePickerOpen} transparent animationType="fade" onRequestClose={()=>setPpTypePickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={()=>setPpTypePickerOpen(false)}>
          <View style={styles.sheet}>
            <Pressable style={styles.option} onPress={()=>{ setPpType("phone"); setPpTypePickerOpen(false); }}>
              <Text style={styles.optionText}>เบอร์โทรศัพท์</Text>
            </Pressable>
            <Pressable style={styles.option} onPress={()=>{ setPpType("cid"); setPpTypePickerOpen(false); }}>
              <Text style={styles.optionText}>เลขบัตรประชาชน</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: -16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  h1: { fontSize: 20, fontWeight: "700", color:"#0F172A" },
  sub: { color: "#64748B", marginBottom: 16 },

  selectorRow: { flexDirection:"row", gap:12, marginBottom:16 },
  selectCard: {
    flex:1, backgroundColor:"#fff", borderRadius:12, paddingVertical:20,
    alignItems:"center", justifyContent:"center", borderWidth:1, borderColor:"#E2E8F0",
  },
  selectCardActive: { backgroundColor:"#0A57FF", borderColor:"#0A57FF" },
  selectText: { marginTop:6, fontWeight:"700", color:"#0A57FF" },
  selectTextActive: { color:"#fff" },

  dropdown: {
    flexDirection:"row", justifyContent:"space-between", alignItems:"center",
    backgroundColor:"#fff", borderWidth:1, borderColor:"#E2E8F0", borderRadius:10,
    paddingHorizontal:12, paddingVertical:14,
  },
  input: {
    backgroundColor:"#fff", borderWidth:1, borderColor:"#E2E8F0",
    borderRadius:10, paddingHorizontal:12, paddingVertical:14,
  },

  backdrop:{ flex:1, backgroundColor:"rgba(0,0,0,0.3)", justifyContent:"flex-end" },
  sheet:{ backgroundColor:"#fff", borderTopLeftRadius:16, borderTopRightRadius:16, paddingVertical:8 },
  option:{ paddingVertical:14, paddingHorizontal:16, borderBottomWidth:1, borderBottomColor:"#F1F5F9" },
  optionText:{ fontSize:16 },
});
