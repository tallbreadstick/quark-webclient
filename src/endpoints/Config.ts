export const baseUrl = "http://localhost:8080";

export interface Response {
    status: "OK" | "ERROR";
    msg: any;
}

export function Ok(msg: string): Response {
    return { status: "OK", msg };
}

export function Err(msg: string): Response {
    return { status: "ERROR", msg }
}