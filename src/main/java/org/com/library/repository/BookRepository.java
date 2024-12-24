package org.com.library.repository;

import org.com.library.entity.Book;
import org.com.library.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BookRepository extends JpaRepository<Book, Integer> {

    // 根据状态查找图书
    List<Book> findByStatus(Book.Status status);

    // 搜索图书的方法
    @Query("SELECT b FROM Book b WHERE " +
           "(:title is null OR b.title LIKE %:title%) AND " +
           "(:author is null OR b.author LIKE %:author%) AND " +
           "(:category is null OR b.category = :category) AND " +
           "(:status is null OR b.status = :status)")
    Page<Book> findBooks(@Param("title") String title,
                        @Param("author") String author,
                        @Param("category") String category,
                        @Param("status") String status,
                        Pageable pageable);

    // 检查ISBN是否已存在
    boolean existsByIsbn(String isbn);

    // 查询用户上传的图书
    List<Book> findByUploaderOrderByUploadTimeDesc(User uploader);
} 