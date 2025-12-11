import React, { useEffect, useState, Suspense, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Page from "../components/page/Page";
import { loadSessionState } from "../types/UserSession";
import { fetchCourseWithChapters, editCourse } from "../endpoints/CourseHandler";
import { fetchUsers } from "../endpoints/UserHandler";
import LoadingSkeleton from "../components/LoadingSkeleton";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import AlertModal from "../components/modals/AlertModal";
import ActionModal from "../components/modals/ActionModal";

// Lazy Markdown+KaTeX renderer
const PreviewRenderer = React.lazy(async () => ({
    default: ({ value }: { value: string }) => (
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {value}
        </ReactMarkdown>
    ),
}));

export default function CourseEditPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { userSession, setUserSession } = loadSessionState();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [description, setDescription] = useState<string | null>(null);
    const [introContent, setIntroContent] = useState("");

    const [forkable, setForkable] = useState(false);
    const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE" | "UNLISTED">("PUBLIC");
    const [tagsText, setTagsText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Track initial values to detect changes
    const [initialData, setInitialData] = useState<{
        name: string;
        description: string | null;
        introContent: string;
        forkable: boolean;
        visibility: string;
        tagsText: string;
    } | null>(null);

    // drag & layout state
    const [leftWidth, setLeftWidth] = useState<number>(320);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const draggingRef = useRef(false);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);
    const [isLarge, setIsLarge] = useState(() =>
        typeof window !== "undefined" ? window.innerWidth >= 1024 : true
    );

    // Success modal state
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    // Unsaved changes confirmation modal state
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);

    const MIN_LEFT = 200;
    const MIN_CENTER = 360;
    const MIN_PREVIEW = 360;
    const MIN_REMAIN = MIN_CENTER + MIN_PREVIEW;

    // Check if there are unsaved changes
    const hasUnsavedChanges = () => {
        if (!initialData) return false;
        
        return (
            name !== initialData.name ||
            description !== initialData.description ||
            introContent !== initialData.introContent ||
            forkable !== initialData.forkable ||
            visibility !== initialData.visibility ||
            tagsText !== initialData.tagsText
        );
    };

    // Load course data
    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            if (!userSession) {
                setError("You must be signed in to edit courses.");
                setLoading(false);
                return;
            }
            if (!courseId) {
                setError("Invalid course id");
                setLoading(false);
                return;
            }

            try {
                const lookup = userSession.username || userSession.email || "";
                const userRes = await fetchUsers(lookup);
                if (!(userRes.status === "OK" && userRes.ok?.length)) {
                    if (!cancelled) setError("User profile not found");
                }

                const res = await fetchCourseWithChapters(Number(courseId), userSession.jwt ?? "");
                if (res.status !== "OK" || !res.ok) {
                    if (!cancelled) setError(res.err ?? "Failed to fetch course");
                } else {
                    const course = res.ok;
                    
                    // Check for persisted unsaved changes first
                    const storageKey = `course_edit_${courseId}`;
                    const savedData = sessionStorage.getItem(storageKey);
                    
                    let courseName, courseDescription, courseForkable, courseVisibility, courseTagsText, courseIntroContent;
                    
                    if (savedData) {
                        // Load from sessionStorage if available
                        const parsed = JSON.parse(savedData);
                        courseName = parsed.name;
                        courseDescription = parsed.description;
                        courseForkable = parsed.forkable;
                        courseVisibility = parsed.visibility;
                        courseTagsText = parsed.tagsText;
                        courseIntroContent = parsed.introContent;
                    } else {
                        // Load from API
                        courseName = course.name ?? "";
                        courseDescription = course.description ?? null;
                        courseForkable = Boolean(course.forkable);
                        courseVisibility = (course as any).visibility ?? "PUBLIC";
                        courseTagsText = (course.tags ?? []).join(",");
                        
                        try {
                            const parsed = JSON.parse(course.introduction ?? '{"content":""}');
                            courseIntroContent = parsed.content ?? "";
                        } catch {
                            courseIntroContent = String(course.introduction ?? "");
                        }
                    }

                    // Set state
                    setName(courseName);
                    setDescription(courseDescription);
                    setForkable(courseForkable);
                    setVisibility(courseVisibility as any);
                    setTagsText(courseTagsText);
                    setIntroContent(courseIntroContent);

                    // Store initial data for change detection (from API, not sessionStorage)
                    const originalCourseName = course.name ?? "";
                    const originalCourseDescription = course.description ?? null;
                    const originalCourseForkable = Boolean(course.forkable);
                    const originalCourseVisibility = (course as any).visibility ?? "PUBLIC";
                    const originalCourseTagsText = (course.tags ?? []).join(",");
                    let originalCourseIntroContent = "";
                    try {
                        const parsed = JSON.parse(course.introduction ?? '{"content":""}');
                        originalCourseIntroContent = parsed.content ?? "";
                    } catch {
                        originalCourseIntroContent = String(course.introduction ?? "");
                    }
                    
                    setInitialData({
                        name: originalCourseName,
                        description: originalCourseDescription,
                        introContent: originalCourseIntroContent,
                        forkable: originalCourseForkable,
                        visibility: originalCourseVisibility,
                        tagsText: originalCourseTagsText
                    });
                }
            } catch (e: any) {
                if (!cancelled) setError(e?.message || "Failed to load course");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [courseId, userSession]);

    // Save to sessionStorage whenever state changes
    useEffect(() => {
        if (courseId && initialData) {
            const storageKey = `course_edit_${courseId}`;
            const currentData = {
                name,
                description,
                introContent,
                forkable,
                visibility,
                tagsText
            };
            
            // Only save if there are changes
            if (hasUnsavedChanges()) {
                sessionStorage.setItem(storageKey, JSON.stringify(currentData));
            } else {
                // Clear sessionStorage if no changes
                sessionStorage.removeItem(storageKey);
            }
        }
    }, [name, description, introContent, forkable, visibility, tagsText, courseId, initialData]);

    // Handle browser back/refresh with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Only show browser warning for page refresh/close, not for navigation
            if (hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = "";
            }
        };

        // Only add beforeunload for actual page close/refresh
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [name, description, introContent, forkable, visibility, tagsText, initialData]);

    // Custom navigation handler with unsaved changes check
    const handleNavigation = (path: string) => {
        // Allow navigation to any /edit path without warning
        if (path.includes('/edit')) {
            navigate(path);
            return;
        }

        // For non-edit paths, check for unsaved changes
        if (hasUnsavedChanges() && !isNavigating) {
            setPendingNavigation(path);
            setShowUnsavedModal(true);
        } else {
            navigate(path);
        }
    };

    // Intercept Link clicks from Page component and profile navigations
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a');
            const button = target.closest('button');
            
            // Handle link clicks
            if (link && link.href && !link.href.includes('#') && link.origin === window.location.origin) {
                const targetPath = new URL(link.href).pathname;
                
                // Don't intercept if navigating to /edit paths
                if (targetPath.includes('/edit')) {
                    return;
                }
                
                // Check for unsaved changes
                if (hasUnsavedChanges() && !isNavigating) {
                    e.preventDefault();
                    e.stopPropagation();
                    setPendingNavigation(targetPath);
                    setShowUnsavedModal(true);
                }
            }
            
            // Handle profile button/link clicks (catches View Profile, profile dropdown, etc.)
            if ((link || button) && target.textContent?.includes('Profile')) {
                if (hasUnsavedChanges() && !isNavigating) {
                    e.preventDefault();
                    e.stopPropagation();
                    setPendingNavigation('/profile');
                    setShowUnsavedModal(true);
                }
            }
        };

        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, [name, description, introContent, forkable, visibility, tagsText, initialData, isNavigating]);

    // Handle browser back button
    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            if (hasUnsavedChanges() && !isNavigating) {
                e.preventDefault();
                window.history.pushState(null, "", location.pathname);
                setPendingNavigation("back");
                setShowUnsavedModal(true);
            }
        };

        window.history.pushState(null, "", location.pathname);
        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [name, description, introContent, forkable, visibility, tagsText, initialData, location.pathname, isNavigating]);

    // Handle unsaved changes confirmation
    const handleConfirmLeave = () => {
        setIsNavigating(true);
        
        // Clear sessionStorage when leaving to non-edit pages
        if (courseId) {
            const storageKey = `course_edit_${courseId}`;
            sessionStorage.removeItem(storageKey);
        }
        
        if (pendingNavigation === "back") {
            window.history.back();
        } else if (pendingNavigation) {
            navigate(pendingNavigation);
        }
        
        setShowUnsavedModal(false);
        setPendingNavigation(null);
        
        // Reset after navigation
        setTimeout(() => setIsNavigating(false), 100);
    };

    const handleCancelLeave = () => {
        setShowUnsavedModal(false);
        setPendingNavigation(null);
    };

    // Responsive
    useEffect(() => {
        const onResize = () => setIsLarge(window.innerWidth >= 1024);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // Drag handler
    const startDrag = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        draggingRef.current = true;
        startXRef.current = e.clientX;
        startWidthRef.current = leftWidth;
        document.body.style.cursor = "col-resize";

        const onMouseMove = (ev: MouseEvent) => {
            if (!draggingRef.current || !containerRef.current) return;
            const dx = ev.clientX - startXRef.current;
            const containerRect = containerRef.current.getBoundingClientRect();
            const maxLeft = containerRect.width / 4;
            const max = Math.min(maxLeft, containerRect.width - MIN_REMAIN);
            setLeftWidth(Math.max(MIN_LEFT, Math.min(startWidthRef.current + dx, max)));
        };

        const onMouseUp = () => {
            draggingRef.current = false;
            document.body.style.cursor = "";
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    useEffect(() => {
        const clamp = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const max = Math.max(MIN_LEFT, rect.width - MIN_REMAIN);
            setLeftWidth((w) => Math.max(MIN_LEFT, Math.min(w, max)));
        };
        window.addEventListener("resize", clamp);
        clamp();
        return () => window.removeEventListener("resize", clamp);
    }, []);

    // Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        if (!courseId || !name.trim()) {
            setError(!courseId ? "Invalid course id" : "Name is required");
            setSubmitting(false);
            return;
        }

        const introJson = JSON.stringify({ content: introContent });
        const tags = (tagsText || "").split(",").map(s => s.trim()).filter(Boolean).map(String);
        const body = { name: name.trim(), description: description?.trim() ?? null, introduction: introJson, forkable, visibility, tags };

        try {
            const jwt = userSession?.jwt ?? "";
            const res = await editCourse(Number(courseId), body as any, jwt);
            if (res.status !== "OK") throw new Error(res.err ?? "Failed to update course");

            // Clear sessionStorage after successful save
            const storageKey = `course_edit_${courseId}`;
            sessionStorage.removeItem(storageKey);

            // Update initial data to reflect saved state
            setInitialData({
                name: name.trim(),
                description: description?.trim() ?? null,
                introContent,
                forkable,
                visibility,
                tagsText
            });
            
            // Show success modal
            setShowSuccessModal(true);
        } catch (e: any) {
            setError(e?.message || "Failed to save");
        } finally {
            setSubmitting(false);
        }
    };

    // Handle modal close and redirect to course view
    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        // Don't navigate away - stay on the edit page
    };

    if (loading) return (
        <Page title="Quark | Edit Course" userSession={userSession} setUserSession={setUserSession}>
            <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center">
                <LoadingSkeleton count={3} />
            </div>
        </Page>
    );

    return (
        <Page title={`Quark | Edit ${name || "Course"}`} userSession={userSession} setUserSession={setUserSession}>
            <div className="relative z-10 h-[calc(100vh-7rem)] px-3 py-4 text-gray-200">
                <style>{`
                    /* Custom dropdown styling for course edit page */
                    .course-edit-page select {
                        padding-left: 0.5rem !important;
                        padding-right: 1.5rem !important;
                        background-color: rgba(255, 255, 255, 0.05) !important;
                        border: 1px solid rgba(255, 255, 255, 0.1) !important;
                        border-radius: 0.5rem !important;
                        color: white !important;
                        transition: all 0.2s !important;
                        cursor: pointer !important;
                        font-size: 0.875rem !important;
                    }
                    
                    .course-edit-page select:hover {
                        background-color: rgba(59, 130, 246, 0.1) !important;
                        border-color: rgba(59, 130, 246, 0.3) !important;
                    }
                    
                    .course-edit-page select:focus {
                        outline: none !important;
                        ring: 2px !important;
                        ring-color: rgb(59, 130, 246) !important;
                        border-color: rgba(59, 130, 246, 0.5) !important;
                    }
                    
                    .course-edit-page select option {
                        background-color: rgb(15, 23, 42) !important;
                        color: white !important;
                    }
                    
                    .course-edit-page select option:checked {
                        background-color: rgb(37, 99, 235) !important;
                    }
                    
                    .course-edit-page select option:hover {
                        background-color: rgb(59, 130, 246) !important;
                    }
                `}</style>

                <div ref={containerRef} className="course-edit-page w-full mx-auto gap-6 items-start h-full relative"
                    style={{ display: 'grid', gridTemplateColumns: isLarge ? `${leftWidth}px 1fr 1fr` : '1fr', gap: '1.5rem' }}>

                    {/* Drag handle */}
                    {isLarge && (
                        <div onMouseDown={startDrag} style={{
                            position: 'absolute', top: 0, left: `calc(${leftWidth}px + 0.75rem - 4px)`,
                            height: "100%", width: 8, cursor: 'col-resize', zIndex: 40
                        }}>
                            <div className="h-full w-full bg-transparent hover:bg-white/10" />
                        </div>
                    )}

                    {/* LEFT: Form + buttons */}
                    <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6 h-full flex flex-col justify-between">
                        <div className="flex-1 overflow-auto">
                            <h1 className="text-2xl font-semibold text-white mb-4 text-left">Edit Course</h1>
                            {!userSession ? (
                                <div className="text-center text-gray-300">
                                    <p className="mb-4">You must be signed in to edit a course.</p>
                                    <a href="/login" className="px-4 py-2 bg-[#566fb8] rounded-md text-white cursor-pointer">Sign in</a>
                                </div>
                            ) : (
                                <form id="course-edit-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                                    {error && <div className="mb-2 text-sm text-red-400">{error}</div>}
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-[#bdcdff]">Name</label>
                                        <input value={name} onChange={(e) => setName(e.target.value)} required
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition" />
                                        <label className="block mb-2 mt-3 text-sm font-medium text-[#bdcdff]">Description</label>
                                        <textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} rows={4}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition h-24 resize-y" />
                                        <label className="block mb-2 mt-3 text-sm font-medium text-[#bdcdff]">Tag IDs (comma separated)</label>
                                        <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="e.g. 1,2,3"
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition" />
                                        <div className="mt-2 flex items-center gap-4">
                                            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 accent-blue-500 cursor-pointer"
                                                    checked={forkable}
                                                    onChange={(e) => setForkable(e.target.checked)}
                                                />
                                                <span className="text-white">Forkable</span>
                                                </label>
                                            <div className="ml-auto text-sm text-white flex items-center gap-2">
                                                Visibility:
                                                <div className="relative">
                                                    <select 
                                                        value={visibility} 
                                                        onChange={(e) => setVisibility(e.target.value as any)}
                                                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 appearance-none pr-8 transition hover:bg-blue-500/10 hover:border-blue-500/30 cursor-pointer"
                                                    >
                                                        <option value="PUBLIC">Public</option>
                                                        <option value="PRIVATE">Private</option>
                                                        <option value="UNLISTED">Unlisted</option>
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                                        <svg
                                                            className="h-4 w-4 text-blue-400"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                        {userSession && (
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleNavigation(`/course/${courseId}/chapters/edit`)}
                                    className="flex-1 px-4 py-2 bg-gray-700 rounded-md text-white text-sm font-medium hover:bg-gray-600 cursor-pointer transition-colors"
                                >
                                    Edit Chapters
                                </button>
                                <button
                                    type="submit"
                                    form="course-edit-form"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-indigo-600 rounded-md text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                >
                                    {submitting ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* CENTER: Editor */}
                    <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-4 h-full flex flex-col">
                        <div className="flex-1 bg-transparent border border-white/5 rounded-md overflow-hidden">
                            <Editor
                                height="100%"
                                language="markdown"
                                theme="vs-dark"
                                value={introContent}
                                onChange={(val) => setIntroContent(val ?? "")}
                                options={{
                                    minimap: { enabled: false },
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    wordWrap: 'on',
                                    fontSize: 14,
                                    automaticLayout: true
                                }}
                            />
                        </div>
                    </div>

                    {/* RIGHT: Preview */}
                    <div className="w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6 h-full flex flex-col overflow-y-auto">
                        <h1 className="text-2xl font-semibold text-white mb-4 text-center">Preview</h1>
                        <div className="w-full flex-1 px-6 py-6 rounded-md bg-white border border-gray-200 text-gray-900 overflow-auto min-h-0 prose">
                            <Suspense fallback={<div>Loading preview...</div>}>
                                <PreviewRenderer value={introContent} />
                            </Suspense>
                        </div>
                    </div>

                </div>

                {/* Save Success Modal */}
                <AlertModal
                    isOpen={showSuccessModal}
                    onClose={handleSuccessModalClose}
                    title="Course Updated Successfully!"
                    message={
                        <>
                            <p>Your course "{name}" has been updated successfully.</p>
                            <p className="text-sm text-gray-400 mt-2">
                                You can continue editing or navigate to another page.
                            </p>
                        </>
                    }
                    variant="success"
                    buttonText="Okay"
                />

                {/* Unsaved Changes Confirmation Modal */}
                <ActionModal
                    isOpen={showUnsavedModal}
                    onClose={handleCancelLeave}
                    onConfirm={handleConfirmLeave}
                    title="Unsaved Changes"
                    message="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
                    confirmText="Leave"
                    cancelText="Stay"
                    variant="warning"
                />
            </div>
        </Page>
    );
}