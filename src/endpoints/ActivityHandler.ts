import axios from "axios";
import { baseUrl, Ok, Err, type Response } from "./Config";

// ---------------------- REQUEST TYPES ----------------------

export interface ActivityRulesetRequest {
    enabled: boolean;
    closeDateTime?: string;    // ISO string for LocalDateTime
    timeLimit?: number;        // long
}

export interface ActivityRequest {
    name: string;
    description: string;
    icon: string;
    ruleset: ActivityRulesetRequest;
    finishMessage: string;
}

// ---------------------- RESPONSE TYPES ----------------------

export interface ActivitySection {
    id: number;
    idx: number;
}

export interface ActivityRulesetResponse {
    enabled: boolean;
    closeDateTime?: string;
    timeLimit?: number;
}

export interface ActivityContentResponse {
    id: number;
    idx: number;
    name: string;
    description: string;
    icon: string;
    ruleset: ActivityRulesetResponse;
    finishMessage: string;
    sections: ActivitySection[];
}

// ------------------------------------------------------------
// ---------------------- API HANDLERS ------------------------
// ------------------------------------------------------------

// ---------------------- ADD ACTIVITY ----------------------
export async function addActivity(
    chapterId: number,
    request: ActivityRequest,
    jwt: string
): Promise<Response<string>> {

    try {
        const config: any = { responseType: "text" };
        if (jwt) config.headers = { "Authorization": `Bearer ${jwt}` };

        const response = await axios.post(
            `${baseUrl}/api/chapter/${chapterId}/activity`,
            request,
            config
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- EDIT ACTIVITY ----------------------
export async function editActivity(
    activityId: number,
    request: ActivityRequest,
    jwt: string
): Promise<Response<string>> {

    try {
        const config: any = { responseType: "text" };
        if (jwt) config.headers = { "Authorization": `Bearer ${jwt}` };

        const response = await axios.put(
            `${baseUrl}/api/activity/${activityId}`,
            request,
            config
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- DELETE ACTIVITY ----------------------
export async function deleteActivity(
    activityId: number,
    jwt: string
): Promise<Response<string>> {

    try {
        const config: any = { responseType: "text" };
        if (jwt) config.headers = { "Authorization": `Bearer ${jwt}` };

        const response = await axios.delete(
            `${baseUrl}/api/activity/${activityId}`,
            config
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- FETCH ACTIVITY ----------------------
export async function fetchActivity(
    activityId: number,
    jwt: string
): Promise<Response<ActivityContentResponse>> {

    try {
        const config: any = {};
        if (jwt) config.headers = { "Authorization": `Bearer ${jwt}` };

        const response = await axios.get<ActivityContentResponse>(
            `${baseUrl}/api/activity/${activityId}`,
            config
        );

        return Ok(response.data);

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}
