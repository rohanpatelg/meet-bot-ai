import { createApp } from 'vue'
import App from './app.vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import routes from '~pages'
import { createPinia } from 'pinia'
// Create a container for the Vue app
import '@/assets/base.scss'

setTimeout(() => {    
  routes.push({
    path: '/',
    component: () => import('./pages/index.vue')
  })
  const appContainer = document.createElement('div');
appContainer.id = 'meet-bot-ai-app';
document.body.appendChild(appContainer);
  const router = createRouter({
    history: createWebHashHistory(),
    routes
  })
// Create and mount the Vue app
const app = createApp(App).use(router).use(createPinia());

  app.mount('#meet-bot-ai-app');
}, 0)
const style = document.createElement('style');
style.textContent = `
  #meet-bot-ai-app {
    position: fixed;
    bottom: 0px;
    right: 0px;
    background-color: transparent;
    z-index: 9999;
    overflow: hidden;
    max-width: 300px;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
  }
`;
document.head.appendChild(style);

// Style the container


// console.log(router.getRoutes())

self.onerror = function (message, source, lineno, colno, error) {
  console.info(
    `Error: ${message}\nSource: ${source}\nLine: ${lineno}\nColumn: ${colno}\nError object: ${error}`
  )
}
