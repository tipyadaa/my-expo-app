import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  FlatList,
  Button,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

// ======================= Types =======================
export type Account = {
  id: number;
  account_type: 'BANK' | 'PP';
  bank_code?: string;
  prompt_pay_type?: string;
  name_th: string;
  account_no: string;
  is_active: boolean;
};

export type Room = {
  id: number;
  room_name: string;
  list_bank: string | number[];
  min_amount_receive?: number;
  hide_sender_detail?: boolean;
  hide_receiver_detail?: boolean;
  line_group_id?: string;
  qr_token?: string;
};

type Props = {
  mode: 'create' | 'edit';
  initialRoom?: Room; // required if mode === 'edit'
  accounts: Account[];
  userId: number;
  apiBase: string; // e.g. https://api.example.com
  apiKey: string;
  onSaved: (room: Room) => void;
};

// ======================= Normalized Branch Shape =======================
// UI/state works with this central shape, not backend field names
type BranchNormalized = {
  name: string;
  minAmount: number;
  hideSender: boolean;
  hideReceiver: boolean;
  selectedBankIds: number[];
};

// ======================= Utils (Pure) =======================
export function parseSelected(listBankRaw: Room['list_bank'] | undefined | null): number[] {
  if (Array.isArray(listBankRaw)) {
    // coerce to numbers safely
    return listBankRaw.map((v) => Number(v)).filter((n) => Number.isFinite(n));
  }
  if (typeof listBankRaw === 'string') {
    try {
      const arr = JSON.parse(listBankRaw);
      if (Array.isArray(arr)) return arr.map((v) => Number(v)).filter((n) => Number.isFinite(n));
      return [];
    } catch {
      return [];
    }
  }
  return [];
}

export function toLocalAccounts(accounts: Account[], selectedIds: number[]): Account[] {
  const set = new Set(selectedIds);
  return accounts.map((a) => ({ ...a, is_active: set.has(a.id) }));
}

export function getSelectedIds(localAccounts: Account[]): number[] {
  return localAccounts.filter((a) => a.is_active).map((a) => a.id);
}

export function buildBranchNormalized(
  formState: { roomName: string; minAmountReceive: number; hideSenderDetail: boolean; hideReceiverDetail: boolean },
  localAccounts: Account[],
): BranchNormalized {
  return {
    name: formState.roomName.trim(),
    minAmount: Number(formState.minAmountReceive) || 0,
    hideSender: !!formState.hideSenderDetail,
    hideReceiver: !!formState.hideReceiverDetail,
    selectedBankIds: getSelectedIds(localAccounts),
  };
}

type FieldMapping = {
  name: string;
  minAmount: string;
  hideSender: string;
  hideReceiver: string;
  selectedBankIds: string; // key for list_bank
};

export function mapToApiPayload(
  normalized: BranchNormalized,
  mapping: FieldMapping,
  extra?: Record<string, any>,
  options?: { listAsJsonString?: boolean },
): Record<string, any> {
  const { listAsJsonString = true } = options || {};
  const payload: Record<string, any> = {
    ...(extra || {}),
  };
  payload[mapping.name] = normalized.name;
  payload[mapping.minAmount] = normalized.minAmount;
  payload[mapping.hideSender] = normalized.hideSender;
  payload[mapping.hideReceiver] = normalized.hideReceiver;
  payload[mapping.selectedBankIds] = listAsJsonString
    ? JSON.stringify(normalized.selectedBankIds)
    : normalized.selectedBankIds;
  return payload;
}

export function selectAccountsFromRoom(room: Room, accounts: Account[]): Account[] {
  const selected = parseSelected(room?.list_bank);
  return toLocalAccounts(accounts, selected);
}

export function getConnectedAccounts(accounts: Account[]): Account[] {
  return accounts.filter((a) => a.is_active);
}

// ======================= Component =======================
export default function BranchForm(props: Props) {
  const { mode, initialRoom, accounts, userId, apiBase, apiKey, onSaved } = props;

  const [roomName, setRoomName] = useState<string>(mode === 'edit' ? (initialRoom?.room_name ?? '') : '');
  const [minAmountReceive, setMinAmountReceive] = useState<number>(
    mode === 'edit' ? Number(initialRoom?.min_amount_receive ?? 0) : 0,
  );
  const [hideSenderDetail, setHideSenderDetail] = useState<boolean>(
    mode === 'edit' ? !!initialRoom?.hide_sender_detail : false,
  );
  const [hideReceiverDetail, setHideReceiverDetail] = useState<boolean>(
    mode === 'edit' ? !!initialRoom?.hide_receiver_detail : false,
  );
  const [localAccounts, setLocalAccounts] = useState<Account[]>(accounts);
  const [loading, setLoading] = useState<boolean>(false);

  // init mapping from room.list_bank to accounts.is_active in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialRoom) {
      const selected = parseSelected(initialRoom.list_bank);
      setLocalAccounts(toLocalAccounts(accounts, selected));
      setRoomName(initialRoom.room_name ?? '');
      setMinAmountReceive(Number(initialRoom.min_amount_receive ?? 0));
      setHideSenderDetail(!!initialRoom.hide_sender_detail);
      setHideReceiverDetail(!!initialRoom.hide_receiver_detail);
    } else {
      // create mode: keep incoming flags
      setLocalAccounts(accounts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialRoom, accounts]);

  const connectedAccounts = useMemo(() => getConnectedAccounts(localAccounts), [localAccounts]);

  const onToggleAccount = (id: number, value: boolean) => {
    setLocalAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: value } : a)));
  };

  const validate = (): boolean => {
    if (!roomName || roomName.trim().length === 0) {
      Alert.alert('กรอกชื่อสาขา', 'โปรดกรอกชื่อสาขาก่อนบันทึก');
      return false;
    }
    const anySelected = localAccounts.some((a) => a.is_active);
    if (!anySelected) {
      Alert.alert('เลือกบัญชีรับเงิน', 'โปรดเลือกอย่างน้อย 1 บัญชีรับเงิน');
      return false;
    }
    if (minAmountReceive < 0 || Number.isNaN(minAmountReceive)) {
      Alert.alert('จำนวนเงินขั้นต่ำไม่ถูกต้อง', 'โปรดระบุจำนวนเงินขั้นต่ำเป็นเลขศูนย์หรือมากกว่า');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    try {
      // build normalized
      const normalized = buildBranchNormalized(
        { roomName, minAmountReceive, hideSenderDetail, hideReceiverDetail },
        localAccounts,
      );

      // mapping for API fields
      const mapping: FieldMapping = {
        name: 'room_name',
        minAmount: 'min_amount_receive',
        hideSender: 'hide_sender_detail',
        hideReceiver: 'hide_receiver_detail',
        selectedBankIds: 'list_bank',
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        apikey: props.apiKey,
      };

      let url = '';
      let method: 'POST' | 'PUT' = 'POST';
      let body: any = null;

      if (mode === 'create') {
        url = `${apiBase.replace(/\/$/, '')}/room2/create`;
        method = 'POST';
        body = mapToApiPayload(normalized, mapping, { user_id: userId }, { listAsJsonString: true });
      } else {
        // edit mode
        url = `${apiBase.replace(/\/$/, '')}/room2/update`;
        method = 'PUT';
        body = mapToApiPayload(
          normalized,
          mapping,
          { id: initialRoom!.id, user_id: userId },
          { listAsJsonString: true },
        );
      }

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
      });

      const data = await safeParseJson<any>(res);

      if (data && data.message === 'Success') {
        let savedRoom: Room | null = null;

        if (mode === 'create') {
          const fromApi = data?.data as any;
          if (fromApi && typeof fromApi === 'object') {
            savedRoom = ensureRoomObjectFromApi(fromApi, normalized);
          } else {
            // compose from submitted values if server not returning data
            savedRoom = {
              id: Number((data?.data?.id ?? -1) as any) || -1,
              room_name: normalized.name,
              list_bank: normalized.selectedBankIds,
              min_amount_receive: normalized.minAmount,
              hide_sender_detail: normalized.hideSender,
              hide_receiver_detail: normalized.hideReceiver,
            };
          }
          // Extra safeguard: some backends ignore list_bank on create.
          // If we have a real ID and selected banks, fire an update to persist list_bank.
          const createdId = Number((savedRoom as Room).id || fromApi?.id || -1);
          if (createdId > 0 && normalized.selectedBankIds.length > 0) {
            try {
              const urlUpdate = `${apiBase.replace(/\/$/, '')}/room2/update`;
              const updatePayload = {
                id: createdId,
                user_id: userId,
                room_name: normalized.name,
                min_amount_receive: normalized.minAmount,
                hide_sender_detail: normalized.hideSender,
                hide_receiver_detail: normalized.hideReceiver,
                list_bank: JSON.stringify(normalized.selectedBankIds),
              };
              await fetch(urlUpdate, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'ngrok-skip-browser-warning': 'true',
                  apikey: apiKey,
                },
                body: JSON.stringify(updatePayload),
              });
            } catch (e) {
              // non-blocking
            }
          }
          Alert.alert('สำเร็จ', 'สร้างสาขาเรียบร้อยแล้ว');
        } else {
          // update: merge initialRoom and submitted
          savedRoom = {
            ...(initialRoom as Room),
            room_name: normalized.name,
            min_amount_receive: normalized.minAmount,
            hide_sender_detail: normalized.hideSender,
            hide_receiver_detail: normalized.hideReceiver,
            list_bank: normalized.selectedBankIds,
          };
          Alert.alert('สำเร็จ', 'อัปเดตสาขาเรียบร้อยแล้ว');
        }

        onSaved(savedRoom!);
      } else {
        const msg = data?.message || 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่';
        Alert.alert('ไม่สำเร็จ', msg);
      }
    } catch (err: any) {
      Alert.alert('ข้อผิดพลาดเครือข่าย', err?.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Name */}
      <Text style={styles.label}>ชื่อสาขา</Text>
      <TextInput
        style={styles.input}
        placeholder="กรอกชื่อสาขา"
        value={roomName}
        onChangeText={setRoomName}
      />

      {/* Min amount */}
      <Text style={styles.label}>จำนวนเงินขั้นต่ำที่รับ (บาท)</Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        keyboardType="numeric"
        value={String(Number.isFinite(minAmountReceive) ? minAmountReceive : 0)}
        onChangeText={(t) => {
          // allow only digits
          const digits = t.replace(/[^0-9]/g, '');
          setMinAmountReceive(digits.length ? Number(digits) : 0);
        }}
      />

      {/* Switches */}
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>ซ่อนเลขบัญชีผู้โอน</Text>
        <Switch value={hideSenderDetail} onValueChange={setHideSenderDetail} />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>ซ่อนเลขบัญชีผู้รับ</Text>
        <Switch value={hideReceiverDetail} onValueChange={setHideReceiverDetail} />
      </View>

      {/* Accounts list */}
      <Text style={[styles.label, { marginTop: 12 }]}>บัญชีรับเงิน</Text>
      <FlatList
        data={localAccounts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.accountRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.accountName}>{item.name_th}</Text>
              <Text style={styles.accountNo}>{item.account_no}</Text>
            </View>
            <Switch
              value={!!item.is_active}
              onValueChange={(v) => onToggleAccount(item.id, v)}
            />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.empty}>ไม่พบบัญชีรับเงิน</Text>}
      />

      {/* Connected summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>บัญชีที่เชื่อมต่อแล้ว</Text>
        {connectedAccounts.length === 0 ? (
          <Text style={styles.empty}>ยังไม่ได้เชื่อมบัญชี</Text>
        ) : (
          connectedAccounts.map((acc) => (
            <Text key={acc.id} style={styles.summaryItem}>
              • {acc.name_th} ({acc.account_no})
            </Text>
          ))
        )}
      </View>

      {/* Save button */}
      <View style={styles.saveRow}>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Button
            title={mode === 'create' ? 'Create Branch' : 'Update Branch'}
            onPress={handleSave}
            disabled={loading}
          />
        )}
      </View>
    </View>
  );
}

// ======================= Helpers (impure) =======================
async function safeParseJson<T>(res: Response): Promise<T | null> {
  try {
    const text = await res.text();
    if (!text) return null as any;
    return JSON.parse(text) as T;
  } catch {
    return null as any;
  }
}

function ensureRoomObjectFromApi(fromApi: any, normalized: BranchNormalized): Room {
  // try best-effort mapping
  const listBankRaw = fromApi?.list_bank ?? normalized.selectedBankIds;
  const listAsArray = Array.isArray(listBankRaw)
    ? listBankRaw
    : parseSelected(typeof listBankRaw === 'string' ? listBankRaw : undefined);

  return {
    id: Number(fromApi?.id ?? -1),
    room_name: String(fromApi?.room_name ?? normalized.name),
    list_bank: listAsArray,
    min_amount_receive: Number(
      fromApi?.min_amount_receive ?? fromApi?.min_receive ?? normalized.minAmount,
    ),
    hide_sender_detail: !!(fromApi?.hide_sender_detail ?? normalized.hideSender),
    hide_receiver_detail: !!(fromApi?.hide_receiver_detail ?? normalized.hideReceiver),
    line_group_id: fromApi?.line_group_id,
    qr_token: fromApi?.qr_token,
  } as Room;
}

// ======================= Styles =======================
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  switchLabel: { fontSize: 14 },
  accountRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  accountName: { fontWeight: '600' },
  accountNo: { color: '#64748B' },
  separator: { height: 1, backgroundColor: '#f1f5f9' },
  empty: { color: '#64748B', fontStyle: 'italic', marginVertical: 8 },
  summary: { marginTop: 12, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 },
  summaryTitle: { fontWeight: '700', marginBottom: 4 },
  summaryItem: { color: '#0f172a' },
  saveRow: { marginTop: 16 },
});

// ======================= Example Usage =======================
// <BranchForm
//   mode="create"
//   accounts={accountsFromServer}
//   userId={profile.id}
//   apiBase={API_BASE}
//   apiKey={API_KEY}
//   onSaved={(room) => console.log('Saved room', room)}
// />
