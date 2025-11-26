import axios from "axios";
import { baseUrl, Ok, Err, type Response } from "./Config";

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    userType: "EDUCATOR" | "STUDENT";
}

export interface LoginRequest {
    identifier: string;
    password: string;
}

export interface AuthResponse {
    jwt: string;
    username: string;
    email: string;
}

//
// ---------------------- REGISTER ----------------------
//

export async function register(request: RegisterRequest): Promise<Response> {
    try {
        const response = await axios.post(
            `${baseUrl}/api/auth/register`,
            request,
            {
                headers: { "Content-Type": "application/json" },
                responseType: "text"  // important — Spring returns text/plain
            }
        );

        if (response.status === 200)
            return Ok(response.data); // ex: "User created successfully"

        return Err(response.data ?? "Unknown Error");

    } catch (e: any) {
        console.error(e);

        if (e.response) {
            return Err(e.response.data ?? "Request Failed");
        }

        return Err("Network Error");
    }
}

//
// ---------------------- LOGIN ----------------------
//

export async function login(request: LoginRequest): Promise<Response> {
    try {
        const response = await axios.post<AuthResponse>(
            `${baseUrl}/api/auth/login`,
            request,
            {
                headers: { "Content-Type": "application/json" }
            }
        );

        if (response.status === 200)
            return Ok(response.data.toString());

        return Err("Unknown Error");

    } catch (e: any) {
        console.error(e);

        if (e.response) {
            if (e.response.status === 401)
                return Err(e.response.data);

            return Err(e.response.data ?? "Request Failed");
        }

        return Err("Network Error");
    }
}
