// src/utils/useUserProfile.ts
import { useEffect, useState } from "react";
import { fetchUsers } from "../endpoints/UserHandler";
import { fetchProfilePicture, fetchBio } from "../endpoints/ProfileHandler";

export type UserType = "educator" | "learner" | undefined;

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  userType: UserType;
  profilePictureUrl?: string | null;
  bio?: string | null;
}

export function useUserProfile(userSession: any) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const identifier = userSession?.username ?? userSession?.email ?? null;
    if (!identifier) return;

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const res = await fetchUsers(identifier);
        if (cancelled) return;
        
        if (res.status === "OK" && res.ok && res.ok.length > 0) {
          const currentUser = res.ok.find((user: any) => 
            user.username === userSession.username || 
            user.email === userSession.email
          );
          
          if (!currentUser) return;

          // Normalize user type
          const apiUserType = currentUser.userType;
          let normalizedType: UserType = undefined;
          
          if (typeof apiUserType === "string") {
            const upperType = apiUserType.toUpperCase();
            if (upperType === "EDUCATOR") {
              normalizedType = "educator";
            } else if (upperType === "STUDENT") {
              normalizedType = "learner";
            }
          }

          const updates: Partial<UserProfile> = {
            id: currentUser.id,
            username: currentUser.username,
            email: currentUser.email,
            userType: normalizedType,
          };

          // Fetch profile picture
          const picRes = await fetchProfilePicture(currentUser.id);
          if (!cancelled && picRes.status === "OK" && picRes.ok) {
            updates.profilePictureUrl = picRes.ok.startsWith("data:")
              ? picRes.ok
              : `data:image/png;base64,${picRes.ok}`;
          }

          // Fetch bio
          const bioRes = await fetchBio(currentUser.id);
          if (!cancelled && bioRes.status === "OK" && bioRes.ok != null) {
            updates.bio = bioRes.ok;
          }

          setProfile(updates as UserProfile);
        }
      } catch (e) {
        console.warn("Failed to load profile info:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [userSession]);

  return { profile, loading };
}