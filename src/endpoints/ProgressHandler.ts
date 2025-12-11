import axios from "axios";
import { baseUrl, Ok, Err, type Response } from "./Config";

export interface CourseProgress {
    id: number;
    courseId: number;
    userId?: number;
    progress?: number; // 0-100
    lastActivity?: string | null;
    enrolledAt?: string | null;
    // backend may include additional fields; keep this flexible
    [key: string]: any;
}

// ---------------------- ENROLL ----------------------
export async function enrollInCourse(courseId: number, jwt: string): Promise<Response<string>> {
    try {
        const config: any = { responseType: "text" };
        if (jwt) config.headers = { Authorization: `Bearer ${jwt}` };

        const response = await axios.post(`${baseUrl}/api/progress/courses/${courseId}/enroll`, null, config);

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- UNENROLL ----------------------
export async function unenrollFromCourse(courseId: number, jwt: string): Promise<Response<string>> {
    try {
        const config: any = { responseType: "text" };
        if (jwt) config.headers = { Authorization: `Bearer ${jwt}` };

        const response = await axios.delete(`${baseUrl}/api/progress/courses/${courseId}/unenroll`, config);

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- GET ENROLLED COURSES ----------------------
export async function getEnrolledCourses(jwt: string): Promise<Response<CourseProgress[]>> {
    try {
        const config: any = {};
        if (jwt) config.headers = { Authorization: `Bearer ${jwt}` };

        const response = await axios.get<CourseProgress[]>(`${baseUrl}/api/progress/courses/enrolled`, config);

        return Ok(response.data);

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- GET COURSE PROGRESS ----------------------
export async function getCourseProgress(courseId: number, jwt: string): Promise<Response<CourseProgress>> {
    try {
        const config: any = {};
        if (jwt) config.headers = { Authorization: `Bearer ${jwt}` };

        const response = await axios.get<CourseProgress>(`${baseUrl}/api/progress/courses/${courseId}`, config);

        return Ok(response.data);

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- IS ENROLLED ----------------------
export async function isEnrolled(courseId: number, jwt: string): Promise<Response<boolean>> {
    try {
        const config: any = {};
        if (jwt) config.headers = { Authorization: `Bearer ${jwt}` };

        const response = await axios.get<boolean>(`${baseUrl}/api/progress/courses/${courseId}/enrolled`, config);

        return Ok(response.data);

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}
