package com.groomup.backend.dto;

public class ProductColorResponse {

    private String name;
    private String value;
    private String image;

    public ProductColorResponse() {}

    public ProductColorResponse(String name, String value, String image) {
        this.name = name;
        this.value = value;
        this.image = image;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }
}

