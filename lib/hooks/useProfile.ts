// src/lib/hooks/useProfile.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyProfile,
  updateMyProfile,
  listCategories,
  getDisplayName,
  type Profile,
  type Category,
} from "../service/profileService";

const keys = {
  root: ["profile"] as const,
  me: () => [...keys.root, "me"] as const,
  cats: () => [...keys.root, "categories"] as const,
};

/** ดึงโปรไฟล์ของผู้ใช้ที่ล็อกอิน */
export function useMyProfile() {
  return useQuery<Profile>({
    queryKey: keys.me(),
    queryFn: getMyProfile,
  });
}

/** ดึงรายชื่อหมวดหมู่ร้านค้า */
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: keys.cats(),
    queryFn: listCategories,
  });
}

/** อัปเดตโปรไฟล์ของฉัน */
export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Profile>) => updateMyProfile(patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.root });
    },
  });
}

/** helper ให้ component ใช้ชื่อที่เหมาะ */
export function useDisplayName() {
  const { data } = useMyProfile();
  return getDisplayName(data);
}
