package com.cohort.api.event;

import java.util.UUID;

public sealed interface DomainEvent permits StalledApplicationEvent, UpcomingInterviewEvent, MissingDebriefEvent {
    // Subscribers must limit their side effects to this user.
    UUID userId();

    String occurrenceKey();
}
