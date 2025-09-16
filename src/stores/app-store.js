import { defineStore } from 'pinia';
import { ref } from 'vue';
import { calculateRewards } from '@/utils/calculator';

const loadData = async () => {
    try {
        // 使用fetch加载src目录下的data.json
        const response = await fetch(new URL('../data.json', import.meta.url));
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data || {
            records: [],
            rewards: { small: 0, medium: 0, large: 0 },
            rewardHistory: []
        };
    } catch (error) {
        console.error('加载data.json失败:', error);
        // 加载失败时返回默认数据
        return {
            records: [],
            rewards: { small: 0, medium: 0, large: 0 },
            rewardHistory: []
        };
    }
};

export const useAppStore = defineStore('app', () => {
    const isAuthenticated = ref(false);
    const isLoading = ref(false);

    const records = ref([]);
    const rewards = ref({ small: 0, medium: 0, large: 0 });
    const rewardHistory = ref([]);

    // 初始化应用 - 仅加载数据，不保存
    const initApp = async () => {
        const data = await loadData();
        console.log(data);
        records.value = data.records;
        rewards.value = data.rewards;
        rewardHistory.value = data.rewardHistory;
        isAuthenticated.value = true;
    };

    // 添加记录 - 不包含保存逻辑
    const addRecord = (newRecord) => {
        const existingIndex = records.value.findIndex(r => r.date === newRecord.date);

        if (existingIndex !== -1) {
            records.value[existingIndex] = newRecord;
        } else {
            records.value.push(newRecord);
        }

        // 按日期倒序排序
        records.value.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 处理奖励（仅内存中计算，不保存）
        processMonthlyReward(newRecord.date.substring(0, 7));
    };

    // 处理月度奖励（仅内存中计算）
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

    // 兑换奖励（仅内存中操作）
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
        exchangeRewards
    };
});