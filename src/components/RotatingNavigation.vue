<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Home from "../views/HomeView.vue"

const router = useRouter()
const showNav = ref(false)

const open = () => { showNav.value = true }
const close = () => { showNav.value = false }

const goHome = () => {
  close()
  router.push('/')
}
const goHistory = () => {
  close()
  router.push('/history')
}
const goRewards = () => {
  close()
  router.push('/rewards')
}
</script>

<template>
  <div class="rotating-nav">
    <div class="container" :class="{ 'show-nav': showNav }">
      <div class="circle-container">
        <div class="circle">
          <button id="close" @click="close">
            <i class="fas fa-times"></i>
          </button>
          <button id="open" @click="open">
            <i class="fas fa-bars"></i>
          </button>
        </div>
      </div>
      <div class="content">
        <slot name="moduleBlock">
          <Home />
        </slot>
      </div>
    </div>

    <nav>
      <ul>
        <li @click="goHome"><i class="fas fa-home"></i> 首页</li>
        <li @click="goHistory"><i class="fas fa-list"></i> 历史记录</li>
        <li @click="goRewards"><i class="fas fa-gift"></i> 奖励模块</li>
      </ul>
    </nav>
  </div>
</template>

<style>

.rotating-nav {
  width: 100%;
  height: 100%;
  font-family: 'Lato', sans-serif;
  color: #222;
  overflow-x: hidden;
  position: relative;
}

/* 容器与旋转 */
.rotating-nav .container {
  background-color: #fafafa;
  transform-origin: top left;
  transition: transform 0.5s linear;
  height: max-content;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(255, 182, 193, 0.25);
}

.rotating-nav .container.show-nav {
  transform: rotate(-20deg);
}
.rotating-nav .container:has(.show-nav) {
   border-radius: 16px;
}

/* 左上角圆形按钮 */
.rotating-nav .circle-container {
  position: fixed;
  top: -100px;
  left: -100px;
  z-index: 999;
}

.rotating-nav .circle {
  background-color: #ff7979; 
  height: 200px;
  width: 200px;
  border-radius: 50%;
  position: relative;
  transition: transform 0.5s linear;
  box-shadow: 0 6px 16px rgba(255, 182, 193, 0.35);
}

.rotating-nav .container.show-nav .circle {
  transform: rotate(-70deg);
}

.rotating-nav .circle button {
  cursor: pointer;
  position: absolute;
  top: 50%;
  left: 50%;
  height: 100px;
  background: transparent;
  border: 0;
  font-size: 26px;
  color: #fff;
}

.rotating-nav .circle button:focus {
  outline: none;
}

.rotating-nav .circle button#open {
  left: 60%;
}

.rotating-nav .circle button#close {
  top: 60%;
  transform: rotate(90deg);
  transform-origin: top left;
}

/* 导航显隐与过渡 */
.rotating-nav .container.show-nav + nav li {
  transform: translateX(0);
  transition-delay: 0.3s;
}

.rotating-nav nav {
  position: fixed;
  bottom: 40px;
  left: 0;
  z-index: 100;
}

.rotating-nav nav ul {
  list-style-type: none;
  padding-left: 30px;
}

.rotating-nav nav ul li {
  text-transform: uppercase;
  color: #fff;
  margin: 40px 0;
  transform: translateX(-100%);
  transition: transform 0.4s ease-in;
  cursor: pointer;
}

.rotating-nav nav ul li i {
  font-size: 20px;
  margin-right: 10px;
}

.rotating-nav nav ul li + li {
  margin-left: 15px;
  transform: translateX(-150%);
}

.rotating-nav nav ul li + li + li {
  margin-left: 30px;
  transform: translateX(-200%);
}

/* 内容区 */
.rotating-nav .content img {
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(255, 182, 193, 0.25);
}

.rotating-nav .content {
  max-width: 1000px;
  margin: 50px auto 0;
}

.rotating-nav .content h1 {
  margin: 0;
  color: #ff6fae;
}

.rotating-nav .content small {
  color: #555;
  font-style: italic;
}

.rotating-nav .content p {
  color: #333;
  line-height: 1.5;
}
</style>