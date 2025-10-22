import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMyProfile, useUpdateMyProfile, useCategories } from "../../../lib/hooks/useProfile";
import type { Category } from "../../../lib/service/profileService";

export default function PageRegisterStore() {
  const router = useRouter();
  const { data: profile, isLoading } = useMyProfile();
  const { mutateAsync: updateMyProfileMutation, isPending } = useUpdateMyProfile();
  const { data: categories = [], isLoading: catLoading } = useCategories();

  const [storeName, setStoreName] = React.useState("");
  const [storeCategory, setStoreCategory] = React.useState("");
  const [storeCategoryLabel, setStoreCategoryLabel] = React.useState("");
  const [storePhone, setStorePhone] = React.useState("");
  const [storeAddress, setStoreAddress] = React.useState("");
  const [categoryModalOpen, setCategoryModalOpen] = React.useState(false);
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    if (!profile || initialized) return;
    setStoreName(profile.store_name ?? "");
    const rawType = profile.store_category_type ?? "";
    setStoreCategory(rawType);
    setStoreCategoryLabel(rawType);
    setStorePhone(profile.store_phone ?? "");
    setStoreAddress(profile.store_address ?? profile.address ?? "");
    setInitialized(true);
  }, [profile, initialized]);

  React.useEffect(() => {
    if (!categories.length || !storeCategory) return;
    const match = categories.find(
      (c) =>
        c.iso_code === storeCategory ||
        c.category_name_th === storeCategory ||
        c.category_name_en === storeCategory
    );
    if (match) {
      const label = match.category_name_th || match.category_name_en || storeCategory;
      setStoreCategoryLabel(label);
    }
  }, [categories, storeCategory]);

  const onSubmit = async () => {
    const name = storeName.trim();
    const phone = storePhone.trim();
    const address = storeAddress.trim();
    const category = storeCategory.trim();

    if (!name) {
      Alert.alert("กรุณากรอกชื่อร้านค้า", "โปรดระบุชื่อร้านค้าของคุณ");
      return;
    }

    try {
      await updateMyProfileMutation({
        store_name: name,
        store_category_type: category || undefined,
        store_phone: phone || undefined,
        address: address || undefined,
        store_address: address || undefined,
      });
      router.replace("/(tabs)/report");
    } catch (err: any) {
      Alert.alert("บันทึกข้อมูลไม่สำเร็จ", err?.message ?? "ไม่สามารถบันทึกข้อมูลร้านค้าได้");
    }
  };

  const renderCategoryOption = ({ item }: { item: Category }) => {
    const label = item.category_name_th || item.category_name_en || `หมวดหมู่ ${item.cat_id}`;
    const value = item.iso_code || item.category_name_en || String(item.cat_id);
    return (
      <TouchableOpacity
        style={styles.optionRow}
        onPress={() => {
          setStoreCategory(value);
          setStoreCategoryLabel(label);
          setCategoryModalOpen(false);
        }}
      >
        <Text style={styles.optionText}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const categoryPlaceholder = "ประเภทร้านค้า";
  const categoryDisplay = storeCategoryLabel || categoryPlaceholder;

  return (
    <LinearGradient
      colors={["#0A4BFF", "#01C3AF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoWrap}>
              <Text style={styles.logoText}>Sure</Text>
              <Text style={[styles.logoText, { marginTop: -2 }]}>Sure</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.heading}>ข้อมูลร้านค้า</Text>

              {isLoading && !initialized ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator />
                </View>
              ) : (
                <>
                  <Text style={[styles.label, styles.labelFirst]}>ชื่อร้านค้า</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ชื่อร้านค้า"
                    value={storeName}
                    onChangeText={setStoreName}
                  />

                  <Text style={styles.label}>ประเภทร้านค้า</Text>
                  <Pressable
                    style={[styles.input, styles.selector]}
                    onPress={() => setCategoryModalOpen(true)}
                  >
                    <Text
                      style={[
                        styles.selectorText,
                        !storeCategoryLabel && { color: "#9CA3AF" },
                      ]}
                    >
                      {categoryDisplay}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#0F172A" />
                  </Pressable>

                  <Text style={styles.label}>เบอร์ร้านค้า</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="เบอร์ร้านค้า"
                    keyboardType="phone-pad"
                    value={storePhone}
                    onChangeText={(t) => setStorePhone(t.replace(/[^\d]/g, ""))}
                    maxLength={10}
                  />

                  <Text style={styles.label}>ที่อยู่</Text>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="ที่อยู่"
                    multiline
                    value={storeAddress}
                    onChangeText={setStoreAddress}
                  />

                  <Pressable
                    style={[styles.submit, (isPending || isLoading) && styles.submitDisabled]}
                    onPress={onSubmit}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitText}>เข้าสู่ระบบ</Text>
                    )}
                  </Pressable>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={categoryModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCategoryModalOpen(false)}>
          <View
            style={styles.modalCard}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>เลือกประเภทร้านค้า</Text>
            {catLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator />
              </View>
            ) : (
              <FlatList
                data={categories}
                keyExtractor={(item) => String(item.cat_id)}
                renderItem={renderCategoryOption}
                ItemSeparatorComponent={() => <View style={styles.optionDivider} />}
                ListEmptyComponent={
                  <Text style={styles.optionEmpty}>ไม่มีข้อมูลประเภทร้านค้า</Text>
                }
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  logoWrap: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 46,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  heading: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 24,
  },
  label: {
    color: "#0F172A",
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 12,
  },
  labelFirst: {
    marginTop: 0,
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    color: "#0F172A",
    fontSize: 14,
  },
  selectorIcon: {
    fontSize: 18,
    color: "#0F172A",
  },
  textarea: {
    minHeight: 72,
    paddingVertical: 10,
    textAlignVertical: "top",
  },
  loadingBox: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  submit: {
    marginTop: 28,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#0A4BFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
    textAlign: "center",
  },
  modalLoading: {
    paddingVertical: 32,
    alignItems: "center",
  },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  optionText: {
    fontSize: 16,
    color: "#0F172A",
  },
  optionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E2E8F0",
  },
  optionEmpty: {
    textAlign: "center",
    color: "#94A3B8",
    paddingVertical: 24,
  },
});
