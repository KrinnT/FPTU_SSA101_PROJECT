"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { User, Settings, Shield, LogOut, ChevronRight, X, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────
type Panel = "profile" | "security" | null;
type SecurityTab = "password" | "email" | "2fa";

// ── Main Component ────────────────────────────────────────────────────────
export function UserProfileDropdown() {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const [panel, setPanel] = useState<Panel>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
                setPanel(null);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (!user) return null;

    const initials = user.name
        ? user.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
        : user.email[0].toUpperCase();

    const handleLogout = async () => {
        localStorage.removeItem("chat_history");
        localStorage.removeItem("psych-flashcards");
        localStorage.removeItem("scheduler_fixed");
        localStorage.removeItem("scheduler_tasks");
        localStorage.removeItem("forumPosts_clean");
        localStorage.removeItem("cbtJournal");
        await logout();
    };

    return (
        <div ref={dropdownRef} className="relative shrink-0">
            {/* ── Trigger Button ── */}
            <button
                onClick={() => { setOpen(!open); setPanel(null); }}
                className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-full transition-all",
                    open ? "bg-primary/20" : "hover:bg-white/10"
                )}
            >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                    {initials}
                </div>
                <span className="hidden md:block text-sm font-medium max-w-[80px] truncate">
                    {user.name || user.email.split("@")[0]}
                </span>
            </button>

            {/* ── Dropdown Menu ── */}
            {open && !panel && (
                <div className="absolute bottom-full mb-2 right-0 w-56 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 z-50">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
                        <p className="text-sm font-semibold truncate">{user.name || "User"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="p-1.5 space-y-0.5">
                        <MenuButton
                            icon={<User className="w-4 h-4" />}
                            label="Thông tin cá nhân"
                            onClick={() => setPanel("profile")}
                        />
                        <MenuButton
                            icon={<Shield className="w-4 h-4" />}
                            label="Bảo mật"
                            onClick={() => setPanel("security")}
                        />
                    </div>

                    {/* Logout */}
                    <div className="p-1.5 border-t border-border/50">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Đăng xuất
                        </button>
                    </div>
                </div>
            )}

            {/* ── Profile Panel ── */}
            {open && panel === "profile" && (
                <PanelModal
                    title="Thông tin cá nhân"
                    onClose={() => { setPanel(null); setOpen(false); }}
                    onBack={() => setPanel(null)}
                >
                    <ProfilePanel user={user} onSaved={() => { setPanel(null); setOpen(false); }} />
                </PanelModal>
            )}

            {/* ── Security Panel ── */}
            {open && panel === "security" && (
                <PanelModal
                    title="Bảo mật"
                    onClose={() => { setPanel(null); setOpen(false); }}
                    onBack={() => setPanel(null)}
                >
                    <SecurityPanel />
                </PanelModal>
            )}
        </div>
    );
}

// ── Helper Sub-components ─────────────────────────────────────────────────
function MenuButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
        >
            <span className="text-muted-foreground">{icon}</span>
            {label}
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
        </button>
    );
}

function PanelModal({ title, children, onClose, onBack }: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    onBack: () => void;
}) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bg-card rounded-2xl shadow-2xl border border-border/50 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
                    <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                    <h2 className="font-semibold">{title}</h2>
                    <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-5">
                    {children}
                </div>
            </div>
        </div>
    );
}

// ── Profile Panel ─────────────────────────────────────────────────────────
function ProfilePanel({ user, onSaved }: { user: { name?: string | null; email: string }; onSaved: () => void }) {
    const [name, setName] = useState(user.name || "");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/auth/profile").then(r => r.json()).then(d => {
            if (d.user) { setName(d.user.name || ""); setPhone(d.user.phone || ""); }
        });
    }, []);

    async function handleSave() {
        setLoading(true); setError(""); setSuccess(false);
        const res = await fetch("/api/auth/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "updateProfile", name, phone })
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) { setError(data.error || "Lỗi không xác định"); return; }
        setSuccess(true);
        setTimeout(onSaved, 800);
    }

    return (
        <div className="space-y-4">
            <Field label="Họ và tên" value={name} onChange={setName} placeholder="Nguyễn Văn A" />
            <Field label="Số điện thoại" value={phone} onChange={setPhone} placeholder="0901234567" />
            <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm mt-1 text-muted-foreground">{user.email} <span className="text-xs">(đổi ở mục Bảo mật)</span></p>
            </div>
            {error && <ErrorMsg text={error} />}
            {success && <SuccessMsg text="Đã lưu thành công!" />}
            <Button className="w-full" onClick={handleSave} disabled={loading}>
                {loading ? "Đang lưu..." : "Lưu thông tin"}
            </Button>
        </div>
    );
}

// ── Security Panel ────────────────────────────────────────────────────────
function SecurityPanel() {
    const [tab, setTab] = useState<SecurityTab>("password");

    return (
        <div className="space-y-4">
            {/* Tab switcher */}
            <div className="flex rounded-xl overflow-hidden border border-border/50 text-xs">
                {(["password", "email", "2fa"] as SecurityTab[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={cn(
                            "flex-1 py-2 font-medium transition-colors",
                            tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/40"
                        )}
                    >
                        {t === "password" ? "Mật khẩu" : t === "email" ? "Email" : "2FA"}
                    </button>
                ))}
            </div>

            {tab === "password" && <ChangePasswordForm />}
            {tab === "email" && <ChangeEmailForm />}
            {tab === "2fa" && <TwoFAInfo />}
        </div>
    );
}

function ChangePasswordForm() {
    const [cur, setCur] = useState(""); const [newP, setNewP] = useState(""); const [confirm, setConfirm] = useState("");
    const [showCur, setShowCur] = useState(false); const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState(false);

    async function handleSave() {
        if (newP !== confirm) { setError("Mật khẩu mới không khớp"); return; }
        if (newP.length < 8) { setError("Mật khẩu mới tối thiểu 8 ký tự"); return; }
        setLoading(true); setError(""); setSuccess(false);
        const res = await fetch("/api/auth/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "changePassword", currentPassword: cur, newPassword: newP })
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) { setError(data.error || "Lỗi"); return; }
        setSuccess(true); setCur(""); setNewP(""); setConfirm("");
    }

    return (
        <div className="space-y-3">
            <PasswordField label="Mật khẩu hiện tại" value={cur} onChange={setCur} show={showCur} onToggle={() => setShowCur(!showCur)} />
            <PasswordField label="Mật khẩu mới" value={newP} onChange={setNewP} show={showNew} onToggle={() => setShowNew(!showNew)} />
            <PasswordField label="Xác nhận mật khẩu mới" value={confirm} onChange={setConfirm} show={showNew} onToggle={() => setShowNew(!showNew)} />
            {error && <ErrorMsg text={error} />}
            {success && <SuccessMsg text="Đổi mật khẩu thành công!" />}
            <Button className="w-full" onClick={handleSave} disabled={loading || !cur || !newP || !confirm}>
                {loading ? "Đang đổi..." : "Đổi mật khẩu"}
            </Button>
        </div>
    );
}

function ChangeEmailForm() {
    const [newEmail, setNewEmail] = useState(""); const [cur, setCur] = useState("");
    const [showP, setShowP] = useState(false); const [loading, setLoading] = useState(false);
    const [error, setError] = useState(""); const [success, setSuccess] = useState(false);

    async function handleSave() {
        setLoading(true); setError(""); setSuccess(false);
        const res = await fetch("/api/auth/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "changeEmail", newEmail, currentPassword: cur })
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) { setError(data.error || "Lỗi"); return; }
        setSuccess(true); setCur(""); setNewEmail("");
    }

    return (
        <div className="space-y-3">
            <Field label="Email mới" value={newEmail} onChange={setNewEmail} placeholder="email@fpt.edu.vn" type="email" />
            <PasswordField label="Mật khẩu hiện tại (xác nhận)" value={cur} onChange={setCur} show={showP} onToggle={() => setShowP(!showP)} />
            {error && <ErrorMsg text={error} />}
            {success && <SuccessMsg text="Đổi email thành công! Vui lòng đăng nhập lại." />}
            <Button className="w-full" onClick={handleSave} disabled={loading || !newEmail || !cur}>
                {loading ? "Đang đổi..." : "Đổi email"}
            </Button>
        </div>
    );
}

function TwoFAInfo() {
    return (
        <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Shield className="w-7 h-7 text-primary" />
            </div>
            <div>
                <p className="font-semibold">Xác thực 2 bước (2FA)</p>
                <p className="text-sm text-muted-foreground mt-1">Tính năng đang được phát triển.</p>
                <p className="text-xs text-muted-foreground mt-1">2FA qua email OTP sẽ sớm ra mắt.</p>
            </div>
            <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs text-left">
                🚧 Tính năng này đang trong lộ trình phát triển và sẽ được thêm vào trong bản cập nhật tiếp theo.
            </div>
        </div>
    );
}

// ── UI Helpers ────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = "text" }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
    return (
        <div>
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <Input className="mt-1" type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        </div>
    );
}

function PasswordField({ label, value, onChange, show, onToggle }: {
    label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void;
}) {
    return (
        <div>
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <div className="relative mt-1">
                <Input type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} className="pr-9" />
                <button type="button" onClick={onToggle} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

function ErrorMsg({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{text}
        </div>
    );
}

function SuccessMsg({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg p-2.5 text-xs">
            <Check className="w-3.5 h-3.5 flex-shrink-0" />{text}
        </div>
    );
}
