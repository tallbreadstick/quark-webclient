import { useEffect, useState, useRef, type FC } from "react";
import { useNavigate } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import ProfileTab from "../components/ProfileTab";
import { fetchUsers } from "../endpoints/UserHandler";
import { createPortal } from "react-dom";
import {
  uploadProfilePicture,
  fetchProfilePicture,
  clearProfilePicture,
  updateBio,
  fetchBio,
} from "../endpoints/ProfileHandler";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faCertificate, faChartPie, faChartLine } from '@fortawesome/free-solid-svg-icons';
// icons/dropdown handled by Navbar
// No hardcoded tab/course data — tabs start empty when no courses exist

interface UserSession {
  username: string;
  email: string;
  jwt: string;
  profilePictureUrl?: string | null;
  bio?: string | null;
}

const Profile = () => {
  const { userSession, setUserSession } = loadSessionState();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("achievements");
  const [profileUserType, setProfileUserType] = useState<
    "educator" | "learner" | undefined
  >(undefined);

/* -------------------------- UploadControls -------------------------- */
  const UploadControls: FC<{
    userSession: UserSession;
    setUserSession: React.Dispatch<React.SetStateAction<UserSession | null>>;
  }> = ({ userSession, setUserSession }) => {
    const [selected, setSelected] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const modalRef = useRef<HTMLDivElement | null>(null);

    const preview = selected ? URL.createObjectURL(selected) : undefined;

    useEffect(() => {
      return () => {
        if (preview) URL.revokeObjectURL(preview);
      };
    }, [preview]);

    // close modal when clicking outside or pressing Escape
    useEffect(() => {
      const onDoc = (e: MouseEvent) => {
        if (!menuOpen) return;
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          setMenuOpen(false);
        }
      };

      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setMenuOpen(false);
      };

      document.addEventListener("mousedown", onDoc);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onDoc);
        document.removeEventListener("keydown", onKey);
      };
    }, [menuOpen]);

    const doUpload = async (fileParam?: File | null) => {
        // ... (Keep existing doUpload logic exactly as is) ...
        // (Hidden for brevity, paste your existing doUpload function here)
        setError(null);
        const fileToUpload = fileParam ?? selected;
        if (!fileToUpload) return setError("Please select a file");
        if (!userSession?.jwt) return setError("Not authenticated");

        const maxBytes = 5 * 1024 * 1024;
        if (fileToUpload.size > maxBytes) return setError("File is too large (max 5MB)");

        setUploading(true);
        try {
            const res = await uploadProfilePicture(fileToUpload, userSession.jwt);
            if (res.status !== "OK") {
            return setError(res.err ?? String(res.ok ?? "Upload failed"));
            }

            const lookupId = userSession.username || userSession.email;
            const usersRes = await fetchUsers(lookupId);
            if (usersRes.status === "OK" && usersRes.ok && usersRes.ok.length > 0) {
            const uid = usersRes.ok[0].id;
            const picRes = await fetchProfilePicture(uid);
            if (picRes.status === "OK" && picRes.ok) {
                const dataUrl = picRes.ok.startsWith("data:")
                ? picRes.ok
                : `data:image/png;base64,${picRes.ok}`;
                setUserSession((prev) => (prev ? { ...prev, profilePictureUrl: dataUrl } : prev));
                setSelected(null);
                setMenuOpen(false);
                return;
            }
            }
            setSelected(null);
            setMenuOpen(false);
            setError("Uploaded but failed to retrieve updated profile picture");
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setUploading(false);
        }
    };

    const doClear = async () => {
       // ... (Keep existing doClear logic exactly as is) ...
       // (Hidden for brevity, paste your existing doClear function here)
       if (!userSession?.jwt) return setError("Not authenticated");
       setUploading(true);
       setError(null);
       try {
         const res = await clearProfilePicture(userSession.jwt);
         if (res.status === "OK") {
           if (selected) {
             setSelected(null);
           }
           setUserSession((prev) => (prev ? { ...prev, profilePictureUrl: null } : prev));
           setMenuOpen(false);
         } else setError(res.err ?? "Failed to clear profile picture");
       } catch (e: any) {
         setError(e?.message || String(e));
       } finally {
         setUploading(false);
       }
    };

    return (
      <div className="flex flex-col items-center gap-3 relative">
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            // Open the local upload modal when avatar is clicked
            setMenuOpen(true);
          }}
          className="w-28 h-28 rounded-full overflow-hidden border-2 border-cyan-400 shadow-md flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 cursor-pointer relative"
        >
          {(preview ?? userSession.profilePictureUrl) ? (
            <img
              src={(preview ?? userSession.profilePictureUrl) as string}
              alt={userSession.username ?? "Profile image"}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white font-semibold">{(userSession.username || userSession.email || "U").charAt(0).toUpperCase()}</span>
          )}

        </div>

        {/* --- MODAL WITH PORTAL --- */}
        {menuOpen && createPortal(
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[9999] flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Manage profile image">
            <div ref={modalRef} className="bg-[#1a1f2e] border border-white/10 rounded-xl p-6 max-w-sm w-[90%] flex flex-col items-center gap-4 shadow-2xl relative">
              
              {/* Optional: Add a subtle glow behind the modal content */}
              <div className="absolute inset-0 bg-blue-500/5 blur-xl rounded-xl -z-10" />

              <h3 className="text-white text-lg font-medium">Update Photo</h3>
              
              <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-cyan-400 shadow-md bg-gradient-to-br from-slate-900 to-slate-700">
                {(preview ?? userSession.profilePictureUrl) ? (
                  <img src={(preview ?? userSession.profilePictureUrl) as string} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-semibold">{(userSession.username || userSession.email || "U").charAt(0).toUpperCase()}</div>
                )}
              </div>

              <div className="w-full flex flex-col sm:flex-row gap-3 mt-2">
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-lg shadow-green-900/20">{uploading ? "Uploading..." : "Upload New"}</button>
                <button onClick={doClear} disabled={uploading} className="flex-1 px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition shadow-lg shadow-red-900/20">Remove</button>
              </div>

              <div className="w-full text-right">
                <button onClick={() => setMenuOpen(false)} className="text-sm text-gray-400 hover:text-white transition">Cancel</button>
              </div>
            </div>
          </div>,
          document.body // Target container
        )}

        {/* hidden file input used by upload menu */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            if (!f) return;
            setSelected(f);
            void doUpload(f);
          }}
        />

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  };

  /* -------------------------- BioEditor -------------------------- */
  const BioEditor: FC<{
    userSession: UserSession;
    setUserSession: React.Dispatch<React.SetStateAction<UserSession | null>>;
  }> = ({ userSession, setUserSession }) => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(userSession?.bio ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      setValue(userSession?.bio ?? "");
    }, [userSession?.bio]);

    const doSave = async () => {
      if (!userSession?.jwt) return setError("Not authenticated");
      setSaving(true);
      setError(null);
      try {
        const res = await updateBio(value ?? "", userSession.jwt);
        if (res.status === "OK") {
          setUserSession((prev) =>
            prev ? { ...prev, bio: value } : prev
          );
          setEditing(false);
        } else setError(res.err ?? "Failed to save bio");
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setSaving(false);
      }
    };

    const doClear = async () => {
      if (!userSession?.jwt) return setError("Not authenticated");
      setSaving(true);
      setError(null);
      try {
        const res = await updateBio(" ", userSession.jwt);
        if (res.status === "OK") {
          setUserSession((prev) =>
            prev ? { ...prev, bio: "" } : prev
          );
          setValue("");
          setEditing(false);
        } else setError(res.err ?? "Failed to clear bio");
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="w-full">
        {!editing ? (
          <div className="flex justify-between items-start gap-4">
            <p className="text-gray-200 text-sm leading-relaxed break-words max-w-xl">
              {userSession?.bio ? (
                userSession.bio
              ) : (
                <span className="text-gray-400 italic">
                  No bio yet — add a short introduction about yourself.
                </span>
              )}
            </p>
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-md bg-white/10 text-white placeholder-gray-400 text-sm"
              placeholder="Write something about yourself..."
            />
            <div className="flex gap-2">
              <button
                onClick={doSave}
                disabled={saving}
                className="px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={doClear}
                disabled={saving}
                className="px-4 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  setValue(userSession?.bio ?? "");
                  setEditing(false);
                }}
                className="px-4 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        )}
      </div>
    );
  };

  /* -------------------------- Load profile info -------------------------- */
  useEffect(() => {
    // only run when identifier changes (username or email)
    const identifier = userSession?.username ?? userSession?.email ?? null;

    if (!userSession) {
      navigate("/login");
      return;
    }

    if (!identifier) return;

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const res = await fetchUsers(identifier);
        if (cancelled) return;
        if (res.status === "OK" && res.ok && res.ok.length > 0) {
          const p = res.ok[0];
          setProfileUserType(p.userType === "EDUCATOR" ? "educator" : "learner");

          // Fetch picture and bio, but only update session if values changed
          const updates: Partial<UserSession> = {};

          const picRes = await fetchProfilePicture(p.id);
          if (!cancelled && picRes.status === "OK" && picRes.ok) {
            const dataUrl = picRes.ok.startsWith("data:")
              ? picRes.ok
              : `data:image/png;base64,${picRes.ok}`;
            if (dataUrl !== userSession.profilePictureUrl) updates.profilePictureUrl = dataUrl;
          }

          const bioRes = await fetchBio(p.id);
          if (!cancelled && bioRes.status === "OK" && bioRes.ok != null) {
            if (bioRes.ok !== userSession.bio) updates.bio = bioRes.ok;
          }

          if (Object.keys(updates).length > 0) {
            setUserSession((prev) => (prev ? { ...prev, ...updates } : prev));
          }
        }
      } catch (e) {
        console.warn("Failed to load profile info:", e);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
    // only depend on identifier (username/email) and navigate
  }, [userSession?.username, userSession?.email, navigate]);

  if (!userSession)
    return (
      <Page title="Quark | Profile" userSession={userSession} setUserSession={setUserSession}>
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          Redirecting to login...
        </div>
      </Page>
    );

  const username = userSession.username || "User";
  const isEducator = profileUserType === "educator";
  
  // No courses yet — start with empty tabs and empty content
  const tabs: any[] = [];

  

  return (
    <Page title={`Quark | ${username}'s Profile`} userSession={userSession} setUserSession={setUserSession}>
      <main className="min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Profile Header */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
            <UploadControls userSession={userSession} setUserSession={setUserSession} />
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
                <h1 className="text-3xl font-bold text-white">
                  {username}
                </h1>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3 mt-1">
                
                {profileUserType && (
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      isEducator ? "bg-blue-500/20 text-blue-300" : "bg-green-500/20 text-green-300"
                    }`}
                  >
                    {profileUserType.charAt(0).toUpperCase() + profileUserType.slice(1)}
                  </span>
                )}
              </div>
              <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
                <BioEditor userSession={userSession} setUserSession={setUserSession} />
              </div>
            </div>
          </div>



          {/* Tabs */}
          <ProfileTab tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab content */}
          <div className="space-y-6">
            {/* Achievements */}
            {activeTab === "achievements" && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-2xl"><FontAwesomeIcon icon={faTrophy} /></span>
                  <h2 className="text-xl font-semibold text-white">{isEducator ? "Teaching Achievements" : "Your Badges"}</h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-6 rounded-lg bg-white/5 text-center text-gray-400">
                    <p className="text-sm">No achievements yet.</p>
                    <p className="text-xs mt-2">Complete or create courses to earn achievements.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Certificates */}
            {activeTab === "certificates" && !isEducator && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
                <span className="text-6xl block mb-4"><FontAwesomeIcon icon={faCertificate} /></span>
                <p className="text-gray-400 text-lg mb-4">Complete courses to earn certificates and showcase your achievements.</p>
                <button onClick={() => navigate("/marketplace")} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">Browse Courses</button>
              </div>
            )}

            {/* Activity */}
            {activeTab === "activity" && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-2xl"><FontAwesomeIcon icon={faChartPie} /></span>
                  <h2 className="text-xl font-semibold text-white">{isEducator ? "Teaching Activity" : "Recent Activity"}</h2>
                </div>
                <div className="p-6 rounded-lg bg-white/5 text-center text-gray-400">
                  <p className="text-sm">No recent activity.</p>
                  <p className="text-xs mt-2">Your activity will appear here once you start using Quark.</p>
                </div>
              </div>
            )}

            {/* Analytics */}
            {activeTab === "analytics" && isEducator && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-2xl"><FontAwesomeIcon icon={faChartLine} /></span>
                  <h2 className="text-xl font-semibold text-white">Teaching Analytics</h2>
                </div>
                <div className="p-6 rounded-lg bg-white/5 text-center text-gray-400">
                  <p className="text-sm">No analytics available yet.</p>
                  <p className="text-xs mt-2">Teaching analytics will show here once you create courses and receive engagement.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </Page>
  );
};

export default Profile;
