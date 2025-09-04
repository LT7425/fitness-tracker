
const GITHUB_CONFIG = {
    owner: 'YOUR_GITHUB_USERNAME',
    repo: 'github-fitness-tracker',
    path: 'data.json',
    token: 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN'
};

export async function loadData() {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`,
            {
                headers: {
                    Authorization: `token ${GITHUB_CONFIG.token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );

        if (!response.ok) {
            if (response.status === 404) {
                return { records: [], rewards: { small: 0, medium: 0, large: 0 }, rewardHistory: [] };
            }
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        const content = atob(data.content);
        return JSON.parse(content);
    } catch (error) {
        console.error('Error loading data from GitHub:', error);
        // 出错时尝试从localStorage加载备份
        const localData = localStorage.getItem(STORAGE_KEY);
        return localData ? JSON.parse(localData) : {
            records: [],
            rewards: { small: 0, medium: 0, large: 0 },
            rewardHistory: []
        };
    }
}

export async function saveData(data) {
    try {
        // 先获取现有文件的SHA（用于更新）
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`,
            {
                headers: {
                    Authorization: `token ${GITHUB_CONFIG.token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );

        const sha = response.ok ? (await response.json()).sha : null;
        const content = btoa(JSON.stringify(data, null, 2));

        // 保存到GitHub
        const saveResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `token ${GITHUB_CONFIG.token}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `Update fitness data: ${new Date().toISOString()}`,
                    content: content,
                    sha: sha // 只有更新现有文件时需要
                })
            }
        );

        if (!saveResponse.ok) {
            throw new Error(`Failed to save data: ${saveResponse.status}`);
        }

        // 同时保存到localStorage作为备份
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving data to GitHub:', error);
        // 出错时至少保存到localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return false;
    }
}

export function exportData() {
    const data = loadData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fitness-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

export function importData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.records && data.rewards) {
                    saveData(data);
                    resolve(true);
                } else {
                    reject(new Error('Invalid data format'));
                }
            } catch (error) {
                reject(error);
            }
        };
        reader.readAsText(file);
    });
}