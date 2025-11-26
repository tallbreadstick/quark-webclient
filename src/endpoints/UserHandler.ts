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

export interface UserResponse {
    id: number;
    username: string;
    email: string;
    userType: "EDUCATOR" | "STUDENT";
}

//
// ---------------------- REGISTER ----------------------
//

export async function register(request: RegisterRequest): Promise<Response<string>> {
    try {
        const response = await axios.post(
            `${baseUrl}/api/auth/register`,
            request,
            {
                headers: { "Content-Type": "application/json" },
                responseType: "text"  // Spring returns text/plain
            }
        );

        if (response.status === 200)
            return Ok(response.data); // ok = message

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

export async function login(request: LoginRequest): Promise<Response<AuthResponse>> {
    try {
        const response = await axios.post<AuthResponse>(
            `${baseUrl}/api/auth/login`,
            request,
            {
                headers: { "Content-Type": "application/json" }
            }
        );

        if (response.status === 200)
            return Ok(response.data);

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

export async function fetchUsers(identifier: string): Promise<Response<UserResponse[]>> {
    try {
        const response = await axios.get<UserResponse[]>(
            `${baseUrl}/api/users`,
            {
                params: { identifier },
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        if (response.status === 200)
            return Ok(response.data);

        return Err("Unknown Error");

    } catch (e: any) {
        console.error(e);

        if (e.response) {
            return Err(
                e.response.data ?? "Request Failed"
            );
        }

        return Err("Network Error");
    }
}
