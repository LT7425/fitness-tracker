import { number } from 'echarts';
import { defineStore } from 'pinia';
import { ref } from 'vue';

// Helper to parse "60min" to 60
const parseDuration = (durationStr) => {
    if (!durationStr) return 0;
    return parseInt(durationStr, 10) || 0;
};

// Helper to parse "18.95(公里)" to 18.95
const parseDistance = (distanceStr) => {
    if (!distanceStr) return 0;
    if(typeof(distanceStr) == 'number') return distanceStr;
    const match = distanceStr.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
};

const calculateLongestStreak = (records) => {
    if (!records || records.length === 0) return 0;
    const dates = [...new Set(records.map(r => r.date.split('T')[0]))]
        .map(d => new Date(d))
        .sort((a, b) => a - b);
    if (dates.length < 2) return dates.length;

    let longest = 1, current = 1;
    for (let i = 1; i < dates.length; i++) {
        const diff = (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
            current++;
        } else {
            longest = Math.max(longest, current);
            current = 1;
        }
    }
    return Math.max(longest, current);
};

export const useHistoryStore = defineStore('history', () => {
    const allRecords = ref([]);
    const filteredRecords = ref([]);
    
    const stats = ref({
        totalCount: 0,
        totalDuration: 0, // in hours
        totalDistance: 0, // in km
        longestStreak: 0,
    });

    const durationChartData = ref({});
    const typeChartData = ref({});

    async function fetchAllRecords() {
        if (allRecords.value.length > 0) return;
        try {
            const response = await fetch(new URL('../data.json', import.meta.url));
            const data = await response.json();
            allRecords.value = data.records.map(r => ({
                ...r,
                dateObj: new Date(r.date),
                durationNum: parseDuration(r.sportsTime),
                distanceNum: parseDistance(r.distance),
            }));
            // Initially, show all records
            fetchHistory({});
        } catch (error) {
            console.error('Failed to load data.json:', error);
        }
    }

    function fetchHistory({ timeRange = 'all', exerciseType = 'all', searchQuery = '' }) {
        let records = [...allRecords.value];

        const sportTypes = {
            cycling: '骑行',
            walk: '步行',
            run: '跑步',
        }

        // 1. Filter by Time Range
        const now = new Date();
        if (timeRange !== 'all') {
            records = records.filter(r => {
                const recordDate = r.dateObj;
                switch (timeRange) {
                    case 'month':
                        return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
                    case 'lastMonth':
                        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        return recordDate.getMonth() === lastMonth.getMonth() && recordDate.getFullYear() === lastMonth.getFullYear();
                    case '3months':
                        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                        return recordDate >= threeMonthsAgo;
                    case 'year':
                        return recordDate.getFullYear() === now.getFullYear();
                    default:
                        return true;
                }
            });
        }

        // 2. Filter by Exercise Type
        if (exerciseType !== 'all') {
            records = records.filter(r => r.type.toLowerCase() === exerciseType.toLowerCase());
        }

        // 3. Filter by Search Query (assuming search applies to type or a non-existent notes field)
        if (searchQuery) {
            records = records.filter(r => r.type.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        filteredRecords.value = records;
        
        // 4. Calculate Stats
        const totalMinutes = records.reduce((sum, r) => sum + r.durationNum, 0);
        stats.value = {
            totalCount: records.length,
            totalDuration: (totalMinutes / 60).toFixed(1),
            totalDistance: records.reduce((sum, r) => sum + r.distanceNum, 0).toFixed(2),
            longestStreak: calculateLongestStreak(records),
        };

        // 5. Prepare Chart Data
        // Duration Trend (monthly)
        const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        const currentYearData = new Array(12).fill(0);
        
        allRecords.value.filter(r => r.dateObj.getFullYear() === now.getFullYear()).forEach(r => {
            const month = r.dateObj.getMonth();
            currentYearData[month] += r.durationNum;
        });

        durationChartData.value = {
            grid: { top: 30, right: 20, bottom: 30, left: 50 },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: monthLabels },
            yAxis: { type: 'value', name: '分钟' },
            series: [{
                name: '运动时长 (分钟)',
                type: 'line',
                smooth: true,
                data: currentYearData,
                areaStyle: {},
                lineStyle: { width: 2 },
                itemStyle: { color: '#3B82F6' }
            }]
        };

        // Type Distribution
        const typeCounts = records.reduce((acc, r) => {
            acc[r.type] = (acc[r.type] || 0) + 1;
            return acc;
        }, {});

        typeChartData.value = {
            tooltip: { trigger: 'item' },
            legend: { bottom: 0 },
            series: [{
                name: '运动类型',
                type: 'pie',
                radius: ['50%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
                label: { show: false, position: 'center' },
                emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
                labelLine: { show: false },
                data: Object.entries(typeCounts).map(([name, value]) => ({ name: sportTypes[name], value })),
            }],
            color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6']
        };
    }

    return {
        allRecords, 
        filteredRecords,
        stats,
        durationChartData,
        typeChartData,
        fetchAllRecords,
        fetchHistory,
    };
});