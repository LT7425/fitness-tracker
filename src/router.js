import { createRouter, createWebHistory } from 'vue-router';

const routes = [
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
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;