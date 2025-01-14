// 当前页码和每页显示数量
let currentPage = 0;
const pageSize = 4;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    loadMyUploads();
});

// 加载用户上传的图书
function loadMyUploads() {
    fetch('/api/books/my-uploads?page=' + currentPage + '&size=' + pageSize)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayUploads(data.data);
            } else {
                showError('加载失败：' + data.message);
            }
        })
        .catch(error => {
            console.error('加载失败:', error);
            showError('加载失败，请稍后重试');
        });
}

// 显示上传列表
function displayUploads(pageData) {
    const tbody = document.getElementById('myUploads');
    
    if (!pageData.content || pageData.content.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">暂无上传记录</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageData.content.map(book => {
        // 准备要传递的图书数据
        const bookData = {
            id: book.id,
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            category: book.category
        };
        
        return `
            <tr>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${formatDate(book.uploadTime)}</td>
                <td>
                    <span class="status-badge ${getStatusClass(book.status)}">
                        ${book.status}
                    </span>
                </td>
                <td>
                    ${book.status === '未通过' && book.reviewComment ? 
                        `<span class="review-comment" title="${book.reviewComment}">
                            ${book.reviewComment}
                        </span>` : 
                        '-'
                    }
                </td>
                <td>
                    ${book.status === '未通过' ? 
                        `<button onclick='resubmitBook(${JSON.stringify(bookData)
                            .replace(/'/g, "&#39;")
                            .replace(/"/g, "&quot;")})' 
                            class="btn-resubmit">
                            重新提交
                        </button>` : 
                        '-'
                    }
                </td>
            </tr>
        `;
    }).join('');

    updatePagination(pageData);
}

// 更新分页控件
function updatePagination(pageData) {
    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    
    const totalPages = pageData.totalPages;
    let html = '';
    
    // 上一页按钮
    if (currentPage > 0) {
        html += `<button onclick="changePage(${currentPage - 1})" class="page-btn">上一页</button>`;
    }
    
    // 页码按钮
    for (let i = 0; i < totalPages; i++) {
        if (i === currentPage) {
            html += `<button class="page-btn active">${i + 1}</button>`;
        } else {
            html += `<button onclick="changePage(${i})" class="page-btn">${i + 1}</button>`;
        }
    }
    
    // 下一页按钮
    if (currentPage < totalPages - 1) {
        html += `<button onclick="changePage(${currentPage + 1})" class="page-btn">下一页</button>`;
    }
    
    pagination.innerHTML = html;
    
    // 替换原有的分页控件
    const oldPagination = document.querySelector('.pagination');
    if (oldPagination) {
        oldPagination.replaceWith(pagination);
    } else {
        document.querySelector('.upload-list').appendChild(pagination);
    }
}

// 切换页面
function changePage(page) {
    currentPage = page;
    loadMyUploads();
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 获取状态对应的样式类
function getStatusClass(status) {
    switch (status) {
        case '已通过':
            return 'status-success';
        case '未通过':
            return 'status-error';
        case '待审核':
            return 'status-pending';
        default:
            return '';
    }
}

// 显示错误信息
function showError(message) {
    const tbody = document.getElementById('myUploads');
    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="error-message">${message}</td>
        </tr>
    `;
}

// 重新提交图书
function resubmitBook(book) {
    try {
        // 添加调试日志
        console.log('重新提交图书:', book);

        // 跳转到上传页面并携带图书信息
        const params = new URLSearchParams({
            id: book.id,
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            category: book.category,
            isResubmit: 'true'  // 标记这是一个重新提交
        });

        // 添加调试日志
        console.log('跳转URL:', `/books/upload?${params.toString()}`);
        
        window.location.href = `/books/upload?${params.toString()}`;
    } catch (error) {
        console.error('重新提交失败:', error);
        alert('重新提交失败，请稍后重试');
    }
} 