// lib/service/lineLoginService.ts
// LINE Login โดยตรง (ไม่ต้องเพิ่ม backend endpoint)
// อิงตาม Svelte example ที่ user ให้มา

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { setStoredAuth } from '../authService';
import { httpPost } from '../http';

// ปิด browser session เมื่อเสร็จสิ้น
WebBrowser.maybeCompleteAuthSession();

// ======================== Configuration ========================
const LINE_CHANNEL_ID = process.env.EXPO_PUBLIC_LINE_CHANNEL_ID || '2006678742';
const LINE_CHANNEL_SECRET = process.env.EXPO_PUBLIC_LINE_CHANNEL_SECRET || '2648424bc67130d314e3f0098aaccd51';

// Redirect URI - ใช้ custom scheme สำหรับ mobile app
const REDIRECT_URI = 'suresure://auth/line';

// LINE OAuth URLs
const LINE_AUTHORIZE_URL = 'https://access.line.me/oauth2/v2.1/authorize';
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token';
const LINE_PROFILE_URL = 'https://api.line.me/v2/profile';

// State สำหรับ CSRF protection (เหมือน Svelte)
const LOGIN_STATE = 'sure-sure-login';

// ======================== Types ========================
type LineTokenResponse = {
    access_token: string;
    token_type: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    id_token: string; // JWT contains email
};

type LineProfile = {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
};

type LineIdToken = {
    iss: string;
    sub: string;
    aud: string;
    exp: number;
    iat: number;
    email?: string;
    name?: string;
};

// ======================== Main Login Function ========================
/**
 * เริ่มต้นกระบวนการล็อกอินผ่าน LINE
 * ตาม flow ของ Svelte: redirectToLineLogin() → LINE callback → process
 */
export async function loginWithLine(): Promise<{ token: string; user: any }> {
    try {
        // Step 1-2: สร้าง URL และเปิด LINE login page (redirectToLineLogin)
        const authUrl = buildLineAuthUrl();
        const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);

        // Step 3: ตรวจสอบผลลัพธ์
        if (result.type !== 'success') {
            throw new Error('LINE login was cancelled');
        }

        // Step 4: ดึง code และ state จาก redirect URL
        const { code, state } = parseRedirectUrl(result.url);

        // ตรวจสอบ state (CSRF protection)
        if (state !== LOGIN_STATE) {
            throw new Error('Invalid state - possible CSRF attack');
        }

        // Step 5: แลก code เป็น access token (ตาม Svelte +page.server.ts บรรทัด 86-97)
        const tokenData = await exchangeCodeForToken(code);

        // Step 6: ดึงข้อมูล profile จาก LINE (ตาม Svelte บรรทัด 110-122)
        const profileData = await getLineProfile(tokenData.access_token);

        // Step 7: ดึง email จาก ID token (ตาม Svelte บรรทัด 133-144)
        const email = extractEmailFromIdToken(tokenData.id_token);

        // Step 8: ล็อกอินกับ backend ของเราเอง (ตาม Svelte บรรทัด 168-169)
        const authData = await loginWithBackend({
            userId: profileData.userId,
            displayName: profileData.displayName,
            pictureUrl: profileData.pictureUrl || '',
            email: email || '',
        });

        return authData;

    } catch (error: any) {
        console.error('❌ LINE login error:', error);
        throw error;
    }
}

// ======================== Helper Functions ========================

/**
 * Step 2: สร้าง LINE authorization URL
 * เหมือนกับ redirectToLineLogin() ใน Svelte
 */
function buildLineAuthUrl(): string {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: LINE_CHANNEL_ID,
        redirect_uri: REDIRECT_URI,
        state: LOGIN_STATE,
        // Scope เหมือน Svelte: openid profile real_name gender birthdate phone address email
        scope: 'openid profile email',
    });

    return `${LINE_AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Step 4: แยก code และ state จาก redirect URL
 */
function parseRedirectUrl(url: string): { code: string; state: string } {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    const state = urlObj.searchParams.get('state');

    if (!code || !state) {
        throw new Error('Missing code or state in redirect URL');
    }

    return { code, state };
}

/**
 * Step 5: แลก authorization code เป็น access token
 * เทียบเคียง Svelte +page.server.ts บรรทัด 86-97
 */
async function exchangeCodeForToken(code: string): Promise<LineTokenResponse> {
    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET, // ⚠️ ใน production ควรทำใน backend
    });

    const response = await fetch(LINE_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LINE token exchange failed: ${errorText}`);
    }

    return await response.json();
}

/**
 * Step 6: ดึงข้อมูล profile จาก LINE
 * เทียบเคียง Svelte +page.server.ts บรรทัด 110-122
 */
async function getLineProfile(accessToken: string): Promise<LineProfile> {
    const response = await fetch(LINE_PROFILE_URL, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LINE profile fetch failed: ${errorText}`);
    }

    return await response.json();
}

/**
 * Step 7: Decode LINE ID Token เพื่อดึง email
 * เทียบเคียง Svelte +page.server.ts บรรทัด 133-144
 */
function extractEmailFromIdToken(idToken: string): string {
    try {
        // JWT format: header.payload.signature
        const parts = idToken.split('.');
        if (parts.length !== 3) {
            console.warn('Invalid JWT format');
            return '';
        }

        // Decode base64 payload
        const payload = parts[1];
        const decodedPayload = base64Decode(payload);
        const tokenData: LineIdToken = JSON.parse(decodedPayload);

        return tokenData.email || '';
    } catch (error) {
        console.warn('Failed to decode ID token:', error);
        return '';
    }
}

/**
 * Step 8: ล็อกอินกับ backend ของเราโดยใช้ข้อมูลจาก LINE
 * เทียบเคียง Svelte +page.server.ts บรรทัด 168-180
 */
async function loginWithBackend(lineData: {
    userId: string;
    displayName: string;
    pictureUrl: string;
    email: string;
}): Promise<{ token: string; user: any }> {
    try {
        // ใช้ endpoint /login ที่มีอยู่แล้ว
        // ส่งข้อมูลจาก LINE ไปสร้าง/login user
        const response = await httpPost<any>('/login', {
            user_type: 'merchant',
            username: lineData.userId,        // ใช้ LINE userId เป็น username
            password: lineData.userId,        // ใช้ LINE userId เป็น password
            name_th: lineData.displayName,
            picture: lineData.pictureUrl,
            email: lineData.email,
        });

        // รับ token และ user data
        const data = response?.data ?? response;

        if (!data?.token && !data?.Token) {
            throw new Error('No token received from backend');
        }

        // Step 9: เก็บ token และ user ใน AsyncStorage (เหมือน cookie ใน Svelte)
        const token = data.token || data.Token;
        const user = data.user || data;

        await setStoredAuth({
            token: token,
            user: {
                ...user,
                line_user_id: lineData.userId,
                picture: lineData.pictureUrl || user.picture,
            },
        });

        return {
            token: token,
            user: user,
        };

    } catch (error: any) {
        console.error('Backend login error:', error);
        throw new Error(error?.message || 'Failed to login with backend');
    }
}

/**
 * Helper: Base64 decode for React Native
 */
function base64Decode(str: string): string {
    // แทน padding ที่อาจหายไป
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;

    try {
        // ใช้ atob ถ้ามี (web)
        if (typeof atob !== 'undefined') {
            return atob(padded);
        }

        // ใช้ Buffer สำหรับ React Native
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(padded, 'base64').toString('utf-8');
        }

        throw new Error('No base64 decode method available');
    } catch (error) {
        console.error('Base64 decode error:', error);
        return '{}';
    }
}
