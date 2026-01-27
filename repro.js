
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMES = Array.from({ length: 16 }, (_, i) => i + 7); // 7:00 to 22:00

// Mock Data
const fixedEvents = [
    { id: "1", day: "Monday", startTime: "12:00", endTime: "14:00", name: "SSA101" },
    { id: "2", day: "Monday", startTime: "15:00", endTime: "17:00", name: "MAE101" },
    { id: "3", day: "Wednesday", startTime: "12:00", endTime: "14:00", name: "VOV1" },
];

const tasks = [
    { id: "t1", name: "DAILYDICTION LIS", duration: 1 },
    { id: "t2", name: "CODE PYTHON", duration: 1 }
];

function generateSchedule() {
    console.log("Starting generation...");
    // 1. Reset all tasks
    const tasksToSchedule = tasks.map(t => ({ ...t, assignedSlot: undefined }));
    const currentSchedule = [...fixedEvents];

    // Helper to check collision
    const isOccupied = (day, startHour, duration) => {
        // This function was identified as unused in the original code, but I'll leave it here to match structure
        return false;
    };

    // 2. Greedy allocation
    for (const task of tasksToSchedule) {
        let placed = false;
        console.log(`Scheduling task: ${task.name} (${task.duration}h)`);

        for (const day of DAYS) {
            if (placed) break;
            for (const hour of TIMES) { // 7, 8, ... 22
                if (hour + task.duration > 22) continue; // exceed day end

                // Check collision logic from the component
                const checkCollision = (d, s, dur) => {
                    // Check fixed
                    if (fixedEvents.some(ev => {
                        if (ev.day !== d) return false;
                        const evStart = parseInt(ev.startTime.split(":")[0]);
                        const evEnd = parseInt(ev.endTime.split(":")[0]);
                        return (s < evEnd && (s + dur) > evStart);
                    })) {
                         // console.log(`Collision fixed: ${d} ${s} with event`);
                         return true;
                    }

                    // Check already placed tasks
                    if (tasksToSchedule.some(t => {
                        if (t === task) return false; // self
                        if (!t.assignedSlot) return false; // not placed
                        if (t.assignedSlot.day !== d) return false;
                        const tStart = parseInt(t.assignedSlot.startTime.split(":")[0]);
                        // t.duration
                        return (s < (tStart + t.duration) && (s + dur) > tStart);
                    })) {
                        // console.log(`Collision task: ${d} ${s} with task`);
                        return true;
                    }

                    return false;
                };

                if (!checkCollision(day, hour, task.duration)) {
                    // Found a spot!
                    task.assignedSlot = {
                        day,
                        startTime: `${hour}:00`.padStart(5, '0') // 08:00
                    };
                    placed = true;
                    console.log(`Placed ${task.name} at ${day} ${task.assignedSlot.startTime}`);
                    break;
                }
            }
        }
        if (!placed) console.log(`Could not place ${task.name}`);
    }

    return tasksToSchedule;
}

const result = generateSchedule();
console.log("Result:", JSON.stringify(result, null, 2));
