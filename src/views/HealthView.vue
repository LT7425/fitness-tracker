<template>
  <div class="health-container">
    <div class="header-section">
      <h1>健康记录</h1>
    </div>

    <!-- 加载状态 -->
    <transition name="fade">
      <div v-if="healthStore.loading" class="loading-container">
        <n-spin size="large" />
      </div>
    </transition>

    <!-- 数据统计卡片 - 每个用户独立显示 -->
    <transition name="slide-up">
      <div class="stats-cards" v-show="!healthStore.loading">
        <div v-for="role in healthStore.roles" :key="role.id" class="user-stats-card">
          <div class="user-header">
            <div class="user-avatar">{{ role.name.charAt(0) }}</div>
            <h3>{{ role.name }}</h3>
          </div>
          <div class="user-stats">
            <div class="user-stat-item">
              <div class="stat-icon-small">
                <i class="fas fa-weight"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value-small">{{ getUserCurrentWeight(role.id) }}Kg</div>
                <div class="stat-label-small">当前体重</div>
              </div>
            </div>
            <div class="user-stat-item">
              <div class="stat-icon-small">
                <i class="fas fa-chart-line"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value-small" :class="{ 'weight-down': getUserWeightChange(role.id) < 0, 'weight-up': getUserWeightChange(role.id) > 0 }">
                  {{ getUserWeightChange(role.id) > 0 ? '+' : '' }}{{ getUserWeightChange(role.id) }} Kg
                </div>
                <div class="stat-label-small">较昨日变化</div>
              </div>
            </div>
            <div class="user-stat-item" v-if="role.target">
              <div class="stat-icon-small">
                <i class="fas fa-bullseye"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value-small">{{ getUserTargetProgress(role.id) }}%</div>
                <div class="stat-label-small">目标进度</div>
              </div>
            </div>
            <div class="user-stat-item">
              <div class="stat-icon-small">
                <i class="fas fa-calendar-check"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value-small">{{ getUserRecordCount(role.id) }}</div>
                <div class="stat-label-small">记录天数</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <!-- 体重折线图 -->
    <div class="chart-wrapper" v-show="!healthStore.loading">
      <div class="date-filter">
        <div class="quick-date-filters">
          <n-button
              size="small"
              @click="setDateRange(3)"
              :type="isDateRangeActive(3) ? 'primary' : 'default'"
          >
            3天
          </n-button>
          <n-button
              size="small"
              @click="setDateRange(7)"
              :type="isDateRangeActive(7) ? 'primary' : 'default'"
          >
            7天
          </n-button>
          <n-button
              size="small"
              @click="setDateRange(15)"
              :type="isDateRangeActive(15) ? 'primary' : 'default'"
          >
            15天
          </n-button>
          <n-button
              size="small"
              @click="setDateRange(30)"
              :type="isDateRangeActive(30) ? 'primary' : 'default'"
          >
            30天
          </n-button>
          <n-button
              size="small"
              @click="clearDateRange"
              :type="!dateRange ? 'primary' : 'default'"
          >
            全部
          </n-button>
        </div>
      </div>
      <div class="chart-container">
        <v-chart :option="chartOption" @click="handleChartClick" class="health-chart"></v-chart>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons" v-show="!healthStore.loading">
      <n-button type="primary" @click="openAddModal" v-if="showEdit">
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
import { NModal, NImage, NSelect, NDatePicker, NButton, NForm, NFormItem, NInputNumber, NInput, NSpin, NUpload, useMessage } from 'naive-ui';
import { useRoute } from 'vue-router';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import * as echarts from 'echarts/core';

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent]);

const healthStore = useHealthStore();
const route = useRoute();
const message = useMessage();

// 响应式主题状态
const isDarkTheme = ref(document.body.classList.contains('dark-theme'));

// 监听主题变化
const observer = new MutationObserver(() => {
  isDarkTheme.value = document.body.classList.contains('dark-theme');
});

// 开始观察body的class变化
if (typeof window !== 'undefined') {
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class']
  });
}

// 检查URL参数中是否有edit
const showEdit = computed(() => route.query.edit === 'true');

// 加载角色列表
const roles = ref([]);

// 日期范围筛选
const dateRange = ref(null);

// 统计数据 - 计算每个用户的统计数据
function getUserCurrentWeight(roleId) {
  const records = healthStore.allRoleRecords.filter(r => r.roleId === roleId);
  if (records.length === 0) return '0';
  
  // 按日期排序，获取最新记录
  records.sort((a, b) => new Date(b.date) - new Date(a.date));
  return records[0].weight.toFixed(1);
}

function getUserWeightChange(roleId) {
  const records = healthStore.allRoleRecords.filter(r => r.roleId === roleId);
  if (records.length < 2) return 0;
  
  // 按日期排序
  records.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // 计算最近两次记录的体重变化
  const latest = records[0].weight;
  const previous = records[1].weight;
  return (latest - previous).toFixed(1);
}

function getUserTargetProgress(roleId) {
  const role = healthStore.roles.find(r => r.id === roleId);
  if (!role || !role.target) return 0;
  
  const records = healthStore.allRoleRecords.filter(r => r.roleId === roleId);
  if (records.length === 0) return 0;
  
  // 按日期排序，获取最新记录
  records.sort((a, b) => new Date(b.date) - new Date(a.date));
  const currentWeight = records[0].weight;
  const initialWeight = records[records.length - 1].weight;
  
  // 计算目标进度
  const totalChange = initialWeight - role.target;
  const currentChange = initialWeight - currentWeight;
  
  if (totalChange === 0) return 0;
  const progress = Math.round((currentChange / totalChange) * 100);
  return Math.max(0, Math.min(100, progress));
}

function getUserRecordCount(roleId) {
  const records = healthStore.allRoleRecords.filter(r => r.roleId === roleId);
  return records.length;
}

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
  // 不关闭详情，保持selectedRecord可用
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
      // 编辑成功后关闭详情
      healthStore.closeDetail();
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

// 快速设置日期范围
function setDateRange(days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  dateRange.value = [
    startDate.getTime(),
    endDate.getTime()
  ];
}

// 检查日期范围是否激活
function isDateRangeActive(days) {
  if (!dateRange.value || !dateRange.value[0] || !dateRange.value[1]) {
    return false;
  }
  
  const startDate = new Date(dateRange.value[0]);
  const endDate = new Date(dateRange.value[1]);
  const today = new Date();
  
  // 计算日期差
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // 检查结束日期是否是今天
  const isToday = endDate.toDateString() === today.toDateString();
  
  return isToday && diffDays === days;
}

// 清除日期范围
function clearDateRange() {
  dateRange.value = null;
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
  const series = [];
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // 根据主题设置图表颜色 - 使用响应式检测
  const textColor = isDarkTheme.value ? '#e5e7eb' : '#374151';
  const gridColor = isDarkTheme.value ? '#374151' : '#e5e7eb';
  const backgroundColor = isDarkTheme.value ? '#1f2937' : '#ffffff';

  healthStore.roles.forEach((role, index) => {
    const roleRecords = records.filter(r => r.roleId === role.id);
    const weights = allDates.map(date => {
      const record = roleRecords.find(r => r.date === date);
      return record ? record.weight : null;
    });

    // 添加实际体重折线
    series.push({
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
      },
      // 添加区域渐变效果
      areaStyle: {
        opacity: 0.1,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: colors[index % colors.length] },
          { offset: 1, color: 'rgba(255, 255, 255, 0)' }
        ])
      }
    });

    // 添加目标体重虚线
    if (role.target) {
      series.push({
        name: `${role.name}目标`,
        type: 'line',
        data: allDates.map(() => role.target),
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: colors[index % colors.length],
          width: 2,
          type: 'dashed'
        }
      });
    }
  });

  return {
    backgroundColor,
    title: {
      text: '体重变化趋势',
      left: 'left',
      textStyle: {
        color: textColor
      }
    },
    tooltip: {
      trigger: 'axis',
      show: !isMobile,
      backgroundColor: isDarkTheme.value ? '#374151' : '#ffffff',
      borderColor: isDarkTheme.value ? '#4b5563' : '#e5e7eb',
      textStyle: {
        color: textColor
      },
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
      top: 30,
      textStyle: {
        color: textColor
      }
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
      data: allDates,
      axisLine: {
        lineStyle: {
          color: gridColor
        }
      },
      axisLabel: {
        color: textColor
      }
    },
    yAxis: {
      type: 'value',
      name: '体重 (kg)',
      min: 50,
      max: 80,
      nameTextStyle: {
        color: textColor
      },
      axisLine: {
        lineStyle: {
          color: gridColor
        }
      },
      axisLabel: {
        color: textColor
      },
      splitLine: {
        lineStyle: {
          color: gridColor,
          type: 'dashed'
        }
      }
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

  // 移动端默认选择3天
  if (isMobile) {
    setDateRange(3);
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
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 深色主题样式 */
.health-container.dark-theme {
  background-color: #1f2937;
  color: #e5e7eb;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h1 {
  font-size: 2rem;
  margin-bottom: 20px;
  color: #333;
  transition: color 0.3s ease;
}

.dark-theme h1 {
  color: #e5e7eb;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

/* 统计卡片样式 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}


/* 用户统计卡片 */
.user-stats-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.user-stats-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.user-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
  text-transform: uppercase;
}

.user-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
}

.user-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.user-stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon-small {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 14px;
}

.stat-info {
  flex: 1;
}

.stat-value-small {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
}

.stat-label-small {
  font-size: 12px;
  color: #6b7280;
}

/* 深色主题下的用户统计卡片 */
.dark-theme .user-stats-card {
  background: #374151;
}

.dark-theme .user-header {
  border-bottom-color: #4b5563;
}

.dark-theme .user-header h3 {
  color: #e5e7eb;
}

.dark-theme .stat-icon-small {
  background: #4b5563;
  color: #9ca3af;
}

.dark-theme .stat-value-small {
  color: #e5e7eb;
}

.dark-theme .stat-label-small {
  color: #9ca3af;
}

.weight-down {
  color: #10B981 !important;
}

.weight-up {
  color: #EF4444 !important;
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
  transition: color 0.3s ease;
}

.dark-theme .diet-section h3 {
  color: #e5e7eb;
}

.meal-form-item {
  margin-bottom: 20px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.dark-theme .meal-form-item {
  background: #374151;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
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

.quick-date-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

/* 深色主题下的快速日期筛选按钮 */
.dark-theme .quick-date-filters button {
  color: #e5e7eb;
  border-color: #4b5563;
  background-color: #374151;
}

.dark-theme .quick-date-filters button:hover {
  background-color: #4b5563;
  border-color: #6b7280;
}

.dark-theme .quick-date-filters button.n-button--primary-type {
  background-color: #3B82F6;
  border-color: #3B82F6;
  color: #ffffff;
}

.chart-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 45px 20px 20px 20px;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.dark-theme .chart-container {
  background: #374151;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.health-chart {
  height: 400px;
  width: 100%;
  z-index: 999;
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
  transition: color 0.3s ease, border-color 0.3s ease;
}

.dark-theme .detail-section h3 {
  color: #e5e7eb;
  border-color: #4b5563;
}

.detail-section p {
  margin: 8px 0;
  color: #666;
  transition: color 0.3s ease;
}

.dark-theme .detail-section p {
  color: #9ca3af;
}

.meal-item {
  margin: 15px 0;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.dark-theme .meal-item {
  background: #374151;
}

.meal-item h4 {
  font-size: 1rem;
  margin-bottom: 8px;
  color: #333;
  transition: color 0.3s ease;
}

.dark-theme .meal-item h4 {
  color: #e5e7eb;
}

.meal-note {
  margin: 8px 0;
  color: #666;
  line-height: 1.5;
  transition: color 0.3s ease;
}

.dark-theme .meal-note {
  color: #9ca3af;
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
  transition: transform 0.2s ease;
}

.meal-images :deep(.n-image:hover) {
  transform: scale(1.02);
}


/* 移动端适配 */
@media (max-width: 768px) {
  .health-container {
    padding: 10px;
    overflow-x: hidden;
  }

  .dark-theme.health-container {
    padding: 10px;
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
    padding-top: 45px;
  }

  .date-filter {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    z-index: 10;
    width: 100%;
    overflow-x: hidden;
  }

  .quick-date-filters {
    justify-content: center;
    gap: 5px;
  }

  .quick-date-filters button {
    flex: 1;
    min-width: 60px;
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

  .stats-cards {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}
</style>
