"use client";

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MoodTrendChartProps {
    history: any[];
    onAddCheckIn: () => void;
}

export default function MoodTrendChart({ history, onAddCheckIn }: MoodTrendChartProps) {
    if (history.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                <p>No daily data yet.</p>
                <Button variant="outline" size="sm" onClick={onAddCheckIn}>
                    <Plus className="w-4 h-4 mr-2" /> Add First Check-in
                </Button>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
                <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 6]} hide />
                <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: 'var(--color-foreground)' }}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="#0ea5e9"
                    fillOpacity={1}
                    fill="url(#colorMood)"
                    strokeWidth={3}
                    name="Mood Score"
                />
                <Line
                    type="monotone"
                    dataKey="focus"
                    stroke="#0d9488"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Focus Level"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
