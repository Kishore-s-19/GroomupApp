package com.groomup.backend.dto;

public class CatalogSeedResult {

    private int created;
    private int updated;
    private int skipped;

    public CatalogSeedResult() {}

    public CatalogSeedResult(int created, int updated, int skipped) {
        this.created = created;
        this.updated = updated;
        this.skipped = skipped;
    }

    public int getCreated() {
        return created;
    }

    public void setCreated(int created) {
        this.created = created;
    }

    public int getUpdated() {
        return updated;
    }

    public void setUpdated(int updated) {
        this.updated = updated;
    }

    public int getSkipped() {
        return skipped;
    }

    public void setSkipped(int skipped) {
        this.skipped = skipped;
    }
}

