import axios from "axios";
import { baseUrl, Ok, Err, type Response } from "./Config";

export interface CourseRequest {
    name: string;
    description: string;
    introduction: string;
    forkable: boolean;
    visibility: "PUBLIC" | "PRIVATE" | "UNLISTED";
    tags: string[];
}

export interface CourseContentResponse {
    id: number;
    name: string;
    description: string;
    introduction: string;
    forkable: boolean;
    tags: string[];
    chapters: CourseChapter[];
}

export interface CourseChapter {
    id: number;
    idx: number;
    name: string;
    description: string;
    icon: string;
}

// ---------------------- CREATE COURSE ----------------------
export async function createCourse(request: CourseRequest, jwt: string): Promise<Response<string>> {
    try {
        const response = await axios.post(
            `${baseUrl}/api/courses`,
            request,
            {
                headers: { "Authorization": `Bearer ${jwt}` },
                responseType: "text"
            }
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- FORK COURSE ----------------------
export async function forkCourse(courseId: number, request: CourseRequest, jwt: string): Promise<Response<string>> {
    try {
        const response = await axios.post(
            `${baseUrl}/api/courses/${courseId}`,
            request,
            {
                headers: { "Authorization": `Bearer ${jwt}` },
                responseType: "text"
            }
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- EDIT COURSE ----------------------
export async function editCourse(courseId: number, request: CourseRequest, jwt: string): Promise<Response<string>> {
    try {
        const response = await axios.put(
            `${baseUrl}/api/courses/${courseId}`,
            request,
            {
                headers: { "Authorization": `Bearer ${jwt}` },
                responseType: "text"
            }
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- DELETE COURSE ----------------------
export async function deleteCourse(courseId: number, jwt: string): Promise<Response<string>> {
    try {
        const response = await axios.delete(
            `${baseUrl}/api/courses/${courseId}`,
            {
                headers: { "Authorization": `Bearer ${jwt}` },
                responseType: "text"
            }
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- FETCH COURSES WITH FILTER ----------------------
export async function fetchCourses(params: Record<string, string | undefined>, jwt: string): Promise<Response<CourseContentResponse[]>> {
    try {
        const response = await axios.get<CourseContentResponse[]>(
            `${baseUrl}/api/courses`,
            {
                headers: { "Authorization": `Bearer ${jwt}` },
                params
            }
        );

        return Ok(response.data);

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- FETCH COURSE WITH CHAPTERS ----------------------
export async function fetchCourseWithChapters(courseId: number, jwt: string): Promise<Response<CourseContentResponse>> {
    try {
        const response = await axios.get<CourseContentResponse>(
            `${baseUrl}/api/courses/${courseId}`,
            { headers: { "Authorization": `Bearer ${jwt}` } }
        );

        return Ok(response.data);

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- SHARE COURSE ----------------------
export async function shareCourse(courseId: number, targetUserId: number, jwt: string): Promise<Response<string>> {
    try {
        const response = await axios.post(
            `${baseUrl}/api/courses/share`,
            { courseId, userId: targetUserId },
            {
                headers: { "Authorization": `Bearer ${jwt}` },
                responseType: "text"
            }
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}
