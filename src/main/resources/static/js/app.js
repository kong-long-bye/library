import { createApp } from 'vue'
import { router } from './router/index.js'
import Home from './views/Home.js'

const app = createApp({
    components: {
        Home
    },
    template: `
        <router-view></router-view>
    `
})

app.use(router)
app.mount('#app') 