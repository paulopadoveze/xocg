import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { plugin as TippyPlugin } from 'vue-tippy'

// import 'tippy.js/dist/tippy.css'
// import 'tippy.js/themes/light.css'
// import 'tippy.js/animations/shift-away.css'

const app = createApp(App)
const pinia = createPinia()

createApp(App)
  .use(pinia)
  .use(router)
  .use(TippyPlugin)
  .mount('#app')