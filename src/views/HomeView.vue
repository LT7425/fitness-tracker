<template>
  <div class="home-container home">
    <!-- 欢迎信息 -->
    <div class="welcome-section">
      <h1>嗨，宝贝！<br/><span class="highlight">今天运动了吗？</span></h1>
      <p>坚持运动，塑造更好的自己。已连续打卡 <span class="accent">{{ longestMonthStreak }}</span> 天，继续加油！</p>
    </div>
    
    <!-- 本周进度和统计 -->
    <div class="stats-grid">
      <!-- 本周进度 -->
      <div class="stat-card">
        <h3><i class="icon-calendar"></i> 本周进度</h3>
        <div class="progress-container">
          <div class="progress-ring">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" stroke-width="8"/>
              <circle cx="50" cy="50" r="45" fill="none" stroke="#3B82F6" stroke-width="8" 
                      :stroke-dasharray="circumference" :stroke-dashoffset="weekProgressOffset"/>
            </svg>
            <div class="progress-text">
              <span class="percentage">{{ weekProgressPercent }}%</span>
              <span class="details">{{ weekCheckInCount }}/7天</span>
            </div>
          </div>
          <div class="week-days">
            <div v-for="(day, index) in weekDaysStatus" :key="index" class="day" :class="{ completed: day }"></div>
          </div>
        </div>
      </div>
      
      <!-- 本月统计 -->
      <div class="stat-card">
        <h3><i class="icon-chart"></i> 本月统计</h3>
        <div class="stat-items">
          <div class="stat-item">
            <div class="stat-label">总时长</div>
            <div class="stat-value">{{ monthTotalDuration }}小时</div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: monthDurationProgress + '%' }"></div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-label">总距离</div>
            <div class="stat-value">{{ monthTotalDistance }}公里</div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: monthDistanceProgress + '%' }"></div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-label">打卡次数</div>
            <div class="stat-value">{{ monthCheckInCount }}次</div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: monthCheckInCountProgress + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 连续打卡 -->
      <div class="stat-card">
        <h3><i class="icon-fire"></i> 最长连续打卡</h3>
        <div class="streak-info">
          <div class="streak-days">{{ longestMonthStreak }}</div>
          <div class="streak-label">天</div>
          <div class="streak-next" v-if="daysToNewBadge > 0 && daysToNewBadge < 15">
            再坚持 <span class="highlight">{{ daysToNewBadge }}</span> 天，获得奖励！
          </div>
          <div class="streak-next" v-else-if="daysToNewBadge >= 15 && daysToNewBadge < 20">
            再坚持 <span class="highlight">{{ daysToNewBadge }}</span> 天，获得特殊奖励！
          </div>
          <div class="streak-next" v-else>
            恭喜！已达成徽章目标！
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useDataStore } from '@/stores/data';

const dataStore = useDataStore();

// --- 从 Store 获取数据 ---
const longestMonthStreak = computed(() => dataStore.longestMonthStreak);
const weekRecords = computed(() => dataStore.weekRecords);
const monthRecords = computed(() => dataStore.monthRecords);

// --- 组件加载时获取所有数据 ---
onMounted(() => {
  dataStore.fetchAllData("week");
});

// --- 本周进度计算 ---
const weekCheckInCount = computed(() => weekRecords.value.length);
const weekProgressPercent = computed(() => Math.round((weekCheckInCount.value / 7) * 100));
const circumference = 2 * Math.PI * 45; // 2 * PI * r
const weekProgressOffset = computed(() => circumference * (1 - weekProgressPercent.value / 100));

const weekDaysStatus = computed(() => {
  const status = Array(7).fill(false);
  const weekRecordDays = new Set(weekRecords.value.map(r => {
    const day = new Date(r.date).getDay();
    return day === 0 ? 6 : day - 1; // 0 (Mon) to 6 (Sun)
  }));
  weekRecordDays.forEach(dayIndex => {
    status[dayIndex] = true;
  });
  return status;
});

// --- 本月统计计算 ---
const monthGoals = {
  duration: 20, // 小时
  distance: 100, // 公里
  checkIns: 20, // 次
};

const monthTotalDuration = computed(() => {
  const totalMinutes = monthRecords.value.reduce((sum, r) => sum * 1 + (r.sportsTime || 0) * 1, 0);
  return (totalMinutes / 60).toFixed(1);
});
const monthTotalDistance = computed(() => monthRecords.value.reduce((sum, r) => sum * 1 + (r.distance || 0) * 1, 0));   
const monthCheckInCount = computed(() => monthRecords.value.length);

const monthDurationProgress = computed(() => Math.min((monthTotalDuration.value / monthGoals.duration) * 100, 100));
const monthDistanceProgress = computed(() => Math.min((monthTotalDistance.value / monthGoals.distance) * 100, 100));
const monthCheckInCountProgress = computed(() => Math.min((monthCheckInCount.value / monthGoals.checkIns) * 100, 100));

// --- 连续打卡计算 ---
const daysToNewBadge = computed(() => {
    if(longestMonthStreak.value < 15){
        return Math.max(0, 15 - longestMonthStreak.value);
    }else if(longestMonthStreak.value >= 15 && longestMonthStreak.value < 20){
        return Math.max(0, 20 - longestMonthStreak.value);
    }else if(longestMonthStreak.value >= 20){
        return 0;
    }
});

</script>

<style scoped>
/* 样式保持不变 */
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

/* 欢迎区域 */
.welcome-section {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px 0;
}

.welcome-section h1 {
  font-size: 2.2rem;
  margin-bottom: 15px;
  color: #333;
}

.welcome-section .highlight {
  color: #3B82F6;
}

.welcome-section p {
  font-size: 1.1rem;
  color: #666;
  max-width: 600px;
  margin: 15px auto 0;
}

.welcome-section .accent {
  color: #F59E0B;
  font-weight: bold;
}

/* 打卡卡片 */
.checkin-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 25px;
  margin-bottom: 30px;
}

.checkin-card h2 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #333;
}

.checkin-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 25px;
}

@media (max-width: 768px) {
  .checkin-grid {
    grid-template-columns: 1fr;
  }
}

.exercise-types label,
.exercise-data label {
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
  color: #555;
}

.exercise-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.exercise-btn {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.exercise-btn.active {
  background: #3B82F6;
  color: white;
  border-color: #3B82F6;
}

.exercise-btn i {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.data-inputs {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e0e0e0;
}

.input-group {
  margin-bottom: 15px;
}

.input-group:last-child {
  margin-bottom: 0;
}

.input-group label {
  font-size: 0.9rem;
  margin-bottom: 5px;
  color: #666;
  font-weight: normal;
}

.input-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.checkin-btn {
  width: 100%;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 0;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.checkin-btn:hover {
  background: #2563EB;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 20px;
}

.stat-card h3 {
  font-size: 1.1rem;
  margin-bottom: 15px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-card h3 i {
  color: #3B82F6;
}

/* 进度圆环 */
.progress-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-ring {
  position: relative;
  width: 160px;
  height: 160px;
  margin-bottom: 10px;
}

.progress-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.percentage {
  font-size: 1.8rem;
  font-weight: bold;
  color: #3B82F6;
  display: block;
}

.details {
  font-size: 0.9rem;
  color: #666;
}

.week-days {
  display: flex;
  gap: 5px;
  margin-top: 10px;
}

.day {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e0e0e0;
}

.day.completed {
  background: #3B82F6;
}

/* 统计项目 */
.stat-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  display: flex;
  justify-content: space-between;
}

.stat-value {
  font-weight: 600;
}

.progress-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #10B981;
}

/* 连续打卡 */
.streak-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.streak-days {
  font-size: 3rem;
  font-weight: bold;
  color: #F59E0B;
  line-height: 1;
}

.streak-label {
  font-size: 1rem;
  color: #666;
  margin-bottom: 10px;
}

.streak-next {
  background: #f5f5f5;
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
  text-align: center;
}

/* 推荐计划 */
.plans-section {
  margin-bottom: 30px;
}

.plans-section h2 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.plans-section h2 i {
  color: #F59E0B;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 992px) {
  .plans-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .plans-grid {
    grid-template-columns: 1fr;
  }
}

.plan-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.plan-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

.plan-image {
  height: 160px;
  background-size: cover;
  background-position: center;
}

.plan-info {
  padding: 15px;
}

.plan-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 0.8rem;
}

.plan-level {
  background: #e3f2fd;
  color: #3B82F6;
  padding: 3px 8px;
  border-radius: 12px;
}

.plan-duration {
  color: #666;
}

.plan-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.plan-desc {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 15px;
  line-height: 1.4;
}

.plan-btn {
  width: 100%;
  background: #f5f5f5;
  border: none;
  border-radius: 6px;
  padding: 8px 0;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.plan-btn:hover {
  background: #3B82F6;
  color: white;
}

/* 图标样式 */
.icon-running::before { content: "🏃"; }
.icon-cycling::before { content: "🚴"; }
.icon-swimming::before { content: "🏊"; }
.icon-fitness::before { content: "💪"; }
.icon-arrow-right::before { content: "→"; }
.icon-calendar::before { content: "📅"; }
.icon-chart::before { content: "📊"; }
.icon-fire::before { content: "🔥"; }
.icon-lightbulb::before { content: "💡"; }
</style>