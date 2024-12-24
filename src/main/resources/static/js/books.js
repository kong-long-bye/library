// 文件上传处理
const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('title', document.getElementById('title').value);
        formData.append('author', document.getElementById('author').value);
        formData.append('isbn', document.getElementById('isbn').value);
        formData.append('category', document.getElementById('category').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('file', document.getElementById('file').files[0]);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (response.ok) {
                showSuccess('上传成功！等待管理员审核...');
                setTimeout(() => {
                    window.location.href = '/books';
                }, 2000);
            } else {
                showError(data.message || '上传失败');
            }
        } catch (error) {
            showError('网络错误，请稍后重试');
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
        messageDiv.className = 'success';
        messageDiv.textContent = message;
    }
}

function showError(message) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.className = 'error';
        messageDiv.textContent = message;
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