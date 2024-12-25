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

            System.out.println("接收到上传请求 - 文件大小: " + file.getSize());

            Book book = bookService.uploadBook(title, author, isbn, category, file, user);
            return ResponseEntity.ok(Map.of(
                "message", "上传成功",
                "bookId", book.getId()
            ));
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
    public ResponseEntity<?> reviewBook(@PathVariable Integer id, 
                                      @RequestParam String status,
                                      HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || !user.isAdmin()) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "无权限访问", null));
        }

        try {
            Book book = bookService.reviewBook(id, status, user);
            String message = status.equals("已通过") ? "图书审核通过" : "图书审核未通过";
            return ResponseEntity.ok(new ApiResponse(true, message, book));
        } catch (BusinessException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage(), null));
        }
    }

    @GetMapping("/books/my-uploads")
    public ResponseEntity<?> getMyUploads(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "请先登录", null));
        }
        
        List<Book> books = bookService.getBooksByUploader(user);
        return ResponseEntity.ok(new ApiResponse(true, "获取成功", books));
    }

    @GetMapping("/books/review-history")
    public ResponseEntity<?> getReviewHistory(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || !user.isAdmin()) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "无权限访问", null));
        }
        
        List<Book> books = bookService.getReviewHistory();
        return ResponseEntity.ok(new ApiResponse(true, "获取成功", books));
    }

    @GetMapping("/books/search")
    public ResponseEntity<?> searchBooks(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        System.out.println("接收到搜索请求 - query: " + query + ", page: " + page + ", size: " + size);
        
        try {
            PageRequest pageRequest = PageRequest.of(page, size, 
                Sort.by(Sort.Direction.DESC, "uploadTime"));
            
            Page<Book> books = bookService.searchApprovedBooks(query, pageRequest);
            
            System.out.println("搜索结果数量: " + books.getTotalElements());
            
            return ResponseEntity.ok(new ApiResponse(true, "搜索成功", books));
        } catch (BusinessException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
} 