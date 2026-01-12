package com.groomup.backend.dto;

public class WebhookResponse {

    private boolean processed;
    private String reason;

    public WebhookResponse(boolean processed, String reason) {
        this.processed = processed;
        this.reason = reason;
    }

    public boolean isProcessed() {
        return processed;
    }

    public void setProcessed(boolean processed) {
        this.processed = processed;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}

