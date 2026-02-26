<template>
  <div class="health-container">
    <h1>健康记录</h1>

    <!-- 体重折线图 -->
    <div class="chart-wrapper">
      <div class="date-filter">
        <n-date-picker
          v-model:value="dateRange"
          type="daterange"
          clearable
          @update:value="handleDateRangeChange"
        />
      </div>
      <div class="chart-container">
        <v-chart :option="chartOption" @click="handleChartClick" class="health-chart"></v-chart>
      </div>
    </div>

    <!-- 详情模态框 -->
    <n-modal 
      v-model:show="healthStore.showDetailModal" 
      preset="card" 
      title="每日详情"
:style="{ width: isMobile ? '95%' : '600px', maxWidth: isMobile ? '600px' : 'none' }"
      
      :mask-closable="!isMobile"
    >
      <div v-if="healthStore.selectedRecord" class="detail-content">
        <div class="detail-section">
          <h3>基本信息</h3>
          <p><strong>日期：</strong>{{ healthStore.selectedRecord.date }}</p>
          <p><strong>体重：</strong>{{ healthStore.selectedRecord.weight }} kg</p>
        </div>

        <div class="detail-section">
          <h3>饮食记录</h3>
          <div v-for="(meal, index) in healthStore.selectedRecord.diet" :key="index" class="meal-item">
            <h4>{{ getMealTypeName(meal.mealType) }}</h4>
            <p v-if="meal.note">{{ meal.note }}</p>
            <n-image
              v-if="meal.image"
              :src="meal.image"
              width="200"
              object-fit="cover"
            />
          </div>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useHealthStore } from '@/stores/health';
import { NModal, NImage, NSelect, NDatePicker } from 'naive-ui';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';
import VChart from 'vue-echarts';

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent]);

const healthStore = useHealthStore();

// 日期范围筛选
const dateRange = ref(null);

const mealTypeMap = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐'
};

function getMealTypeName(type) {
  return mealTypeMap[type] || type;
}

// 日期范围变化处理
function handleDateRangeChange(value) {
  // 日期范围变化时，chartOption会自动重新计算
}


// 图表配置
const chartOption = computed(() => {
  let records = healthStore.allRoleRecords;

  // 根据日期范围筛选记录
  if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
    const startDate = new Date(dateRange.value[0]);
    const endDate = new Date(dateRange.value[1]);
    records = records.filter(r => {
      const recordDate = new Date(r.date);
      return recordDate >= startDate && recordDate <= endDate;
    });
  }

  // 获取所有唯一日期并排序
  const allDates = [...new Set(records.map(r => r.date))].sort((a, b) => new Date(a) - new Date(b));

  // 为每个角色创建一个系列
  const series = healthStore.roles.map((role, index) => {
    const roleRecords = records.filter(r => r.roleId === role.id);
    const weights = allDates.map(date => {
      const record = roleRecords.find(r => r.date === date);
      return record ? record.weight : null;
    });

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return {
      name: role.name,
      type: 'line',
      data: weights,
      smooth: true,
      symbol: 'circle',
      symbolSize: 10,
      connectNulls: false,
      lineStyle: {
        color: colors[index % colors.length],
        width: 3
      },
      itemStyle: {
        color: colors[index % colors.length]
      }
    };
  });

  return {
    title: {
      text: '体重变化趋势',
      left: 'left'
    },
    tooltip: {
      trigger: 'axis',
      show: !isMobile,
      formatter: (params) => {
        let result = `${params[0].name}<br/>`;
        params.forEach(param => {
          if (param.value !== null) {
            result += `${param.seriesName}: ${param.value} kg<br/>`;
          }
        });
        return result;
      }
    },
    legend: {
      data: healthStore.roles.map(r => r.name),
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 80,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: allDates
    },
    yAxis: {
      type: 'value',
      name: '体重 (kg)'
    },
    series
  };
});

// 图表点击事件处理
let isMobile = false;
try {
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
} catch (e) {}

let lastClickTime = 0;
let clickTimer = null;

function handleChartClick(params) {
  // 移动端使用单次点击，不使用防抖
  if (isMobile) {
    // 找到对应角色的记录
    const roleName = params.seriesName;
    const role = healthStore.roles.find(r => r.name === roleName);

    if (role) {
      const record = healthStore.allRoleRecords.find(
        r => r.date === params.name && r.roleId === role.id
      );
      if (record) {
        // 延迟执行，确保触摸事件完成
        setTimeout(() => {
          healthStore.openDetail(record);
        }, 50);
      }
    }
    return;
  }

  // 桌面端使用防抖
  const now = Date.now();
  if (now - lastClickTime < 300) {
    return;
  }
  lastClickTime = now;

  // 找到对应角色的记录
  const roleName = params.seriesName;
  const role = healthStore.roles.find(r => r.name === roleName);

  if (role) {
    const record = healthStore.allRoleRecords.find(
      r => r.date === params.name && r.roleId === role.id
    );
    if (record) {
      healthStore.openDetail(record);
    }
  }
}


// 组件挂载时加载数据
onMounted(() => {
  healthStore.loadData();
});
</script>

<style scoped>
.health-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  height: 100vh;
}

h1 {
  font-size: 2rem;
  margin-bottom: 20px;
  color: #333;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .health-container {
    padding: 10px;
    overflow-x: hidden;
  }

  body {
    overflow-x: hidden;
  }

  h1 {
    font-size: 1.5rem;
    margin-top: 10px !important;
    margin-bottom: 15px;
  }

  .chart-wrapper {
    margin-top: 0 !important;
    padding-top: 60px;
  }

  .date-filter {
    position: absolute;
    top: 0;
    right: 10px;
    left: 10px;
    z-index: 10;
    overflow-x: hidden;
  }

  .date-filter :deep(.n-date-picker) {
    width: 100%;
  }

  .chart-container {
    padding: 10px;
  }

  .detail-content {
    padding: 5px 0;
  }

  .meal-item {
    padding: 8px;
  }

  .health-chart {
    height: 300px;
  }

}

.role-selector {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-selector label {
  font-weight: 500;
  color: #555;
}

.chart-wrapper {
  margin-top: 50px;
  position: relative;
}

.date-filter {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  width: 220px;
}

.chart-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 20px;
}

.health-chart {
  height: 400px;
  width: 100%;
}

.detail-content {
  padding: 10px 0;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h3 {
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: #333;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 8px;
}

.detail-section p {
  margin: 8px 0;
  color: #666;
}

.meal-item {
  margin: 15px 0;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.meal-item h4 {
  font-size: 1rem;
  margin-bottom: 8px;
  color: #333;
}
</style>
