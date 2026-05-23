package com.example.first.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "market_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long eventId;

    private String eventName;
    private String marketEffect; // BULL_IT, BEAR_IT, CRASH, BOOM, GOLD_BOOM, banking sector under pressure, etc.
    private LocalDateTime createdAt;
}
