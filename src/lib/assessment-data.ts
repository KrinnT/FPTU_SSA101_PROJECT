export type Category = "Depression" | "Anxiety" | "Stress";

export interface Question {
    id: number;
    text: string;
    category: Category;
}

// DASS-21 Raw Score Thresholds (No multiplication)
// Source: Lovibond, S.H. & Lovibond, P.F. (1995)
export const DASS_THRESHOLDS = {
    Depression: {
        normal: 4,
        mild: 6,
        moderate: 10,
        severe: 13,
    },
    Anxiety: {
        normal: 3,
        mild: 5,
        moderate: 7,
        severe: 9,
    },
    Stress: {
        normal: 7,
        mild: 9,
        moderate: 12,
        severe: 16,
    },
};

export const questions: Question[] = [
    { id: 1, text: "I found it hard to wind down", category: "Stress" },
    { id: 2, text: "I was aware of dryness of my mouth", category: "Anxiety" },
    { id: 3, text: "I couldn't seem to experience any positive feeling at all", category: "Depression" },
    { id: 4, text: "I experienced breathing difficulty (e.g. excessively rapid breathing, breathlessness in the absence of physical exertion)", category: "Anxiety" },
    { id: 5, text: "I found it difficult to work up the initiative to do things", category: "Depression" },
    { id: 6, text: "I tended to over-react to situations", category: "Stress" },
    { id: 7, text: "I experienced trembling (e.g. in the hands)", category: "Anxiety" },
    { id: 8, text: "I felt that I was using a lot of nervous energy", category: "Stress" },
    { id: 9, text: "I was worried about situations in which I might panic and make a fool of myself", category: "Anxiety" },
    { id: 10, text: "I felt that I had nothing to look forward to", category: "Depression" },
    { id: 11, text: "I found myself getting agitated", category: "Stress" },
    { id: 12, text: "I found it difficult to relax", category: "Stress" },
    { id: 13, text: "I felt down-hearted and blue", category: "Depression" },
    { id: 14, text: "I was intolerant of anything that kept me from getting on with what I was doing", category: "Stress" },
    { id: 15, text: "I felt I was close to panic", category: "Anxiety" },
    { id: 16, text: "I was unable to become enthusiastic about anything", category: "Depression" },
    { id: 17, text: "I felt I wasn't worth much as a person", category: "Depression" },
    { id: 18, text: "I felt that I was rather touchy", category: "Stress" },
    { id: 19, text: "I was aware of the action of my heart in the absence of physical exertion (e.g. sense of heart rate increase, heart missing a beat)", category: "Anxiety" },
    { id: 20, text: "I felt scared without any good reason", category: "Anxiety" },
    { id: 21, text: "I felt that life was meaningless", category: "Depression" },
];
