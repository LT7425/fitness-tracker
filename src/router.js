import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
    {
        path: '/',
        redirect: '/home'
    },
    {
        path: '/home',
        name: 'Home',
        component: () => import('./views/HomeView.vue')
    },
    {
        path: '/history',
        name: 'History',
        component: () => import('./views/HistoryView.vue')
    },
    {
        path: '/rewards',
        name: 'Rewards',
        component: () => import('./views/RewardsView.vue')
    },
    {
        path: '/health',
        name: 'Health',
        component: () => import('./views/HealthView.vue')
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

export default router;