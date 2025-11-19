import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";

const Profile = () => {
  const { userSession, setUserSession } = loadSessionState();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("achievements");

  // Redirect if not logged in
  useEffect(() => {
    if (!userSession) {
      navigate("/login");
    }
  }, [userSession, navigate]);

  if (!userSession) {
    return (
      <Page title="Quark | Profile" userSession={userSession} setUserSession={setUserSession}>
        <div className="min-h-screen flex items-center justify-center cursor-default">
          <div className="text-center text-gray-400">
            Redirecting to login...
          </div>
        </div>
      </Page>
    );
  }

  const username = userSession.username || "User";
  const isEducator = userSession.userType === 'educator';

  // Define tabs based on user role
  const educatorTabs = [
    { id: "achievements", label: "Achievements", emoji: "🏆" },
    { id: "analytics", label: "Analytics", emoji: "📈" },
    { id: "activity", label: "Activity", emoji: "📊" }
  ];

  const learnerTabs = [
    { id: "achievements", label: "Achievements", emoji: "🏆" },
    { id: "certificates", label: "Certificates", emoji: "📜" },
    { id: "activity", label: "Activity", emoji: "📊" }
  ];

  const tabs = isEducator ? educatorTabs : learnerTabs;

  return (
    <Page title={`Quark | ${username}'s Profile`} userSession={userSession} setUserSession={setUserSession}>
      <main className="relative z-10 min-h-[calc(100vh-7rem)] px-6 py-8 text-gray-200 cursor-default">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Header Card */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 cursor-default">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0 cursor-pointer" onClick={() => {/* Add avatar upload functionality */}}>
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-cyan-400 hover:border-cyan-300 transition-colors">
                  <span className="text-white font-bold text-2xl">
                    {username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              
              {/* User Info */}
              <div className="flex-1 text-center sm:text-left cursor-default">
                <h1 className="text-2xl font-bold text-white mb-2">{username}</h1>
                <p className="text-gray-400">
                  {isEducator 
                    ? "Educator inspiring future generations" 
                    : "Curious learner exploring the cosmos"
                  }
                </p>
                {userSession.userType && (
                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium cursor-default ${
                      isEducator
                        ? "bg-blue-500/20 text-blue-300"
                        : userSession.userType === 'learner'
                        ? "bg-green-500/20 text-green-300"
                        : "bg-purple-500/20 text-purple-300"
                    }`}>
                      {userSession.userType.charAt(0).toUpperCase() + userSession.userType.slice(1)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Edit Profile Button */}
              <button className="px-4 py-2 bg-purple-600 rounded-lg text-white hover:bg-blue-700 transition font-semibold cursor-pointer">
                Edit Profile
              </button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-1 cursor-default">
            <div className={`grid gap-1 ${isEducator ? 'grid-cols-3' : 'grid-cols-3'}`}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="text-lg">{tab.emoji}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6 cursor-default">
            {/* Achievements Tab */}
            {activeTab === "achievements" && (
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6 cursor-default">
                  <span className="text-2xl">🏆</span>
                  <h2 className="text-xl font-semibold text-white">
                    {isEducator ? "Teaching Achievements" : "Your Badges"}
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-2xl">
                          {isEducator ? "👨‍🏫" : "⭐"}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-white text-center">
                        {isEducator ? `Teaching Badge ${i}` : `Badge ${i}`}
                      </span>
                      <span className="text-xs text-gray-400 text-center">
                        {isEducator ? `${i * 25} students reached` : "Achievement description"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certificates Tab (Learners Only) */}
            {activeTab === "certificates" && !isEducator && (
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6 cursor-default">
                  <span className="text-2xl">📜</span>
                  <h2 className="text-xl font-semibold text-white">Earned Certificates</h2>
                </div>
                <div className="text-center py-12">
                  <span className="text-6xl text-gray-600 mb-4 block">📜</span>
                  <p className="text-gray-400 text-lg mb-4">
                    Complete courses to earn certificates and showcase your achievements.
                  </p>
                  <button 
                    onClick={() => navigate("/marketplace")}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold cursor-pointer"
                  >
                    Browse Courses
                  </button>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6 cursor-default">
                  <span className="text-2xl">📊</span>
                  <h2 className="text-xl font-semibold text-white">
                    {isEducator ? "Teaching Activity" : "Recent Activity"}
                  </h2>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="h-2 w-2 rounded-full bg-blue-400 mt-3 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {isEducator 
                            ? `Published new course module ${i}`
                            : `Completed lesson ${i} in Data Structures`
                          }
                        </p>
                        <p className="text-gray-400 text-sm mt-1">2 hours ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Tab (Educators Only) */}
            {activeTab === "analytics" && isEducator && (
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6 cursor-default">
                  <span className="text-2xl">📈</span>
                  <h2 className="text-xl font-semibold text-white">Teaching Analytics</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors cursor-pointer">
                    <h3 className="text-lg font-semibold text-white mb-2">Student Engagement</h3>
                    <p className="text-3xl font-bold text-blue-400">85%</p>
                    <p className="text-gray-400 text-sm mt-2">Average completion rate</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors cursor-pointer">
                    <h3 className="text-lg font-semibold text-white mb-2">Total Students</h3>
                    <p className="text-3xl font-bold text-green-400">247</p>
                    <p className="text-gray-400 text-sm mt-2">Across all courses</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors cursor-pointer">
                    <h3 className="text-lg font-semibold text-white mb-2">Course Rating</h3>
                    <p className="text-3xl font-bold text-yellow-400">4.8★</p>
                    <p className="text-gray-400 text-sm mt-2">Based on 89 reviews</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors cursor-pointer">
                    <h3 className="text-lg font-semibold text-white mb-2">Content Published</h3>
                    <p className="text-3xl font-bold text-purple-400">12</p>
                    <p className="text-gray-400 text-sm mt-2">Courses created</p>
                  </div>
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