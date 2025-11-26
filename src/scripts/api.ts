import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8080/api",
    headers: { "Content-Type": "application/json" },
    // send credentials (cookies) with requests so backend can identify the user
    withCredentials: true,
});

// Attach Authorization header automatically if a token is present in localStorage.
api.interceptors.request.use((config) => {
    try {
        const raw = localStorage.getItem("session");
        if (raw) {
            const session = JSON.parse(raw);
            if (session?.jwt) {
                config.headers = config.headers || {};
                // only set Authorization if it's not already set
                if (!config.headers["Authorization"] && !config.headers["authorization"]) {
                    config.headers["Authorization"] = `Bearer ${session.jwt}`;
                }
            }
        }
    } catch (e) {
        // ignore
    }
    return config;
});

// Optionally handle 401 responses globally (keep current behavior but allow debugging)
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err?.response?.status;
        if (status === 401) {
            // don't automatically redirect here; callers may handle it.
            console.warn("API: Unauthorized (401)");
        }
        return Promise.reject(err);
    }
);

export default api;
