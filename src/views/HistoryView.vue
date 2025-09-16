<template>
  <n-card title="历史记录" class="history-container">
    <!-- 第一行：日期选择框 + 两个柱状图 -->
    <div class="history-header">
      <!-- 日期选择框 -->
      <div class="date-picker-container">
        <n-date-picker
            v-model:value="selectedDate"
            type="date"
            :disabled-date="disabledDate"
            :render-cell="renderDateCell"
            placeholder="选择日期"
            :panel="true"
        />
      </div>

      <!-- 时间和距离柱状图 -->
      <div class="chart-container">
        <h3>时间与距离统计</h3>
        <v-chart :option="timeDistanceOption" class="chart" />
      </div>

      <!-- 时间和时速柱状图 -->
      <div class="chart-container">
        <h3>时间与时速统计</h3>
        <v-chart :option="timeSpeedOption" class="chart" />
      </div>
    </div>
  </n-card>
</template>

<script setup>
import { useAppStore } from '@/stores/app-store';
import { ref, computed } from 'vue';
import  VChart  from 'vue-echarts';
import { BarChart } from 'echarts/charts';
import { use } from 'echarts/core';
import { NDatePicker } from 'naive-ui';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';

use([
  BarChart,
  CanvasRenderer,
  TooltipComponent,
  LegendComponent,
  GridComponent
]);

// 状态管理
const store = useAppStore();
const selectedDate = ref(new Date());

// 日期选择框配置
const disabledDate = (date) => {
  return date > new Date();
};

// 自定义日期单元格渲染（已完成显示绿色，未完成显示灰色）
const renderDateCell = (date) => {
  const dateStr = date.toISOString().split('T')[0];
  const isCompleted = store.records.some(record => record.date === dateStr);
  return {
    style: {
      backgroundColor: isCompleted ? '#4cd964' : '#f2f2f2',
      right: 0,
      top: "31px",
      height: "100%",
      width: "100%",
    }
  };
};

// 图表数据处理
const chartData = computed(() => {
  // 按日期排序记录
  const sortedRecords = [...store.records].sort((a, b) => new Date(a.date) - new Date(b.date));
  return {
    dates: sortedRecords.map(r => r.date),
    durations: sortedRecords.map(r => r.duration),
    distances: sortedRecords.map(r => r.distance || 0),
    speeds: sortedRecords.map(r => r.speed || 0)
  };
});

// 时间与距离图表配置
const timeDistanceOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['运动时间(分钟)', '运动距离(公里)'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: chartData.value.dates },
  yAxis: [{ type: 'value' }],
  series: [
    { name: '运动时间(分钟)', type: 'bar', data: chartData.value.durations, itemStyle: { color: '#3498db' } },
    { name: '运动距离(公里)', type: 'bar', data: chartData.value.distances, itemStyle: { color: '#2ecc71' } }
  ]
}));

// 时间与时速图表配置
const timeSpeedOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['运动时间(分钟)', '运动时速(km/h)'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: chartData.value.dates },
  yAxis: [{ type: 'value' }],
  series: [
    { name: '运动时间(分钟)', type: 'bar', data: chartData.value.durations, itemStyle: { color: '#3498db' } },
    { name: '运动时速(km/h)', type: 'bar', data: chartData.value.speeds, itemStyle: { color: '#e74c3c' } }
  ]
}));

</script>

<style scoped>
.history-container {
  padding: 20px;
}

.history-header {
  display: grid;
  grid-template-columns: 300px 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.date-picker-container {
  display: flex;
  align-items: flex-start;
}

.chart-container {
  min-height: 300px;
}

.chart {
  width: 100%;
  height: 250px;
}

</style>