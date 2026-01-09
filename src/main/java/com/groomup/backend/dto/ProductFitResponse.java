package com.groomup.backend.dto;

public class ProductFitResponse {

    private Integer trueToSize;
    private Integer length;
    private Integer width;

    public ProductFitResponse() {}

    public ProductFitResponse(Integer trueToSize, Integer length, Integer width) {
        this.trueToSize = trueToSize;
        this.length = length;
        this.width = width;
    }

    public Integer getTrueToSize() {
        return trueToSize;
    }

    public void setTrueToSize(Integer trueToSize) {
        this.trueToSize = trueToSize;
    }

    public Integer getLength() {
        return length;
    }

    public void setLength(Integer length) {
        this.length = length;
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }
}

