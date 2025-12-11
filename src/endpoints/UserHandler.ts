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

// ---------------------- Input Sanitization / Validation ----------------------

const USERNAME_REGEX = /^[A-Za-z0-9_.-]{3,30}$/;
const MAX_IDENTIFIER_LENGTH = 254;

function sanitizeString(value: string, max = 256): string {
    return value?.toString().trim().slice(0, max) ?? "";
}

function isValidEmail(email: string): boolean {
    // Simple, pragmatic email check
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateRegisterRequest(req: RegisterRequest): { ok: true; payload: RegisterRequest } | { ok: false; err: string } {
    const username = sanitizeString(req.username, 30);
    const email = sanitizeString(req.email, MAX_IDENTIFIER_LENGTH);
    const password = (req.password ?? "").toString().trim();
    const userType = req.userType;

    if (!username) return { ok: false, err: "Username is required" };
    if (!USERNAME_REGEX.test(username)) return { ok: false, err: "Username must be 3-30 characters and contain only letters, numbers, underscore, dot or hyphen" };

    if (!email) return { ok: false, err: "Email is required" };
    if (!isValidEmail(email)) return { ok: false, err: "Invalid email format" };

    if (!password) return { ok: false, err: "Password is required" };
    if (password.length < 8) return { ok: false, err: "Password must be at least 8 characters" };

    if (userType !== "EDUCATOR" && userType !== "STUDENT") return { ok: false, err: "Invalid userType" };

    return {
        ok: true,
        payload: {
            username,
            email,
            password,
            userType
        }
    };
}

function validateLoginRequest(req: LoginRequest): { ok: true; payload: LoginRequest } | { ok: false; err: string } {
    const identifier = sanitizeString(req.identifier, MAX_IDENTIFIER_LENGTH);
    const password = (req.password ?? "").toString().trim();

    if (!identifier) return { ok: false, err: "Identifier (username or email) is required" };
    if (identifier.length > MAX_IDENTIFIER_LENGTH) return { ok: false, err: "Identifier is too long" };

    if (!password) return { ok: false, err: "Password is required" };

    return { ok: true, payload: { identifier, password } };
}

function sanitizeIdentifierParam(identifier: string): string {
    return sanitizeString(identifier, 100);
}


//
// ---------------------- REGISTER ----------------------
//

export async function register(request: RegisterRequest): Promise<Response<string>> {
    try {
        const validation = validateRegisterRequest(request);
        if (!validation.ok) {
            return Err(validation.err);
        }

        const payload = validation.payload;

        const response = await axios.post(
            `${baseUrl}/api/auth/register`,
            payload,
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
        const validation = validateLoginRequest(request);
        if (!validation.ok) return Err(validation.err);

        const payload = validation.payload;

        const response = await axios.post<AuthResponse>(
            `${baseUrl}/api/auth/login`,
            payload,
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
        const id = sanitizeIdentifierParam(identifier ?? "");

        const response = await axios.get<UserResponse[]>(
            `${baseUrl}/api/users`,
            {
                params: { identifier: id },
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
