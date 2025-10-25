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
import SureSureLogo from "../../../components/SureSureLogo";

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
  const [storeWebsite, setStoreWebsite] = React.useState("");
  const [storeEmail, setStoreEmail] = React.useState("");
  const [categoryModalOpen, setCategoryModalOpen] = React.useState(false);
  const [initialized, setInitialized] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!profile || initialized) return;
    setStoreName(profile.store_name ?? "");
    const rawType = profile.store_category_type ?? "";
    setStoreCategory(rawType);
    setStoreCategoryLabel(rawType);
    setStorePhone(profile.store_phone ?? "");
    setStoreAddress(profile.store_address ?? profile.address ?? "");
    setStoreWebsite(profile.store_email ?? "");
    setStoreEmail(profile.website ?? "");
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
    const website = storeWebsite.trim();
    const email = storeEmail.trim();
    const categoryCode = storeCategory.trim();
    const categoryName = storeCategoryLabel.trim();

    if (!name) {
      setErrorMessage("\u0e01\u0e23\u0e38\u0e13\u0e32\u0e01\u0e23\u0e2d\u0e01\u0e0a\u0e37\u0e48\u0e2d\u0e23\u0e49\u0e32\u0e19\u0e04\u0e49\u0e32");
      return;
    }

    setErrorMessage(null);

    try {
      await updateMyProfileMutation({
        store_name: name,
        store_category_type: categoryName || categoryCode || undefined,
        store_phone: phone || undefined,
        address: address || undefined,
        store_address: address || undefined,
        store_email: website || undefined,
        website: email || undefined,
      });
      router.replace("/login/register/pagePackage");
    } catch (err: any) {
      Alert.alert("\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e23\u0e49\u0e32\u0e19\u0e44\u0e21\u0e48\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08", err?.message ?? "\u0e01\u0e23\u0e38\u0e13\u0e32\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e2d\u0e35\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07");
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

  const categoryPlaceholder = "\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e2b\u0e21\u0e27\u0e14\u0e2b\u0e21\u0e39\u0e48\u0e23\u0e49\u0e32\u0e19\u0e04\u0e49\u0e32";
  const categoryDisplay = storeCategoryLabel || categoryPlaceholder;

  const closeError = () => setErrorMessage(null);

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
              <SureSureLogo style={styles.logo} />
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

                  
                  <Text style={styles.label}>Store website (optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://yourshop.com"
                    value={storeWebsite}
                    onChangeText={setStoreWebsite}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <Text style={styles.label}>Store email (optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="shop@example.com"
                    value={storeEmail}
                    onChangeText={setStoreEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
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

      <Modal visible={!!errorMessage} transparent animationType="fade" onRequestClose={closeError}>
        <View style={styles.alertBackdrop}>
          <View style={styles.alertBox}>
            <View style={styles.alertIcon}>
              <Text style={styles.alertIconText}>!</Text>
            </View>
            <Text style={styles.alertMessage}>{errorMessage}</Text>
            <TouchableOpacity style={styles.alertButton} onPress={closeError}>
              <Text style={styles.alertButtonText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  logo: {
    width: 180,
    height: 180,
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
  alertBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  alertBox: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  alertIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  alertIconText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#EF4444",
    marginTop: -4,
  },
  alertMessage: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  alertButton: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 999,
    backgroundColor: "#0F172A",
  },
  alertButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
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
