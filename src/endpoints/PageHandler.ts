import axios from "axios";
import { baseUrl, Ok, Err, type Response } from "./Config";

// ---------------------- REQUEST/RESPONSE TYPES ----------------------

// Renderer matches backend enum Page.Renderer
export type PageRenderer = "MARKDOWN" | "LATEX";

export interface PageRequest {
    renderer: PageRenderer;
    content: string;
}

export interface PageContentResponse {
    renderer: PageRenderer;
    content: string;
}

// ---------------------- ADD PAGE ----------------------
export async function addPage(
    lessonId: number,
    request: PageRequest,
    jwt: string
): Promise<Response<string>> {
    try {
        const config: any = { responseType: "text" };
        if (jwt) config.headers = { "Authorization": `Bearer ${jwt}` };

        const response = await axios.post(
            `${baseUrl}/api/lesson/${lessonId}/page`,
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

// ---------------------- EDIT PAGE ----------------------
export async function editPage(
    pageId: number,
    request: PageRequest,
    jwt: string
): Promise<Response<string>> {
    try {
        const config: any = { responseType: "text" };
        if (jwt) config.headers = { "Authorization": `Bearer ${jwt}` };

        const response = await axios.put(
            `${baseUrl}/api/page/${pageId}`,
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

// ---------------------- DELETE PAGE ----------------------
export async function deletePage(
    pageId: number,
    jwt: string
): Promise<Response<string>> {
    try {
        const config: any = { responseType: "text" };
        if (jwt) config.headers = { "Authorization": `Bearer ${jwt}` };

        const response = await axios.delete(
            `${baseUrl}/api/page/${pageId}`,
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

// ---------------------- REORDER PAGES ----------------------
export async function reorderPages(
    lessonId: number,
    pageIds: number[],
    jwt: string
): Promise<Response<string>> {
    try {
        const config: any = { headers: { "Authorization": `Bearer ${jwt}` } };

        const response = await axios.patch(
            `${baseUrl}/api/lesson/${lessonId}`,
            pageIds,
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

// ---------------------- FETCH PAGE ----------------------
export async function fetchPage(
    pageId: number,
    jwt: string
): Promise<Response<PageContentResponse>> {
    try {
        const config: any = {};
        if (jwt) config.headers = { "Authorization": `Bearer ${jwt}` };

        const response = await axios.get<PageContentResponse>(
            `${baseUrl}/api/page/${pageId}`,
            config
        );

        return Ok(response.data);

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data?.error ?? "Request failed");
        return Err("Network Error");
    }
}
