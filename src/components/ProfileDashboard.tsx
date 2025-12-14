// src/components/ProfileDashboard.tsx
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faGraduationCap, faUser } from '@fortawesome/free-solid-svg-icons';
import { fetchCourses } from "../endpoints/CourseHandler";
import { type UserSession } from "../types/UserSession";

interface DashboardStats {
  totalCourses: number;
  ownedCourses: number;
  enrolledCourses: number;
  loading: boolean;
}

export const ProfileDashboard = ({ userSession, userProfile }: { userSession: UserSession; userProfile: any }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    ownedCourses: 0,
    enrolledCourses: 0,
    loading: true,
  });

  const isEducator = userProfile?.userType === "educator";
  const isLearner = userProfile?.userType === "learner";

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        // Fetch total courses in database
        const allCoursesResponse = await fetchCourses({}, userSession.jwt);
        const totalCourses = allCoursesResponse.status === "OK" && allCoursesResponse.ok 
          ? allCoursesResponse.ok.length 
          : 0;

        if (isEducator) {
          // Fetch courses owned by educator
          const ownedCoursesResponse = await fetchCourses(
            { owner: userSession.username },
            userSession.jwt
          );

          const ownedCount = ownedCoursesResponse.status === "OK" && ownedCoursesResponse.ok
            ? ownedCoursesResponse.ok.length
            : 0;

          setStats({
            totalCourses,
            ownedCourses: ownedCount,
            enrolledCourses: 0,
            loading: false,
          });
        } else if (isLearner) {
          // Fetch enrolled courses for learner using the same method as CoursesPage
          const enrolledResponse = await fetchCourses(
            { enrolled: 'true' },
            userSession.jwt ?? ""
          );
          
          // Count the total number of enrolled courses
          const enrolledCount = enrolledResponse.status === "OK" && enrolledResponse.ok
            ? enrolledResponse.ok.length
            : 0;

          console.log(`Student enrolled in ${enrolledCount} courses`);

          setStats({
            totalCourses,
            ownedCourses: 0,
            enrolledCourses: enrolledCount,
            loading: false,
          });
        } else {
          // Default case for other user types
          setStats({
            totalCourses,
            ownedCourses: 0,
            enrolledCourses: 0,
            loading: false,
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    if (userSession?.jwt) {
      fetchUserStats();
    }
  }, [userSession, isEducator, isLearner]);

  // Wait for both stats and userProfile to load to prevent color flash
  if (stats.loading || !userProfile?.userType) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white/5 rounded-lg p-4 animate-pulse">
              <div className="h-8 bg-white/10 rounded mb-2"></div>
              <div className="h-4 bg-white/10 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const accountDetails = {
    username: userSession.username,
    email: userSession.email,
    userType: userProfile?.userType || "Unknown",
  };

  const dashboardCards = isEducator
    ? [
        {
          icon: faBook,
          label: "Owned Courses",
          value: stats.ownedCourses,
          color: "from-purple-500 to-purple-600",
          bgColor: "bg-purple-500/10",
        },  
      ]
    : [
        {
          icon: faGraduationCap,
          label: "Enrolled Courses",
          value: stats.enrolledCourses,
          color: "from-green-500 to-green-600",
          bgColor: "bg-green-500/10",
        },
      ];

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Insights</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Details Card */}
        <div className="bg-blue-500/10 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">Account Details</h3>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
              <FontAwesomeIcon icon={faUser} className="text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Username:</span>
              <span className="text-sm font-medium text-white">{accountDetails.username}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Email:</span>
              <span className="text-sm font-medium text-white truncate ml-2">{accountDetails.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">User Type:</span>
              <span className="text-sm font-medium text-white capitalize">{accountDetails.userType}</span>
            </div>
          </div>
        </div>
        
        {/* Course Stats Cards */}
        {dashboardCards.map((card, index) => (
          <div
            key={index}
            className={`${card.bgColor} border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">{card.label}</h3>
              <div className={`bg-gradient-to-br ${card.color} p-2 rounded-lg`}>
                <FontAwesomeIcon icon={card.icon} className="text-white" />
              </div>
            </div>
            <p className="text-6xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileDashboard;