import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { calculateRewards } from '@/utils/calculator';

// 简单的本地存储函数
const loadData = () => {
    try {
        const data = localStorage.getItem('fitness-data');
        return data ? JSON.parse(data) : {
            records: [],
            rewards: { small: 0, medium: 0, large: 0 },
            rewardHistory: []
        };
    } catch (error) {
        return {
            records: [],
            rewards: { small: 0, medium: 0, large: 0 },
            rewardHistory: []
        };
    }
};

const saveData = (data) => {
    try {
        localStorage.setItem('fitness-data', JSON.stringify(data));
    } catch (error) {
        console.error('保存数据失败:', error);
    }
};

export const useAppStore = defineStore('app', () => {
    const isAuthenticated = ref(false);
    const isLoading = ref(false);

    const records = ref([]);
    const rewards = ref({ small: 0, medium: 0, large: 0 });
    const rewardHistory = ref([]);

    // 初始化应用
    const initApp = () => {
        const data = loadData();
        records.value = data.records;
        rewards.value = data.rewards;
        rewardHistory.value = data.rewardHistory;
        isAuthenticated.value = true;
    };

    // 保存数据
    const saveAppData = () => {
        const data = {
            records: records.value,
            rewards: rewards.value,
            rewardHistory: rewardHistory.value
        };
        saveData(data);
    };

    // 添加记录
    const addRecord = (newRecord) => {
        const existingIndex = records.value.findIndex(r => r.date === newRecord.date);

        if (existingIndex !== -1) {
            records.value[existingIndex] = newRecord;
        } else {
            records.value.push(newRecord);
        }

        // 按日期倒序排序
        records.value.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 处理奖励
        processMonthlyReward(newRecord.date.substring(0, 7));
        saveAppData();
    };

    // 处理月度奖励
    const processMonthlyReward = (yearMonth) => {
        const { earnedSmallReward, rewardCount } = calculateRewards(records.value, yearMonth);
        const alreadyRewarded = rewardHistory.value.some(item =>
            item.message && item.message.includes(yearMonth)
        );

        if (earnedSmallReward && !alreadyRewarded) {
            rewards.value.small += 1;
            rewardHistory.value.push({
                date: new Date().toISOString().split('T')[0],
                action: 'earned',
                type: 'small',
                message: `因${yearMonth}月奖励次数(${rewardCount})未达20，获得1个小奖励`
            });
        }
    };

    // 兑换奖励
    const exchangeRewards = (fromType, toType) => {
        if (fromType === 'small' && toType === 'medium' && rewards.value.small >= 3) {
            rewards.value.small -= 3;
            rewards.value.medium += 1;
            rewardHistory.value.push({
                date: new Date().toISOString().split('T')[0],
                action: 'exchanged',
                from: ['small', 'small', 'small'],
                to: 'medium',
                message: `用3个小奖励兑换了1个中级奖励`
            });
            saveAppData();
        }
    };

    return {
        isAuthenticated,
        isLoading,
        records,
        rewards,
        rewardHistory,
        initApp,
        addRecord,
        exchangeRewards,
        saveAppData
    };
});