package com.example.first.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

@Entity
public class GoalTacker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long goalId;

    private int targetAmount;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User usertemp;

    // Default Constructor
    public GoalTacker() {
    }

    // Getter and Setter for goalId
    public Long getGoalId() {
        return goalId;
    }

    public void setGoalId(Long goalId) {
        this.goalId = goalId;
    }

    // Getter and Setter for targetAmount
    public int getTargetAmount() {
        return targetAmount;
    }

    public void setTargetAmount(int targetAmount) {
        this.targetAmount = targetAmount;
    }

    // Getter and Setter for usertemp
    public User getUsertemp() {
        return usertemp;
    }

    public void setUsertemp(User usertemp) {
        this.usertemp = usertemp;
    }
}