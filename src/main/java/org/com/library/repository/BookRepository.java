package org.com.library.repository;

import org.com.library.entity.Book;
import org.com.library.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
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
    Page<Book> findByUploaderOrderByUploadTimeDesc(User uploader, Pageable pageable);

    // 根据状态查找图书并按审核时间倒序排序
    List<Book> findByStatusInOrderByReviewTimeDesc(List<Book.Status> statuses);

    // 根据ID和状态更新图书
    @Modifying
    @Query("UPDATE Book b SET b.status = :status, b.reviewTime = :reviewTime, " +
           "b.reviewer = :reviewer, b.reviewComment = :reviewComment WHERE b.id = :id")
    void updateBookStatus(@Param("id") Integer id, 
                         @Param("status") Book.Status status, 
                         @Param("reviewTime") LocalDateTime reviewTime,
                         @Param("reviewer") User reviewer,
                         @Param("reviewComment") String reviewComment);

    // 通过ISBN精确查找已通过审核的图书
    @Query("SELECT b FROM Book b WHERE b.isbn = :isbn AND b.status = '已通过'")
    Optional<Book> findApprovedByIsbn(@Param("isbn") String isbn);
    
    // 通过书名或作者模糊搜索已通过审核的图书
    @Query("SELECT b FROM Book b WHERE " +
           "b.status = '已通过' AND " +
           "(:query IS NULL OR b.title LIKE %:query% OR b.author LIKE %:query%)")
    Page<Book> searchApprovedBooks(
            @Param("query") String query,
            Pageable pageable);

    // 根据ISBN和上传者查找图书
    Optional<Book> findByIsbnAndUploader(String isbn, User uploader);
} 