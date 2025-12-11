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
        <div className="flex justify-between items-center gap-4"> {/* Changed from items-start to items-center */}
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
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-indigo-500 to-blue-500 border border-indigo-400 shadow-lg shadow-indigo-500/30 hover:brightness-110 active:scale-[0.99] transition cursor-pointer"
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
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-indigo-500 to-blue-500 border border-indigo-400 shadow-lg shadow-indigo-500/30 hover:brightness-110 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleClear}
              disabled={saving}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-rose-500 to-red-600 border border-red-400 shadow-lg shadow-red-500/30 hover:brightness-110 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold text-sm text-white/90 bg-slate-700 border border-slate-500 shadow-md shadow-slate-900/40 hover:bg-slate-600 active:scale-[0.99] transition cursor-pointer"
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