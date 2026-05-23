package com.example.first.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "gold_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoldHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long historyId;

    private Double oldPrice;
    private Double newPrice;
    private LocalDateTime updatedAt;
}
