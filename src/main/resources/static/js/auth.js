// 登录表单处理
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const messageDiv = document.getElementById('message');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                showSuccess(messageDiv, '登录成功！');
                setTimeout(() => {
                    window.location.href = '/search';
                }, 1500);
            } else {
                showError(messageDiv, data.message || '登录失败');
            }
        } catch (error) {
            showError(messageDiv, '网络错误，请稍后重试');
        }
    });
}

// 注册表单处理
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const messageDiv = document.getElementById('message');

        // 基本验证
        if (password !== confirmPassword) {
            showError(messageDiv, '两次输入的密码不一致');
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                showSuccess(messageDiv, '注册成功！正在跳转到登录页面...');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                showError(messageDiv, data.message || '注册失败');
            }
        } catch (error) {
            showError(messageDiv, '网络错误，请稍后重试');
        }
    });
}

// 修改密码表单处理
const changePasswordForm = document.getElementById('changePasswordForm');
if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const messageDiv = document.getElementById('message');

        // 基本验证
        if (newPassword !== confirmPassword) {
            showError(messageDiv, '两次输入的新密码不一致');
            return;
        }

        // 验证新密码格式
        if (!isValidPassword(newPassword)) {
            showError(messageDiv, '新密码必须至少6位，且含字母和数字');
            return;
        }

        try {
            const response = await fetch('/api/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    oldPassword: oldPassword,
                    newPassword: newPassword
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                showSuccess(messageDiv, '密码修改成功！请重新登录...');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                showError(messageDiv, data.message || '密码修改失败');
            }
        } catch (error) {
            showError(messageDiv, '网络错误，请稍后重试');
        }
    });
}

// 辅助函数
function showError(element, message) {
    element.className = 'error';
    element.textContent = message;
}

function showSuccess(element, message) {
    element.className = 'success';
    element.textContent = message;
}

function isValidPassword(password) {
    return password.length >= 6 && 
           /[A-Za-z]/.test(password) && 
           /[0-9]/.test(password);
} 