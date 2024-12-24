export default {
    name: 'Home',
    data() {
        return {
            searchQuery: '',
            books: [],
            categories: [
                { id: 1, name: '小说' },
                { id: 2, name: '技术' },
                { id: 3, name: '医学' }
            ],
            isLoggedIn: false,
            username: ''
        }
    },
    template: `
        <div class="home">
            <header class="header">
                <div class="logo">
                    <h1>数字图书馆</h1>
                </div>
                <div class="search-box">
                    <input 
                        type="text" 
                        v-model="searchQuery" 
                        placeholder="搜索书籍、作者或ISBN..."
                        @keyup.enter="handleSearch"
                    >
                    <button @click="handleSearch">搜索</button>
                </div>
                <div class="user-actions">
                    <template v-if="!isLoggedIn">
                        <router-link to="/login">登录</router-link> |
                        <router-link to="/register">注册</router-link>
                    </template>
                    <template v-else>
                        <span>欢迎, {{ username }}</span> |
                        <a @click="logout">退出</a>
                    </template>
                </div>
            </header>

            <main class="main-content">
                <div class="categories">
                    <h2>图书分类</h2>
                    <ul>
                        <li v-for="category in categories" 
                            :key="category.id"
                            @click="filterByCategory(category.id)">
                            {{ category.name }}
                        </li>
                    </ul>
                </div>

                <div class="book-list">
                    <div v-for="book in books" 
                         :key="book.id" 
                         class="book-card"
                         @click="goToBookDetail(book.id)">
                        <img :src="book.cover" :alt="book.title">
                        <h3>{{ book.title }}</h3>
                        <p>{{ book.author }}</p>
                    </div>
                </div>
            </main>
        </div>
    `,
    methods: {
        handleSearch() {
            // 实现搜���逻辑
        },
        filterByCategory(categoryId) {
            // 实现分类筛选
        },
        goToBookDetail(bookId) {
            this.$router.push(`/book/${bookId}`)
        },
        logout() {
            // 实现登出逻辑
        }
    }
} 