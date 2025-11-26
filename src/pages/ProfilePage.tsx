import { useEffect, useState, type FC } from "react";
import { useNavigate } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import ProfileTab from "../components/ProfileTab";
import { fetchUsers } from "../endpoints/UserHandler";
import {
  uploadProfilePicture,
  fetchProfilePicture,
  clearProfilePicture,
  updateBio,
  fetchBio,
} from "../endpoints/ProfileHandler";
import {
  educatorTabs,
  learnerTabs,
  mockAchievements,
  mockAnalytics,
  mockActivities,
} from "../data/profileData";

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

    const preview = selected ? URL.createObjectURL(selected) : undefined;

    useEffect(() => {
      return () => {
        if (preview) URL.revokeObjectURL(preview);
      };
    }, [preview]);

    const doUpload = async () => {
      if (!selected) return setError("Please select a file");
      if (!userSession?.jwt) return setError("Not authenticated");
      setUploading(true);
      setError(null);
      try {
        const res = await uploadProfilePicture(selected, userSession.jwt);
        if (res.status === "OK") {
          const lookupId = userSession.username || userSession.email;
          const usersRes = await fetchUsers(lookupId);
          if (usersRes.status === "OK" && usersRes.ok.length > 0) {
            const uid = usersRes.ok[0].id;
            const picRes = await fetchProfilePicture(uid);
            if (picRes.status === "OK" && picRes.ok) {
              const dataUrl = picRes.ok.startsWith("data:")
                ? picRes.ok
                : `data:image/png;base64,${picRes.ok}`;
              setUserSession((prev) =>
                prev ? { ...prev, profilePictureUrl: dataUrl } : prev
              );
              setSelected(null);
            }
          }
        } else setError(res.err ?? "Upload failed");
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setUploading(false);
      }
    };

    const doClear = async () => {
      if (!userSession?.jwt) return setError("Not authenticated");
      setUploading(true);
      setError(null);
      try {
        const res = await clearProfilePicture(userSession.jwt);
        if (res.status === "OK")
          setUserSession((prev) =>
            prev ? { ...prev, profilePictureUrl: null } : prev
          );
        else setError(res.err ?? "Failed to clear profile picture");
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="flex flex-col items-center gap-3">
        <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-cyan-400 shadow-md">
          <img
            src={preview ?? userSession.profilePictureUrl ?? undefined}
            alt={userSession.username ?? "Profile image"}
            className="w-full h-full object-cover bg-gradient-to-br from-slate-900 to-slate-700"
          />
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-md cursor-pointer hover:bg-white/20 transition text-sm">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelected(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <span>{selected ? selected.name : "Choose image"}</span>
        </label>

        <div className="flex gap-2">
          <button
            onClick={doUpload}
            disabled={uploading || !selected}
            className="px-4 py-1 bg-green-600 rounded-md text-white hover:bg-green-700 transition"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
          <button
            onClick={doClear}
            disabled={uploading}
            className="px-4 py-1 bg-red-600 rounded-md text-white hover:bg-red-700 transition"
          >
            Clear
          </button>
        </div>
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
    if (!userSession) return navigate("/login");

    const loadProfile = async () => {
      try {
        const id = userSession.username || userSession.email;
        const res = await fetchUsers(id);
        if (res.status === "OK" && res.ok.length > 0) {
          const p = res.ok[0];
          setProfileUserType(p.userType === "EDUCATOR" ? "educator" : "learner");

          const picRes = await fetchProfilePicture(p.id);
          if (picRes.status === "OK" && picRes.ok) {
            const dataUrl = picRes.ok.startsWith("data:")
              ? picRes.ok
              : `data:image/png;base64,${picRes.ok}`;
            setUserSession((prev) =>
              prev ? { ...prev, profilePictureUrl: dataUrl } : prev
            );
          }

          const bioRes = await fetchBio(p.id);
          if (bioRes.status === "OK" && bioRes.ok != null) {
            setUserSession((prev) =>
              prev ? { ...prev, bio: bioRes.ok } : prev
            );
          }
        }
      } catch (e) {
        console.warn("Failed to load profile info:", e);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

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
  const tabs = isEducator ? educatorTabs : learnerTabs;
  const achievements = isEducator ? mockAchievements.educator : mockAchievements.learner;
  const activities = isEducator ? mockActivities.educator : mockActivities.learner;

  return (
    <Page title={`Quark | ${username}'s Profile`} userSession={userSession} setUserSession={setUserSession}>
      <main className="min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Profile Header */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
            <UploadControls userSession={userSession} setUserSession={setUserSession} />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-white">{username}</h1>
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-1">
                <span className="text-gray-400 text-sm">{isEducator ? "Educator" : "Learner"}</span>
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
            <div className="flex flex-col items-end gap-3">
              <div className="text-sm text-gray-300">Member since • <span className="font-semibold">2023</span></div>
              <button className="px-5 py-2 bg-purple-600 rounded-lg text-white hover:bg-blue-700 transition font-semibold">Edit Profile</button>
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
                  <span className="text-2xl">🏆</span>
                  <h2 className="text-xl font-semibold text-white">{isEducator ? "Teaching Achievements" : "Your Badges"}</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {achievements.map(a => (
                    <div key={a.id} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition">
                      <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-2xl">{a.icon}</span>
                      </div>
                      <span className="text-sm font-medium text-white text-center">{a.title}</span>
                      <span className="text-xs text-gray-400 text-center">{a.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certificates */}
            {activeTab === "certificates" && !isEducator && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
                <span className="text-6xl block mb-4">📜</span>
                <p className="text-gray-400 text-lg mb-4">Complete courses to earn certificates and showcase your achievements.</p>
                <button onClick={() => navigate("/marketplace")} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">Browse Courses</button>
              </div>
            )}

            {/* Activity */}
            {activeTab === "activity" && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-2xl">📊</span>
                  <h2 className="text-xl font-semibold text-white">{isEducator ? "Teaching Activity" : "Recent Activity"}</h2>
                </div>
                <div className="space-y-3">
                  {activities.map(a => (
                    <div key={a.id} className="flex items-start gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition">
                      <div className="h-2 w-2 rounded-full bg-blue-400 mt-3 flex-shrink-0" />
                      <div>
                        <p className="text-white font-medium">{a.title}</p>
                        <p className="text-gray-400 text-sm mt-1">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics */}
            {activeTab === "analytics" && isEducator && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-2xl">📈</span>
                  <h2 className="text-xl font-semibold text-white">Teaching Analytics</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mockAnalytics.map((analytic, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-5 hover:bg-white/10 transition">
                      <h3 className="text-lg font-semibold text-white mb-2">{analytic.title}</h3>
                      <p className={`text-3xl font-bold ${analytic.color}`}>{analytic.value}</p>
                      <p className="text-gray-400 text-sm mt-1">{analytic.description}</p>
                    </div>
                  ))}
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
