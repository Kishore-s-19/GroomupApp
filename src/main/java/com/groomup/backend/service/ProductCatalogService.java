package com.groomup.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.groomup.backend.dto.CatalogSeedResult;
import com.groomup.backend.model.Product;
import com.groomup.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ProductCatalogService {

    private static final Pattern PRODUCT_DETAILS_BLOCK = Pattern.compile(
            "export\\s+const\\s+productDetails\\s*=\\s*(\\{[\\s\\S]*?\\n\\};)",
            Pattern.MULTILINE
    );

    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;

    public ProductCatalogService(ProductRepository productRepository, ObjectMapper objectMapper) {
        this.productRepository = productRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public CatalogSeedResult seedFromDataJs(boolean onlyIfEmpty) throws IOException {
        if (onlyIfEmpty && productRepository.count() > 0) {
            return new CatalogSeedResult(0, 0, 0);
        }

        Path dataPath = Path.of("data", "data.js");
        if (!Files.exists(dataPath)) {
            return new CatalogSeedResult(0, 0, 0);
        }

        String content = Files.readString(dataPath, StandardCharsets.UTF_8);
        String objectLiteral = extractProductDetailsObjectLiteral(content);
        if (objectLiteral == null) {
            return new CatalogSeedResult(0, 0, 0);
        }

        String json = jsObjectToJson(objectLiteral);
        JsonNode root = objectMapper.readTree(json);
        if (!root.isObject()) {
            return new CatalogSeedResult(0, 0, 0);
        }

        List<JsonNode> nodes = new ArrayList<>();
        Iterator<JsonNode> values = root.elements();
        while (values.hasNext()) {
            nodes.add(values.next());
        }

        nodes.sort((a, b) -> {
            Integer ia = intValue(a, "id");
            Integer ib = intValue(b, "id");
            if (ia == null && ib == null) {
                return 0;
            }
            if (ia == null) {
                return 1;
            }
            if (ib == null) {
                return -1;
            }
            return ia.compareTo(ib);
        });

        int created = 0;
        int updated = 0;
        int skipped = 0;

        for (JsonNode node : nodes) {
            Integer sourceId = intValue(node, "id");
            if (sourceId == null) {
                skipped++;
                continue;
            }

            String name = text(node, "name");
            String category = text(node, "category");

            Optional<Product> existing = productRepository.findBySourceId(sourceId)
                    .or(() -> {
                        if (name == null || category == null) {
                            return Optional.empty();
                        }
                        return productRepository.findFirstByNameIgnoreCaseAndCategoryIgnoreCase(name, category);
                    });

            Product product = existing.orElseGet(Product::new);
            boolean wasNew = product.getId() == null;

            toProduct(product, sourceId, node);
            productRepository.save(product);

            if (wasNew) {
                created++;
            } else {
                updated++;
            }
        }

        return new CatalogSeedResult(created, updated, skipped);
    }

    @Transactional
    public int dedupeNullSourceId() {
        return productRepository.deleteAllDuplicatesWithoutSourceId();
    }

    private String extractProductDetailsObjectLiteral(String content) {
        Matcher matcher = PRODUCT_DETAILS_BLOCK.matcher(content);
        if (!matcher.find()) {
            return null;
        }
        String block = matcher.group(1);
        String trimmed = block.trim();
        if (trimmed.endsWith(";")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private String jsObjectToJson(String jsObjectLiteral) {
        String s = jsObjectLiteral;
        s = s.replaceAll("(?m)^[\\t ]*//.*$", "");
        s = s.trim();
        s = s.replaceAll("([\\{,]\\s*)(\\d+)\\s*:", "$1\"$2\":");
        s = s.replaceAll("([\\{,]\\s*)([A-Za-z_][A-Za-z0-9_]*)\\s*:", "$1\"$2\":");
        s = s.replaceAll(",(\\s*[\\}\\]])", "$1");
        return s;
    }

    private void toProduct(Product product, Integer sourceId, JsonNode node) throws IOException {
        product.setSourceId(sourceId);
        product.setName(text(node, "name"));
        product.setBrand(text(node, "brand"));
        product.setCategory(text(node, "category"));
        product.setDescription(text(node, "description"));
        product.setFitNote(text(node, "fitNote"));
        product.setMaterials(text(node, "materials"));
        product.setCareGuide(text(node, "careGuide"));
        product.setDeliveryInfo(text(node, "deliveryInfo"));

        BigDecimal price = decimal(node, "price");
        if (price == null) {
            price = BigDecimal.ZERO;
        }
        product.setPrice(price);
        product.setOriginalPrice(decimal(node, "originalPrice"));

        product.setRating(decimal(node, "rating"));
        product.setReviewsCount(intValue(node, "reviews"));

        JsonNode imagesNode = node.get("images");
        if (imagesNode != null && imagesNode.isArray() && imagesNode.size() > 0) {
            product.setImageUrl(imagesNode.get(0).asText());
        } else {
            product.setImageUrl(null);
        }

        product.setImagesJson(objectMapper.writeValueAsString(node.get("images")));
        product.setColorsJson(objectMapper.writeValueAsString(node.get("colors")));
        product.setSizesJson(objectMapper.writeValueAsString(node.get("sizes")));
        product.setFitJson(objectMapper.writeValueAsString(node.get("fit")));

        product.setActive(true);
    }

    private String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        if (v == null || v.isNull()) {
            return null;
        }
        String s = v.asText();
        return s.isBlank() ? null : s;
    }

    private Integer intValue(JsonNode node, String field) {
        JsonNode v = node.get(field);
        if (v == null || v.isNull()) {
            return null;
        }
        if (v.isInt()) {
            return v.asInt();
        }
        if (v.isNumber()) {
            return v.numberValue().intValue();
        }
        String s = v.asText();
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private BigDecimal decimal(JsonNode node, String field) {
        JsonNode v = node.get(field);
        if (v == null || v.isNull()) {
            return null;
        }
        if (v.isNumber()) {
            return v.decimalValue();
        }
        String s = v.asText();
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}

