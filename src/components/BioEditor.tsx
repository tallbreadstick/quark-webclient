// src/components/BioEditor.tsx
import { useState, useEffect, type FC } from "react";
import { updateBio } from "../endpoints/ProfileHandler";

interface BioEditorProps {
  userSession: any;
  setUserSession: React.Dispatch<React.SetStateAction<any>>;
}

const BioEditor: FC<BioEditorProps> = ({ userSession, setUserSession }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(userSession?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(userSession?.bio ?? "");
  }, [userSession?.bio]);

  const handleSave = async () => {
    if (!userSession?.jwt) return setError("Not authenticated");
    setSaving(true);
    setError(null);
    try {
      const res = await updateBio(value ?? "", userSession.jwt);
      if (res.status === "OK") {
        setUserSession((prev: any) => prev ? { ...prev, bio: value } : prev);
        setEditing(false);
      } else {
        setError(res.err ?? "Failed to save bio");
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!userSession?.jwt) return setError("Not authenticated");
    setSaving(true);
    setError(null);
    try {
      const res = await updateBio(" ", userSession.jwt);
      if (res.status === "OK") {
        setUserSession((prev: any) => prev ? { ...prev, bio: "" } : prev);
        setValue("");
        setEditing(false);
      } else {
        setError(res.err ?? "Failed to clear bio");
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(userSession?.bio ?? "");
    setEditing(false);
  };

  return (
    <div className="w-full">
      {!editing ? (
        <div className="flex justify-between items-start gap-4">
          <p className="text-gray-200 text-sm leading-relaxed break-words max-w-xl">
            {userSession?.bio ? (
              userSession.bio
            ) : (
              <span className="text-gray-400 italic">
                No bio yet — add a short introduction about yourself.
              </span>
            )}
          </p>
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
          >
            Edit
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-md bg-white/10 text-white placeholder-gray-400 text-sm"
            placeholder="Write something about yourself..."
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleClear}
              disabled={saving}
              className="px-4 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              Clear
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default BioEditor;