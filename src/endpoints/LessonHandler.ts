import axios from "axios";
import { baseUrl, Ok, Err, type Response } from "./Config";

// ---------------------- Types ----------------------

export interface LessonRequest {
    name: string;
    description: string;
    icon: string;
    finishMessage?: string;
}

export interface LessonContentResponse {
    id: number;
    idx: number;
    name: string;
    description: string;
    icon: string;
    finishMessage?: string;
    pages: { id: number; idx: number }[];
}

// ---------------------- Add Lesson ----------------------
export async function addLesson(
    chapterId: number,
    request: LessonRequest,
    jwt: string
): Promise<Response<string>> {
    try {
        const config: any = { responseType: "text" };
        if (jwt) config.headers = { Authorization: `Bearer ${jwt}` };

        const response = await axios.post(
            `${baseUrl}/api/chapter/${chapterId}/lesson`,
            request,
            config
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");
    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data?.error ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- Edit Lesson ----------------------
export async function editLesson(
    lessonId: number,
    request: LessonRequest,
    jwt: string
): Promise<Response<string>> {
    try {
        const config: any = { responseType: "text" };
        if (jwt) config.headers = { Authorization: `Bearer ${jwt}` };

        const response = await axios.put(
            `${baseUrl}/api/lesson/${lessonId}`,
            request,
            config
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");
    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data?.error ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- Delete Lesson ----------------------
export async function deleteLesson(
    lessonId: number,
    jwt: string
): Promise<Response<string>> {
    try {
        const config: any = { responseType: "text" };
        if (jwt) config.headers = { Authorization: `Bearer ${jwt}` };

        const response = await axios.delete(
            `${baseUrl}/api/lesson/${lessonId}`,
            config
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");
    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data?.error ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- Fetch Lesson ----------------------
export async function fetchLesson(
    lessonId: number,
    jwt: string
): Promise<Response<LessonContentResponse>> {
    try {
        const config: any = {};
        if (jwt) config.headers = { Authorization: `Bearer ${jwt}` };

        const response = await axios.get<LessonContentResponse>(
            `${baseUrl}/api/lesson/${lessonId}`,
            config
        );

        return Ok(response.data);
    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data?.error ?? "Request failed");
        return Err("Network Error");
    }
}
