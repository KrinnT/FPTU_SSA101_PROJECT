"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Plus, Trash2, ArrowRight, Save, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import ProtectedRoute from "@/components/layout/protected-route";

// Calendar Imports
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
// Configure moment to start week on Monday
moment.updateLocale('en', {
    week: { dow: 1 }
});
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './rbc-dark.css'; // Dark mode overrides (must be AFTER library CSS)

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(BigCalendar);

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
    groupId?: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMES = Array.from({ length: 24 }, (_, i) => i); // 0:00 to 23:00

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

    // Config values
    const [allowedStartTime, setAllowedStartTime] = useState("08:00");
    const [allowedEndTime, setAllowedEndTime] = useState("22:00");

    // Form Inputs
    const [newEvent, setNewEvent] = useState({ name: "", day: "Monday", startTime: "08:00", endTime: "10:00" });
    const [everydayTask, setEverydayTask] = useState({ name: "", duration: 1 });
    const [includeWeekends, setIncludeWeekends] = useState(true);
    const [normalTask, setNormalTask] = useState({ name: "", duration: 1 });
    const [isLoading, setIsLoading] = useState(true);
    const [repeatWeeks, setRepeatWeeks] = useState(4);

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
                        groupId: t.groupId,
                        assignedSlot: (t.scheduledDay && t.scheduledStartTime)
                            ? { day: t.scheduledDay, startTime: t.scheduledStartTime }
                            : undefined
                    }));
                    setTasks(hydratedTasks);

                    if (hydratedTasks.some((t: Task) => t.assignedSlot)) setGenerated(true);
                }
            } catch (error) {
                console.error("Failed to load scheduler data");
            } finally {
                setIsLoading(false);
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

    // --- HELPERS ---
    const timeToFloat = (time: string) => {
        const [h, m] = time.split(":").map(Number);
        return h + m / 60;
    };

    const floatToTime = (val: number) => {
        const h = Math.floor(val);
        const m = Math.round((val - h) * 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    // --- ALGORITHM ---
    const checkCollision = (day: string, start: number, duration: number, currentFixed: FixedEvent[], currentTasks: Task[], ignoreTaskId?: string) => {
        const end = start + duration;
        const BUFFER = 0.25; // 15 minutes gap

        // Check fixed (Strict collision + Buffer preference? Let's strict collision + buffer to be safe)
        if (currentFixed.some(ev => {
            if (ev.day !== day) return false;
            const evStart = timeToFloat(ev.startTime);
            const evEnd = timeToFloat(ev.endTime);
            // Collision if our task (with buffer padding) overlaps event
            // Logic: (Start < EvEnd) && (End > EvStart). 
            // We want Gap: Start >= EvEnd + Buffer OR End <= EvStart - Buffer
            // So Collision: Start < EvEnd + Buffer && End > EvStart - Buffer
            return (start < evEnd + BUFFER && end > evStart - BUFFER);
        })) return true;

        // Check already placed tasks (Gap required)
        if (currentTasks.some(t => {
            if (t.id === ignoreTaskId) return false; // self
            if (!t.assignedSlot) return false; // not placed
            if (t.assignedSlot.day !== day) return false;
            const tStart = timeToFloat(t.assignedSlot.startTime);
            const tEnd = tStart + t.duration;
            // Ensure 15m gap
            return (start < tEnd + BUFFER && end > tStart - BUFFER);
        })) return true;

        return false;
    };

    const findFirstAvailableSlot = (duration: number, currentFixed: FixedEvent[], currentTasks: Task[], ignoreTaskId?: string) => {
        const globalStartFloat = timeToFloat(allowedStartTime);
        const globalEndFloat = timeToFloat(allowedEndTime);

        for (const day of DAYS) {
            // Step by 15 mins (0.25)
            for (let hour = globalStartFloat; hour <= globalEndFloat - 0.25; hour += 0.25) {
                if (hour + duration > globalEndFloat) continue;

                if (!checkCollision(day, hour, duration, currentFixed, currentTasks, ignoreTaskId)) {
                    return {
                        day,
                        startTime: floatToTime(hour)
                    };
                }
            }
        }
        return undefined;
    };

    const addEverydayTask = async () => {
        if (!everydayTask.name) return;

        const newTasksParams: any[] = [];
        let currentFixed = fixedEvents;
        let localTasksClone = [...tasks];
        const groupId = crypto.randomUUID(); // Unique group ID for this everyday task set
        const optimisticTasks: Task[] = []; // To store temporary tasks for optimistic UI
        const globalStartFloat = timeToFloat(allowedStartTime);
        const globalEndFloat = timeToFloat(allowedEndTime);

        const daysToSchedule = includeWeekends
            ? DAYS
            : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

        daysToSchedule.forEach(day => {
            // Find slot
            let assignedSlot = undefined;
            // Step 15 mins
            for (let hour = globalStartFloat; hour <= globalEndFloat - 0.25; hour += 0.25) {
                if (hour + everydayTask.duration > globalEndFloat) continue;
                if (!checkCollision(day, hour, everydayTask.duration, currentFixed, localTasksClone)) {
                    assignedSlot = { day, startTime: floatToTime(hour) };
                    break;
                }
            }

            if (assignedSlot) {
                const tempId = `temp-${groupId}-${day}`;
                const tempTask: Task = {
                    id: tempId,
                    name: everydayTask.name,
                    duration: everydayTask.duration,
                    assignedSlot,
                    groupId
                };

                // Add to both local clone (for collision detection of remaining days) and optimistic array
                localTasksClone.push(tempTask);
                optimisticTasks.push(tempTask);

                newTasksParams.push({
                    name: everydayTask.name,
                    duration: everydayTask.duration,
                    scheduledDay: assignedSlot.day,
                    scheduledStartTime: assignedSlot.startTime,
                    groupId
                });
            }
        });

        // 1. Optimistic UI Update: Show immediately
        setTasks(prev => [...prev, ...optimisticTasks]);
        setEverydayTask({ ...everydayTask, name: "" });
        setGenerated(true);

        // 2. Background API Call: Batch create
        if (newTasksParams.length > 0) {
            try {
                const res = await fetch("/api/scheduler/tasks/batch-create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tasks: newTasksParams })
                });

                if (res.ok) {
                    const createdTasks = await res.json();

                    // Format the response back to client schema
                    const hydratedTasks = createdTasks.map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        duration: t.duration,
                        groupId: t.groupId,
                        assignedSlot: (t.scheduledDay && t.scheduledStartTime)
                            ? { day: t.scheduledDay, startTime: t.scheduledStartTime }
                            : undefined
                    }));

                    // 3. Replace optimistic temp tasks with the real DB records
                    setTasks(prev => {
                        // Remove the optimistic tasks for this group
                        const filtered = prev.filter(t => t.groupId !== groupId || !t.id.startsWith("temp-"));
                        // Add real tasks
                        return [...filtered, ...hydratedTasks];
                    });
                } else {
                    // Revert on failure
                    console.error("Failed to create everyday tasks");
                    setTasks(prev => prev.filter(t => t.groupId !== groupId));
                }
            } catch (err) {
                console.error("Network error creating everyday tasks", err);
                // Revert on failure
                setTasks(prev => prev.filter(t => t.groupId !== groupId));
            }
        }
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
                    id: t.id, name: t.name, duration: t.duration, groupId: t.groupId,
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

    const removeTask = async (task: Task) => {
        try {
            await fetch(`/api/scheduler/tasks/${task.id}`, { method: "DELETE" });

            // If it has a groupId, remove all tasks with the same groupId from state
            if (task.groupId) {
                setTasks(tasks.filter(t => t.groupId !== task.groupId));
            } else {
                setTasks(tasks.filter(t => t.id !== task.id));
            }
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

    // --- CALENDAR EVENTS FORMATTING ---
    // Helper to find date for a specific day of the week in current week
    const getNextDateForDay = (dayName: string) => {
        const today = new Date();
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const targetDayIndex = days.indexOf(dayName);
        const currentDayIndex = today.getDay();

        // Always place them in the current week starting Sunday
        const diff = targetDayIndex - currentDayIndex;
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + diff);
        return targetDate;
    };

    const calendarEvents: any[] = [];

    for (let w = 0; w < repeatWeeks; w++) {
        const weekOffset = w * 7 * 24 * 60 * 60 * 1000;

        fixedEvents.forEach(fe => {
            const date = getNextDateForDay(fe.day);
            const [sH, sM] = fe.startTime.split(':').map(Number);
            const [eH, eM] = fe.endTime.split(':').map(Number);

            const start = new Date(date.getTime() + weekOffset);
            start.setHours(sH, sM, 0, 0);

            const end = new Date(date.getTime() + weekOffset);
            end.setHours(eH, eM, 0, 0);

            calendarEvents.push({
                id: `${fe.id}-w${w}`,
                title: fe.name,
                start,
                end,
                isFixed: true,
                resourceId: fe.id
            });
        });

        tasks.filter(t => t.assignedSlot).forEach(t => {
            const slot = t.assignedSlot!;
            const date = getNextDateForDay(slot.day);

            const startFloat = timeToFloat(slot.startTime);
            const sH = Math.floor(startFloat);
            const sM = Math.round((startFloat - sH) * 60);

            const endFloat = startFloat + t.duration;
            const eH = Math.floor(endFloat);
            const eM = Math.round((endFloat - eH) * 60);

            const start = new Date(date.getTime() + weekOffset);
            start.setHours(sH, sM, 0, 0);

            const end = new Date(date.getTime() + weekOffset);
            end.setHours(eH, eM, 0, 0);

            calendarEvents.push({
                id: `${t.id}-w${w}`,
                title: t.name,
                start,
                end,
                isFixed: false,
                resourceId: t.id,
                taskId: t.id
            });
        });
    }

    const onEventDrop = async ({ event, start, end }: any) => {
        if (event.isFixed) return; // Cannot move fixed events via UI simply

        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const newDay = days[start.getDay()];
        const newStartTime = floatToTime(start.getHours() + (start.getMinutes() / 60));

        // Optimistic Update
        setTasks(prev => prev.map(t => {
            if (t.id === event.taskId) {
                return { ...t, assignedSlot: { day: newDay, startTime: newStartTime } };
            }
            return t;
        }));

        try {
            await fetch(`/api/scheduler/tasks/${event.taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    scheduledDay: newDay,
                    scheduledStartTime: newStartTime
                })
            });
        } catch (e) {
            console.error("Failed to move event", e);
        }
    };

    const onSelectEvent = (event: any) => {
        if (window.confirm(`Are you sure you want to delete '${event.title}'?`)) {
            if (event.isFixed) {
                removeFixed(event.resourceId);
            } else {
                const taskToDelete = tasks.find(t => t.id === event.taskId);
                if (taskToDelete) {
                    removeTask(taskToDelete);
                }
            }
        }
    };

    const onSelectSlot = ({ start, end }: any) => {
        const h = start.getHours().toString().padStart(2, '0');
        const m = start.getMinutes().toString().padStart(2, '0');
        const eh = end.getHours().toString().padStart(2, '0');
        const em = end.getMinutes().toString().padStart(2, '0');
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const day = days[start.getDay()];
        
        setNewEvent(prev => ({ 
            ...prev, 
            day, 
            startTime: `${h}:${m}`, 
            endTime: `${eh}:${em}` 
        }));
        
        // Scroll to form if needed or just give feedback
        const formElement = document.getElementById('fixed-schedule-form');
        if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
    };

    const CustomEvent = ({ event }: any) => (
        <div className="flex flex-col h-full w-full overflow-hidden">
            <div className="font-bold truncate text-[0.8rem] leading-tight">
                {event.title}
            </div>
            <div className="text-[10px] opacity-80 leading-tight mt-1">
                {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
            </div>
        </div>
    );

    // Calculate grouped tasks to avoid showing 7 tasks
    const everydayTaskGroups = Array.from(
        tasks.reduce((acc, task) => {
            if (task.groupId && task.groupId !== "") {
                if (!acc.has(task.groupId)) {
                    acc.set(task.groupId, {
                        ...task,
                        daysCount: 1 // Track how many days this task appears
                    });
                } else {
                    const existing = acc.get(task.groupId);
                    existing.daysCount += 1;
                }
            }
            return acc;
        }, new Map()).values()
    );

    // Normal tasks are tasks that don't have a 7-day pattern (for this UI simplified assumption, 
    // we'll just say any task without a groupId or single is normal, but actually everyday tasks always get a groupId)
    const normalTasks = tasks.filter(t => !t.groupId || t.groupId === "");
    const groupedEverydayTasks = everydayTaskGroups.filter((g: any) => g.daysCount === 7 || g.id.startsWith("temp-"));

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background w-full">
                <p className="text-muted-foreground animate-pulse">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 bg-background flex flex-col items-center">
            <div className="w-full max-w-6xl space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Smart Scheduler</h1>
                        <p className="text-muted-foreground">Auto-generate your perfect study week based on your free time.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm">
                            <span className="text-muted-foreground mr-2 font-medium">Loop Weeks:</span>
                            <input
                                type="number"
                                min={1}
                                max={52}
                                className="w-12 bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-center text-foreground font-semibold"
                                value={repeatWeeks}
                                onChange={(e) => setRepeatWeeks(Math.max(1, parseInt(e.target.value) || 1))}
                            />
                        </div>
                        <Button variant="outline" onClick={async () => {
                            // Clear DB
                            await fetch("/api/scheduler", { method: "DELETE" });
                            // Clear Local State
                            setFixedEvents([]);
                            setTasks([]);
                            setGenerated(false);
                        }}>
                            <RotateCcw className="w-4 h-4 mr-2" /> Reset
                        </Button>
                        <Button className="bg-primary" onClick={generateSchedule}>
                            <Calendar className="w-4 h-4 mr-2" /> Generate
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* INPUT COMBINED */}
                    <div className="space-y-6 lg:col-span-1">
                        {/* Fixed Events Input */}
                        <Card className="glass-card" id="fixed-schedule-form">
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
                                <div className="space-y-3">
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
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="time"
                                                className="flex-1 min-w-0 text-sm h-10 px-2"
                                                value={newEvent.startTime}
                                                onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })}
                                            />
                                            <span className="text-muted-foreground flex-shrink-0">–</span>
                                            <Input
                                                type="time"
                                                className="flex-1 min-w-0 text-sm h-10 px-2"
                                                value={newEvent.endTime}
                                                onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })}
                                            />
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
                                <div className="flex items-center space-x-2 py-2">
                                    <input
                                        type="checkbox"
                                        id="weekends"
                                        checked={includeWeekends}
                                        onChange={(e) => setIncludeWeekends(e.target.checked)}
                                        className="rounded border-input bg-background w-4 h-4 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="weekends" className="text-sm font-normal cursor-pointer text-muted-foreground">
                                        Include Weekends (Sat-Sun)
                                    </Label>
                                </div>
                                <Button className="w-full" variant="secondary" onClick={addEverydayTask} disabled={!everydayTask.name}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Everyday Task
                                </Button>

                                {/* EVERYDAY TASKS LIST (GROUPED) - belongs to this section */}
                                {groupedEverydayTasks.length > 0 && (
                                    <div className="space-y-2 pt-3 border-t border-border">
                                        <Label className="text-xs text-muted-foreground block">Added Everyday Tasks</Label>
                                        {groupedEverydayTasks.map((groupTask: any) => (
                                            <div key={groupTask.groupId} className="flex justify-between items-center text-sm p-2 bg-primary/10 rounded-md border border-primary/20">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-primary">{groupTask.name}</span>
                                                    <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px]">{groupTask.duration}h/day</span>
                                                </div>
                                                <button onClick={() => removeTask(groupTask)} className="text-muted-foreground hover:text-red-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
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

                                {/* Normal Task List */}
                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 border-t border-border pt-3">
                                    <Label className="text-xs text-muted-foreground mb-2 block">Individual Tasks</Label>
                                    {normalTasks.map(t => (
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
                                            <button onClick={() => removeTask(t)} className="text-muted-foreground hover:text-red-500">
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
                                    {generated ? "Here is your optimized schedule. You can drag and drop items to adjust." : "Add events and click Generate to see the plan."}
                                    <div className="flex items-center gap-4 mt-4 bg-secondary/20 p-2 rounded-md border text-sm">
                                        <div className="font-semibold text-primary">Auto-Schedule Allowed Hours:</div>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="time"
                                                value={allowedStartTime}
                                                onChange={e => setAllowedStartTime(e.target.value)}
                                                className="h-8 w-24 px-2"
                                            />
                                            <span>to</span>
                                            <Input
                                                type="time"
                                                value={allowedEndTime}
                                                onChange={e => setAllowedEndTime(e.target.value)}
                                                className="h-8 w-24 px-2"
                                            />
                                        </div>
                                    </div>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-visible p-0 md:p-6 pb-6">
                                <div className="h-[900px] w-full min-w-[600px] rounded-md overflow-hidden bg-background">
                                    <style>{`
                                        /* Customizing Big Calendar for Dark/Light Mode */
                                        .rbc-calendar {
                                            font-family: inherit;
                                            color: hsl(var(--foreground));
                                            border-color: hsl(var(--border));
                                            min-height: 900px;
                                        }
                                        .rbc-time-view {
                                            border-color: hsl(var(--border));
                                            border-radius: 0.5rem;
                                            overflow: hidden;
                                            flex: 1;
                                        }
                                        .rbc-time-header-content {
                                            border-left-color: hsl(var(--border));
                                            color: hsl(var(--foreground));
                                        }
                                        .rbc-header {
                                            border-bottom-color: hsl(var(--border));
                                            color: hsl(var(--foreground));
                                            padding: 10px 0;
                                            font-weight: 600;
                                            font-size: 0.8rem;
                                            text-transform: uppercase;
                                            letter-spacing: 0.05em;
                                        }
                                        .rbc-header + .rbc-header {
                                            border-left-color: hsl(var(--border));
                                        }
                                        .rbc-day-bg {
                                            border-left-color: color-mix(in srgb, hsl(var(--border)) 50%, transparent);
                                        }
                                        .rbc-time-slot {
                                            border-top: 1px dashed color-mix(in srgb, hsl(var(--border)) 30%, transparent);
                                        }
                                        .rbc-timeslot-group {
                                            border-bottom-color: color-mix(in srgb, hsl(var(--border)) 30%, transparent);
                                            min-height: 70px; /* INCREASED again to ensure 2 lines of text + time fits */
                                        }
                                        .rbc-event {
                                            border: none;
                                            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
                                            padding: 0 !important; /* Managed by CustomEvent now */
                                            display: flex;
                                            flex-direction: column;
                                            overflow: visible !important;
                                        }
                                        .rbc-event-content {
                                            overflow: visible !important;
                                            padding: 4px 8px;
                                        }
                                        .rbc-event-label {
                                            display: none !important;
                                        }
                                        .rbc-today {
                                            background-color: color-mix(in srgb, hsl(var(--primary)) 5%, transparent);
                                        }
                                        .rbc-event-content {
                                            font-size: 0.85rem;
                                            font-weight: 600;
                                            line-height: 1.2;
                                            word-break: break-word;
                                            white-space: normal;
                                            overflow: visible;
                                        }
                                        .rbc-current-time-indicator {
                                            background-color: hsl(var(--primary));
                                            height: 2px;
                                        }
                                        .rbc-time-content {
                                            border-top: none;
                                        }
                                        .rbc-time-content > * + * > * {
                                            border-left-color: color-mix(in srgb, hsl(var(--border)) 50%, transparent);
                                        }
                                        .rbc-time-gutter .rbc-timeslot-group {
                                            border-right-color: color-mix(in srgb, hsl(var(--border)) 50%, transparent);
                                            border-bottom-color: transparent;
                                        }
                                        .rbc-label {
                                            font-size: 0.7rem;
                                            color: hsl(var(--muted-foreground));
                                            padding: 0 4px;
                                        }
                                        .rbc-toolbar button {
                                            color: hsl(var(--foreground));
                                            border-color: hsl(var(--border));
                                        }
                                        .rbc-toolbar button:active,
                                        .rbc-toolbar button.rbc-active {
                                            background-image: none;
                                            background-color: hsl(var(--primary));
                                            border-color: hsl(var(--primary));
                                            color: hsl(var(--primary-foreground));
                                            box-shadow: none;
                                        }
                                        .rbc-toolbar button:hover:not(.rbc-active) {
                                            background-color: hsl(var(--border));
                                        }
                                    `}</style>
                                    <DnDCalendar
                                        localizer={localizer}
                                        events={calendarEvents}
                                        defaultView="week"
                                        views={['week', 'day']}
                                        step={15}
                                        timeslots={4}
                                        onEventDrop={onEventDrop}
                                        onEventResize={() => { }} // Could be implemented later
                                        resizable={false}
                                        draggableAccessor={(event: any) => !event.isFixed}
                                        onSelectEvent={onSelectEvent}
                                        onSelectSlot={onSelectSlot}
                                        selectable
                                        components={{
                                            event: CustomEvent
                                        }}
                                        eventPropGetter={(event: any) => ({
                                            style: {
                                                backgroundColor: event.isFixed ? '#f43f5e' : '#3b82f6', // rose-500 / blue-500
                                                color: 'white',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                padding: '2px 4px'
                                            }
                                        })}
                                        toolbar={true}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div >
    );
}
