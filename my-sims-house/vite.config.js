import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/three.js-sims/',
  resolve: {
    alias: {
      // 1. מכריח את כל הטעינות של התוספות להגיע לאותה תיקייה פיזית
      'three/addons': path.resolve(__dirname, 'node_modules/three/examples/jsm'),
      
      // 2. תמיכה בנתיב הישן (ליתר ביטחון)
      'three/examples/jsm': path.resolve(__dirname, 'node_modules/three/examples/jsm'),

      // 3. מכריח את הטעינה של הליבה (THREE) להגיע לקובץ הספציפי הזה
      'three': path.resolve(__dirname, 'node_modules/three/build/three.module.js')
    }
  }
});