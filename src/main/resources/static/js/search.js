let currentPage = 0;
const pageSize = 10;

document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    // 搜索按钮点击事件
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (!query) {
            alert('请输入搜索内容');
            return;
        }
        performSearch();
    });

    // 回车键搜索
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (!query) {
                alert('请输入搜索内容');
                return;
            }
            performSearch();
        }
    });
});

function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
    
    const searchResults = document.getElementById('searchResults');
    searchResults.style.display = 'block';
    
    // 添加调试日志
    console.log('发送搜索请求:', `/api/books/search?query=${encodeURIComponent(query)}&page=${currentPage}&size=${pageSize}`);
    
    const resultsBody = document.getElementById('resultsBody');
    resultsBody.innerHTML = '<tr><td colspan="6" class="loading">搜索中...</td></tr>';
    
    fetch(`/api/books/search?query=${encodeURIComponent(query)}&page=${currentPage}&size=${pageSize}`)
        .then(response => {
            // 添加调试日志
            console.log('响应状态:', response.status);
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    window.location.href = '/login';
                    return;
                }
                throw new Error('搜索失败');
            }
            return response.json();
        })
        .then(data => {
            // 添加调试日志
            console.log('响应数据:', data);
            if (data.success) {
                displayResults(data.data);
            } else {
                showError(data.message || '搜索失败');
            }
        })
        .catch(error => {
            console.error('搜索失败:', error);
            showError('搜索失败，请稍后重试');
        });
}

function displayResults(pageData) {
    const resultCount = document.getElementById('resultCount');
    const resultsBody = document.getElementById('resultsBody');
    
    resultCount.textContent = `找到 ${pageData.totalElements} 条结果`;
    
    if (!pageData.content || pageData.content.length === 0) {
        resultsBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-results">未找到相关图书</td>
            </tr>
        `;
        return;
    }
    
    resultsBody.innerHTML = pageData.content.map(book => `
        <tr>
            <td>${book.title || ''}</td>
            <td>${book.author || ''}</td>
            <td>${book.isbn || ''}</td>
            <td>${formatDate(book.uploadTime) || ''}</td>
            <td>${book.uploader ? book.uploader.username : ''}</td>
            <td class="actions">
                <button onclick="previewBook(${book.id})" class="btn-action btn-preview">在线阅读</button>
                <button onclick="downloadBook(${book.id})" class="btn-action btn-download">下载</button>
            </td>
        </tr>
    `).join('');
    
    updatePagination(pageData);
}

function updatePagination(pageData) {
    const pagination = document.getElementById('pagination');
    const totalPages = pageData.totalPages;
    
    let html = '';
    
    if (currentPage > 0) {
        html += `<button onclick="changePage(${currentPage - 1})">上一页</button>`;
    }
    
    for (let i = 0; i < totalPages; i++) {
        if (i === currentPage) {
            html += `<button class="active">${i + 1}</button>`;
        } else {
            html += `<button onclick="changePage(${i})">${i + 1}</button>`;
        }
    }
    
    if (currentPage < totalPages - 1) {
        html += `<button onclick="changePage(${currentPage + 1})">下一页</button>`;
    }
    
    pagination.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    performSearch();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function viewBookDetail(bookId) {
    window.location.href = `/books/${bookId}`;
}

function showError(message) {
    const resultsBody = document.getElementById('resultsBody');
    resultsBody.innerHTML = `
        <tr>
            <td colspan="6" class="error-message">${message}</td>
        </tr>
    `;
}

// 添加下载功能
async function downloadBook(bookId) {
    try {
        const response = await fetch(`/api/books/${bookId}/download`);
        if (!response.ok) {
            throw new Error('下载失败');
        }
        
        // 获取文件名
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'download';
        if (contentDisposition) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }
        
        // 创建blob并下载
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('下载失败:', error);
        showError('下载失败，请稍后重试');
    }
}


// 添加预览功能
function previewBook(bookId) {
    // 跳转到预览页面而不是直接打开文件
    window.open(`/books/${bookId}/read`, '_blank');
} 