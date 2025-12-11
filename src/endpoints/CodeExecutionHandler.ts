import axios from "axios";
import { baseUrl, Ok, Err, type Response } from "./Config";

// ---------------------- REQUEST/RESPONSE TYPES ----------------------

export interface CodeSubmissionRequest {
    activityId: number;
    sectionId: number;
    code: string;
    language?: string; // default: "python"
}

export interface CodeExecutionResponse {
    success: boolean;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    testResults: TestCaseResult[];
    error?: string | null;
    executionTimeMs?: number | null;
}

export interface TestCaseResult {
    testNumber: number;
    testName?: string | null;
    passed: boolean;
    expectedOutput?: string | null;
    actualOutput?: string | null;
    errorMessage?: string | null;
    executionTimeMs?: number | null;
}

// ---------------------- SUBMIT CODE ----------------------
export async function submitCode(
    request: CodeSubmissionRequest,
    jwt: string
): Promise<Response<CodeExecutionResponse>> {
    try {
        const config: any = {};
        if (jwt) config.headers = { "Authorization": `Bearer ${jwt}` };

        const response = await axios.post<CodeExecutionResponse>(
            `${baseUrl}/api/code/submit`,
            request,
            config
        );

        return Ok(response.data);
    } catch (e: any) {
        console.error(e);
        if (e.response) {
            const body = e.response.data;
            return Err(typeof body === 'object' ? JSON.stringify(body) : String(body));
        }
        return Err(e.message ?? "Network Error");
    }
}

// ---------------------- RUN CODE (no save) ----------------------
export async function runCode(
    request: CodeSubmissionRequest,
    jwt: string
): Promise<Response<CodeExecutionResponse>> {
    try {
        const config: any = {};
        if (jwt) config.headers = { "Authorization": `Bearer ${jwt}` };

        const response = await axios.post<CodeExecutionResponse>(
            `${baseUrl}/api/code/run`,
            request,
            config
        );

        return Ok(response.data);
    } catch (e: any) {
        console.error(e);
        if (e.response) {
            const body = e.response.data;
            return Err(typeof body === 'object' ? JSON.stringify(body) : String(body));
        }
        return Err(e.message ?? "Network Error");
    }
}
