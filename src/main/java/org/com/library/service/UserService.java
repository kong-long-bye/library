package org.com.library.service;

import org.com.library.entity.User;
import org.com.library.repository.UserRepository;
import org.com.library.exception.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public User register(String username, String password) {
        // 验证用户名
        if (username == null || username.trim().isEmpty()) {
            throw new CustomException("用户名不能为空");
        }
        if ("admin".equalsIgnoreCase(username)) {
            throw new CustomException("不能使用此用户名");
        }
        if (username.matches("\\d+")) {
            throw new CustomException("用户名不能为纯数字");
        }
        if (username.length() < 4 || username.length() > 20) {
            throw new CustomException("用户名长度必须在4-20位之间");
        }

        // 验证密码
        if (password == null || password.length() < 6) {
            throw new CustomException("密码长度至少6位");
        }
        if (!password.matches("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{6,}$")) {
            throw new CustomException("密码必须包含字母和数字");
        }

        // 检查用户名是否已存在
        if (userRepository.existsByUsername(username)) {
            throw new CustomException("用户名已存在");
        }

        // 创建新用户
        User user = new User();
        user.setUsername(username);
        user.setPassword(password);
        user.setRole(User.ROLE_USER); // 设置为普通用户
        return userRepository.save(user);
    }

    public User login(String username, String password) {
        // 参数验证
        if (username == null || username.trim().isEmpty()) {
            throw new CustomException("用户名不能为空");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new CustomException("密码不能为空");
        }

        // 查找用户
        User user = userRepository.findByUsername(username.trim())
                .orElseThrow(() -> new CustomException("用户名或密码错误"));

        // 直接比较密码
        if (!password.equals(user.getPassword())) {
            throw new CustomException("用户名或密码错误");
        }

        return user;
    }

    @Transactional
    public void changePassword(Integer userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("用户不存在"));

        // 验证旧密码
        if (!oldPassword.equals(user.getPassword())) {
            throw new CustomException("当前密码错误");
        }

        // 验证新密码格式
        if (newPassword == null || newPassword.length() < 6) {
            throw new CustomException("新密码长度至少6位");
        }
        if (!newPassword.matches("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{6,}$")) {
            throw new CustomException("新密码必须包含字母和数字");
        }

        // 直接保存新密码
        user.setPassword(newPassword);
        userRepository.save(user);
    }

    public User createAdmin(String username, String password) {
        User admin = new User();
        admin.setUsername(username);
        admin.setPassword(password);
        admin.setRole(User.ROLE_ADMIN); // 设置为管理员
        return userRepository.save(admin);
    }

    // 检查是否是管理员
    public boolean isAdmin(User user) {
        return user != null && User.ROLE_ADMIN.equals(user.getRole());
    }
} 