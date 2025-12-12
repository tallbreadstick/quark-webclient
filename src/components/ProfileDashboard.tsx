// src/components/ProfileDashboard.tsx
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
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

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        // Fetch courses by username (owned courses)
        const coursesResponse = await fetchCourses(
          { owner: userSession.username },
          userSession.jwt
        );

        if (coursesResponse.status === "OK" && coursesResponse.ok) {
          setStats({
            totalCourses: coursesResponse.ok.length,
            ownedCourses: coursesResponse.ok.length,
            enrolledCourses: 0, // Can be extended later with enrollment data
            loading: false,
          });
        } else {
          setStats((prev) => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    if (userSession?.jwt) {
      fetchUserStats();
    }
  }, [userSession]);

  if (stats.loading) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>
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

  const dashboardCards = [
    {
      icon: faBook,
      label: "Total Courses",
      value: stats.totalCourses,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: faGraduationCap,
      label: "Owned Courses",
      value: stats.ownedCourses,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <p className="text-3xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileDashboard;
