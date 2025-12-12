// src/pages/ProfilePage.tsx
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import UploadControls from "../components/UploadControls";
import BioEditor from "../components/BioEditor";
import ProfileDashboard from "../components/ProfileDashboard";
import { useUserProfile } from "../utils/useUserProfile";

const Profile = () => {
  const { userSession, setUserSession } = loadSessionState();
  
  const { profile: userProfile } = useUserProfile(userSession);
  const isEducator = userProfile?.userType === "educator";

  if (!userSession) {
    return (
      <Page title="Quark | Profile" userSession={userSession} setUserSession={setUserSession}>
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          Redirecting to login...
        </div>
      </Page>
    );
  }

  const username = userSession.username || "User";

  return (
    <Page title={`Quark | ${username}'s Profile`} userSession={userSession} setUserSession={setUserSession}>
      <main className="min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Profile Header */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
            <UploadControls userSession={userSession} setUserSession={setUserSession} />
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
                <h1 className="text-3xl font-bold text-white">{username}</h1>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3 mt-1">
                {userProfile?.userType && (
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      isEducator ? "bg-purple-500/20 text-purple-300" : "bg-green-500/20 text-green-300"
                    }`}
                  >
                    {userProfile.userType.charAt(0).toUpperCase() + userProfile.userType.slice(1)}
                  </span>
                )}
              </div>
              <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
                <BioEditor userSession={userSession} setUserSession={setUserSession} />
              </div>
            </div>
          </div>

          {/* Dashboard */}
          <ProfileDashboard userSession={userSession} userProfile={userProfile} />
      
        </div>
      </main>
    </Page>
  );
};

export default Profile;