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
/**
 * Submit code for grading (saves submission and runs all test cases)
 * 
 * @param request Code submission with activity, section, code, and language
 * @param jwt JWT authentication token
 * @returns Response with execution results including test outcomes
 */
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

        if (response.status === 200 && response.data) {
            return Ok(response.data);
        }
        return Err("Invalid response from server");
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
/**
 * Run code against test cases (does not save submission)
 * 
 * @param request Code submission with activity, section, code, and language
 * @param jwt JWT authentication token
 * @returns Response with execution results including test outcomes
 */
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

        if (response.status === 200 && response.data) {
            return Ok(response.data);
        }
        return Err("Invalid response from server");
    } catch (e: any) {
        console.error(e);
        if (e.response) {
            const body = e.response.data;
            return Err(typeof body === 'object' ? JSON.stringify(body) : String(body));
        }
        return Err(e.message ?? "Network Error");
    }
}
