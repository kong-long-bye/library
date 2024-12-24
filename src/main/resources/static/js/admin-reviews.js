// 加载待审核图书列表
function loadPendingBooks() {
    fetch('/api/books/pending')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tbody = document.getElementById('reviewBooks');
                tbody.innerHTML = data.data.map(book => `
                    <tr>
                        <td class="book-title">${book.title}</td>
                        <td class="book-author">${book.author}</td>
                        <td class="book-isbn">${book.isbn}</td>
                        <td class="book-category">${book.category}</td>
                        <td class="uploader-name">${book.uploader.username}</td>
                        <td class="upload-time">${formatDate(book.uploadTime)}</td>
                        <td class="action-buttons">
                            <button onclick="reviewBook(${book.id}, '已通过')" class="btn-approve">通过</button>
                            <button onclick="reviewBook(${book.id}, '未通过')" class="btn-reject">拒绝</button>
                        </td>
                    </tr>
                `).join('');
            }
        })
        .catch(error => {
            console.error('加载待审核列表失败:', error);
            showErrorMessage('加载待审核列表失败，请刷新页面重试');
        });
}

// 审核图书
function reviewBook(bookId, status) {
    const loadingOverlay = showLoadingOverlay();
    
    fetch(`/api/books/${bookId}/review`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `status=${status}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccessMessage(data.message);
            loadPendingBooks();
        } else {
            showErrorMessage(data.message);
        }
    })
    .catch(error => {
        console.error('审核失败:', error);
        showErrorMessage('审核操作失败，请重试');
    })
    .finally(() => {
        hideLoadingOverlay(loadingOverlay);
    });
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

// 显示加载遮罩
function showLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(overlay);
    return overlay;
}

// 隐藏加载遮罩
function hideLoadingOverlay(overlay) {
    document.body.removeChild(overlay);
}

// 显示成功消息
function showSuccessMessage(message) {
    showMessage(message, 'success');
}

// 显示错误消息
function showErrorMessage(message) {
    showMessage(message, 'error');
}

// 显示消息提示
function showMessage(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }, 100);
}

// 页面加载时执行，并每分钟刷新一次
document.addEventListener('DOMContentLoaded', () => {
    loadPendingBooks();
    setInterval(loadPendingBooks, 60000);
}); 