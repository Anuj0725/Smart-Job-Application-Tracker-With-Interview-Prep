package com.cohort.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "fl_rounds", schema = "fl")
public class FlRound {
    @Id
    @UuidGenerator
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "round_number", nullable = false)
    private int roundNumber;

    @Column(nullable = false)
    private boolean accepted;

    @Column
    private String reason;

    @Column(name = "cohort_size", nullable = false)
    private int cohortSize;

    @Transient
    private int satOutCount;

    @Transient
    private Integer modelVersion;

    @Transient
    private Double checkAccuracy;

    @Transient
    private Double noiseMultiplier;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected FlRound() {
    }

    public FlRound(int roundNumber, boolean accepted, String reason, int cohortSize) {
        this.roundNumber = roundNumber;
        this.accepted = accepted;
        this.reason = reason;
        this.cohortSize = cohortSize;
    }

    public FlRound(int roundNumber, boolean accepted, String reason, int cohortSize,
                   int satOutCount, Integer modelVersion, Double checkAccuracy, Double noiseMultiplier) {
        this(roundNumber, accepted, reason, cohortSize);
        this.satOutCount = satOutCount;
        this.modelVersion = modelVersion;
        this.checkAccuracy = checkAccuracy;
        this.noiseMultiplier = noiseMultiplier;
    }

    public int getSatOutCount() {
        return satOutCount;
    }

    public Integer getModelVersion() {
        return modelVersion;
    }

    public Double getCheckAccuracy() {
        return checkAccuracy;
    }

    public Double getNoiseMultiplier() {
        return noiseMultiplier;
    }

    public UUID getId() {
        return id;
    }

    public int getRoundNumber() {
        return roundNumber;
    }

    public boolean isAccepted() {
        return accepted;
    }

    public String getReason() {
        return reason;
    }

    public int getCohortSize() {
        return cohortSize;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
