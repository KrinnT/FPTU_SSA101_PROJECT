"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Plus, Trash2, ArrowRight, Save, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedRoute from "@/components/layout/protected-route";

// Types
interface FixedEvent {
    id: string;
    day: string; // "Monday", "Tuesday", etc.
    startTime: string; // "08:00"
    endTime: string; // "10:00"
    name: string;
}

interface Task {
    id: string;
    name: string;
    duration: number; // in hours
    assignedSlot?: { day: string, startTime: string }; // Assigned by algorithm
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMES = Array.from({ length: 16 }, (_, i) => i + 7); // 7:00 to 22:00

export default function SchedulerPage() {
    return (
        <ProtectedRoute>
            <SchedulerContent />
        </ProtectedRoute>
    );
}

function SchedulerContent() {
    // State
    const [fixedEvents, setFixedEvents] = useState<FixedEvent[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [generated, setGenerated] = useState(false);

    // Form Inputs
    const [newEvent, setNewEvent] = useState({ name: "", day: "Monday", startTime: "08:00", endTime: "10:00" });
    const [everydayTask, setEverydayTask] = useState({ name: "", duration: 1 });
    const [normalTask, setNormalTask] = useState({ name: "", duration: 1 });

    // Load from DB
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/scheduler");
                if (res.ok) {
                    const data = await res.json();

                    // Hydrate Fixed Events
                    setFixedEvents(data.fixedEvents || []);

                    // Hydrate Tasks and map assignedSlot
                    const hydratedTasks = (data.tasks || []).map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        duration: t.duration,
                        assignedSlot: (t.scheduledDay && t.scheduledStartTime)
                            ? { day: t.scheduledDay, startTime: t.scheduledStartTime }
                            : undefined
                    }));
                    setTasks(hydratedTasks);

                    if (hydratedTasks.some((t: Task) => t.assignedSlot)) setGenerated(true);
                }
            } catch (error) {
                console.error("Failed to load scheduler data");
            }
        };
        fetchData();
    }, []);

    const addFixedEvent = async () => {
        if (!newEvent.name) return;
        try {
            const res = await fetch("/api/scheduler/fixed", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newEvent)
            });
            if (res.ok) {
                const event = await res.json();
                setFixedEvents([...fixedEvents, event]);
                setNewEvent({ ...newEvent, name: "" });
            }
        } catch (e) { console.error(e); }
    };

    // --- ALGORITHM ---
    const checkCollision = (day: string, startHour: number, duration: number, currentFixed: FixedEvent[], currentTasks: Task[], ignoreTaskId?: string) => {
        // Check fixed
        if (currentFixed.some(ev => {
            if (ev.day !== day) return false;
            const evStart = parseInt(ev.startTime.split(":")[0]);
            const evEnd = parseInt(ev.endTime.split(":")[0]);
            return (startHour < evEnd && (startHour + duration) > evStart);
        })) return true;

        // Check already placed tasks
        if (currentTasks.some(t => {
            if (t.id === ignoreTaskId) return false; // self
            if (!t.assignedSlot) return false; // not placed
            if (t.assignedSlot.day !== day) return false;
            const tStart = parseInt(t.assignedSlot.startTime.split(":")[0]);
            return (startHour < (tStart + t.duration) && (startHour + duration) > tStart);
        })) return true;

        return false;
    };

    const findFirstAvailableSlot = (duration: number, currentFixed: FixedEvent[], currentTasks: Task[], ignoreTaskId?: string) => {
        for (const day of DAYS) {
            for (const hour of TIMES) { // 7, 8, ... 22
                if (hour + duration > 23) continue; // exceed day end (allow up to 23:00 end)

                if (!checkCollision(day, hour, duration, currentFixed, currentTasks, ignoreTaskId)) {
                    return {
                        day,
                        startTime: `${hour}:00`.padStart(5, '0')
                    };
                }
            }
        }
        return undefined;
    };

    const addEverydayTask = async () => {
        if (!everydayTask.name) return;

        // Note: For "Everyday Task", we create 7 separate tasks on the backend? 
        // Or one task repeated? The current logic creates 7 tasks. 
        // We need to call the API 7 times or create a batch API.
        // For simplicity, let's just loop and call create 7 times (parallel).

        // However, the original logic calculates slots immediately. 
        // We should replicate that: Calculate slots, then create tasks with those slots.

        const newTasksParams: any[] = [];
        let currentFixed = fixedEvents;
        let localTasksClone = [...tasks];

        DAYS.forEach(day => {
            // Find slot
            let assignedSlot = undefined;
            for (const hour of TIMES) {
                if (hour + everydayTask.duration > 23) continue;
                if (!checkCollision(day, hour, everydayTask.duration, currentFixed, localTasksClone)) {
                    assignedSlot = { day, startTime: `${hour}:00`.padStart(5, '0') };
                    break;
                }
            }

            if (assignedSlot) {
                // We will create this task with the slot pre-filled
                // But wait, 'localTasksClone' needs it to prevent collision for next day? 
                // Actually days are independent, so no collision between these 7 tasks.
                // But we update 'localTasksClone' in case we add more things.
                const tempTask = {
                    id: "temp",
                    name: everydayTask.name,
                    duration: everydayTask.duration,
                    assignedSlot
                };
                localTasksClone.push(tempTask);

                newTasksParams.push({
                    name: everydayTask.name,
                    duration: everydayTask.duration,
                    scheduledDay: assignedSlot.day,
                    scheduledStartTime: assignedSlot.startTime
                });
            }
        });

        // Parallel Create
        await Promise.all(newTasksParams.map(async p => {
            const res = await fetch("/api/scheduler/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(p)
            });
            if (res.ok) {
                const t = await res.json();
                // Hydrate and add to state
                const hydrated = {
                    id: t.id, name: t.name, duration: t.duration,
                    assignedSlot: (t.scheduledDay && t.scheduledStartTime) ? { day: t.scheduledDay, startTime: t.scheduledStartTime } : undefined
                };
                setTasks(prev => [...prev, hydrated]);
            }
        }));

        setEverydayTask({ ...everydayTask, name: "" });
        setGenerated(true); // Since we auto-scheduled them
    };

    const addNormalTask = async () => {
        if (!normalTask.name) return;

        // Auto-schedule logic
        const slot = findFirstAvailableSlot(normalTask.duration, fixedEvents, tasks);

        try {
            const res = await fetch("/api/scheduler/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: normalTask.name,
                    duration: normalTask.duration,
                    scheduledDay: slot?.day,
                    scheduledStartTime: slot?.startTime
                })
            });

            if (res.ok) {
                const t = await res.json();
                const hydrated = {
                    id: t.id, name: t.name, duration: t.duration,
                    assignedSlot: (t.scheduledDay && t.scheduledStartTime) ? { day: t.scheduledDay, startTime: t.scheduledStartTime } : undefined
                };
                setTasks([...tasks, hydrated]);
                setNormalTask({ ...normalTask, name: "" });
                if (slot) setGenerated(true);
            }
        } catch (e) { console.error(e); }
    };

    const removeFixed = async (id: string) => {
        try {
            await fetch(`/api/scheduler/fixed/${id}`, { method: "DELETE" });
            setFixedEvents(fixedEvents.filter(e => e.id !== id));
            // Note: We might need to re-generate or warn user that tasks might now be invalid?
            // For now, keep it simple.
        } catch (e) { console.error(e); }
    };

    const removeTask = async (id: string) => {
        try {
            await fetch(`/api/scheduler/tasks/${id}`, { method: "DELETE" });
            setTasks(tasks.filter(t => t.id !== id));
        } catch (e) { console.error(e); }
    };

    const generateSchedule = async () => {
        // Recalculate all slots
        let currentTasksState: Task[] = [...tasks].map(t => ({ ...t, assignedSlot: undefined }));

        for (let i = 0; i < currentTasksState.length; i++) {
            const task = currentTasksState[i];
            const slot = findFirstAvailableSlot(task.duration, fixedEvents, currentTasksState, task.id);

            if (slot) {
                currentTasksState[i].assignedSlot = slot;
            }
        }

        setTasks(currentTasksState);
        setGenerated(true);

        // Sync updates to backend
        try {
            await fetch("/api/scheduler/tasks/batch", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    updates: currentTasksState.map(t => ({
                        id: t.id,
                        assignedSlot: t.assignedSlot
                    }))
                })
            });
        } catch (e) { console.error("Batch update failed", e); }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 bg-background flex flex-col items-center">
            <div className="w-full max-w-6xl space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Smart Scheduler</h1>
                        <p className="text-muted-foreground">Auto-generate your perfect study week based on your free time.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => {
                            setFixedEvents([]);
                            setTasks([]);
                            setGenerated(false);
                            // TODO: Add Clear API
                        }}>
                            <RotateCcw className="w-4 h-4 mr-2" /> Reset View
                        </Button>
                        <Button className="bg-primary" onClick={generateSchedule}>
                            <Calendar className="w-4 h-4 mr-2" /> Generate Schedule
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* INPUT COMBINED */}
                    <div className="space-y-6 lg:col-span-1">
                        {/* Fixed Events Input */}
                        <Card className="glass-card">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">1. Fixed Schedule</CardTitle>
                                <CardDescription>Classes, Part-time jobs, etc.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Activity Name</Label>
                                    <Input
                                        placeholder="e.g. Calculus Class"
                                        value={newEvent.name}
                                        onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <Label>Day</Label>
                                        <select
                                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={newEvent.day}
                                            onChange={e => setNewEvent({ ...newEvent, day: e.target.value })}
                                        >
                                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Time</Label>
                                        <div className="flex items-center gap-1">
                                            <select
                                                className="w-full h-10 rounded-md border border-input bg-background px-1 text-sm"
                                                value={newEvent.startTime}
                                                onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })}
                                            >
                                                {TIMES.slice(0, -1).map(t => <option key={t} value={`${t}:00`}>{t}:00</option>)}
                                            </select>
                                            <span>-</span>
                                            <select
                                                className="w-full h-10 rounded-md border border-input bg-background px-1 text-sm"
                                                value={newEvent.endTime}
                                                onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })}
                                            >
                                                {TIMES.slice(1).map(t => <option key={t} value={`${t}:00`}>{t}:00</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <Button className="w-full" variant="secondary" onClick={addFixedEvent} disabled={!newEvent.name}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Fixed Event
                                </Button>

                                {/* List */}
                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                                    {fixedEvents.map(ev => (
                                        <div key={ev.id} className="flex justify-between items-center text-sm p-2 bg-secondary/10 rounded-md border border-secondary/20">
                                            <div>
                                                <span className="font-semibold block">{ev.name}</span>
                                                <span className="text-muted-foreground">{ev.day.slice(0, 3)} {ev.startTime}-{ev.endTime}</span>
                                            </div>
                                            <button onClick={() => removeFixed(ev.id)} className="text-muted-foreground hover:text-red-500">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {fixedEvents.length === 0 && <p className="text-xs text-center text-muted-foreground py-2">No fixed events yet.</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Everyday Tasks Input */}
                        <Card className="glass-card">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">2. Task To Do Everyday</CardTitle>
                                <CardDescription>Adds this activity to every day of the week.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Everyday Task Name</Label>
                                    <Input
                                        placeholder="e.g. Morning Jog"
                                        value={everydayTask.name}
                                        onChange={e => setEverydayTask({ ...everydayTask, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Duration (Hours)</Label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3].map(h => (
                                            <button
                                                key={h}
                                                onClick={() => setEverydayTask({ ...everydayTask, duration: h })}
                                                className={cn(
                                                    "flex-1 py-2 rounded-md border text-sm transition-all",
                                                    everydayTask.duration === h
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-transparent hover:bg-muted"
                                                )}
                                            >
                                                {h}h
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <Button className="w-full" variant="secondary" onClick={addEverydayTask} disabled={!everydayTask.name}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Everyday Task
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Normal Tasks Input */}
                        <Card className="glass-card">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">3. Tasks To Do</CardTitle>
                                <CardDescription>Flexible items to fit in once.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Task Name</Label>
                                    <Input
                                        placeholder="e.g. Study Math"
                                        value={normalTask.name}
                                        onChange={e => setNormalTask({ ...normalTask, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Duration (Hours)</Label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4].map(h => (
                                            <button
                                                key={h}
                                                onClick={() => setNormalTask({ ...normalTask, duration: h })}
                                                className={cn(
                                                    "flex-1 py-2 rounded-md border text-sm transition-all",
                                                    normalTask.duration === h
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-transparent hover:bg-muted"
                                                )}
                                            >
                                                {h}h
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <Button className="w-full" variant="secondary" onClick={addNormalTask} disabled={!normalTask.name}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Task
                                </Button>

                                {/* Task List */}
                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                                    {tasks.map(t => (
                                        <div key={t.id} className={cn(
                                            "flex justify-between items-center text-sm p-2 rounded-md border",
                                            t.assignedSlot
                                                ? "bg-secondary/10 border-secondary/20"
                                                : "bg-red-500/10 border-red-500/20"
                                        )}>
                                            <div className="flex flex-col">
                                                <div className="flex items-center">
                                                    <span className="font-semibold">{t.name}</span>
                                                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{t.duration}h</span>
                                                </div>
                                                {!t.assignedSlot && <span className="text-[10px] text-red-400">Not scheduled (no space)</span>}
                                            </div>
                                            <button onClick={() => removeTask(t.id)} className="text-muted-foreground hover:text-red-500">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {tasks.length === 0 && <p className="text-xs text-center text-muted-foreground py-2">No tasks added.</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* CALENDAR VISUALIZATION */}
                    <div className="lg:col-span-2">
                        <Card className="glass-card h-full min-h-[600px] flex flex-col">
                            <CardHeader className="pb-4">
                                <CardTitle>Weekly Timetable</CardTitle>
                                <CardDescription>
                                    {generated ? "Here is your optimized schedule." : "Add events and click Generate to see the plan."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-x-auto pb-6">
                                <div className="min-w-[700px]">
                                    {/* Header Row */}
                                    <div className="grid grid-cols-8 gap-1 mb-2">
                                        <div className="text-center text-xs font-bold text-muted-foreground pt-2">TIME</div>
                                        {DAYS.map(d => (
                                            <div key={d} className="text-center text-xs font-bold uppercase tracking-wider p-2 bg-secondary/20 rounded-md text-foreground">
                                                {d.slice(0, 3)}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Grid */}
                                    <div className="space-y-1">
                                        {TIMES.map(hour => (
                                            <div key={hour} className="grid grid-cols-8 gap-1 h-14">
                                                {/* Time Label */}
                                                <div className="text-xs text-muted-foreground text-right pr-2 pt-1 border-t border-dashed border-white/10">
                                                    {hour}:00
                                                </div>

                                                {/* Day Columns */}
                                                {DAYS.map(day => {
                                                    // Find items here
                                                    const fixedItem = fixedEvents.find(e =>
                                                        e.day === day &&
                                                        parseInt(e.startTime.split(":")[0]) === hour
                                                    );

                                                    // Render fixed event (handle height for duration)
                                                    if (fixedItem) {
                                                        const duration = parseInt(fixedItem.endTime.split(":")[0]) - parseInt(fixedItem.startTime.split(":")[0]);
                                                        return (
                                                            <div
                                                                key={`${day}-${hour}`}
                                                                className="relative z-20 rounded-md bg-rose-500/80 p-1 text-[10px] leading-tight text-white shadow-sm overflow-hidden hover:opacity-90 transition-opacity border border-rose-400"
                                                                style={{ height: `${duration * 3.5}rem`, gridRow: `span ${duration}` }}
                                                            >
                                                                <strong>{fixedItem.name}</strong>
                                                                <br />
                                                                {fixedItem.startTime}-{fixedItem.endTime}
                                                            </div>
                                                        );
                                                    }

                                                    // Skip if inside a multi-hour fixed event (logic simplified for rendering: we only render at start time)
                                                    // Check if this hour is covered by a previous fixed event
                                                    const coveringFixed = fixedEvents.find(e =>
                                                        e.day === day &&
                                                        parseInt(e.startTime.split(":")[0]) < hour &&
                                                        parseInt(e.endTime.split(":")[0]) > hour
                                                    );
                                                    if (coveringFixed) return <div key={`${day}-${hour}`} className="invisible" />; // Placeholder

                                                    // Find Task
                                                    const taskItem = tasks.find(t =>
                                                        t.assignedSlot?.day === day &&
                                                        parseInt(t.assignedSlot.startTime.split(":")[0]) === hour
                                                    );

                                                    if (taskItem) {
                                                        return (
                                                            <div
                                                                key={`${day}-${hour}`}
                                                                className="relative z-10 rounded-md bg-blue-500/70 p-1 text-[10px] text-white shadow-sm overflow-hidden hover:opacity-90 transition-opacity border border-blue-400"
                                                                style={{ height: `${taskItem.duration * 3.5}rem` }}
                                                            >
                                                                <div className="font-semibold">{taskItem.name}</div>
                                                                <div className="opacity-80 text-[9px] flex items-center gap-1">
                                                                    <Clock className="w-2 h-2" /> {taskItem.duration}h
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    // Skip if covered by task
                                                    const coveringTask = tasks.find(t =>
                                                        t.assignedSlot?.day === day &&
                                                        parseInt(t.assignedSlot.startTime.split(":")[0]) < hour &&
                                                        (parseInt(t.assignedSlot.startTime.split(":")[0]) + t.duration) > hour
                                                    );
                                                    if (coveringTask) return <div key={`${day}-${hour}`} className="invisible" />;

                                                    // Empty Cell
                                                    return (
                                                        <div key={`${day}-${hour}`} className="rounded-md bg-white/5 border border-white/5 hover:bg-white/10 transition-colors" />
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
