<template>
  <div class="history-container">
    <h1>运动历史</h1>
    
    <!-- 筛选和搜索 -->
    <div class="filter-card">
      <div class="filter-grid">
        <div class="filter-item">
          <label>时间范围</label>
          <select v-model="timeRange">
            <option value="all">全部时间</option>
            <option value="month">本月</option>
            <option value="lastMonth">上月</option>
            <option value="3months">近3个月</option>
            <option value="year">今年</option>
          </select>
        </div>
        
        <div class="filter-item">
          <label>运动类型</label>
          <select v-model="exerciseType">
            <option value="all">全部类型</option>
            <option value="Running">跑步</option>
            <option value="Cycling">骑行</option>
            <option value="Swimming">游泳</option>
            <option value="Fitness">健身</option>
            <option value="Walk">步行</option>
          </select>
        </div>
        
        <div class="filter-item">
          <label>搜索</label>
          <div class="search-box">
            <input 
              type="text" 
              v-model="searchQuery"
              placeholder="按运动类型搜索..."
            >
            <i class="search-icon">🔍</i>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 数据统计 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">总打卡次数</div>
        <div class="stat-value">{{ stats.totalCount }}</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-label">总运动时长 (小时)</div>
        <div class="stat-value">{{ stats.totalDuration }}</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-label">总运动距离 (公里)</div>
        <div class="stat-value">{{ stats.totalDistance }}</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-label">最长连续打卡 (天)</div>
        <div class="stat-value">{{ stats.longestStreak }}</div>
      </div>
    </div>
    
    <!-- 图表统计 -->
    <div class="charts-grid">
      <div class="chart-card">
        <h3>年度运动时长趋势</h3>
        <div class="chart-container">
          <v-chart :option="durationChartData" autoresize style="height:300px"></v-chart>
        </div>
      </div>
      
      <div class="chart-card">
        <h3>运动类型分布</h3>
        <div class="chart-container">
          <v-chart :option="typeChartData" autoresize style="height:300px"></v-chart>
        </div>
      </div>
    </div>
    
    <!-- 历史记录列表 -->
    <div class="history-list-section">
      <h2><i class="history-icon">📜</i> 打卡记录</h2>
      
      <div class="records-list">
        <div class="record-item" v-for="record in filteredRecords" :key="record.date">
          <div class="record-info">
            <div class="record-icon" :class="getIconClass(record.type)"></div>
            <div class="record-details">
              <h3>{{ textMap[record.type] || record.type }}</h3>
              <p>{{ new Date(record.date).toLocaleDateString() }}</p>
            </div>
          </div>
          
          <div class="record-stats">
            <div class="stat-item">
              <div class="stat-title">时长</div>
              <div class="stat-value">{{ record.sportsTime }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-title">距离</div>
              <div class="stat-value">{{ record.distance }}</div>
            </div>
            <div class="record-actions">
              <button class="more-btn">⋮</button>
            </div>
          </div>
        </div>
        <div v-if="filteredRecords.length === 0" class="no-records">
            没有找到匹配的记录。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useHistoryStore } from '@/stores/history.js';
const textMap = {
  running: '跑步',
  fitness: '健身',
  cycling: '骑行',
  swimming: '游泳',
  walk: '步行',
}
const textToMap = {
  跑步: 'running',
  健身: 'fitness',
  骑行: 'cycling',
  游泳: 'swimming',
  步行: 'walk',
}

// ECharts
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components';
import VChart from 'vue-echarts';
use([CanvasRenderer, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent]);

// Pinia Store
const historyStore = useHistoryStore();
const { filteredRecords, stats, durationChartData, typeChartData } = storeToRefs(historyStore);

// Filters
const timeRange = ref('all');
const exerciseType = ref('all');
const searchQuery = ref('');

// Fetch initial data
onMounted(() => {
  historyStore.fetchAllRecords();
});

// Watch for filter changes and trigger a new fetch
watch([timeRange, exerciseType, searchQuery], () => {
  historyStore.fetchHistory({
    timeRange: timeRange.value,
    exerciseType: exerciseType.value,
    searchQuery: textToMap[searchQuery.value] || searchQuery.value,
  });
});

// Helper to get icon class based on exercise type
const getIconClass = (type) => {
  switch (type) {
    case 'running': return 'running-icon';
    case 'fitness': return 'fitness-icon';
    case 'cycling': return 'cycling-icon';
    case 'swimming': return 'swimming-icon';
    case 'walk': return 'walk-icon'; // Added for walk
    default: return 'default-icon';
  }
};
</script>

<style scoped>
.history-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.history-container h1 {
  font-size: 2rem;
  margin-bottom: 25px;
  color: #333;
}

.filter-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 30px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.filter-item label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.filter-item select,
.search-box input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
}

.filter-item select:focus,
.search-box input:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.search-box {
  position: relative;
}

.search-box input {
  padding-left: 38px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

.stat-label {
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #3B82F6;
  margin-bottom: 10px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

@media (max-width: 900px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 20px;
}

.chart-card h3 {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 15px;
}

.chart-container {
  width: 100%;
  height: 100%;
}

.history-list-section h2 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.record-item {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 15px 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  transition: box-shadow 0.3s ease;
}

@media (min-width: 768px) {
  .record-item {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.record-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.record-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.record-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.running-icon { background: #e3f2fd; color: #3B82F6; background-image: url('../../public/running.png'); background-size: cover; }
.fitness-icon { background: #e8f5e9; color: #10B981; background-image: url('../../public/fitness.png'); background-size: cover; }
.cycling-icon { background: #fff3cd; color: #F59E0B; background-image: url('../../public/cycling.png'); background-size: cover; }
.swimming-icon { background: #e0f7fa; color: #06B6D4; background-image: url('../../public/swimming.png'); background-size: cover; }
.walk-icon { background: #f3e5f5; color: #8E24AA; background-image: url('../../public/walk.png'); background-size: cover;} /* Added for walk */
.default-icon { background: #f0f0f0; color: #666; }

.record-details h3 {
  font-weight: 600;
  color: #333;
  margin-bottom: 3px;
}

.record-details p {
  color: #666;
  font-size: 0.9rem;
}

.record-stats {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 20px;
  width: 100%;
}

@media (min-width: 768px) {
  .record-stats {
    width: auto;
    min-width: 300px;
  }
}

.stat-item {
  text-align: center;
}

.stat-title {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 3px;
}

.stat-value {
  font-weight: 600;
  color: #333;
}

.record-actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

.more-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.more-btn:hover {
  background: #f5f5f5;
}

.no-records {
    text-align: center;
    padding: 40px;
    color: #888;
    font-size: 1.1rem;
}
</style>