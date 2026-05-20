package com.example.first.Dto;

public class GoalTrackerDto {

    private int targetAmount;
    private Long userId;

    // Default Constructor
    public GoalTrackerDto() {
    }

    // Getter and Setter for targetAmount
    public int getTargetAmount() {
        return targetAmount;
    }

    public void setTargetAmount(int targetAmount) {
        this.targetAmount = targetAmount;
    }

    // Getter and Setter for userId
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
