package com.groomup.backend.config;

import com.groomup.backend.service.ProductCatalogService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.seed-products-on-start", havingValue = "true", matchIfMissing = false)
public class ProductDataSeeder implements CommandLineRunner {

    private final ProductCatalogService productCatalogService;

    public ProductDataSeeder(ProductCatalogService productCatalogService) {
        this.productCatalogService = productCatalogService;
    }

    @Override
    public void run(String... args) throws Exception {
        productCatalogService.seedFromDataJs(true);
    }
}
