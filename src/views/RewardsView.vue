<template>
  <div class="rewards-container">
    <h1>我的成就与奖励</h1>
    
    <!-- 新的礼盒兑换区域 -->
    <div class="redemption-section">
      <h2>兑换奖励</h2>
      <p>根据您记录的运动次数，可以兑换不同等级的礼盒！</p>
      
      <div class="redemption-status">
        <p>自上次兑换后，您已累计记录 <strong>{{ unredeemedRecordsCount }}</strong> 次运动。</p>
      </div>

      <div class="reward-options">
        <!-- 小礼盒 -->
        <div class="reward-card">
          <div class="reward-icon">🎁</div>
          <h3>小礼盒</h3>
          <p>需要 15 次记录</p>
          <button 
            @click="rewardsStore.redeemReward('small')"
            :disabled="availableReward !== 'small' && availableReward !== 'large'"
            class="redeem-btn"
          >
            {{ unredeemedRecordsCount >= 15 ? '立即兑换' : `${15 - unredeemedRecordsCount}次后解锁` }}
          </button>
        </div>

        <!-- 大礼盒 -->
        <div class="reward-card">
          <div class="reward-icon">🎉</div>
          <h3>大礼盒</h3>
          <p>需要 20 次记录</p>
          <button 
            @click="rewardsStore.redeemReward('large')"
            :disabled="availableReward !== 'large'"
            class="redeem-btn large"
          >
            {{ unredeemedRecordsCount >= 20 ? '立即兑换' : `${20 - unredeemedRecordsCount}次后解锁` }}
          </button>
        </div>
      </div>
      <p class="redeem-note">注意：兑换大礼盒的条件是累计20次且未兑换小礼盒。兑换任意礼盒后，计数将重置。</p>
    </div>

    <!-- 所有徽章区域 -->
    <div class="all-badges-section">
      <div class="section-header">
        <h2><i class="icon-grid"></i> 所有成就</h2>
        <div class="badge-filters">
          <button class="filter-btn" :class="{ active: activeFilter === 'all' }" @click="setFilter('all')">全部</button>
          <button class="filter-btn" :class="{ active: activeFilter === 'unlocked' }" @click="setFilter('unlocked')">已获得</button>
          <button class="filter-btn" :class="{ active: activeFilter === 'locked' }" @click="setFilter('locked')">未获得</button>
        </div>
      </div>
      
      <div class="badges-grid all-badges">
        <div 
          v-for="badge in filteredBadges" 
          :key="badge.id"
          class="badge-card"
          :class="{ 'locked': !badge.unlocked }"
        >
          <div class="badge-icon" :class="getIconClass(badge.icon, badge.unlocked)">
            <i :class="`icon-${badge.icon}`"></i>
          </div>
          <h3>{{ badge.name }}</h3>
          <p>{{ badge.description }}</p>
          <span class="badge-date" :class="{ 'new': badge.unlocked }">
            {{ badge.unlockedDate }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRewardsStore } from '@/stores/rewards.js';
import { useHistoryStore } from '@/stores/history.js';

// Stores
const rewardsStore = useRewardsStore();
const historyStore = useHistoryStore();

// 从 store 中解构 state 和 getter
const { unlockedAchievements, unredeemedRecordsCount, availableReward } = storeToRefs(rewardsStore);

// 组件挂载时获取所有历史记录
onMounted(() => {
  historyStore.fetchAllRecords();
});

// 成就徽章筛选
const activeFilter = ref('all');
const setFilter = (filter) => {
  activeFilter.value = filter;
};

const filteredBadges = computed(() => {
  // 确保 unlockedAchievements.value 是一个数组
  const achievements = Array.isArray(unlockedAchievements.value) ? unlockedAchievements.value : [];
  
  if (activeFilter.value === 'unlocked') {
    return achievements.filter(b => b.unlocked);
  }
  if (activeFilter.value === 'locked') {
    return achievements.filter(b => !b.unlocked);
  }
  return achievements;
});

// 图标样式辅助函数
const getIconClass = (icon, unlocked) => {
  if (!unlocked) return 'locked-icon';
  const iconMap = {
    fire: 'fire-icon',
    running: 'run-icon',
    cycling: 'bike-icon',
    'calendar-check': 'calendar-icon',
    bolt: 'bolt-icon',
    clock: 'time-icon',
  };
  return iconMap[icon] || 'locked-icon';
};
</script>

<style scoped>
/* General Styles */
.rewards-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.rewards-container h1 {
  font-size: 2rem;
  margin-bottom: 25px;
  color: #333;
}

/* Redemption Section */
.redemption-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 25px;
  margin-bottom: 40px;
  text-align: center;
}

.redemption-section h2 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 5px;
}

.redemption-section p {
  color: #666;
  margin-bottom: 20px;
}

.redemption-status {
  font-size: 1.1rem;
  margin-bottom: 25px;
}

.redemption-status strong {
  color: #3B82F6;
  font-size: 1.5rem;
}

.reward-options {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
}

.reward-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  width: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.reward-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}

.reward-card h3 {
  font-size: 1.2rem;
  margin-bottom: 5px;
}

.redeem-btn {
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 15px;
}

.redeem-btn.large {
  background: #F59E0B;
}

.redeem-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.redeem-btn:not(:disabled):hover {
  opacity: 0.9;
}

.redeem-note {
  margin-top: 25px;
  font-size: 0.9rem;
  color: #9ca3af;
}

/* All Badges Section */
.all-badges-section {
  margin-top: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 1.5rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Badge Filters */
.badge-filters {
  display: flex;
  gap: 10px;
}

.filter-btn {
  background: white;
  border: 1px solid #ddd;
  color: #666;
  border-radius: 20px;
  padding: 6px 15px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn.active {
  background: #3B82F6;
  color: white;
  border-color: #3B82F6;
}

.filter-btn:not(.active):hover {
  background: #f5f5f5;
}

/* Badges Grid */
.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.badge-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 20px;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.badge-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

.badge-card.locked {
  opacity: 0.6;
  background: #f9fafb;
}

.badge-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  margin: 0 auto 15px;
}

.fire-icon { background: #fff3cd; color: #F59E0B; }
.run-icon { background: #e3f2fd; color: #3B82F6; }
.time-icon { background: #f3e5f5; color: #9C27B0; }
.calendar-icon { background: #e8f5e9; color: #10B981; }
.bike-icon { background: #fff3cd; color: #F59E0B; }
.bolt-icon { background: #e0f2fe; color: #0ea5e9; }
.locked-icon { background: #e5e7eb; color: #9ca3af; }

.badge-card h3 {
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
}

.badge-card p {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 10px;
  min-height: 30px;
}

.badge-date {
  font-size: 0.8rem;
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-block;
  background: #f3f4f6;
  color: #6b7280;
}

.badge-date.new {
  background: #d1fae5;
  color: #065f46;
}

/* Icons */
.icon-grid::before { content: "🏆"; }
.icon-fire::before { content: "🔥"; }
.icon-running::before { content: "🏃"; }
.icon-clock::before { content: "⏱️"; }
.icon-calendar-check::before { content: "✅"; }
.icon-cycling::before { content: "🚴"; }
.icon-bolt::before { content: "⚡"; }
</style>