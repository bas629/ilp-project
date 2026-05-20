package com.example.first.Dto;

public class GetGoalTackerDto {

    private Double totalAmount;
    private int targetAmount;
    private Double progressPercentage;

    // Default Constructor
    public GetGoalTackerDto() {
    }

    // Getter and Setter for totalAmount
    public Double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }

    // Getter and Setter for targetAmount
    public int getTargetAmount() {
        return targetAmount;
    }

    public void setTargetAmount(int targetAmount) {
        this.targetAmount = targetAmount;
    }

    // Getter and Setter for progressPercentage
    public Double getProgressPercentage() {
        return progressPercentage;
    }

    public void setProgressPercentage(Double progressPercentage) {
        this.progressPercentage = progressPercentage;
    }
}