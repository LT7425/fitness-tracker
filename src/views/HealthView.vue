<template>
  <div class="health-container">
    <h1>健康记录</h1>

    <!-- 加载状态 -->
    <div v-if="healthStore.loading" class="loading-container">
      <n-spin size="large" />
    </div>

    <!-- 体重折线图 -->
    <div class="chart-wrapper" v-show="!healthStore.loading">
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

    <!-- 操作按钮 -->
    <div class="action-buttons" v-show="!healthStore.loading && showEdit">
      <n-button type="primary" @click="openAddModal">
        <template #icon>
          <i class="fas fa-plus"></i>
        </template>
        添加记录
      </n-button>
    </div>

    <!-- 详情模态框 -->
    <n-modal
        v-model:show="healthStore.showDetailModal"
        preset="card"
        title="每日详情"
        :style="{ width: isMobile ? '95%' : '600px', maxWidth: isMobile ? '600px' : 'none' }"
        :mask-closable="!isMobile"
        :segmented="{ content: 'soft', footer: 'soft' }"
    >
      <div v-if="healthStore.selectedRecord" class="detail-content">
        <div class="detail-section">
          <h3>基本信息</h3>
          <p><strong>用户：</strong>{{ getRoleName(healthStore.selectedRecord.role_id) }}</p>
          <p><strong>日期：</strong>{{ healthStore.selectedRecord.date }}</p>
          <p><strong>体重：</strong>{{ healthStore.selectedRecord.weight }} kg</p>
        </div>

        <div class="detail-section">
          <h3>饮食记录</h3>
          <div v-for="(meal, index) in healthStore.selectedRecord.diet" :key="index" class="meal-item">
            <h4>{{ getMealTypeName(meal.mealType) }}</h4>
            <p v-if="meal.note" class="meal-note">{{ meal.note }}</p>
            <div v-if="meal.images && meal.images.length > 0" class="meal-images">
              <n-image-group>
                <n-image
                    v-for="(img, imgIndex) in meal.images"
                    :key="imgIndex"
                    :src="img"
                    width="150"
                    height="150"
                    object-fit="cover"
                    :img-props="{ style: 'cursor: pointer' }"
                />
              </n-image-group>
            </div>
          </div>
        </div>

        <div class="detail-actions" v-if="showEdit">
          <n-button type="warning" @click="openEditModal">编辑</n-button>
          <n-button type="error" @click="handleDelete">删除</n-button>
        </div>
      </div>
    </n-modal>

    <!-- 添加/编辑记录模态框 -->
    <n-modal
        v-model:show="showFormModal"
        preset="card"
        :title="isEditing ? '编辑记录' : '添加记录'"
        :style="{ width: isMobile ? '95%' : '600px', height: isMobile ? '300px' : '600px' ,overflowY: 'auto' }"
    >
      <n-form ref="formRef" :model="formData" :rules="formRules">
        <n-form-item label="日期" path="date">
          <n-date-picker
              v-model:value="formData.date"
              type="date"
              style="width: 100%"
          />
        </n-form-item>

        <n-form-item label="角色" path="roleId">
          <n-select
              v-model:value="formData.roleId"
              :options="roleOptions"
              placeholder="选择角色"
          />
        </n-form-item>

        <n-form-item label="体重 (kg)" path="weight">
          <n-input-number
              v-model:value="formData.weight"
              :min="0"
              :max="300"
              :precision="2"
              style="width: 100%"
          />
        </n-form-item>

        <div class="diet-section">
          <h3>饮食记录</h3>
          <div v-for="(meal, index) in formData.diet" :key="index" class="meal-form-item">
            <n-form-item :label="`餐食 ${index + 1}`" :path="`diet.${index}.mealType`">
              <n-select
                  v-model:value="meal.mealType"
                  :options="mealTypeOptions"
                  placeholder="选择餐食类型"
              />
            </n-form-item>
            <n-form-item :path="`diet.${index}.note`">
              <n-input
                  v-model:value="meal.note"
                  type="textarea"
                  placeholder="输入餐食备注"
                  :autosize="{ minRows: 2, maxRows: 4 }"
              />
            </n-form-item>
            <n-form-item label="图片" v-if="showEdit">
              <n-upload
                  :max="3"
                  :default-file-list="meal.images ? meal.images.map((url, i) => ({ id: `${i}`, name: `图片${i+1}`, status: 'finished', url })) : []"
                  :custom-request="(options) => handleImageUpload(options, index)"
                  list-type="image-card"
                  @remove="(options) => handleImageRemove(options, index)"
              >
                点击上传图片
              </n-upload>
            </n-form-item>
            <n-button type="error" size="small" @click="removeMeal(index)">删除餐食</n-button>
          </div>
          <n-button dashed @click="addMeal">添加餐食</n-button>
        </div>
      </n-form>

      <template #footer>
        <div class="form-footer">
          <n-button @click="showFormModal = false">取消</n-button>
          <n-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEditing ? '更新' : '添加' }}
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useHealthStore } from '@/stores/health';
import { supabase, TABLES } from '@/utils/supabase';
import { NModal, NImage, NSelect, NDatePicker, NButton, NForm, NFormItem, NInputNumber, NInput, NAlert, NSpin, NCard, NDivider, NUpload, useMessage } from 'naive-ui';
import { useRoute } from 'vue-router';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';
import VChart from 'vue-echarts';

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent]);

const healthStore = useHealthStore();
const route = useRoute();
const message = useMessage();

// 检查URL参数中是否有edit
const showEdit = computed(() => route.query.edit === 'true');

// 加载角色列表
const roles = ref([]);

// 日期范围筛选
const dateRange = ref(null);

// 表单相关
const showFormModal = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const formRef = ref(null);
const editingRecordId = ref(null);

const formData = ref({
  date: null,
  roleId: null,
  weight: null,
  diet: []
});

// 图片上传相关
const uploadingImages = ref({});

const formRules = {
  date: {
    required: true,
    type: 'number',
    message: '请选择日期',
    trigger: ['blur', 'change'],
    validator: (rule, value) => {
      return value !== null && value !== undefined && value !== ''
    }
  },
  roleId: {
    required: true,
    type: 'number',
    message: '请选择角色',
    trigger: ['blur', 'change'],
    validator: (rule, value) => {
      return value !== null && value !== undefined
    }
  },
  weight: {
    required: true,
    type: 'number',
    message: '请输入体重',
    trigger: ['blur', 'change'],
    validator: (rule, value) => {
      return value !== null && value !== undefined && value > 0
    }
  }
};

const mealTypeMap = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐'
};

const mealTypeOptions = [
  { label: '早餐', value: 'breakfast' },
  { label: '午餐', value: 'lunch' },
  { label: '晚餐', value: 'dinner' },
  { label: '加餐', value: 'snack' }
];

const roleOptions = computed(() =>
    healthStore.roles.map(role => ({
      label: role.name,
      value: role.id
    }))
);

function getMealTypeName(type) {
  return mealTypeMap[type] || type;
}

function getRoleName(roleId) {
  const role = healthStore.roles.find(r => r.id === roleId);
  return role ? role.name : '未知用户';
}

// 添加餐食
function addMeal() {
  formData.value.diet.push({
    mealType: null,
    note: '',
    images: []
  });
}

// 删除餐食
function removeMeal(index) {
  formData.value.diet.splice(index, 1);
}

// 打开添加模态框
function openAddModal() {
  isEditing.value = false;
  formData.value = {
    date: Date.now(),
    roleId: healthStore.currentRoleId,
    weight: null,
    diet: []
  };
  showFormModal.value = true;
  if (showEdit.value && roles.value.length > 0 && !formData.value.roleId) {
    formData.value.roleId = roles.value[0].id;
  }
}

// 打开编辑模态框
function openEditModal() {
  isEditing.value = true;
  const record = healthStore.selectedRecord;

  // 保存记录ID，避免closeDetail后丢失
  if (record && record.id) {
    editingRecordId.value = record.id;
  }

  formData.value = {
    date: new Date(record.date).getTime(),
    roleId: record.roleId,
    weight: record.weight,
    diet: record.diet ? record.diet.map(meal => ({
      mealType: meal.mealType,
      note: meal.note,
      images: meal.images || []
    })) : []
  };
  showFormModal.value = true;
  healthStore.closeDetail();
}

// 处理表单提交
async function handleSubmit() {
  try {
    await formRef.value?.validate();
    submitting.value = true;

    const submitData = {
      date: new Date(formData.value.date).toISOString().split('T')[0],
      role_id: formData.value.roleId,
      weight: formData.value.weight,
      diet: formData.value.diet
    };

    if (isEditing.value) {
      await healthStore.updateRecord(editingRecordId.value, submitData);
    } else {
      await healthStore.addRecord(submitData);
    }
    message.success(isEditing.value ? '更新成功' : '添加成功');
    showFormModal.value = false;
  } catch (error) {
    console.error('提交失败:', error);
  } finally {
    submitting.value = false;
  }
}

// 处理删除
async function handleDelete() {
  if (confirm('确定要删除这条记录吗？')) {
    try {
      await healthStore.deleteRecord(healthStore.selectedRecord.id);
      healthStore.closeDetail();
      message.success('删除成功')
    } catch (error) {
      console.error('删除失败:', error);
    }
  }
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
  if (showEdit.value) {
    loadRoles();
  }
});

// 处理图片上传
async function handleImageUpload({ file, onFinish, onError }, mealIndex) {
  try {
    // 获取真实的文件对象
    const actualFile = file.file || file.originFileObj || file;

    const fileExt = actualFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 上传到Supabase Storage
    const { data, error: uploadError } = await supabase.storage
        .from('meal-images')
        .upload(filePath, actualFile);

    if (uploadError) {
      console.error('上传错误:', uploadError);
      throw uploadError;
    }

    // 使用fullPath构建公开URL
    const bucketName = 'meal-images';
    const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${data.path}`;

    // 将URL添加到images数组
    if (!formData.value.diet[mealIndex].images) {
      formData.value.diet[mealIndex].images = [];
    }
    formData.value.diet[mealIndex].images.push(publicUrl);
    message.success('上传成功');
    onFinish({ url: publicUrl });
  } catch (error) {
    console.error('图片上传失败:', error);
    onError();
    message.error(`图片上传失败: ${error.message}`);
  }
}

// 删除图片
function handleImageRemove({ file }, mealIndex) {
  const url = file.url || file.response?.url;
  if (url && formData.value.diet[mealIndex].images) {
    const index = formData.value.diet[mealIndex].images.indexOf(url);
    if (index > -1) {
      formData.value.diet[mealIndex].images.splice(index, 1);
    }
  }
}

// 加载角色列表
async function loadRoles() {
  try {
    const { data, error } = await supabase
        .from(TABLES.ROLES)
        .select('*')
        .order('id');

    if (error) throw error;
    roles.value = data || [];

    if (roles.value.length > 0 && !formData.value.roleId) {
      formData.value.roleId = roles.value[0].id;
    }
  } catch (error) {
    console.error('加载角色失败:', error);
    message.error('加载角色失败');
  }
}
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

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.action-buttons {
  margin: 20px 0;
  display: flex;
  gap: 10px;
}

.detail-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.diet-section {
  margin-top: 20px;
}

.diet-section h3 {
  margin-bottom: 15px;
  color: #333;
}

.meal-form-item {
  margin-bottom: 20px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 8px;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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

  .action-buttons {
    flex-direction: column;
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
  max-height: 500px;
  overflow-y: auto;
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

.meal-note {
  margin: 8px 0;
  color: #666;
  line-height: 1.5;
}

.meal-images {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.meal-images :deep(.n-image) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.meal-images :deep(.n-image:hover) {
  transform: scale(1.02);
}
</style>
