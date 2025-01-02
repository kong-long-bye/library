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
        <div class="book-actions">
            ${book.format === 'PDF' ? 
                `<button onclick="previewBook(${book.id})" class="btn-preview">预览</button>` :
                `<button onclick="downloadBook(${book.id})" class="btn-download">下载</button>`
            }
        </div>
        <div class="review-actions">
            <button onclick="reviewBook(${book.id}, '已通过')" class="btn-approve">通过</button>
            <button onclick="showRejectDialog(${book.id})" class="btn-reject">拒绝</button>
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

// 显示拒绝理由弹窗
function showRejectDialog(bookId) {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'review-dialog';
    overlay.innerHTML = `
        <div class="dialog-content">
            <h3>审核不通过</h3>
            <div class="form-group">
                <label for="rejectReason">请输入不通过原因：</label>
                <textarea 
                    id="rejectReason" 
                    placeholder="请详细说明不通过的原因..." 
                    rows="4"
                    maxlength="500"
                ></textarea>
                <div class="char-count">
                    <span id="charCount">0</span>/500
                </div>
            </div>
            <div class="dialog-actions">
                <button type="button" class="btn-cancel">取消</button>
                <button type="button" class="btn-confirm">确认</button>
            </div>
        </div>
    `;

    // 添加到body
    document.body.appendChild(overlay);

    // 获取元素
    const cancelBtn = overlay.querySelector('.btn-cancel');
    const confirmBtn = overlay.querySelector('.btn-confirm');
    const textarea = overlay.querySelector('#rejectReason');
    const charCount = overlay.querySelector('#charCount');

    // 字符计数
    textarea.addEventListener('input', () => {
        const count = textarea.value.length;
        charCount.textContent = count;
        if (count >= 500) {
            charCount.style.color = 'red';
        } else {
            charCount.style.color = '';
        }
    });

    // 聚焦到文本框
    textarea.focus();

    // 取消按钮事件
    cancelBtn.onclick = () => {
        document.body.removeChild(overlay);
    };

    // ESC键关闭弹窗
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.body.removeChild(overlay);
        }
    });

    // 确认按钮事件
    confirmBtn.onclick = () => {
        const reason = textarea.value.trim();
        if (!reason) {
            alert('请输入不通过原因');
            return;
        }
        if (reason.length > 500) {
            alert('不通过原因不能超过500字');
            return;
        }
        reviewBook(bookId, '未通过', reason);
        document.body.removeChild(overlay);
    };
}

// 修改审核函数，添加理由参数
function reviewBook(bookId, status, reason = '') {
    const formData = new FormData();
    formData.append('status', status);
    if (reason) {
        formData.append('reason', reason);
    }
    
    // 添加调试日志
    console.log('发送审核请求:', {
        bookId,
        status,
        reason
    });
    
    fetch(`/api/books/${bookId}/review`, {
        method: 'POST',
        // 修改：不要使用 FormData，改用 URLSearchParams
        body: new URLSearchParams({
            status: status,
            reason: reason || ''
        })
    })
    .then(response => {
        // 添加调试日志
        console.log('响应状态:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('响应数据:', data);
        if (data.success) {
            showSuccessMessage(data.message);
            loadPendingBooks();
            loadReviewHistory();
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
    });
}

// 预览图书
function previewBook(bookId) {
    window.open(`/books/${bookId}/read`, '_blank');
}

// 下载图书
function downloadBook(bookId) {
    window.location.href = `/api/books/${bookId}/download`;
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