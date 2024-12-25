// 加载待审核图书列表
function loadPendingBooks() {
    fetch('/api/books/pending')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const pendingList = document.getElementById('pendingBooks');
                if (data.data && data.data.length > 0) {
                    pendingList.innerHTML = data.data.map(book => `
                        <div class="pending-item" onclick="showBookDetail(${JSON.stringify(book).replace(/"/g, '&quot;')})">
                            <div class="pending-header">
                                <span class="pending-title">${book.title}</span>
                            </div>
                            <div class="pending-info">
                                <p>作者：${book.author}</p>
                                <p>上传时间：${formatDate(book.uploadTime)}</p>
                            </div>
                        </div>
                    `).join('');
                } else {
                    pendingList.innerHTML = '<div class="empty-state">暂无待审核图书</div>';
                }
            }
        })
        .catch(error => {
            console.error('加载待审核列表失败:', error);
            showErrorMessage('加载待审核列表失败，请刷新页面重试');
        });
}

// 显示图书详情
function showBookDetail(book) {
    // 移除其他项目的active类
    document.querySelectorAll('.pending-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 为当前选中项添加active类
    event.currentTarget.classList.add('active');
    
    const detailDiv = document.getElementById('bookDetail');
    detailDiv.innerHTML = `
        <div class="book-info">
            <h3>${book.title}</h3>
            <div class="book-info-grid">
                <div class="info-item">
                    <label>作者</label>
                    <span>${book.author}</span>
                </div>
                <div class="info-item">
                    <label>ISBN</label>
                    <span>${book.isbn}</span>
                </div>
                <div class="info-item">
                    <label>所属类别</label>
                    <span>${book.category}</span>
                </div>
                <div class="info-item">
                    <label>上传者</label>
                    <span>${book.uploader.username}</span>
                </div>
                <div class="info-item">
                    <label>上传时间</label>
                    <span>${formatDate(book.uploadTime)}</span>
                </div>
                <div class="info-item">
                    <label>文件格式</label>
                    <span>${book.format}</span>
                </div>
            </div>
        </div>
        <div class="review-actions">
            <button onclick="reviewBook(${book.id}, '已通过')" class="btn-approve">通过</button>
            <button onclick="reviewBook(${book.id}, '未通过')" class="btn-reject">拒绝</button>
        </div>
    `;
}

// 加载审核历史
function loadReviewHistory() {
    fetch('/api/books/review-history')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const historyList = document.getElementById('reviewHistory');
                historyList.innerHTML = data.data.map(book => `
                    <tr>
                        <td>${book.title}</td>
                        <td>${book.author}</td>
                        <td>${book.isbn}</td>
                        <td>
                            <span class="status-badge status-${book.status === '已通过' ? 'approved' : 'rejected'}">
                                ${book.status}
                            </span>
                        </td>
                    </tr>
                `).join('');
            }
        })
        .catch(error => {
            console.error('加载审核历史失败:', error);
            showErrorMessage('加载审核历史失败');
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
            // 刷新待审核列表和审核历史
            loadPendingBooks();
            loadReviewHistory();
            // 清空详情面板
            document.getElementById('bookDetail').innerHTML = `
                <div class="empty-state">
                    <p>请从左侧选择要审核的图书</p>
                </div>
            `;
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

// 页面加载时执行
document.addEventListener('DOMContentLoaded', () => {
    loadPendingBooks();
    loadReviewHistory();
    // 每分钟刷新一次
    setInterval(() => {
        loadPendingBooks();
        loadReviewHistory();
    }, 60000);
}); 