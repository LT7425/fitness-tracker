import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase, TABLES } from '@/utils/supabase';

export const useHealthStore = defineStore('health', () => {
    const roles = ref([]);
    const dailyRecords = ref([]);
    const currentRoleId = ref(1);
    const selectedDate = ref(new Date().toISOString().split('T')[0]);
    const showDetailModal = ref(false);
    const selectedRecord = ref(null);
    const loading = ref(false);
    const error = ref(null);

    // 加载角色数据
    async function loadRoles() {
        try {
            const { data, error: err } = await supabase
                .from(TABLES.ROLES)
                .select('*')
                .order('id');

            if (err) throw err;
            roles.value = data || [];

            // 如果有角色，默认选择第一个
            if (roles.value.length > 0) {
                currentRoleId.value = roles.value[0].id;
            }
        } catch (err) {
            console.error('加载角色数据失败:', err);
            error.value = err.message;
        }
    }

    // 加载健康记录数据
    async function loadDailyRecords() {
        try {
            loading.value = true;
            const { data, error: err } = await supabase
                .from(TABLES.DAILY_RECORDS)
                .select('*')
                .order('date', { ascending: true });

            if (err) throw err;
            dailyRecords.value = data || [];
        } catch (err) {
            console.error('加载健康记录失败:', err);
            error.value = err.message;
        } finally {
            loading.value = false;
        }
    }

    // 加载所有数据
    async function loadData() {
        await Promise.all([
            loadRoles(),
            loadDailyRecords()
        ]);
    }

    // 获取当前角色的记录
    const currentRoleRecords = computed(() => {
        return dailyRecords.value
            .filter(record => record.role_id === currentRoleId.value)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    // 获取所有角色的记录（用于图表展示）
    const allRoleRecords = computed(() => {
        return dailyRecords.value.map(record => ({
            ...record,
            roleId: record.role_id // 添加驼峰命名的字段以兼容现有代码
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    // 获取指定日期的记录
    function getRecordByDate(date) {
        return currentRoleRecords.value.find(record => record.date === date);
    }

    // 打开详情模态框
    function openDetail(record) {
        // 创建记录的深拷贝，确保diet中的images数组正确处理
        selectedRecord.value = {
            ...record,
            diet: record.diet ? record.diet.map(meal => ({
                mealType: meal.mealType,
                note: meal.note,
                images: meal.images || []
            })) : []
        };
        showDetailModal.value = true;
    }

    // 关闭详情模态框
    function closeDetail() {
        showDetailModal.value = false;
        selectedRecord.value = null;
    }

    // 添加新记录
    async function addRecord(record) {
        try {
            const newRecord = {
                ...record,
                role_id: currentRoleId.value,
                created_at: new Date().toISOString()
            };

            const { data, error: err } = await supabase
                .from(TABLES.DAILY_RECORDS)
                .insert([newRecord])
                .select()
                .single();

            if (err) throw err;
            dailyRecords.value.push(data);
            return data;
        } catch (err) {
            console.error('添加记录失败:', err);
            error.value = err.message;
            throw err;
        }
    }

    // 更新记录
    async function updateRecord(recordId, updates) {
        try {
            const { data, error: err } = await supabase
                .from(TABLES.DAILY_RECORDS)
                .update(updates)
                .eq('id', recordId)
                .select()
                .single();

            if (err) throw err;

            const index = dailyRecords.value.findIndex(r => r.id === recordId);
            if (index !== -1) {
                dailyRecords.value[index] = data;
            }
            return data;
        } catch (err) {
            console.error('更新记录失败:', err);
            error.value = err.message;
            throw err;
        }
    }

    // 删除记录
    async function deleteRecord(recordId) {
        try {
            const { error: err } = await supabase
                .from(TABLES.DAILY_RECORDS)
                .delete()
                .eq('id', recordId);

            if (err) throw err;

            const index = dailyRecords.value.findIndex(r => r.id === recordId);
            if (index !== -1) {
                dailyRecords.value.splice(index, 1);
            }
        } catch (err) {
            console.error('删除记录失败:', err);
            error.value = err.message;
            throw err;
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
        loading,
        error,
        loadData,
        loadRoles,
        loadDailyRecords,
        getRecordByDate,
        openDetail,
        closeDetail,
        addRecord,
        updateRecord,
        deleteRecord
    };
});
