package org.com.library.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "library.upload")
public class UploadConfig {
    private String basePath;
    private String bookPath;
    private String maxFileSize;
} 