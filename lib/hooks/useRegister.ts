// lib/hooks/useRegister.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerUser, type RegisterRequest, type RegisteredUser } from "../service/registerService";
import { setStoredAuth } from "../authService";

export function useRegister() {
  const qc = useQueryClient();

  return useMutation<RegisteredUser, Error, RegisterRequest>({
    mutationKey: ["register"],
    mutationFn: async (payload) => {
      const user = await registerUser(payload);

      if (user.token) {
        await setStoredAuth({
          token: user.token,
          user: {
            id: user.id,
            uid: user.uid,
            username: user.username,
            email: user.email ?? undefined,
            user_type: user.user_type ?? undefined,
            user_role: user.user_role ?? undefined,
            is_active: user.is_active ?? undefined,
          },
        });
      }

      // อาจจะให้โหลดโปรไฟล์ใหม่ถ้ามี query key เช่น ["me"]
      qc.invalidateQueries({ queryKey: ["me"] }).catch(() => {});

      return user;
    },
  });
}
