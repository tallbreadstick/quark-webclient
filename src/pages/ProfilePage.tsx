// src/pages/ProfilePage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import ProfileTab from "../components/ProfileTab";
import UploadControls from "../components/UploadControls";
import BioEditor from "../components/BioEditor";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faCertificate, faChartPie, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { useUserProfile } from "../utils/useUserProfile";

const Profile = () => {
  const { userSession, setUserSession } = loadSessionState();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("achievements");
  
  const { profile: userProfile, loading } = useUserProfile(userSession);
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
                <h1 className="text-3xl font-bold text-white">{username}</h1>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3 mt-1">
                {userProfile?.userType && (
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      isEducator ? "bg-blue-500/20 text-blue-300" : "bg-green-500/20 text-green-300"
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

          {/* Tabs */}
          <ProfileTab tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Achievements */}
            {activeTab === "achievements" && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <FontAwesomeIcon icon={faTrophy} className="text-2xl" />
                  <h2 className="text-xl font-semibold text-white">
                    {isEducator ? "Teaching Achievements" : "Your Badges"}
                  </h2>
                </div>
                <div className="p-6 rounded-lg bg-white/5 text-center text-gray-400">
                  <p className="text-sm">No achievements yet.</p>
                  <p className="text-xs mt-2">
                    {isEducator 
                      ? "Create engaging courses to earn teaching achievements."
                      : "Complete courses to earn achievements and badges."}
                  </p>
                </div>
              </div>
            )}

            {/* Certificates */}
            {activeTab === "certificates" && !isEducator && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
                <FontAwesomeIcon icon={faCertificate} className="text-6xl block mb-4" />
                <p className="text-gray-400 text-lg mb-4">
                  Complete courses to earn certificates and showcase your achievements.
                </p>
                <button 
                  onClick={() => navigate("/marketplace")} 
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Browse Courses
                </button>
              </div>
            )}

            {/* Activity */}
            {activeTab === "activity" && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <FontAwesomeIcon icon={faChartPie} className="text-2xl" />
                  <h2 className="text-xl font-semibold text-white">
                    {isEducator ? "Teaching Activity" : "Recent Activity"}
                  </h2>
                </div>
                <div className="p-6 rounded-lg bg-white/5 text-center text-gray-400">
                  <p className="text-sm">No recent activity.</p>
                  <p className="text-xs mt-2">
                    {isEducator
                      ? "Your teaching activity will appear here once you create and manage courses."
                      : "Your activity will appear here once you start using Quark."}
                  </p>
                </div>
              </div>
            )}

            {/* Analytics - Only for educators */}
            {activeTab === "analytics" && isEducator && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <FontAwesomeIcon icon={faChartLine} className="text-2xl" />
                  <h2 className="text-xl font-semibold text-white">Teaching Analytics</h2>
                </div>
                <div className="p-6 rounded-lg bg-white/5 text-center text-gray-400">
                  <p className="text-sm">No analytics available yet.</p>
                  <p className="text-xs mt-2">
                    Teaching analytics will show here once you create courses and receive student engagement.
                  </p>
                  <button 
                    onClick={() => navigate("/my-courses/create")} 
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    Create Your First Course
                  </button>
                </div>
              </div>
            )}

            {/* Analytics Tab for Students - Show something different or redirect */}
            {activeTab === "analytics" && !isEducator && (
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
                <FontAwesomeIcon icon={faChartLine} className="text-6xl block mb-4" />
                <p className="text-gray-400 text-lg mb-4">
                  Learning analytics will show your progress through courses.
                </p>
                <button 
                  onClick={() => navigate("/marketplace")} 
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Browse Courses to Start Learning
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </Page>
  );
};

export default Profile;