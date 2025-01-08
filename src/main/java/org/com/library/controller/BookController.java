package org.com.library.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.com.library.dto.ApiResponse;
import org.com.library.entity.Book;
import org.com.library.entity.User;
import org.com.library.exception.BusinessException;
import org.com.library.service.BookService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;


    @PostMapping("/upload")
    public ResponseEntity<?> uploadBook(
            @RequestParam String title,
            @RequestParam String author,
            @RequestParam String isbn,
            @RequestParam String category,
            @RequestParam MultipartFile file,
            HttpSession session) {
        try {
            User user = (User) session.getAttribute("user");
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "请先登录"));
            }

            // 检查是否是重新提交
            Book existingBook = bookService.findByIsbnAndUploader(isbn, user)
                .orElse(null);
            
            if (existingBook != null && existingBook.getStatus() == Book.Status.未通过) {
                // 如果是重新提交，使用原来的ID
                return ResponseEntity.ok(bookService.resubmitBook(existingBook.getId(), title, author, category, file, user));
            } else {
                // 新上传
                Book book = bookService.uploadBook(title, author, isbn, category, file, user);
                return ResponseEntity.ok(Map.of(
                    "message", "上传成功",
                    "bookId", book.getId()
                ));
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/books/pending")
    public ResponseEntity<?> getPendingBooks(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || !user.isAdmin()) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "无权限访问", null));
        }
        
        List<Book> books = bookService.getPendingBooks();
        return ResponseEntity.ok(new ApiResponse(true, "获取成功", books));
    }

    @PostMapping("/books/{id}/review")
    public ResponseEntity<?> reviewBook(
            @PathVariable Integer id,
            @RequestParam String status,
            @RequestParam(required = false) String reason,
            HttpSession session) {
        
        // 添加调试日志
        System.out.println("接收到审核请求 - id: " + id + ", status: " + status + ", reason: " + reason);
        
        User user = (User) session.getAttribute("user");
        if (user == null || !user.isAdmin()) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "无权限访问", null));
        }

        try {
            // 参数验证
            if (status == null || status.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "审核状态不能为空", null));
            }
            
            if ("未通过".equals(status) && (reason == null || reason.trim().isEmpty())) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "拒绝时必须提供理由", null));
            }

            Book book = bookService.reviewBook(id, status, reason, user);
            String message = status.equals("已通过") ? 
                "图书审核通过" : 
                String.format("图书审核未通过：%s", reason);
            
            return ResponseEntity.ok(new ApiResponse(true, message, book));
        } catch (BusinessException e) {
            System.err.println("审核失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage(), null));
        } catch (Exception e) {
            System.err.println("审核发生异常: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(new ApiResponse(false, "系统错误", null));
        }
    }

    @GetMapping("/books/my-uploads")
    public ResponseEntity<?> getMyUploads(
            HttpSession session,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "4") int size) {
        
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "请先登录", null));
        }
        
        PageRequest pageRequest = PageRequest.of(page, size, 
            Sort.by(Sort.Direction.DESC, "uploadTime"));
        Page<Book> books = bookService.getBooksByUploader(user, pageRequest);
        return ResponseEntity.ok(new ApiResponse(true, "获取成功", books));
    }

    @GetMapping("/books/review-history")
    public ResponseEntity<?> getReviewHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || !user.isAdmin()) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "无权限访问", null));
        }
        
        PageRequest pageRequest = PageRequest.of(page, size, 
            Sort.by(Sort.Direction.DESC, "reviewTime"));
        Page<Book> books = bookService.getReviewHistory(pageRequest);
        return ResponseEntity.ok(new ApiResponse(true, "获取成功", books));
    }

    @GetMapping("/books/search")
    public ResponseEntity<?> searchBooks(
        @RequestParam String query,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
        
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Book> books = bookService.searchApprovedBooks(query, pageRequest);
        return ResponseEntity.ok(new ApiResponse(true, "查询成功", books));
    }

    @GetMapping("/books/{id}/download")
    public ResponseEntity<?> downloadBook(@PathVariable int id, HttpSession session) {
        try {
            User user = (User) session.getAttribute("user");
            if (user == null) {
                return ResponseEntity.status(401)
                    .body(new ApiResponse(false, "请先登录", null));
            }

            Book book = bookService.getBookById(id);
            if (book == null || !book.getStatus().equals(Book.Status.已通过)) {
                return ResponseEntity.status(404)
                    .body(new ApiResponse(false, "图书不存在或未通过审核", null));
            }

            // 记录下载历史
            bookService.recordDownload(user, book);

            // 获取文件路径
            Path filePath = Paths.get(book.getFilePath());
            if (!Files.exists(filePath)) {
                return ResponseEntity.status(404)
                    .body(new ApiResponse(false, "文件不存在", null));
            }

            // 读取文件
            Resource resource = new FileSystemResource(filePath.toFile());
            
            // 构建文件名
            String filename = book.getTitle() + "." + book.getFormat().toString().toLowerCase();
            String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8.toString())
                .replace("+", "%20");

            // 返回文件
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                    "attachment; filename*=UTF-8''" + encodedFilename)
                .body(resource);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                .body(new ApiResponse(false, "下载失败: " + e.getMessage(), null));
        }
    }

    @GetMapping("/downloads")
    public ResponseEntity<?> getDownloadHistory(HttpSession session) {
        try {
            User user = (User) session.getAttribute("user");
            if (user == null) {
                return ResponseEntity.status(401)
                    .body(new ApiResponse(false, "请先登录", null));
            }

            return ResponseEntity.ok(new ApiResponse(true, "获取成功", 
                bookService.getDownloadHistory(user)));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new ApiResponse(false, "获取下载历史失败", null));
        }
    }

    @GetMapping("/books/{id}/preview")
    public ResponseEntity<?> previewBook(@PathVariable int id, HttpSession session) {
        try {
            User user = (User) session.getAttribute("user");
            if (user == null) {
                return ResponseEntity.status(401)
                    .body(new ApiResponse(false, "请先登录", null));
            }

            Book book = bookService.getBookById(id);
            if (book == null || !book.getStatus().equals(Book.Status.已通过)) {
                return ResponseEntity.status(404)
                    .body(new ApiResponse(false, "图书不存在或未通过审核", null));
            }

            // 获取文件路径
            Path filePath = Paths.get(book.getFilePath());
            if (!Files.exists(filePath)) {
                return ResponseEntity.status(404)
                    .body(new ApiResponse(false, "文件不存在", null));
            }

            // 读取文件
            Resource resource = new FileSystemResource(filePath.toFile());
            
            // 根据文件格式返回不同的Content-Type和处理方式
            MediaType mediaType = getMediaType(book.getFormat());
            String disposition = "inline"; // 改为 inline 而不是 attachment
            
            return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                    disposition + "; filename*=UTF-8''" + URLEncoder.encode(book.getTitle() + "." + 
                    book.getFormat().toString().toLowerCase(), StandardCharsets.UTF_8.toString()))
                .body(resource);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                .body(new ApiResponse(false, "预览失败: " + e.getMessage(), null));
        }
    }

    private MediaType getMediaType(Book.Format format) {
        return switch (format) {
            case PDF -> MediaType.APPLICATION_PDF;
            case EPUB -> MediaType.parseMediaType("application/epub+zip");
            case MOBI -> MediaType.parseMediaType("application/x-mobipocket-ebook");
            case TXT -> MediaType.TEXT_PLAIN;
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }
} 