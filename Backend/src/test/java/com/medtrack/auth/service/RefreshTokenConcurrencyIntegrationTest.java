package com.medtrack.auth.service;

import com.medtrack.auth.model.RefreshToken;
import com.medtrack.auth.repository.RefreshTokenRepository;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringJUnitConfig(RefreshTokenConcurrencyIntegrationTest.TestConfig.class)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class RefreshTokenConcurrencyIntegrationTest {

    private static final long USER_ID = 42L;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    private ExecutorService executor;

    @BeforeEach
    void setUp() {
        executor = Executors.newFixedThreadPool(2);
    }

    @AfterEach
    void tearDown() throws InterruptedException {
        executor.shutdownNow();
        assertTrue(executor.awaitTermination(5, TimeUnit.SECONDS));
        refreshTokenRepository.deleteAll();
    }

    @RepeatedTest(5)
    void concurrentConsumption_AllowsExactlyOneRequest() throws Exception {
        RefreshToken token = persistActiveToken();
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        Callable<ConsumptionResult> attempt = () -> {
            ready.countDown();
            assertTrue(start.await(5, TimeUnit.SECONDS));
            try {
                RefreshToken consumed = refreshTokenService.consumeToken(token.getToken());
                return ConsumptionResult.success(consumed.getId());
            } catch (BadCredentialsException exception) {
                return ConsumptionResult.rejected(exception.getMessage());
            }
        };

        Future<ConsumptionResult> first = executor.submit(attempt);
        Future<ConsumptionResult> second = executor.submit(attempt);
        assertTrue(ready.await(5, TimeUnit.SECONDS));
        start.countDown();

        List<ConsumptionResult> results = List.of(
                first.get(5, TimeUnit.SECONDS),
                second.get(5, TimeUnit.SECONDS));

        assertEquals(1, results.stream().filter(ConsumptionResult::consumed).count());
        assertEquals(1, results.stream().filter(result -> !result.consumed()).count());
        assertTrue(results.stream()
                .filter(result -> !result.consumed())
                .allMatch(result -> result.message().contains("revoked")));

        RefreshToken persisted = refreshTokenRepository.findByToken(token.getToken()).orElseThrow();
        assertTrue(persisted.isRevoked());
    }

    @Test
    void consumeToken_CommitsRevocationAtTransactionBoundary() {
        RefreshToken token = persistActiveToken();

        RefreshToken consumed = refreshTokenService.consumeToken(token.getToken());

        assertEquals(token.getId(), consumed.getId());
        assertTrue(refreshTokenRepository.findById(token.getId()).orElseThrow().isRevoked());
    }

    @Test
    void consumeToken_RollsBackRevocationWhenRotationFails() {
        RefreshToken token = persistActiveToken();
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);

        IllegalStateException failure = assertThrows(IllegalStateException.class, () ->
                transaction.executeWithoutResult(status -> {
                    RefreshToken consumed = refreshTokenService.consumeToken(token.getToken());
                    assertTrue(consumed.isRevoked());
                    throw new IllegalStateException("replacement token persistence failed");
                }));

        assertEquals("replacement token persistence failed", failure.getMessage());
        RefreshToken persisted = refreshTokenRepository.findById(token.getId()).orElseThrow();
        assertFalse(persisted.isRevoked());
    }

    @Test
    void consumeToken_RejectsExpiredRecordWithoutMutatingIt() {
        RefreshToken token = persistToken(LocalDateTime.now().minusMinutes(1));

        BadCredentialsException failure = assertThrows(
                BadCredentialsException.class,
                () -> refreshTokenService.consumeToken(token.getToken()));

        assertEquals("Refresh token has expired. Please log in again.", failure.getMessage());
        RefreshToken persisted = refreshTokenRepository.findById(token.getId()).orElseThrow();
        assertFalse(persisted.isRevoked());
    }

    @Test
    void consumeToken_RejectsUnknownValueWithoutCreatingRecord() {
        long countBefore = refreshTokenRepository.count();

        BadCredentialsException failure = assertThrows(
                BadCredentialsException.class,
                () -> refreshTokenService.consumeToken(UUID.randomUUID().toString()));

        assertEquals("Invalid refresh token", failure.getMessage());
        assertEquals(countBefore, refreshTokenRepository.count());
    }

    private RefreshToken persistActiveToken() {
        return persistToken(LocalDateTime.now().plusDays(1));
    }

    private RefreshToken persistToken(LocalDateTime expiryDate) {
        RefreshToken token = RefreshToken.builder()
                .userId(USER_ID)
                .token(UUID.randomUUID().toString())
                .expiryDate(expiryDate)
                .revoked(false)
                .build();
        RefreshToken saved = refreshTokenRepository.saveAndFlush(token);
        assertNotNull(saved.getId());
        return saved;
    }

    private record ConsumptionResult(boolean consumed, Long tokenId, String message) {

        private static ConsumptionResult success(Long tokenId) {
            return new ConsumptionResult(true, tokenId, null);
        }

        private static ConsumptionResult rejected(String message) {
            return new ConsumptionResult(false, null, message);
        }
    }

    @Configuration
    @EnableTransactionManagement
    @EnableJpaRepositories(basePackageClasses = RefreshTokenRepository.class)
    static class TestConfig {

        @Bean
        DataSource dataSource() {
            return new EmbeddedDatabaseBuilder()
                    .setType(EmbeddedDatabaseType.H2)
                    .generateUniqueName(true)
                    .build();
        }

        @Bean
        LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
            LocalContainerEntityManagerFactoryBean factory =
                    new LocalContainerEntityManagerFactoryBean();
            factory.setDataSource(dataSource);
            factory.setPackagesToScan(RefreshToken.class.getPackageName());
            factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
            factory.setJpaPropertyMap(Map.of("hibernate.hbm2ddl.auto", "create-drop"));
            return factory;
        }

        @Bean
        PlatformTransactionManager transactionManager(EntityManagerFactory entityManagerFactory) {
            return new JpaTransactionManager(entityManagerFactory);
        }

        @Bean
        RefreshTokenService refreshTokenService(RefreshTokenRepository repository) {
            return new RefreshTokenService(repository);
        }
    }
}
