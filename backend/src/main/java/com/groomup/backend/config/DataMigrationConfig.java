package com.groomup.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DataMigrationConfig {

    private static final Logger log = LoggerFactory.getLogger(DataMigrationConfig.class);

    @Bean
    public CommandLineRunner migrateLegacyData(JdbcTemplate jdbcTemplate) {
        return args -> {
            log.info("Starting automatic legacy data migration...");
            try {
                // Fix NULL versions which cause OptimisticLockingFailureException
                int productVersionsFixed = jdbcTemplate.update(
                    "UPDATE products SET version = 0 WHERE version IS NULL"
                );
                log.info("Fixed {} products with NULL version", productVersionsFixed);

                // Fix NULL timestamps
                int productTimestampsFixed = jdbcTemplate.update(
                    "UPDATE products SET created_at = NOW(), updated_at = NOW() WHERE created_at IS NULL"
                );
                log.info("Fixed {} products with NULL timestamps", productTimestampsFixed);

                // Fix NULL timestamps in all tables
                String[] tables = {"products", "orders", "order_items", "users", "payments", "carts", "cart_items"};
                for (String table : tables) {
                    try {
                        int fixed = jdbcTemplate.update(
                            "UPDATE " + table + " SET created_at = NOW(), updated_at = NOW() WHERE created_at IS NULL"
                        );
                        if (fixed > 0) {
                            log.info("Fixed {} records with NULL timestamps in table: {}", fixed, table);
                        }
                    } catch (Exception e) {
                        log.warn("Could not migrate table {}: {}", table, e.getMessage());
                    }
                }

                log.info("Legacy data migration completed successfully.");
            } catch (Exception e) {
                log.error("Error during legacy data migration: {}", e.getMessage());
            }
        };
    }
}
