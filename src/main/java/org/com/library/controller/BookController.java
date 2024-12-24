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

            Book book = bookService.uploadBook(title, author, isbn, category, file, user);
            return ResponseEntity.ok(Map.of(
                "message", "上传成功",
                "bookId", book.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/books")
    public ResponseEntity<?> searchBooks(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "uploadTime") String sort,
            @RequestParam(defaultValue = "desc") String direction) {
        try {
            Sort.Direction sortDirection = Sort.Direction.fromString(direction);
            PageRequest pageRequest = PageRequest.of(page, size, Sort.by(sortDirection, sort));
            
            Page<Book> books = bookService.searchBooks(title, author, category, status, pageRequest);
            return ResponseEntity.ok(books);
        } catch (Exception e) {
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

    @PostMapping("/{id}/review")
    public ResponseEntity<?> reviewBook(@PathVariable Integer id, 
                                      @RequestParam String status,
                                      HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || !user.isAdmin()) {
            return ResponseEntity.status(403).body(new ApiResponse(false, "无权限访问", null));
        }

        try {
            Book book = bookService.reviewBook(id, status, user);
            return ResponseEntity.ok(new ApiResponse(true, "审核完成", book));
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
} 