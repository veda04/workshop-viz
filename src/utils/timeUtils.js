// Generate custom ticks with dynamic intervals based on zoom level
export const generateTicks = (displayData) => {
if (displayData.length === 0) return [];

const ticks = [];
const firstTime = displayData[0].time;
const lastTime = displayData[displayData.length - 1].time;

// Parse the first and last times
const [startHours, startMinutes] = firstTime.split(':').map(Number);
const [endHours, endMinutes] = lastTime.split(':').map(Number);
const startTotalMinutes = startHours * 60 + startMinutes;
const endTotalMinutes = endHours * 60 + endMinutes;
const rangeMinutes = endTotalMinutes - startTotalMinutes;

// Determine interval based on visible range
let interval;
if (rangeMinutes <= 10) {
    interval = 1;  // 1-minute intervals when zoomed in to 10 minutes or less (maximum zoom)
} else if (rangeMinutes <= 30) {
    interval = 2;  // 2-minute intervals for 10-30 minutes
} else if (rangeMinutes <= 60) {
    interval = 5;  // 5-minute intervals for 30-60 minutes
} else if (rangeMinutes <= 180) {
    interval = 10; // 10-minute intervals for 1-3 hours
} else if (rangeMinutes <= 360) {
    interval = 15; // 15-minute intervals for 3-6 hours
} else {
    interval = 20; // 20-minute intervals for wider ranges
}

// Round to nearest interval
const roundedStart = Math.floor(startTotalMinutes / interval) * interval;

// Generate ticks for visible range
for (let m = roundedStart; m <= endTotalMinutes + interval; m += interval) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    ticks.push(timeStr);
}

return ticks;
};
