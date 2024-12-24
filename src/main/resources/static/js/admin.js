// 加载待审核图书列表
function loadPendingBooks() {
    fetch('/api/books/pending')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tbody = document.getElementById('reviewBooks');
                tbody.innerHTML = data.data.map(book => `
                    <tr>
                        <td>${book.title}</td>
                        <td>${book.author}</td>
                        <td>${book.isbn}</td>
                        <td>${book.category}</td>
                        <td class="uploader-name">${book.uploader.username}</td>
                        <td class="upload-time">${formatDate(book.uploadTime)}</td>
                        <td>
                            <button onclick="reviewBook(${book.id}, '已通过')" class="btn-approve">通过</button>
                            <button onclick="reviewBook(${book.id}, '未通过')" class="btn-reject">拒绝</button>
                        </td>
                    </tr>
                `).join('');
            }
        })
        .catch(error => console.error('加载待审核列表失败:', error));
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

// 审核图书
function reviewBook(bookId, status) {
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
            loadPendingBooks(); // 刷新列表
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('审核失败:', error));
}

// 页面加载时执行，并每分钟刷新一次
document.addEventListener('DOMContentLoaded', () => {
    loadPendingBooks();
    setInterval(loadPendingBooks, 60000);
}); 