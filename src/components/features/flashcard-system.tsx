"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, Play, ArrowLeft, ArrowRight, RotateCw, Save, X, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Assuming you have this or use standard textarea
import { cn } from "@/lib/utils";

// --- Types ---
interface Flashcard {
    id: string;
    front: string;
    back: string;
}

interface Deck {
    id: string;
    title: string;
    description?: string;
    color: string;
    cards: Flashcard[];
}

// --- Data & Helpers ---


const COLORS = [
    "bg-rose-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500",
    "bg-cyan-500", "bg-indigo-500", "bg-violet-500", "bg-pink-500"
];

// --- Components ---

export function FlashcardSystem({ initialDecks = [] }: { initialDecks?: Deck[] }) {
    // State
    const [decks, setDecks] = useState<Deck[]>(initialDecks);
    const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
    const [isStudyMode, setIsStudyMode] = useState(false);

    const activeDeck = decks.find(d => d.id === activeDeckId);

    // --- Handlers ---
    const createDeck = async (title: string, desc: string, color: string) => {
        try {
            const res = await fetch("/api/flashcards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description: desc, color })
            });

            if (res.ok) {
                const newDeck = await res.json();
                setDecks([...decks, newDeck]);
            }
        } catch (error) {
            console.error("Create deck failed", error);
        }
    };

    const deleteDeck = async (id: string) => {
        if (confirm("Are you sure you want to delete this deck?")) {
            try {
                await fetch(`/api/flashcards/${id}`, { method: "DELETE" });
                setDecks(decks.filter(d => d.id !== id));
                if (activeDeckId === id) setActiveDeckId(null);
            } catch (error) {
                console.error("Delete deck failed", error);
            }
        }
    };

    const addCard = async (deckId: string, front: string, back: string) => {
        try {
            const res = await fetch("/api/flashcards/cards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deckId, front, back })
            });

            if (res.ok) {
                const newCard = await res.json();
                setDecks(decks.map(d => {
                    if (d.id === deckId) {
                        return { ...d, cards: [...d.cards, newCard] };
                    }
                    return d;
                }));
            }
        } catch (error) {
            console.error("Add card failed", error);
        }
    };

    const removeCard = async (deckId: string, cardId: string) => {
        try {
            await fetch(`/api/flashcards/cards/${cardId}`, { method: "DELETE" });
            setDecks(decks.map(d => {
                if (d.id === deckId) {
                    return { ...d, cards: d.cards.filter(c => c.id !== cardId) };
                }
                return d;
            }));
        } catch (error) {
            console.error("Remove card failed", error);
        }
    };

    // --- Render ---

    if (isStudyMode && activeDeck) {
        return <StudyMode deck={activeDeck} onExit={() => setIsStudyMode(false)} />;
    }

    if (activeDeck) {
        return <DeckDetail
            deck={activeDeck}
            onBack={() => setActiveDeckId(null)}
            onStudy={() => setIsStudyMode(true)}
            onAddCard={(f, b) => addCard(activeDeck.id, f, b)}
            onRemoveCard={(cid) => removeCard(activeDeck.id, cid)}
        />;
    }

    return <DeckList decks={decks} onCreate={createDeck} onDelete={deleteDeck} onSelect={setActiveDeckId} />;
}

// --- Sub-Components ---

function DeckList({ decks, onCreate, onDelete, onSelect }: {
    decks: Deck[],
    onCreate: (t: string, d: string, c: string) => void,
    onDelete: (id: string) => void,
    onSelect: (id: string) => void
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newColor, setNewColor] = useState(COLORS[0]);

    const handleCreate = () => {
        if (!newTitle) return;
        onCreate(newTitle, newDesc, newColor);
        setIsOpen(false);
        setNewTitle("");
        setNewDesc("");
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Your Library</h2>
                    <p className="text-muted-foreground">Manage your flashcard decks</p>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 rounded-full shadow-lg hover:shadow-xl transition-all">
                            <Plus className="w-4 h-4" /> Create Deck
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Deck</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Spanish Basics" />
                            </div>
                            <div className="space-y-2">
                                <Label>Description (Optional)</Label>
                                <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="e.g. Chapter 1 vocabulary" />
                            </div>
                            <div className="space-y-2">
                                <Label>Color</Label>
                                <div className="flex gap-2 flex-wrap">
                                    {COLORS.map(c => (
                                        <button
                                            key={c}
                                            className={cn(
                                                "w-8 h-8 rounded-full transition-all ring-2 ring-offset-2 ring-offset-background",
                                                c,
                                                newColor === c ? "ring-primary scale-110" : "ring-transparent hover:scale-105"
                                            )}
                                            onClick={() => setNewColor(c)}
                                        />
                                    ))}
                                </div>
                            </div>
                            <Button onClick={handleCreate} className="w-full" disabled={!newTitle}>Create Deck</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {decks.map(deck => (
                    <div
                        key={deck.id}
                        className="group relative bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                        onClick={() => onSelect(deck.id)}
                    >
                        <div className={cn("h-3 w-full", deck.color)} />
                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="font-bold text-xl truncate">{deck.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5em]">
                                    {deck.description || "No description"}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <span className="inline-flex items-center text-sm font-medium text-muted-foreground bg-secondary/50 px-2.5 py-0.5 rounded-full">
                                    {deck.cards.length} cards
                                </span>

                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); onDelete(deck.id); }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {decks.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-secondary mb-4">
                        <RotateCw className="h-10 w-10 opacity-20" />
                    </div>
                    <p>No decks found. Create one to get started!</p>
                </div>
            )}
        </div>
    );
}

function DeckDetail({ deck, onBack, onStudy, onAddCard, onRemoveCard }: {
    deck: Deck,
    onBack: () => void,
    onStudy: () => void,
    onAddCard: (f: string, b: string) => void,
    onRemoveCard: (id: string) => void
}) {
    const [front, setFront] = useState("");
    const [back, setBack] = useState("");

    const handleAdd = () => {
        if (!front || !back) return;
        onAddCard(front, back);
        setFront("");
        setBack("");
        // Focus front input?
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                            <span className={cn("w-4 h-4 rounded-full", deck.color)} />
                            {deck.title}
                        </h1>
                        <p className="text-muted-foreground">{deck.cards.length} cards</p>
                    </div>
                </div>

                <Button
                    onClick={onStudy}
                    disabled={deck.cards.length === 0}
                    className={cn(
                        "gap-2 rounded-full px-6 transition-all",
                        deck.cards.length > 0 ? "shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105" : ""
                    )}
                >
                    <Play className="w-4 h-4 fill-current" /> Study Deck
                </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* List of Cards */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Edit2 className="w-4 h-4" /> Cards in Deck
                    </h3>

                    <div className="space-y-3">
                        {deck.cards.map((card, idx) => (
                            <div key={card.id} className="flex gap-4 p-4 rounded-xl border bg-card/50 hover:bg-card transition-colors group">
                                <div className="flex-1 space-y-1">
                                    <div className="font-medium">{card.front}</div>
                                    <div className="text-sm text-muted-foreground border-t pt-1 mt-1 border-border/50">{card.back}</div>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-8 w-8 self-center"
                                    onClick={() => onRemoveCard(card.id)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        {deck.cards.length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                                No cards yet. Add some below!
                            </div>
                        )}
                    </div>
                </div>

                {/* Add Card Form */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-24 border-none shadow-xl bg-gradient-to-br from-card to-secondary/10">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="font-semibold text-lg">Add New Card</h3>

                            <div className="space-y-2">
                                <Label>Front (Term/Question)</Label>
                                <Input
                                    value={front}
                                    onChange={e => setFront(e.target.value)}
                                    placeholder="e.g. Serendipity"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Back (Definition/Answer)</Label>
                                <Textarea
                                    value={back}
                                    onChange={e => setBack(e.target.value)}
                                    placeholder="e.g. The occurrence of events by chance in a happy or beneficial way"
                                    className="min-h-[100px] resize-none"
                                />
                            </div>

                            <Button onClick={handleAdd} className="w-full gap-2" disabled={!front || !back}>
                                <Plus className="w-4 h-4" /> Add Card
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function StudyMode({ deck, onExit }: { deck: Deck, onExit: () => void }) {
    const [index, setIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const total = deck.cards.length;

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => setIndex((prev) => (prev + 1) % total), 250);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => setIndex((prev) => (prev - 1 + total) % total), 250);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === " " || e.key === "Enter") setIsFlipped(p => !p);
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, []);

    const currentCard = deck.cards[index];

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in duration-300">
            {/* Study Header */}
            <div className="h-16 border-b flex items-center justify-between px-6">
                <Button variant="ghost" onClick={onExit} className="gap-2">
                    <X className="w-4 h-4" /> Exit
                </Button>
                <div className="flex flex-col items-center">
                    <span className="font-bold">{deck.title}</span>
                    <span className="text-xs text-muted-foreground">{index + 1} / {total}</span>
                </div>
                <div className="w-20" /> {/* Spacer */}
            </div>

            {/* Card Area */}
            <div className="flex-1 flex items-center justify-center p-6 bg-secondary/10 relative overflow-hidden">
                {/* Decorative Blobs */}
                <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[150px] animate-pulse pointer-events-none" />

                <div className="w-full max-w-2xl aspect-[3/2] perspective-[1000px] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                    <motion.div
                        initial={false}
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                        className="w-full h-full relative preserve-3d"
                        style={{ transformStyle: "preserve-3d" }}
                    >
                        {/* Front */}
                        <div className={cn(
                            "absolute inset-0 backface-hidden rounded-3xl shadow-2xl flex flex-col items-center justify-center p-12 text-center border-2 border-primary/10 bg-card",
                            "hover:border-primary/30 transition-colors"
                        )}>
                            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground absolute top-8">Term</span>
                            <h2 className="text-3xl md:text-5xl font-bold">{currentCard.front}</h2>
                            <span className="text-xs text-muted-foreground absolute bottom-8">Click or Space to flip</span>
                        </div>

                        {/* Back */}
                        <div
                            className="absolute inset-0 backface-hidden rounded-3xl shadow-2xl flex flex-col items-center justify-center p-12 text-center border-2 border-secondary bg-primary/5 text-foreground"
                            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                        >
                            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground absolute top-8">Definition</span>
                            <p className="text-xl md:text-3xl font-medium leading-relaxed">{currentCard.back}</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Controls */}
            <div className="h-24 border-t bg-card flex items-center justify-center gap-8">
                <Button size="icon" variant="outline" className="h-12 w-12 rounded-full" onClick={handlePrev}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>

                <Button size="lg" className="rounded-full px-12 text-lg h-12" onClick={() => setIsFlipped(!isFlipped)}>
                    <RotateCw className="w-5 h-5 mr-2" /> Flip
                </Button>

                <Button size="icon" variant="outline" className="h-12 w-12 rounded-full" onClick={handleNext}>
                    <ArrowRight className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
