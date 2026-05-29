"use client"

import { useState, useEffect } from "react"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged, User } from "firebase/auth"
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore"

export interface UserProfile {
  uid: string
  email: string | null
  displayName: string | null
  profile_image_url: string | null
  profile_bio: string
  theme: string
  created_at?: any
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      // 기존 프로필 구독이 있으면 먼저 해제
      if (unsubscribeProfile) {
        unsubscribeProfile()
        unsubscribeProfile = null
      }

      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid)

        // Firestore 프로필 실시간 감시 (onSnapshot)
        unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile)
          } else {
            // 프로필 문서가 아직 없으면 구글 계정 정보를 기반으로 최초 생성
            const initialProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              profile_image_url: currentUser.photoURL,
              profile_bio: "",
              theme: "default",
              created_at: serverTimestamp()
            }
            try {
              await setDoc(userDocRef, initialProfile)
              setProfile(initialProfile)
            } catch (err) {
              console.error("Firestore user profile setDoc error: ", err)
            }
          }
          setLoading(false)
        }, (error) => {
          console.error("Firestore profile onSnapshot error: ", error)
          setLoading(false)
        })
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeProfile) {
        unsubscribeProfile()
      }
    }
  }, [])

  return { user, profile, loading }
}
