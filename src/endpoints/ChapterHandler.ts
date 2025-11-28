import axios from "axios";
import { baseUrl, Ok, Err, type Response } from "./Config";

export interface ChapterRequest {
    name: string;
    description: string;
    icon: string;
}

export interface ChapterItem {
    id: number;
    itemType: "ACTIVITY" | "LESSON";
    idx: number;
    name: string;
    description: string;
    icon: string;
    finishMessage?: string;
    ruleset?: string; // only for activities
}

export interface ChapterContentResponse {
    id: number;
    idx: number;
    name: string;
    description: string;
    icon: string;
    items: ChapterItem[];
}

// ---------------------- ADD CHAPTER ----------------------
export async function addChapter(courseId: number, request: ChapterRequest, jwt: string): Promise<Response<string>> {
    try {
        const config: any = { responseType: "text" };
        if (jwt) config.headers = { "Authorization": `Bearer ${jwt}` };

        const response = await axios.post(`${baseUrl}/api/course/${courseId}/chapter`, request, config);
        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- REORDER CHAPTERS ----------------------
export async function reorderChapters(courseId: number, chapterIds: number[], jwt: string): Promise<Response<string>> {
    try {
        const config: any = { headers: { "Authorization": `Bearer ${jwt}` } };
        const response = await axios.patch(`${baseUrl}/api/course/${courseId}`, chapterIds, config);
        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- EDIT CHAPTER ----------------------
export async function editChapter(chapterId: number, request: ChapterRequest, jwt: string): Promise<Response<string>> {
    try {
        const config: any = { responseType: "text" };
        if (jwt) config.headers = { "Authorization": `Bearer ${jwt}` };

        const response = await axios.put(`${baseUrl}/api/chapter/${chapterId}`, request, config);
        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- DELETE CHAPTER ----------------------
export async function deleteChapter(chapterId: number, jwt: string): Promise<Response<string>> {
    try {
        const config: any = { responseType: "text" };
        if (jwt) config.headers = { "Authorization": `Bearer ${jwt}` };

        const response = await axios.delete(`${baseUrl}/api/chapter/${chapterId}`, config);
        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- FETCH CHAPTER WITH ITEMS ----------------------
export async function fetchChapterWithItems(chapterId: number, jwt: string): Promise<Response<ChapterContentResponse>> {
    try {
        const config: any = {};
        if (jwt) config.headers = { "Authorization": `Bearer ${jwt}` };

        const response = await axios.get<ChapterContentResponse>(`${baseUrl}/api/chapter/${chapterId}`, config);
        return Ok(response.data);

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}
