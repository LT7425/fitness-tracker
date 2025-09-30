import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useHistoryStore } from './history';

// --- 成就定义 ---
const achievementsList = [
    { id: 'streak3', name: '坚持不懈', description: '连续打卡3天', icon: 'fire', category: 'streak' },
    { id: 'streak7', name: '连续一周', description: '连续打卡7天', icon: 'fire', category: 'streak' },
    { id: 'streak14', name: '毅力惊人', description: '连续打卡14天', icon: 'fire', category: 'streak' },
    { id: 'run10k', name: '跑步新手', description: '累计跑步10公里', icon: 'running', category: 'distance' },
    { id: 'run50k', name: '跑步达人', description: '累计跑步50公里', icon: 'running', category: 'distance' },
    { id: 'run100k', name: '长跑健将', description: '累计跑步100公里', icon: 'running', category: 'distance' },
    { id: 'cycle25k', name: '骑行初体验', description: '累计骑行25公里', icon: 'cycling', category: 'distance' },
    { id: 'cycle100k', name: '单车好手', description: '累计骑行100公里', icon: 'cycling', category: 'distance' },
    { id: 'firstActivity', name: '初次尝试', description: '完成首次运动打卡', icon: 'calendar-check', category: 'milestone' },
    { id: 'total10', name: '运动健将', description: '累计完成10次运动', icon: 'bolt', category: 'milestone' },
    { id: 'total50', name: '运动狂人', description: '累计完成50次运动', icon: 'bolt', category: 'milestone' },
    { id: 'long_duration', name: '时间管理大师', description: '单次运动超过1小时', icon: 'clock', category: 'special' },
];

const REWARD_KEY = 'last_redeemed_index';

export const useRewardsStore = defineStore('rewards', () => {
    const historyStore = useHistoryStore()
    
    // 从 localStorage 读取最后兑换的记录索引
    const lastRedeemedIndex = ref(parseInt(localStorage.getItem(REWARD_KEY) || '-1', 10));

    // --- 新的礼盒逻辑 ---
    // 计算自上次兑换以来，未被计入奖励的记录数量
    const unredeemedRecordsCount = computed(() => {
        const totalRecords = historyStore.allRecords.length;
        if (totalRecords === 0) return 0;
        // 总记录数 - (上次兑换时的索引 + 1)
        return totalRecords - (lastRedeemedIndex.value + 1);
    });

    // 根据未兑换记录的数量，判断当前可用的奖励类型
    const availableReward = computed(() => {
        const count = unredeemedRecordsCount.value;
        if (count >= 20) return 'large'; // 20条及以上可兑换大礼盒
        if (count >= 15) return 'small'; // 15条及以上可兑换小礼盒
        return null; // 否则无可用奖励
    });

    // 兑换奖励
    function redeemReward(type) {
        if (type !== availableReward.value) {
            alert('不满足兑换条件！');
            return;
        }

        const rewardName = type === 'large' ? '大礼盒' : '小礼盒';
        const rewardItem = type === 'large' ? '【品牌蛋白粉一罐】' : '【运动补给水杯】';

        // 关键：更新“最后兑换索引”为当前所有记录的最后一个索引
        lastRedeemedIndex.value = historyStore.allRecords.length - 1;
        localStorage.setItem(REWARD_KEY, lastRedeemedIndex.value.toString());

        alert(`恭喜！成功兑换一个${rewardName}，获得随机奖励：${rewardItem}！`);
    }

    // --- 成就计算逻辑 (已修复) ---
    const unlockedAchievements = computed(() => {
        const records = historyStore.allRecords;
        
        // 修复：即使没有记录，也返回所有成就（锁定状态）
        if (!records || records.length === 0) {
            return achievementsList.map(ach => ({
                ...ach,
                unlocked: false,
                unlockedDate: '未解锁',
            }));
        }

        const unlocked = new Set();
        const totalActivities = records.length;
        const longestStreak = historyStore.stats.longestStreak;
        
        const totalStats = records.reduce((acc, r) => {
            const type = r.type.toLowerCase();
            acc[type] = (acc[type] || 0) + r.distanceNum;
            return acc;
        }, {});

        if (totalActivities > 0) unlocked.add('firstActivity');
        if (totalActivities >= 10) unlocked.add('total10');
        if (totalActivities >= 50) unlocked.add('total50');
        if (longestStreak >= 3) unlocked.add('streak3');
        if (longestStreak >= 7) unlocked.add('streak7');
        if (longestStreak >= 14) unlocked.add('streak14');
        if ((totalStats.running || 0) >= 10) unlocked.add('run10k');
        if ((totalStats.running || 0) >= 50) unlocked.add('run50k');
        if ((totalStats.running || 0) >= 100) unlocked.add('run100k');
        if ((totalStats.cycling || 0) >= 25) unlocked.add('cycle25k');
        if ((totalStats.cycling || 0) >= 100) unlocked.add('cycle100k');
        if (records.some(r => r.durationNum >= 60)) unlocked.add('long_duration');

        return achievementsList.map(ach => ({
            ...ach,
            unlocked: unlocked.has(ach.id),
            unlockedDate: unlocked.has(ach.id) ? '已获得' : '未解锁',
        }));
    });

    return {
        unlockedAchievements,
        unredeemedRecordsCount,
        availableReward,
        redeemReward,
    };
});