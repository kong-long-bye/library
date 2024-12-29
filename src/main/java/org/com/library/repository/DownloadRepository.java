package org.com.library.repository;

import org.com.library.entity.Download;
import org.com.library.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DownloadRepository extends JpaRepository<Download, Integer> {
    List<Download> findByUserOrderByDownloadTimeDesc(User user);
} 