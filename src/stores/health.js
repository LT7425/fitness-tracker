import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useHealthStore = defineStore('health', () => {
    const roles = ref([]);
    const dailyRecords = ref([]);
    const currentRoleId = ref(1);
    const selectedDate = ref(new Date().toISOString().split('T')[0]);
    const showDetailModal = ref(false);
    const selectedRecord = ref(null);

    // 加载数据
    async function loadData() {
        try {
            const response = await fetch(new URL('../healthData.json', import.meta.url));
            const data = await response.json();
            roles.value = data.roles || [];
            dailyRecords.value = data.dailyRecords || [];

            // 如果有角色，默认选择第一个
            if (roles.value.length > 0) {
                currentRoleId.value = roles.value[0].id;
            }
        } catch (error) {
            console.error('加载健康数据失败:', error);
        }
    }

    // 获取当前角色的记录
    const currentRoleRecords = computed(() => {
        return dailyRecords.value
            .filter(record => record.roleId === currentRoleId.value)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    // 获取所有角色的记录（用于图表展示）
    const allRoleRecords = computed(() => {
        return dailyRecords.value.sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    // 获取指定日期的记录
    function getRecordByDate(date) {
        return currentRoleRecords.value.find(record => record.date === date);
    }

    // 打开详情模态框
    function openDetail(record) {
        selectedRecord.value = record;
        showDetailModal.value = true;
    }

    // 关闭详情模态框
    function closeDetail() {
        showDetailModal.value = false;
        selectedRecord.value = null;
    }

    // 添加新记录
    function addRecord(record) {
        const newRecord = {
            id: Date.now(),
            ...record,
            roleId: currentRoleId.value
        };
        dailyRecords.value.push(newRecord);
    }

    // 更新记录
    function updateRecord(recordId, updates) {
        const index = dailyRecords.value.findIndex(r => r.id === recordId);
        if (index !== -1) {
            dailyRecords.value[index] = {
                ...dailyRecords.value[index],
                ...updates
            };
        }
    }

    // 删除记录
    function deleteRecord(recordId) {
        const index = dailyRecords.value.findIndex(r => r.id === recordId);
        if (index !== -1) {
            dailyRecords.value.splice(index, 1);
        }
    }

    return {
        roles,
        dailyRecords,
        currentRoleId,
        selectedDate,
        showDetailModal,
        selectedRecord,
        currentRoleRecords,
        allRoleRecords,
        loadData,
        getRecordByDate,
        openDetail,
        closeDetail,
        addRecord,
        updateRecord,
        deleteRecord
    };
});
