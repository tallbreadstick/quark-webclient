import axios from "axios";
import { baseUrl, Ok, Err, type Response } from "./Config";

export async function uploadProfilePicture(
    file: File,
    jwt: string
): Promise<Response<string>> {
    try {
        // 1. Create FormData and append file
        const formData = new FormData();
        formData.append("image", file);

        // 2. Send POST request with Authorization header
        const response = await axios.post(
            `${baseUrl}/api/profile`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${jwt}`
                },
                responseType: "text" // Spring returns a text message
            }
        );

        // 3. Handle success
        if (response.status === 200) {
            return Ok(response.data); // "Profile image updated"
        }

        // fallback for unexpected status
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error(e);

        if (e.response) {
            const status = e.response.status;
            const data = e.response.data ?? "Request failed";

            if (status === 413) return Err(data); // too large
            if (status === 404) return Err(data); // not found
            if (status === 400) return Err(data); // bad request
            return Err(data); // fallback
        }

        return Err("Network Error");
    }
}

// ---------------------- FETCH PROFILE PICTURE ----------------------
export async function fetchProfilePicture(userId: number): Promise<Response<string>> {
    try {
        const response = await axios.get(
            `${baseUrl}/api/profile/${userId}`,
            { responseType: "text" } // Spring returns base64 string
        );

        if (response.status === 200)
            return Ok(response.data);

        if (response.status === 204)
            return Err("No profile picture found");

        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- CLEAR PROFILE PICTURE ----------------------
export async function clearProfilePicture(jwt: string): Promise<Response<string>> {
    try {
        const response = await axios.delete(
            `${baseUrl}/api/profile`,
            {
                headers: {
                    "Authorization": `Bearer ${jwt}`
                },
                responseType: "text"
            }
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- UPDATE BIO ----------------------
export async function updateBio(bio: string, jwt: string): Promise<Response<string>> {
    try {
        const response = await axios.post(
            `${baseUrl}/api/profile/bio`,
            bio,
            {
                headers: {
                    "Authorization": `Bearer ${jwt}`,
                    "Content-Type": "text/plain" // Spring expects raw string
                },
                responseType: "text"
            }
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- FETCH BIO ----------------------
export async function fetchBio(userId: number): Promise<Response<string>> {
    try {
        const response = await axios.get(
            `${baseUrl}/api/profile/bio/${userId}`,
            { responseType: "text" }
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error(e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}
