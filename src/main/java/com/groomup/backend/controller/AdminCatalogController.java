package com.groomup.backend.controller;

import com.groomup.backend.dto.CatalogSeedResult;
import com.groomup.backend.service.ProductCatalogService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/catalog")
public class AdminCatalogController {

    private final ProductCatalogService productCatalogService;

    public AdminCatalogController(ProductCatalogService productCatalogService) {
        this.productCatalogService = productCatalogService;
    }

    @PostMapping("/seed")
    public CatalogSeedResult seed(@RequestParam(defaultValue = "true") boolean onlyIfEmpty) throws Exception {
        return productCatalogService.seedFromDataJs(onlyIfEmpty);
    }

    @PostMapping("/dedupe")
    public int dedupe() {
        return productCatalogService.dedupeNullSourceId();
    }
}

