package com.groomup.backend.repository;

import com.groomup.backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByActiveTrueOrderByIdDesc();

    List<Product> findByActiveTrueOrderByIdAsc();

    List<Product> findByCategoryIgnoreCaseAndActiveTrueOrderByIdDesc(String category);

    List<Product> findByCategoryIgnoreCaseAndActiveTrueOrderByIdAsc(String category);

    List<Product> findByNameContainingIgnoreCaseAndActiveTrueOrderByIdDesc(String name);

    List<Product> findByNameContainingIgnoreCaseAndActiveTrueOrderByIdAsc(String name);

    List<Product> findByNameContainingIgnoreCaseAndCategoryIgnoreCaseAndActiveTrueOrderByIdDesc(
            String name,
            String category
    );

    List<Product> findByNameContainingIgnoreCaseAndCategoryIgnoreCaseAndActiveTrueOrderByIdAsc(
            String name,
            String category
    );

    List<Product> findByActiveTrueOrderBySourceIdAsc();

    List<Product> findByCategoryIgnoreCaseAndActiveTrueOrderBySourceIdAsc(String category);

    List<Product> findByNameContainingIgnoreCaseAndActiveTrueOrderBySourceIdAsc(String name);

    List<Product> findByNameContainingIgnoreCaseAndCategoryIgnoreCaseAndActiveTrueOrderBySourceIdAsc(
            String name,
            String category
    );

    Optional<Product> findBySourceId(Integer sourceId);

    Optional<Product> findFirstByNameIgnoreCaseAndCategoryIgnoreCase(String name, String category);

    @Modifying
    @Transactional
    @Query(
            value = """
                    DELETE p_null
                    FROM products p_null
                    JOIN products p_keep
                      ON p_null.source_id IS NULL
                     AND p_keep.source_id IS NOT NULL
                     AND LOWER(p_null.name) = LOWER(p_keep.name)
                     AND LOWER(p_null.category) = LOWER(p_keep.category)
                     AND p_null.price = p_keep.price
                    """,
            nativeQuery = true
    )
    int deleteAllDuplicatesWithoutSourceId();

    @Modifying
    @Transactional
    @Query(
            value = """
                    DELETE FROM products
                    WHERE source_id IS NULL
                      AND LOWER(name) = LOWER(?1)
                      AND LOWER(category) = LOWER(?2)
                      AND price = ?3
                    """,
            nativeQuery = true
    )
    int deleteDuplicatesWithoutSourceId(String name, String category, java.math.BigDecimal price);
}
