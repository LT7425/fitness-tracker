<template>
  <div v-if="!submitted">
    <n-form ref="formRef" @submit.prevent="submitRecord">
      <n-form-item label="运动方式" required>
        <n-radio-group v-model:value="formData.activityType">
          <n-radio value="walking">走路</n-radio>
          <n-radio value="running">跑步</n-radio>
        </n-radio-group>
      </n-form-item>

      <n-form-item label="运动时间（分钟）" required>
        <n-input-number v-model:value="formData.duration" :min="1" placeholder="请输入运动分钟数" />
      </n-form-item>

      <n-form-item label="运动距离（公里）">
        <n-input-number v-model:value="formData.distance" :min="0.1" :step="0.1" placeholder="选填" />
      </n-form-item>

      <n-form-item label="运动时速（km/h）">
        <n-input-number v-model:value="formData.speed" :min="1" :step="0.5" placeholder="输入时间和距离后自动计算" />
      </n-form-item>

      <n-form-item label="运动轨迹图">
        <n-upload
            v-model:file-list="fileList"
            :max="1"
            :before-upload="beforeUpload"
            accept="image/*"
        >
          <n-button>选择图片</n-button>
        </n-upload>
      </n-form-item>

      <n-button type="primary" html-type="submit">提交记录</n-button>
    </n-form>
  </div>

  <!-- 提交成功界面 -->
  <div v-else class="success-container">
    <n-card title="🎉 恭喜完成今日运动!">
      <div class="stats-section">
        <p>本月已完成: <strong>{{ monthStats.totalDays }}天</strong></p>
        <div class="progress-section">
          <p>本月小奖励进度:</p>
          <n-progress :percentage="rewardProgress" :status="rewardStatus" />
          <p class="progress-text">{{ monthStats.rewardCount }}/{{ rewardTarget }} 次奖励进度</p>
        </div>
      </div>
      <n-button @click="resetForm" style="margin-top: 20px;">返回</n-button>
    </n-card>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, watch} from 'vue';
import { useAppStore } from '@/stores/app-store';
import { calculateRewards } from '@/utils/calculator';

const store = useAppStore();
const formRef = ref(null);
const fileList = ref([]);
const submitted = ref(false);
const rewardTarget = 20; // 小奖励目标次数

const formData = ref({
  date: new Date().toISOString().split('T')[0],
  activityType: 'walking',
  duration: null,
  distance: null,
  speed: null,
  image: ''
});

// 获取本月统计数据
const monthStats = computed(() => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  return calculateRewards(store.records, currentMonth);
});

// 计算奖励进度
const rewardProgress = computed(() => {
  return Math.min(Math.round((monthStats.value.rewardCount / rewardTarget) * 100), 100);
});

// 进度状态
const rewardStatus = computed(() => {
  if (rewardProgress.value >= 100) return 'success';
  if (rewardProgress.value >= 60) return 'processing';
  return 'default';
});

watch([() => formData.value.distance, () => formData.value.duration],
    ([newDistance, newDuration]) => {
      // 只有当距离和时间都填写且为正数时才计算
      if (newDistance && newDuration && newDistance > 0 && newDuration > 0) {
        const hours = newDuration / 60; // 转换分钟为小时
        const speed = newDistance / hours; // 计算时速
        formData.value.speed = parseFloat(speed.toFixed(1)); // 保留一位小数
      }
    }
);

// 图片上传处理
const beforeUpload = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      formData.value.image = e.target.result;
      resolve(file);
    };
    reader.readAsDataURL(file);
  });
};

// 提交记录
const submitRecord = async () => {
  // 表单验证
  if (!formData.value.duration) {
    return;
  }

  // 添加记录
  store.addRecord({
    ...formData.value,
    // 计算配速（分钟/公里）
    pace: formData.value.speed ? (60 / formData.value.speed).toFixed(1) : null
  });

  // 标记为已提交
  submitted.value = true;
};

// 重置表单
const resetForm = () => {
  submitted.value = false;
  formData.value = {
    date: new Date().toISOString().split('T')[0],
    activityType: 'walking',
    duration: null,
    distance: null,
    speed: null,
    image: ''
  };
  fileList.value = [];
};

// 检查当天是否已有记录
onMounted(() => {
  const today = new Date().toISOString().split('T')[0];
  const hasTodayRecord = store.records.some(r => r.date === today);
  if (hasTodayRecord) {
    submitted.value = true;
  }
});
</script>

<style scoped>
.success-container {
  text-align: center;
}
.stats-section {
  margin-bottom: 20px;
}
.progress-section {
  margin: 20px 0;
}
.progress-text {
  text-align: right;
  margin-top: 5px;
  font-size: 12px;
  color: #666;
}
</style>