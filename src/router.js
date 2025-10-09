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
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

export default router;