<template>
  <div>
    <n-form>
      <n-form-item label="运动类型">
        <n-radio-group v-model:value="formData.activityType">
          <n-radio value="cycling">骑行</n-radio>
          <n-radio value="walking">走路</n-radio>
        </n-radio-group>
      </n-form-item>

      <n-form-item label="运动时长（分钟）">
        <n-input-number v-model:value="formData.duration" :min="1" />
      </n-form-item>

      <n-button @click="submitRecord" type="primary">提交记录</n-button>
    </n-form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAppStore } from '@/stores/app-store';

const store = useAppStore();

const formData = ref({
  date: new Date().toISOString().split('T')[0],
  activityType: 'cycling',
  duration: 60,
  imageData: '',
  notes: ''
});

const submitRecord = () => {
  store.addRecord({ ...formData.value });
  // 重置表单
  formData.value.duration = 60;
};
</script>