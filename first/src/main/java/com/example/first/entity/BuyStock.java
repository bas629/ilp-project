package com.example.first.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "buy_stocks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuyStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long buyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;

    private Integer quantity;
    private Double buyPrice;
    private Double totalPrice;
    private LocalDate purchaseDate;
}
