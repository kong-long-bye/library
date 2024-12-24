// 加载用户上传的图书列表
function loadMyUploads() {
    fetch('/api/books/my-uploads')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tbody = document.getElementById('myUploads');
                tbody.innerHTML = data.data.map(book => `
                    <tr>
                        <td>${book.title}</td>
                        <td>${book.author}</td>
                        <td>${new Date(book.uploadTime).toLocaleString()}</td>
                        <td>
                            <span class="status-${book.status.toLowerCase()}">${book.status}</span>
                        </td>
                    </tr>
                `).join('');
            }
        })
        .catch(error => console.error('加载上传列表失败:', error));
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', loadMyUploads); 