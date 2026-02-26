import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
      vue(),
      visualizer({
        open: true, // 打包完成后自动打开报告页面
        filename: 'dist/stats.html', // 报告文件生成路径
        gzipSize: true, // 显示 gzip 压缩后的体积
        brotliSize: true // 显示 brotli 压缩后的体积
      })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  base: process.env.NODE_ENV === 'production' ? '/fitness-tracker/' : '/'
})