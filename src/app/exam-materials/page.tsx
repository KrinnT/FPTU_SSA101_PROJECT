"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Upload, Download, Search, FileText, X,
    Share2, Copy, BookOpen, Eye, AlertCircle, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedRoute from "@/components/layout/protected-route";

// ── Types ──────────────────────────────────────────────────────────────
interface Semester {
    id: string;
    name: string;
    subjects: Subject[];
}
interface Subject {
    id: string;
    code: string;
}
interface Material {
    id: string;
    title: string;
    description?: string;
    fileUrl: string;
    size: number;
    type: string;
    totalDownloads: number;
    createdAt: string;
    semester: { id: string; name: string };
    subject: { id: string; code: string };
    uploadedBy: { id: string; name?: string };
}

// ── Helpers ─────────────────────────────────────────────────────────────
function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function typeIcon(type: string) {
    const map: Record<string, string> = {
        PDF: "🔴", DOCX: "🔵", DOC: "🔵", PPTX: "🟠", PPT: "🟠",
        ZIP: "🟡", PNG: "🟢", JPG: "🟢", JPEG: "🟢"
    };
    return map[type.toUpperCase()] ?? "📄";
}

// ── Main Export ──────────────────────────────────────────────────────────
export default function ExamMaterialsPage() {
    return (
        <ProtectedRoute>
            <ExamMaterialsContent />
        </ProtectedRoute>
    );
}

function ExamMaterialsContent() {
    // ─── State ──────────────────────────────────
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [total, setTotal] = useState(0);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [selectedSemesterId, setSelectedSemesterId] = useState("");
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Upload Modal
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        title: "", description: "", semesterId: "", subjectId: ""
    });
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Preview Modal
    const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

    // Copied link toast
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // ─── Data Fetching ──────────────────────────
    useEffect(() => {
        fetch("/api/exam-materials/filters")
            .then(r => r.json()).then(setSemesters).catch(console.error);
        fetch("/api/auth/me")
            .then(r => r.json()).then(d => d.user?.id && setCurrentUserId(d.user.id)).catch(console.error);
    }, []);

    useEffect(() => {
        fetchMaterials(1, true);
    }, [selectedSemesterId, selectedSubjectId, search]);

    async function fetchMaterials(p: number, reset = false) {
        if (reset) setLoading(true); else setLoadingMore(true);
        try {
            const params = new URLSearchParams();
            if (selectedSemesterId) params.set("semesterId", selectedSemesterId);
            if (selectedSubjectId) params.set("subjectId", selectedSubjectId);
            if (search) params.set("search", search);
            params.set("page", String(p));

            const res = await fetch(`/api/exam-materials?${params}`);
            const data = await res.json();

            setMaterials(prev => reset ? data.materials : [...prev, ...data.materials]);
            setTotal(data.total);
            setPage(p);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    // ─── Actions ────────────────────────────────
    const availableSubjects = semesters.find(s => s.id === selectedSemesterId)?.subjects ?? [];
    const uploadSubjects = semesters.find(s => s.id === uploadForm.semesterId)?.subjects ?? [];

    async function handleDownload(material: Material) {
        // Open the file-serving route directly — it streams binary and increments counter
        const a = document.createElement("a");
        a.href = `/api/exam-materials/file?id=${material.id}`;
        a.download = material.title;
        a.click();
        // Optimistic UI counter bump
        setMaterials(prev => prev.map(m =>
            m.id === material.id ? { ...m, totalDownloads: m.totalDownloads + 1 } : m
        ));
    }

    async function handleUpload() {
        if (!uploadFile || !uploadForm.title || !uploadForm.semesterId || !uploadForm.subjectId) {
            setUploadError("Please fill in all required fields.");
            return;
        }
        setUploading(true);
        setUploadError("");

        const form = new FormData();
        form.append("file", uploadFile);
        form.append("title", uploadForm.title);
        form.append("description", uploadForm.description);
        form.append("semesterId", uploadForm.semesterId);
        form.append("subjectId", uploadForm.subjectId);

        try {
            const res = await fetch("/api/exam-materials", { method: "POST", body: form });
            const data = await res.json();
            if (!res.ok) {
                setUploadError(data.error || "Upload failed");
            } else {
                setShowUploadModal(false);
                setUploadForm({ title: "", description: "", semesterId: "", subjectId: "" });
                setUploadFile(null);
                fetchMaterials(1, true);
            }
        } catch {
            setUploadError("Network error. Please try again.");
        } finally {
            setUploading(false);
        }
    }

    function copyShareLink(material: Material) {
        const url = `${window.location.origin}/exam-materials?material=${material.id}`;
        navigator.clipboard.writeText(url);
        setCopiedId(material.id);
        setTimeout(() => setCopiedId(null), 2000);
    }

    async function handleDelete(material: Material) {
        if (!confirm(`Delete "${material.title}"? This cannot be undone.`)) return;
        const res = await fetch(`/api/exam-materials/${material.id}`, { method: "DELETE" });
        if (res.ok) {
            setMaterials(prev => prev.filter(m => m.id !== material.id));
            setTotal(t => t - 1);
        } else {
            const data = await res.json();
            alert(data.error || "Failed to delete");
        }
    }

    // ─── Render ──────────────────────────────────
    return (
        <div className="min-h-screen bg-background">
            {/* ── Header ── */}
            <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-primary" />
                            Exam Materials
                        </h1>
                        <p className="text-sm text-muted-foreground">Share and download study resources</p>
                    </div>
                    <Button onClick={() => setShowUploadModal(true)} className="bg-primary gap-2 self-start sm:self-auto">
                        <Upload className="w-4 h-4" /> Upload Material
                    </Button>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="glass-card p-4 rounded-xl flex flex-wrap gap-3 items-end">
                    {/* Search */}
                    <div className="flex-1 min-w-[180px] space-y-1">
                        <Label className="text-xs text-muted-foreground">Search</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                placeholder="Title..."
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && setSearch(searchInput)}
                            />
                        </div>
                    </div>

                    {/* Semester filter */}
                    <div className="min-w-[160px] space-y-1">
                        <Label className="text-xs text-muted-foreground">Semester</Label>
                        <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                            value={selectedSemesterId}
                            onChange={e => { setSelectedSemesterId(e.target.value); setSelectedSubjectId(""); }}
                        >
                            <option value="">All Semesters</option>
                            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    {/* Subject filter */}
                    <div className="min-w-[160px] space-y-1">
                        <Label className="text-xs text-muted-foreground">Subject</Label>
                        <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                            value={selectedSubjectId}
                            onChange={e => setSelectedSubjectId(e.target.value)}
                            disabled={!selectedSemesterId}
                        >
                            <option value="">All Subjects</option>
                            {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
                        </select>
                    </div>

                    {(selectedSemesterId || selectedSubjectId || search) && (
                        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => {
                            setSelectedSemesterId(""); setSelectedSubjectId("");
                            setSearch(""); setSearchInput("");
                        }}>
                            <X className="w-3 h-3" /> Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Materials Grid ── */}
            <div className="max-w-7xl mx-auto px-4 pb-12">
                <p className="text-sm text-muted-foreground mb-4">
                    {loading ? "Loading..." : `${total} material${total !== 1 ? "s" : ""} found`}
                </p>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-48 rounded-xl bg-muted/30 animate-pulse" />
                        ))}
                    </div>
                ) : materials.length === 0 ? (
                    <div className="text-center py-24 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">No materials found</p>
                        <p className="text-sm mt-1">Try adjusting your filters or upload the first one!</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {materials.map(m => (
                                <MaterialCard
                                    key={m.id}
                                    material={m}
                                    onDownload={() => handleDownload(m)}
                                    onPreview={() => setPreviewMaterial(m)}
                                    onShare={() => copyShareLink(m)}
                                    onDelete={() => handleDelete(m)}
                                    copied={copiedId === m.id}
                                    isOwn={currentUserId === m.uploadedBy.id}
                                />
                            ))}
                        </div>

                        {/* Load More */}
                        {materials.length < total && (
                            <div className="text-center mt-8">
                                <Button variant="outline" onClick={() => fetchMaterials(page + 1)} disabled={loadingMore}>
                                    {loadingMore ? "Loading..." : "Load More"}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Upload Modal ── */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border/50 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">Upload Material</h2>
                            <button onClick={() => setShowUploadModal(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {uploadError && (
                            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {uploadError}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <Label className="text-sm">Title <span className="text-red-400">*</span></Label>
                                <Input
                                    className="mt-1"
                                    placeholder="e.g. MAE101 Final Exam 2024"
                                    value={uploadForm.title}
                                    onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-sm">Description (optional)</Label>
                                <Input
                                    className="mt-1"
                                    placeholder="Brief description..."
                                    value={uploadForm.description}
                                    onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-sm">Semester <span className="text-red-400">*</span></Label>
                                <select
                                    className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                    value={uploadForm.semesterId}
                                    onChange={e => setUploadForm({ ...uploadForm, semesterId: e.target.value, subjectId: "" })}
                                >
                                    <option value="">Select Semester</option>
                                    {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label className="text-sm">Subject <span className="text-red-400">*</span></Label>
                                <select
                                    className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                    value={uploadForm.subjectId}
                                    onChange={e => setUploadForm({ ...uploadForm, subjectId: e.target.value })}
                                    disabled={!uploadForm.semesterId}
                                >
                                    <option value="">Select Subject</option>
                                    {uploadSubjects.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label className="text-sm">File <span className="text-red-400">*</span></Label>
                                <div
                                    className={cn(
                                        "mt-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
                                        uploadFile ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/20"
                                    )}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.docx,.doc,.pptx,.ppt,.zip,.png,.jpg,.jpeg"
                                        onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                                    />
                                    {uploadFile ? (
                                        <div>
                                            <p className="font-medium text-primary text-sm">{uploadFile.name}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{formatSize(uploadFile.size)}</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">Click to choose file</p>
                                            <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, PPTX, ZIP, PNG, JPG · max 25MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Button className="w-full gap-2" onClick={handleUpload} disabled={uploading}>
                            {uploading ? (
                                <>
                                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" /> Upload
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Preview Modal ── */}
            {previewMaterial && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-border/50">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <div>
                                <h2 className="font-bold">{previewMaterial.title}</h2>
                                <p className="text-xs text-muted-foreground">
                                    {previewMaterial.semester.name} · {previewMaterial.subject.code} · {formatSize(previewMaterial.size)}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={() => handleDownload(previewMaterial)} className="gap-1">
                                    <Download className="w-3 h-3" /> Download
                                </Button>
                                <button onClick={() => setPreviewMaterial(null)} className="text-muted-foreground hover:text-foreground">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            {['PDF'].includes(previewMaterial.type.toUpperCase()) ? (
                                <iframe
                                    src={previewMaterial.fileUrl}
                                    className="w-full h-full min-h-[500px] rounded"
                                    title={previewMaterial.title}
                                />
                            ) : ['PNG', 'JPG', 'JPEG'].includes(previewMaterial.type.toUpperCase()) ? (
                                <img src={previewMaterial.fileUrl} alt={previewMaterial.title} className="max-w-full mx-auto rounded" />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
                                    <FileText className="w-12 h-12 opacity-30" />
                                    <p>Preview not available for {previewMaterial.type} files</p>
                                    <Button size="sm" onClick={() => handleDownload(previewMaterial)} className="gap-1">
                                        <Download className="w-3 h-3" /> Download to view
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Material Card Component ──────────────────────────────────────────────
function MaterialCard({
    material, onDownload, onPreview, onShare, onDelete, copied, isOwn
}: {
    material: Material;
    onDownload: () => void;
    onPreview: () => void;
    onShare: () => void;
    onDelete: () => void;
    copied: boolean;
    isOwn: boolean;
}) {
    return (
        <div className="glass-card rounded-xl p-4 flex flex-col gap-3 hover:border-primary/30 transition-all group">
            {/* Top row */}
            <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">{typeIcon(material.type)}</div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {material.title}
                    </h3>
                    {material.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{material.description}</p>
                    )}
                </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-medium">
                    {material.semester.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-medium">
                    {material.subject.code}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px]">
                    {material.type}
                </span>
            </div>

            {/* Meta */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{formatSize(material.size)}</span>
                <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" /> {material.totalDownloads}
                </span>
                <span>by {material.uploadedBy.name || "Anonymous"}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1 border-t border-border/50">
                <Button size="sm" variant="ghost" className="flex-1 gap-1 text-xs" onClick={onPreview}>
                    <Eye className="w-3 h-3" /> Preview
                </Button>
                <button onClick={onShare} className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Copy link">
                    {copied ? <Copy className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
                </button>
                {isOwn && (
                    <button onClick={onDelete} className="p-2 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}
