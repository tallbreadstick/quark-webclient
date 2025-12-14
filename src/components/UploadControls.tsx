// src/components/UploadControls.tsx
import { useState, useRef, useEffect, type FC } from "react";
import { createPortal } from "react-dom";
import { uploadProfilePicture, fetchProfilePicture, clearProfilePicture } from "../endpoints/ProfileHandler";
import { fetchUsers } from "../endpoints/UserHandler";

interface UploadControlsProps {
  userSession: any;
  setUserSession: React.Dispatch<React.SetStateAction<any>>;
}

const UploadControls: FC<UploadControlsProps> = ({ userSession, setUserSession }) => {
  const [selected, setSelected] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const preview = selected ? URL.createObjectURL(selected) : undefined;

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!menuOpen) return;
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const findCurrentUser = (users: any[]) => {
    return users.find((user: any) => 
      user.username === userSession.username || 
      user.email === userSession.email
    );
  };

  const compressImage = (file: File, maxSide = 720, quality = 0.82) =>
    new Promise<File>((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.round(img.width * ratio));
        canvas.height = Math.max(1, Math.round(img.height * ratio));
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Failed to compress image"));
            const compressed = new File([blob], "profile.jpg", { type: "image/jpeg" });
            resolve(compressed);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Unable to read image"));
      };

      img.src = url;
    });

  const doUpload = async (fileParam?: File | null) => {
    setError(null);
    const fileToUpload = fileParam ?? selected;
    if (!fileToUpload) return setError("Please select a file");
    if (!userSession?.jwt) return setError("Not authenticated");

    const maxBytes = 5 * 1024 * 1024;
    if (fileToUpload.size > maxBytes) return setError("File is too large (max 5MB)");

    setUploading(true);
    try {
      const res = await uploadProfilePicture(fileToUpload, userSession.jwt);
      if (res.status !== "OK") {
        return setError(res.err ?? String(res.ok ?? "Upload failed"));
      }

      const lookupId = userSession.username || userSession.email;
      const usersRes = await fetchUsers(lookupId);
      if (usersRes.status === "OK" && usersRes.ok && usersRes.ok.length > 0) {
        const currentUser = findCurrentUser(usersRes.ok);

        if (currentUser) {
          const picRes = await fetchProfilePicture(currentUser.id);
          if (picRes.status === "OK" && picRes.ok) {
            const dataUrl = picRes.ok.startsWith("data:")
              ? picRes.ok
              : `data:image/png;base64,${picRes.ok}`;
            setUserSession((prev: any) =>
              prev ? { ...prev, profilePictureUrl: dataUrl } : prev
            );
            setSelected(null);
            setMenuOpen(false);
            return;
          }
        }
      }

      setSelected(null);
      setMenuOpen(false);
      setError("Uploaded but failed to retrieve updated profile picture");
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setUploading(false);
    }
  };

  const doClear = async () => {
    if (!userSession?.jwt) return setError("Not authenticated");
    setUploading(true);
    setError(null);
    try {
      const res = await clearProfilePicture(userSession.jwt);
      if (res.status === "OK") {
        if (selected) setSelected(null);
        setUserSession((prev: any) =>
          prev ? { ...prev, profilePictureUrl: null } : prev
        );
        setMenuOpen(false);
      } else {
        setError(res.err ?? "Failed to clear profile picture");
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setUploading(false);
    }
  };

  const initials =
    (userSession.username || userSession.email || "U")
      .charAt(0)
      .toUpperCase();

  return (
    <div className="flex flex-col items-center gap-3 relative">

      {/* BIGGER INITIAL HERE */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setMenuOpen(true)}
        className="w-32 h-32 rounded-full overflow-hidden border-2 border-cyan-400 shadow-lg flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 cursor-pointer"
      >
        {(preview ?? userSession.profilePictureUrl) ? (
          <img
            src={(preview ?? userSession.profilePictureUrl) as string}
            alt={userSession.username ?? "Profile image"}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white font-extrabold text-5xl tracking-wide">
            {initials}
          </span>
        )}
      </div>

      {/* MODAL */}
      {menuOpen &&
        createPortal(
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-center justify-center">
            <div
              ref={modalRef}
              className="bg-[#1a1f2e] border border-white/10 rounded-xl p-6 max-w-sm w-[90%] flex flex-col items-center gap-4 shadow-2xl relative"
            >
              <div className="absolute inset-0 bg-blue-500/5 blur-xl rounded-xl -z-10" />

              <h3 className="text-white text-lg font-medium">Update Photo</h3>

              {/* BIGGER INITIAL HERE TOO */}
              <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-cyan-400 shadow-md bg-gradient-to-br from-slate-900 to-slate-700">
                {(preview ?? userSession.profilePictureUrl) ? (
                  <img
                    src={(preview ?? userSession.profilePictureUrl) as string}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-extrabold text-5xl tracking-wide">
                    {initials}
                  </div>
                )}
              </div>

              <div className="w-full flex flex-col sm:flex-row gap-3 mt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-lg"
                >
                  {uploading ? "Uploading..." : "Upload New"}
                </button>
                <button
                  onClick={doClear}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition shadow-lg"
                >
                  Remove
                </button>
              </div>

              <button
                onClick={() => setMenuOpen(false)}
                className="text-sm text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>,
          document.body
        )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          if (!f || uploading) return;
          setError(null);

          if (!f.type.startsWith("image/")) {
            setError("Only image files are allowed");
            return;
          }

          void (async () => {
            try {
              const compressed = await compressImage(f);
              setSelected(compressed);
              await doUpload(compressed);
            } catch (err: any) {
              setError(err?.message ?? "Failed to process image");
            }
          })();
        }}
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default UploadControls;
