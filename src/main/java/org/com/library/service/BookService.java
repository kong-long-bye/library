package org.com.library.service;

import lombok.RequiredArgsConstructor;
import org.com.library.entity.Book;
import org.com.library.entity.User;
import org.com.library.exception.BusinessException;
import org.com.library.repository.BookRepository;
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


@Service
@RequiredArgsConstructor
public class BookService {

    @Autowired
    private BookRepository bookRepository;
    
    @Value("${library.upload.book-path}")
    private String uploadPath;

    @Value("${upload.max-file-size:50MB}")
    private String maxFileSize;



    // 上传图书
    @Transactional
    public Book uploadBook(String title, String author, String isbn, 
                         String category, MultipartFile file,
                         User uploader) throws BusinessException {
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

    // 解析文件大小配置（如：50MB -> 52428800）
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
    public Book reviewBook(Integer bookId, String status, User reviewer) throws BusinessException {
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
                    break;
                case "未通过":
                    newStatus = Book.Status.未通过;
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

            // 使用更新方法
            bookRepository.updateBookStatus(bookId, newStatus, now, reviewer);
            
            // 发送通知给上传者（如果需要）
            notifyUploader(book, newStatus);
            
            return bookRepository.findById(bookId).orElseThrow(() -> new BusinessException("图书不存在"));
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

    // 获取用户上传的图书列表
    public List<Book> getBooksByUploader(User uploader) {
        return bookRepository.findByUploaderOrderByUploadTimeDesc(uploader);
    }

    // 获取审核历史
    public List<Book> getReviewHistory() {
        return bookRepository.findByStatusInOrderByReviewTimeDesc(
            Arrays.asList(Book.Status.已通过, Book.Status.未通过)
        );
    }

    // 通知上传者（可选功能）
    private void notifyUploader(Book book, Book.Status status) {
        // TODO: 实现通知逻辑，比如发送系统消息或邮件
        System.out.println("通知上传者 " + book.getUploader().getUsername() + 
                         " 图书《" + book.getTitle() + "》审核" + status);
    }

    // 通过ISBN查找已通过审核的图书
    public Book findApprovedBookByIsbn(String isbn) {
        return bookRepository.findApprovedByIsbn(isbn)
                .orElseThrow(() -> new BusinessException("未找到对应的图书"));
    }

    // 搜索已通过审核的图书
    public Page<Book> searchApprovedBooks(String query, Pageable pageable) {
        // 如果提供了ISBN，优先使用ISBN搜索
        if (query != null && query.matches("\\d{13}")) {
            try {
                Book book = findApprovedBookByIsbn(query);
                List<Book> books = Collections.singletonList(book);
                return new PageImpl<>(books, pageable, 1);
            } catch (BusinessException e) {
                // ISBN未找到，继续使用其他条件搜索
            }
        }
        
        return bookRepository.searchApprovedBooks(query, pageable);
    }

    // 获取图书详情
    public Book getBookById(int id) throws BusinessException {
        return bookRepository.findById(id)
            .orElseThrow(() -> new BusinessException("图书不存在"));
    }
} 