"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Language, TranslationKey } from "./translations";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>("en");
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("app_language") as Language;
        if (stored && (stored === "en" || stored === "vn")) {
            setLanguageState(stored);
        }
        setIsLoaded(true);
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("app_language", lang);
    };

    const t = (key: TranslationKey): string => {
        return translations[language][key] || key;
    };

    // if (!isLoaded) return <>{children}</>; // This caused the crash because children use the hook immediately.

    // To avoid hydration mismatch, we can just let it be 'en' initially and then update.
    // Or we can render a loading state if we really want to wait. 
    // But for now, let's always provide context.

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
