import axios from "axios";
import { baseUrl, Ok, Err, type Response } from "./Config";

// ---------------------- REQUEST/RESPONSE TYPES ----------------------

export interface SectionRequest {
    sectionType: "MCQ" | "CODE";
    mcq?: MCQSection;
    code?: CodeSection;
}

export interface MCQSection {
    instructions: string;
    questions: Question[];
}

export interface Question {
    question: string;
    points: number;
    correct: string;
    choices: string[];
}

export interface CodeSection {
    renderer: "MARKDOWN" | "LATEX";
    instructions: string;
    defaultCode?: string;
    sources?: string[];
    testCases: TestCase[];
}

export interface TestCase {
    expected: string;
    driver: string;
    points: number;
    hidden: boolean;
}

export interface SectionContentResponse {
    id: number;
    sectionType: "MCQ" | "CODE";
    mcq?: MCQSection;
    code?: CodeSection;
}

// ---------------------- ADD SECTION ----------------------
export async function addSection(
    activityId: number,
    request: SectionRequest,
    jwt: string
): Promise<Response<string>> {
    try {
        const config: any = { responseType: "text" };
        if (jwt) config.headers = { "Authorization": `Bearer ${jwt}` };

        const response = await axios.post(
            `${baseUrl}/api/activity/${activityId}/section`,
            request,
            config
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");
    } catch (e: any) {
        console.error(e);
        if (e.response) {
            const body = e.response.data;
            return Err(typeof body === 'object' ? JSON.stringify(body) : String(body));
        }
        return Err(e.message ?? "Network Error");
    }
}

// ---------------------- EDIT SECTION ----------------------
export async function editSection(
    sectionId: number,
    request: SectionRequest,
    jwt: string
): Promise<Response<string>> {
    try {
        const config: any = { responseType: "text" };
        if (jwt) config.headers = { "Authorization": `Bearer ${jwt}` };

        const response = await axios.put(
            `${baseUrl}/api/section/${sectionId}`,
            request,
            config
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");
    } catch (e: any) {
        console.error(e);
        if (e.response) {
            const body = e.response.data;
            return Err(typeof body === 'object' ? JSON.stringify(body) : String(body));
        }
        return Err(e.message ?? "Network Error");
    }
}

// ---------------------- DELETE SECTION ----------------------
export async function deleteSection(
    sectionId: number,
    jwt: string
): Promise<Response<string>> {
    try {
        const config: any = { responseType: "text" };
        if (jwt) config.headers = { "Authorization": `Bearer ${jwt}` };

        const response = await axios.delete(
            `${baseUrl}/api/section/${sectionId}`,
            config
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");
    } catch (e: any) {
        console.error(e);
        if (e.response) {
            const body = e.response.data;
            return Err(typeof body === 'object' ? JSON.stringify(body) : String(body));
        }
        return Err(e.message ?? "Network Error");
    }
}

// ---------------------- REORDER SECTIONS ----------------------
export async function reorderSections(
    activityId: number,
    sectionIds: number[],
    jwt: string
): Promise<Response<string>> {
    try {
        const config: any = { headers: { "Authorization": `Bearer ${jwt}` } };

        const response = await axios.patch(
            `${baseUrl}/api/activity/${activityId}`,
            sectionIds,
            config
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");
    } catch (e: any) {
        console.error(e);
        if (e.response) {
            const body = e.response.data;
            return Err(typeof body === 'object' ? JSON.stringify(body) : String(body));
        }
        return Err(e.message ?? "Network Error");
    }
}

// ---------------------- FETCH SECTION ----------------------
export async function fetchSection(
    sectionId: number,
    jwt: string
): Promise<Response<SectionContentResponse>> {
    try {
        const config: any = {};
        if (jwt) config.headers = { "Authorization": `Bearer ${jwt}` };

        const response = await axios.get<SectionContentResponse>(
            `${baseUrl}/api/section/${sectionId}`,
            config
        );

        return Ok(response.data);
    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data?.error ?? "Request failed");
        return Err("Network Error");
    }
}
