export function calculateRewards(records, yearMonth) {
    // 1. 过滤出指定年月的记录
    const monthRecords = records.filter(record => record.date.startsWith(yearMonth));

    // 2. 计算总运动天数
    const totalDays = monthRecords.length;

    // 3. 计算达标天数 (骑行>=60或走路>=90)
    const qualifiedDays = monthRecords.filter(record => {
        return (record.activityType === 'cycling' && record.duration >= 60) ||
            (record.activityType === 'walking' && record.duration >= 90);
    }).length;

    // 4. 计算有效次数 (A) = 总天数 - 15 (如果总天数>15)
    let validCount = totalDays > 15 ? totalDays - 15 : 0;

    // 5. 计算总奖励次数 (B)
    let rewardCount = validCount; // 默认情况
    if (validCount >= 20) {
        const excessCount = validCount - 19; // 超过19次的部分
        // 每2次算3次：超额部分 / 2 * 3
        const bonus = Math.floor(excessCount / 2) * 3;
        rewardCount = 19 + bonus;
    }

    // 6. 判断是否获得小奖励
    const earnedSmallReward = rewardCount > 0 && rewardCount < 20;

    return {
        totalDays,
        qualifiedDays,
        validCount,
        rewardCount,
        earnedSmallReward
    };
}