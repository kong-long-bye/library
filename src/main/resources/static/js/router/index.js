import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.js'
import Login from '../views/Login.js'
import Register from '../views/Register.js'
import Books from '../views/Books.js'
import BookDetail from '../views/BookDetail.js'
import Admin from '../views/Admin.js'

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'Home',
            component: Home
        },
        {
            path: '/login',
            name: 'Login',
            component: Login
        },
        {
            path: '/register',
            name: 'Register',
            component: Register
        },
        {
            path: '/books',
            name: 'Books',
            component: Books
        },
        {
            path: '/book/:id',
            name: 'BookDetail',
            component: BookDetail
        },
        {
            path: '/admin',
            name: 'Admin',
            component: Admin,
            meta: { requiresAdmin: true }
        }
    ]
}) 