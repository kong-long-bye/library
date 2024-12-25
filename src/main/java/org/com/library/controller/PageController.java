package org.com.library.controller;

import org.com.library.entity.User;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import jakarta.servlet.http.HttpSession;
import org.springframework.ui.Model;

@Controller
public class PageController {

    @GetMapping("/")
    public String home(HttpSession session) {
        // 如果已登录，跳转到搜索页面
        if (session.getAttribute("user") != null) {
            return "redirect:/search";
        }
        // 未登录跳转到登录页面
        return "redirect:/login";
    }

    @GetMapping("/login")
    public String login(HttpSession session) {
        // 如果已登录，直接跳转到搜索页面
        if (session.getAttribute("user") != null) {
            return "redirect:/search";
        }
        return "login";
    }

    @GetMapping("/register")
    public String register() {
        return "register";
    }

    @GetMapping("/search")
    public String search(HttpSession session) {
        if (session.getAttribute("user") == null) {
            return "redirect:/login";
        }
        return "search";
    }

    @GetMapping("/dashboard")
    public String dashboard(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return "redirect:/login";
        }
        // 如果是管理员，跳转到管理员界面
        if (user.isAdmin()) {
            return "redirect:/admin";
        }
        return "dashboard";
    }

    @GetMapping("/admin")
    public String admin(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || !user.isAdmin()) {
            return "redirect:/login";
        }
        return "admin";
    }

    @GetMapping("/books/upload")
    public String uploadBook(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return "redirect:/login";
        }
        // 如是管理员访问，重定向到管理员的上传页面
        if (user.isAdmin()) {
            return "redirect:/admin/upload";
        }
        return "books/upload";
    }

    @GetMapping("/books/{id}")
    public String bookDetail(@PathVariable Long id, HttpSession session) {
        if (session.getAttribute("user") == null) {
            return "redirect:/login";
        }
        return "books/detail";
    }

    @GetMapping("/change-password")
    public String changePassword(HttpSession session) {
        if (session.getAttribute("user") == null) {
            return "redirect:/login";
        }
        return "change-password";
    }

    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.removeAttribute("user");
        return "redirect:/login";
    }

    @GetMapping("/admin/upload")
    public String adminUpload(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || !user.isAdmin()) {
            return "redirect:/login";
        }
        return "admin/upload";  // 管理员专用的上传页面
    }

    @GetMapping("/admin/reviews")
    public String adminReviews(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || !user.isAdmin()) {
            return "redirect:/login";
        }
        return "admin/reviews";  // 管理员审核页面
    }
} 