import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

import naive from 'naive-ui'
import {useAppStore} from "@/stores/app-store.js";

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(naive)


const appStore = useAppStore();
appStore.initApp().catch(err => {
    console.error('应用初始化失败:', err);
});

app.mount('#app')