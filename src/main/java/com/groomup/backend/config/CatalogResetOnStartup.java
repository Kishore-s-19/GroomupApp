package com.groomup.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

@Component
@Order(0)
@ConditionalOnProperty(name = "app.catalog.reset-on-start", havingValue = "true", matchIfMissing = false)
public class CatalogResetOnStartup implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public CatalogResetOnStartup(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        Path marker = Path.of(".catalog_reset_done");
        if (Files.exists(marker)) {
            return;
        }

        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS=0");
        jdbcTemplate.execute("TRUNCATE TABLE cart_items");
        jdbcTemplate.execute("TRUNCATE TABLE carts");
        jdbcTemplate.execute("TRUNCATE TABLE products");
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS=1");

        Files.writeString(marker, "done", StandardCharsets.UTF_8);
    }
}

