// 加载下载历史
function loadDownloadHistory() {
    fetch('/api/downloads')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tbody = document.getElementById('downloadHistory');
                tbody.innerHTML = data.data.map(download => `
                    <tr>
                        <td>${download.book.title}</td>
                        <td>${download.book.author}</td>
                        <td>${download.book.isbn}</td>
                        <td>${formatDate(download.downloadTime)}</td>
                    </tr>
                `).join('');
            } else {
                showError('加载失败：' + data.message);
            }
        })
        .catch(error => {
            console.error('加载下载历史失败:', error);
            showError('加载失败，请稍后重试');
        });
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 显示错误信息
function showError(message) {
    const tbody = document.getElementById('downloadHistory');
    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="error-message">${message}</td>
        </tr>
    `;
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', loadDownloadHistory); 