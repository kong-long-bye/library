// 文件上传处理
const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const isbn = document.getElementById('isbn').value;
        if (!validateISBN(document.getElementById('isbn'))) {
            showError('请输入正确的13位ISBN编号');
            return;
        }
        
        const formData = new FormData(uploadForm);
        const submitButton = uploadForm.querySelector('button[type="submit"]');
        
        try {
            // 禁用提交按钮，防止重复提交
            if (submitButton) {
                submitButton.disabled = true;
            }
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            // 添加详细的错误处理
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '上传失败');
            }
            
            const data = await response.json();
            
            // 显示成功消息
            showSuccess('上传成功！等待管理员审核...');
            
            // 添加调试日志
            console.log('准备跳转到 dashboard...');
            
            // 重置表单
            uploadForm.reset();
            
            // 3秒后跳转到仪表盘页面
            setTimeout(() => {
                console.log('执行跳转...');
                window.location.href = '/dashboard';
            }, 3000);
            
        } catch (error) {
            console.error('上传错误:', error);
            showError(error.message || '上传失败，请稍后重试');
        } finally {
            // 重新启用提交按钮
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
}

// 书籍列表加载
let currentPage = 1;
const pageSize = 12;

async function loadBooks(page = 1, search = '', sort = 'relevance') {
    try {
        const response = await fetch(`/api/books?page=${page}&size=${pageSize}&search=${search}&sort=${sort}`);
        const data = await response.json();
        
        if (response.ok) {
            renderBooks(data.content);
            renderPagination(data.totalPages, page);
            updateTotalCount(data.totalElements);
        } else {
            showError('加载失败');
        }
    } catch (error) {
        showError('网络错误');
    }
}

function renderBooks(books) {
    const container = document.getElementById('booksContainer');
    if (!container) return;

    container.innerHTML = books.map(book => `
        <div class="book-item">
            <div class="book-cover">
                <img src="/images/covers/${book.id}.jpg" alt="${book.title}" 
                     onerror="this.src='/images/default-cover.jpg'">
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <div class="book-meta">
                    <span>${book.author}</span>
                    <span>${book.year}</span>
                    <span>${book.format.toUpperCase()}</span>
                    <span>${book.fileSize}</span>
                </div>
                <p class="book-description">${book.description || '暂无简介'}</p>
                <div class="book-actions">
                    ${book.status === '已通过' ? 
                        `<button class="btn-download" onclick="downloadBook(${book.id})">
                            下载
                        </button>` : 
                        `<span class="status ${book.status}">${book.status}</span>`
                    }
                    <button class="btn-favorite" onclick="toggleFavorite(${book.id})">
                        收藏
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderPagination(totalPages, currentPage) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    let html = '';
    if (currentPage > 1) {
        html += `<button onclick="loadBooks(${currentPage - 1})">上一页</button>`;
    }
    
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="loadBooks(${i})">${i}</button>`;
    }
    
    if (currentPage < totalPages) {
        html += `<button onclick="loadBooks(${currentPage + 1})">下一页</button>`;
    }
    
    pagination.innerHTML = html;
}

// 搜索和筛选
const searchBtn = document.getElementById('searchBtn');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');

if (searchBtn) {
    searchBtn.addEventListener('click', () => {
        const searchTerm = document.getElementById('searchInput').value;
        const category = categoryFilter.value;
        const status = statusFilter.value;
        loadBooks(1, category, searchTerm, status);
    });
}

if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
        const searchTerm = document.getElementById('searchInput').value;
        const status = statusFilter.value;
        loadBooks(1, categoryFilter.value, searchTerm, status);
    });
}

if (statusFilter) {
    statusFilter.addEventListener('change', () => {
        const searchTerm = document.getElementById('searchInput').value;
        const category = categoryFilter.value;
        const status = statusFilter.value;
        loadBooks(1, category, searchTerm, status);
    });
}

// 初始加载
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('booksContainer')) {
        loadBooks();
    }
});

// 辅助函数
function showSuccess(message) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.className = 'message success';
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';
        
        // 3秒后隐藏消息
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }
}

function showError(message) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.className = 'message error';
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';
        
        // 3秒后隐藏消息
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }
}

// 添加排序功能
const sortSelect = document.getElementById('sortOption');
if (sortSelect) {
    sortSelect.addEventListener('change', () => {
        const searchTerm = document.getElementById('searchInput').value;
        loadBooks(1, searchTerm, sortSelect.value);
    });
}

function updateTotalCount(total) {
    const totalCount = document.querySelector('.total-count');
    if (totalCount) {
        totalCount.textContent = `找到 ${total} 本相关图书`;
    }
}

// 修改上传请求的配置
function uploadBook(formData) {
    return fetch('/api/upload', {
        method: 'POST',
        // 不要设置 Content-Type，让浏览器自动设置
        // headers: {
        //     'Content-Type': 'multipart/form-data'
        // },
        body: formData
    });
}

// 修改 ISBN 验证函数
function validateISBN(input) {
    const isbn = input.value.trim();
    const isbnTip = document.getElementById('isbnTip');
    const submitButton = document.querySelector('button[type="submit"]');
    
    // 如果为空，允许提交
    if (isbn.length === 0) {
        isbnTip.textContent = '如果是单本图书，建议填写10位或13位ISBN编号';
        isbnTip.className = 'form-tip';
        submitButton.disabled = false;
        return true;
    }
    
    // 移除所有非数字字符和X/x（ISBN-10的校验位可能是X）
    input.value = isbn.replace(/[^\dXx]/g, '').toUpperCase();
    
    // 如果不是10位或13位，显示提示但允许提交
    if (input.value.length !== 10 && input.value.length !== 13) {
        isbnTip.textContent = '当前输入' + input.value.length + '位，建议使用10位或13位ISBN';
        isbnTip.className = 'form-tip warning';
        submitButton.disabled = false;
        return true;
    }
    
    // 验证ISBN格式
    if (input.value.length === 13 && isValidISBN13(input.value)) {
        isbnTip.textContent = 'ISBN-13格式正确';
        isbnTip.className = 'form-tip success';
        submitButton.disabled = false;
        return true;
    } else if (input.value.length === 10 && isValidISBN10(input.value)) {
        isbnTip.textContent = 'ISBN-10格式正确';
        isbnTip.className = 'form-tip success';
        submitButton.disabled = false;
        return true;
    } else if (input.value.length === 10 || input.value.length === 13) {
        isbnTip.textContent = 'ISBN校验位不正确，但仍可提交';
        isbnTip.className = 'form-tip warning';
        submitButton.disabled = false;
        return true;
    }
    
    return true; // 始终返回true，允许提交
}

// 添加 ISBN-10 校验算法
function isValidISBN10(isbn) {
    if (!/^[\dX]{10}$/.test(isbn)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(isbn[i]) * (10 - i);
    }
    
    const lastChar = isbn[9];
    const checkDigit = lastChar === 'X' ? 10 : parseInt(lastChar);
    
    return (sum + checkDigit) % 11 === 0;
}

// ISBN-13校验算法
function isValidISBN13(isbn) {
    if (!/^\d{13}$/.test(isbn)) return false;
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += (i % 2 === 0 ? 1 : 3) * parseInt(isbn[i]);
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(isbn[12]);
} 