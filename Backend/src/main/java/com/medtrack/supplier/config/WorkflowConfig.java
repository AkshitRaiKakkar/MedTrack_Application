package com.medtrack.supplier.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.supplier.workflow")
@Data
public class WorkflowConfig {
    private int maxRetries = 5;
    private long retryBackoffMillis = 60000; // 1 minute
    private long schedulerCronInterval = 60000; // default interval for scheduler
    private boolean recoveryEnabled = true;
}
