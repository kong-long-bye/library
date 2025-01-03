package org.com.library.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "books")
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = true)
    private String isbn;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    @ManyToOne
    @JoinColumn(name = "uploader_id", nullable = false)
    private User uploader;

    @Column(nullable = false)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Format format;

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "upload_time")
    private LocalDateTime uploadTime = LocalDateTime.now();

    @Column(name = "review_time", columnDefinition = "DATETIME")
    private LocalDateTime reviewTime;

    @ManyToOne
    @JoinColumn(name = "reviewer_id", columnDefinition = "INT")
    private User reviewer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.待审核;

    @Column(name = "review_comment", length = 500)
    private String reviewComment;

    public enum Format {
        PDF, EPUB, MOBI, TXT
    }

    public enum Status {
        待审核, 已通过, 未通过
    }
} 