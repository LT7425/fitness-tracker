import { defineStore } from 'pinia';
import { ref } from 'vue';

const loadData = async (type) => {
    try {
        const response = await fetch(new URL('../data.json', import.meta.url));
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const records = data.records || [];

        const now = new Date();

        if (type === 'month') {
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            return records.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
            });
        }

        if (type === 'week') {
            const today = new Date();
            const currentDay = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
            const dayDiff = currentDay === 0 ? 6 : currentDay - 1; // 日期差，周一为起始

            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - dayDiff);
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            return records.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate >= startOfWeek && recordDate <= endOfWeek;
            });
        }

        // 默认返回所有记录
        return records;
    } catch (error) {
        console.error('加载data.json失败:', error);
        // 加载失败时返回空数组
        return [];
    }
};

const calculateLongestStreak = (records) => {
    if (!records || records.length === 0) {
        return 0;
    }

    const sortedDates = [...new Set(records.map(r => r.date))]
        .map(d => new Date(d))
        .sort((a, b) => a - b);

    if (sortedDates.length < 2) {
        return sortedDates.length;
    }

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
        const diffTime = sortedDates[i].getTime() - sortedDates[i - 1].getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            currentStreak++;
        } else {
            currentStreak = 1;
        }

        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
        }
    }
    return longestStreak;
};

export const useDataStore = defineStore('data', () => {
    const weekRecords = ref([]);
    const monthRecords = ref([]);
    const longestWeekStreak = ref(0);
    const longestMonthStreak = ref(0);
    const rewards = ref({ small: 0, medium: 0, large: 0 });

    const fetchAllData = async () => {
        const loadedWeekRecords = await loadData('week');
        weekRecords.value = loadedWeekRecords;
        longestWeekStreak.value = calculateLongestStreak(loadedWeekRecords);

        const loadedMonthRecords = await loadData('month');
        monthRecords.value = loadedMonthRecords;
        longestMonthStreak.value = calculateLongestStreak(loadedMonthRecords);
    };

    return { 
        weekRecords, 
        monthRecords, 
        longestWeekStreak, 
        longestMonthStreak, 
        rewards, 
        fetchAllData 
    };
});

