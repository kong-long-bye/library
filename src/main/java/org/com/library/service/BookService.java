package org.com.library.service;

import lombok.RequiredArgsConstructor;
import org.com.library.entity.Book;
import org.com.library.entity.User;
import org.com.library.entity.Download;
import org.com.library.exception.BusinessException;
import org.com.library.repository.BookRepository;
import org.com.library.repository.DownloadRepository;
import org.com.library.config.UploadConfig;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Arrays;
import java.util.Collections;
import java.io.File;
import java.util.Optional;


@Service
@RequiredArgsConstructor
public class BookService {

    @Autowired
    private BookRepository bookRepository;
    
    @Value("${library.upload.book-path}")
    private String uploadPath;

    @Value("${upload.max-file-size:200MB}")
    private String maxFileSize;

    @Autowired
    private DownloadRepository downloadRepository;



    // 上传图书
    @Transactional
    public Book uploadBook(String title, String author, String isbn, 
                         String category, MultipartFile file,
                         User uploader) throws BusinessException {
        // ISBN验证（如果提供了ISBN）
        if (isbn != null && !isbn.trim().isEmpty()) {
            isbn = isbn.trim().toUpperCase();
            // 移除所有非数字和X字符
            isbn = isbn.replaceAll("[^0-9X]", "");
            
            // 检查是否已存在
            if (bookRepository.existsByIsbn(isbn)) {
                throw new BusinessException("该ISBN已存在");
            }
        }

        // 验证文件大小
        long maxSize = parseSize(maxFileSize);
        if (file.getSize() > maxSize) {
            throw new BusinessException("文件大小超过限制");
        }

        // 验证文件格式
        String originalFilename = file.getOriginalFilename();
        String format = getFileFormat(originalFilename);
        if (!isValidFormat(format)) {
            throw new BusinessException("不支持的文件格式");
        }

        // 将文件格式转换为枚举
        Book.Format bookFormat;
        try {
            bookFormat = Book.Format.valueOf(format.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("不支持的文件格式");
        }

        String fileName = UUID.randomUUID().toString() + "." + format;
        String tempPath = uploadPath + "/temp/" + fileName;
        String finalPath = uploadPath + "/books/" + fileName;

        try {
            // 创建必要的目录
            Files.createDirectories(Paths.get(uploadPath + "/temp"));
            Files.createDirectories(Paths.get(uploadPath + "/books"));

            // 先保存到临时目录
            Files.copy(file.getInputStream(), Paths.get(tempPath));

            Book book = new Book();
            book.setTitle(title);
            book.setAuthor(author);
            book.setIsbn(isbn);
            book.setCategory(category);
            book.setFormat(bookFormat);  // 设置文件格式
            book.setFilePath(tempPath);
            book.setUploader(uploader);
            
            // 如果是管理员上传，直接通过审核并移动到正式目录
            if (uploader.isAdmin()) {
                book.setStatus(Book.Status.已通过);
                Files.move(Paths.get(tempPath), Paths.get(finalPath));
                book.setFilePath(finalPath);
            } else {
                book.setStatus(Book.Status.待审核);
            }

            return bookRepository.save(book);
        } catch (IOException e) {
            throw new BusinessException("文件保存失败");
        }
    }

    // 解析文件大小配置
    private long parseSize(String size) {
        size = size.toUpperCase();
        long multiplier = 1;
        if (size.endsWith("KB")) {
            multiplier = 1024;
        } else if (size.endsWith("MB")) {
            multiplier = 1024 * 1024;
        } else if (size.endsWith("GB")) {
            multiplier = 1024 * 1024 * 1024;
        }
        String number = size.replaceAll("[^\\d.]", "");
        return (long) (Double.parseDouble(number) * multiplier);
    }

    // 审核图书
    @Transactional
    public Book reviewBook(Integer bookId, String status, String reason, User reviewer) throws BusinessException {
        if (!reviewer.isAdmin()) {
            throw new BusinessException("无权限进行审核");
        }

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BusinessException("图书不存在"));

        try {
            Book.Status newStatus;
            switch (status) {
                case "已通过":
                    newStatus = Book.Status.已通过;
                    book.setReviewComment(null);  // 通过时清空审核意见
                    break;
                case "未通过":
                    newStatus = Book.Status.未通过;
                    if (reason == null || reason.trim().isEmpty()) {
                        throw new BusinessException("拒绝时必须提供理由");
                    }
                    book.setReviewComment(reason.trim());  // 设置审核意见
                    break;
                default:
                    throw new BusinessException("无效的审核状态");
            }

            LocalDateTime now = LocalDateTime.now();
            book.setStatus(newStatus);
            book.setReviewTime(now);
            book.setReviewer(reviewer);

            if (newStatus == Book.Status.已通过) {
                // 移动文件到正式目录
                String fileName = Paths.get(book.getFilePath()).getFileName().toString();
                String finalPath = uploadPath + "/books/" + fileName;
                Files.move(Paths.get(book.getFilePath()), Paths.get(finalPath));
                book.setFilePath(finalPath);
            } else if (newStatus == Book.Status.未通过) {
                // 删除临时文件
                Files.deleteIfExists(Paths.get(book.getFilePath()));
            }

            // 保存更新到数据库
            Book updatedBook = bookRepository.save(book);
            
            // 发送通知给上传者
            notifyUploader(updatedBook);
            
            return updatedBook;
        } catch (IOException e) {
            throw new BusinessException("文件处理失败: " + e.getMessage());
        }
    }

    public Page<Book> searchBooks(String title, String author, String category, 
                                String status, Pageable pageable) {
        return bookRepository.findBooks(title, author, category, status, pageable);
    }

    private String getFileFormat(String filename) {
        if (filename == null) return "";
        int lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex > 0 ? filename.substring(lastDotIndex + 1).toLowerCase() : "";
    }

    private boolean isValidFormat(String format) {
        try {
            Book.Format.valueOf(format.toUpperCase());
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    // 获取待审核的图书列表
    public List<Book> getPendingBooks() {
        return bookRepository.findByStatus(Book.Status.待审核);
    }

    // 获取用户上传的图书列表（分页）
    public Page<Book> getBooksByUploader(User uploader, Pageable pageable) {
        return bookRepository.findByUploaderOrderByUploadTimeDesc(uploader, pageable);
    }

    // 获取审核历史
    public Page<Book> getReviewHistory(Pageable pageable) {
        return bookRepository.findByStatusInOrderByReviewTimeDesc(
            Arrays.asList(Book.Status.已通过, Book.Status.未通过),
            pageable
        );
    }

    // 通知上传者
    private void notifyUploader(Book book) {
        String message = String.format("您上传的图书《%s》已%s", 
            book.getTitle(), 
            book.getStatus().toString()
        );
        
        if (book.getStatus() == Book.Status.未通过 && book.getReviewComment() != null) {
            message += String.format("\n不通过原因：%s", book.getReviewComment());
        }
        
        // TODO: 实现实际的通知逻辑，比如发送系统消息或邮件
        System.out.println("通知上传者: " + book.getUploader().getUsername() + " - " + message);
    }

    // 通过ISBN查找已通过审核的图书
    public Book findApprovedBookByIsbn(String isbn) {
        return bookRepository.findApprovedByIsbn(isbn)
                .orElseThrow(() -> new BusinessException("未找到对应的图书"));
    }

    // 搜索已通过审核的图书
    public Page<Book> searchApprovedBooks(String query, Pageable pageable) {
        return bookRepository.searchApprovedBooks(query, pageable);
    }

    // 获取图书详情
    public Book getBookById(int id) throws BusinessException {
        return bookRepository.findById(id)
            .orElseThrow(() -> new BusinessException("图书不存在"));
    }

    // 记录下载历史
    @Transactional
    public void recordDownload(User user, Book book) {
        Download download = new Download();
        download.setUser(user);
        download.setBook(book);
        downloadRepository.save(download);
    }

    // 获取用户的下载历史
    public List<Download> getDownloadHistory(User user) {
        return downloadRepository.findByUserOrderByDownloadTimeDesc(user);
    }

    // 根据ISBN和上传者查找图书
    public Optional<Book> findByIsbnAndUploader(String isbn, User uploader) {
        return bookRepository.findByIsbnAndUploader(isbn, uploader);
    }

    // 重新提交图书
    @Transactional
    public Book resubmitBook(Integer bookId, String title, String author, String category, 
                           MultipartFile file, User uploader) throws BusinessException {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BusinessException("图书不存在"));

        // 验证是否是同一个用户的重新提交
        if (!book.getUploader().getId().equals(uploader.getId())) {
            throw new BusinessException("无权重新提交此图书");
        }

        // 验证图书状态
        if (book.getStatus() != Book.Status.未通过) {
            throw new BusinessException("只能重新提交未通过的图书");
        }

        try {
            // 更新图书信息
            book.setTitle(title);
            book.setAuthor(author);
            book.setCategory(category);
            
            // 处理新文件
            String format = getFileFormat(file.getOriginalFilename());
            if (!isValidFormat(format)) {
                throw new BusinessException("不支持的文件格式");
            }

            // 保存新文件
            String fileName = UUID.randomUUID().toString() + "." + format;
            String tempPath = uploadPath + "/temp/" + fileName;
            Files.createDirectories(Paths.get(uploadPath + "/temp"));
            Files.copy(file.getInputStream(), Paths.get(tempPath));

            // 删除旧文件
            if (book.getFilePath() != null) {
                Files.deleteIfExists(Paths.get(book.getFilePath()));
            }

            // 更新文件路径和状态
            book.setFilePath(tempPath);
            book.setFormat(Book.Format.valueOf(format.toUpperCase()));
            book.setStatus(Book.Status.待审核);
            book.setReviewComment(null);  // 清除之前的审核意见
            book.setReviewTime(null);     // 清除之前的审核时间
            book.setReviewer(null);       // 清除之前的审核人

            return bookRepository.save(book);
        } catch (IOException e) {
            throw new BusinessException("文件处理失败: " + e.getMessage());
        }
    }

    // 添加 ISBN-13 校验方法
    private boolean isValidISBN13(String isbn) {
        try {
            int sum = 0;
            for (int i = 0; i < 12; i++) {
                sum += (i % 2 == 0 ? 1 : 3) * Character.getNumericValue(isbn.charAt(i));
            }
            int checkDigit = (10 - (sum % 10)) % 10;
            return checkDigit == Character.getNumericValue(isbn.charAt(12));
        } catch (Exception e) {
            return false;
        }
    }
} 