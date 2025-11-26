export const baseUrl = "http://localhost:8080";

export interface Response<T> {
    status: "OK" | "ERROR";
    ok: T | null;
    err: string | null;
}

export function Ok<T>(ok: T): Response<T> {
    return {
        status: "OK",
        ok,
        err: null
    };
}

export function Err<T>(err: string): Response<T> {
    return {
        status: "ERROR",
        ok: null,
        err
    };
}