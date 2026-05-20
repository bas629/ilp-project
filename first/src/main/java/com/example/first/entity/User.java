package com.example.first.entity;
// ==========================
// USER ENTITY
// ==========================



import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    private String name;

    @Column(unique = true)
    private String email;

    private String mobileNo;

    private String password;

    // ================= RELATION =================

    @OneToMany(mappedBy = "usertemp", cascade = CascadeType.ALL)
    private List<Expense> expenses = new ArrayList<>();


    @OneToMany(mappedBy = "usertemp", cascade = CascadeType.ALL)
    private List<Investment> investments;

    @OneToOne(mappedBy = "usertemp", cascade = CascadeType.ALL)
    private GoalTacker goals;
//
//    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
//    private FinancialProfile financialProfile;
//
//    @OneToMany(mappedBy = "usertemp", cascade = CascadeType.ALL)
//    private List<Stock> Stocks;

    // Getter Setter
}
