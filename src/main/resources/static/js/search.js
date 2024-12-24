document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    // 搜索按钮点击事件
    searchBtn.addEventListener('click', () => {
        handleSearch();
    });

    // 回车键搜索
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    function handleSearch() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            window.location.href = `/books?search=${encodeURIComponent(searchTerm)}`;
        }
    }
}); 