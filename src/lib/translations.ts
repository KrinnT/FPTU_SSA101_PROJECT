export type Language = "en" | "vn";

export const translations = {
    en: {
        "nav_home": "Home",
        "nav_dashboard": "Dashboard",
        "nav_assessment": "Assessment",
        "nav_chat": "Chat",
        "nav_exercises": "Exercises",
        "nav_scheduler": "Scheduler",
        "nav_community": "Community",
        "nav_login": "Login",
        "nav_logout": "Logout",
        "header_team": "SSA101 | CHATGPT TEAM",
        "welcome_back": "Welcome back",
        "crisis_help": "I need support",
        "settings_language": "Language",
    },
    vn: {
        "nav_home": "Trang chủ",
        "nav_dashboard": "Bảng tin",
        "nav_assessment": "Đánh giá",
        "nav_chat": "Trò chuyện",
        "nav_exercises": "Bài tập",
        "nav_scheduler": "Lịch biểu",
        "nav_community": "Cộng đồng",
        "nav_login": "Đăng nhập",
        "nav_logout": "Đăng xuất",
        "header_team": "SSA101 | TEAM CHATGPT",
        "welcome_back": "Chào mừng trở lại",
        "crisis_help": "Tôi cần hỗ trợ",
        "settings_language": "Ngôn ngữ",
    }
};

export type TranslationKey = keyof typeof translations.en;
