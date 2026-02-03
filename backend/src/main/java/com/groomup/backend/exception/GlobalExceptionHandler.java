package com.groomup.backend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException ex) {
        logger.warn("Authentication failed: bad credentials");
        Map<String, String> error = new HashMap<>();
        error.put("error", "Invalid email or password");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleUserNotFound(UsernameNotFoundException ex) {
        logger.warn("Authentication failed: user not found");
        Map<String, String> error = new HashMap<>();
        error.put("error", "Invalid email or password");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatusException(ResponseStatusException ex) {
        logger.warn("ResponseStatusException: {} - {}", ex.getStatusCode(), ex.getReason());
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getReason());
        return ResponseEntity.status(ex.getStatusCode()).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        logger.warn("Validation failed for request");
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err ->
                errors.put(err.getField(), err.getDefaultMessage())
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(org.springframework.security.access.AccessDeniedException ex) {
        logger.warn("Access denied: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Access denied. Admin privileges required.");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrity(DataIntegrityViolationException ex) {
        logger.error("Data integrity violation: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Database error: Please ensure all fields are valid and not too long.");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(TransactionSystemException.class)
    public ResponseEntity<Map<String, String>> handleTransactionSystem(TransactionSystemException ex) {
        Throwable cause = ex.getRootCause();
        logger.error("Transaction error: {} (Root cause: {})", ex.getMessage(), cause != null ? cause.getMessage() : "unknown", ex);
        Map<String, String> error = new HashMap<>();
        
        if (cause != null) {
            String msg = cause.getMessage();
            if (msg != null) {
                if (msg.contains("OptimisticLock") || msg.contains("version") || msg.contains("stale")) {
                    error.put("error", "The product was updated by another process. Please refresh and try again.");
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
                }
                if (msg.contains("Data truncation") || msg.contains("too long") || msg.contains("DataTooLong")) {
                    error.put("error", "One of the fields is too long. Please shorten the text.");
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
                }
                if (msg.contains("Lock wait timeout") || msg.contains("Deadlock")) {
                    error.put("error", "Database is busy. Please try again in a moment.");
                    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
                }
            }
        }
        
        error.put("error", "Database error: Could not save changes. Please check your input.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, String>> handleOptimisticLock(ObjectOptimisticLockingFailureException ex) {
        logger.warn("Optimistic locking failure: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Product was modified by another user. Please refresh and try again.");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException ex) {
        logger.error("IllegalStateException: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Service configuration error");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception ex) {
        logger.error("Unhandled exception: {}", ex.getClass().getSimpleName(), ex);
        Map<String, String> error = new HashMap<>();
        error.put("error", "An unexpected error occurred");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
