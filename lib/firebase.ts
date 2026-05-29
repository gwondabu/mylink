import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCm3j4Hhk-4rNVMt_g87cfIQQNaR-e02YM",
  authDomain: "my-link-484d1.firebaseapp.com",
  projectId: "my-link-484d1",
  storageBucket: "my-link-484d1.firebasestorage.app",
  messagingSenderId: "320035025007",
  appId: "1:320035025007:web:12b2b4f24ca943ab5f1d9a",
  measurementId: "G-Y5K2TDC3H6"
};

// 핫 리로딩 및 중복 초기화 방지를 위한 싱글톤 앱 생성
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Firebase 서비스 모듈들
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// SSR 환경을 고려한 Analytics 안전 초기화 함수
export const initAnalytics = async () => {
  if (typeof window !== "undefined") {
    const supported = await isSupported();
    if (supported) {
      return getAnalytics(app);
    }
  }
  return null;
};

export default app;
