# CLAUDE.md

## Project Context

This project is a configuration-driven event website platform.

The goal is to build **one reusable frontend application** that can
render different event websites based on the hostname/subdomain used to
access the application.

This is currently a **local/testing implementation**. Do not assume or
hard-code any production domain, corporate domain, or production server
URL.

------------------------------------------------------------------------

## Core Concept

The same Next.js application must be capable of rendering different
event websites.

Example testing URLs:

-   `http://robotica.localhost:3000/`
-   `http://novaris.localhost:3000/`

The application reads the incoming hostname, extracts the subdomain, and
uses that value to determine which event should be rendered.

Conceptually:

``` text
Request
  ↓
Hostname
  ↓
Subdomain
  ↓
Backend API
  ↓
Event
  ↓
Event Configuration
  ↓
Reusable Next.js Components
  ↓
Server-rendered HTML
```

The frontend must not contain a separate hardcoded website
implementation for every event.

------------------------------------------------------------------------

## Current Technology

### Frontend

-   Next.js
-   React
-   TypeScript
-   Tailwind CSS
-   App Router
-   Server Components / Server-Side Rendering

### Backend

-   Django
-   Django REST Framework
-   PostgreSQL

The backend is the source of truth for event information and
configuration.

------------------------------------------------------------------------

## Subdomain-Based Rendering

The application must determine the event from the incoming hostname.

For local testing:

``` text
robotica.localhost:3000
```

should produce:

``` text
subdomain = robotica
```

and:

``` text
novaris.localhost:3000
```

should produce:

``` text
subdomain = novaris
```

Do not hard-code event-specific conditions such as:

``` typescript
if (subdomain === "robotica") {
  // Robotica website
}

if (subdomain === "novaris") {
  // Novaris website
}
```

Instead, use the subdomain as an identifier and resolve the event from
the backend.

------------------------------------------------------------------------

## Server-Side Rendering Requirement

The initial event page must be rendered on the server.

Use Next.js Server Components for the initial event resolution and data
loading.

The preferred flow is:

``` text
Browser
  ↓
Next.js request
  ↓
Read Host header
  ↓
Extract subdomain
  ↓
Fetch event from Django API
  ↓
Render React components on server
  ↓
Return HTML
```

Do not use `window.location` or browser-only APIs to determine the
initial event.

For example, use:

``` typescript
import { headers } from "next/headers";

const headersList = await headers();
const host = headersList.get("host") || "";
```

The event should be resolved during the server request.

------------------------------------------------------------------------

## Backend Event Resolution

The backend currently exposes an events endpoint.

The frontend should eventually request only the event associated with
the current subdomain.

Preferred conceptual request:

``` text
/api/v1/events/?slug=robotica
```

or:

``` text
/api/v1/events/?slug=novaris
```

The backend should return the corresponding event rather than requiring
the frontend to download every event and search through the result.

The current API returns a paginated response similar to:

``` json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Robotica",
      "slug": "robotica",
      "status": "published",
      "start_date": "2025-01-01T00:00:00+05:30",
      "end_date": "2025-01-02T00:00:00+05:30",
      "venue_name": "",
      "banner_image": null
    }
  ]
}
```

The current API is being used for testing and may evolve.

------------------------------------------------------------------------

## Event Identity

The event `slug` should be treated as the internal identifier used to
map a subdomain to an event.

Example:

``` text
robotica.localhost
      ↓
robotica
      ↓
Event.slug = "robotica"
```

Do not use the event's `url` configuration field as the primary event
identity.

The `url` field is intended for webpage rendering and
routing/configuration purposes.

Keep these concepts separate:

-   `slug` → identifies the event
-   `url` → describes a webpage/rendering path or configuration

------------------------------------------------------------------------

## Event Website Structure

The website should be composed of reusable components rather than
event-specific pages hardcoded into the source code.

Potential reusable components include:

``` text
Hero
About
Event Details
Venue
Speakers
Schedule
Sponsors
Registration
Footer
```

The exact component set can evolve with requirements.

The components should receive event configuration/data as props.

Conceptually:

``` tsx
<Hero config={event.hero} />
<About config={event.about} />
<Venue config={event.venue} />
```

The same components should work for Robotica, Novaris, and future
events.

------------------------------------------------------------------------

## Configuration-Driven Design

Event-specific content should eventually be stored in the
backend/database.

Possible configurable content includes:

-   Event title
-   Event description
-   Start date
-   End date
-   Venue
-   Banner/hero image
-   About section
-   Speakers
-   Sponsors
-   Schedule
-   Registration information
-   Navigation
-   Footer content
-   Event-specific pages

The frontend should render these values dynamically.

Adding or changing event content should not normally require changing
frontend source code.

------------------------------------------------------------------------

## Pages and Routing

The system needs to support event-specific webpages.

Conceptually:

``` text
event-domain/
event-domain/contact-us
event-domain/schedule
event-domain/sponsors
```

Internally, event pages may be represented using an event identifier
plus a page path.

The public URL should remain associated with the event's subdomain.

For example:

``` text
novaris.localhost:3000/
novaris.localhost:3000/contact-us
```

The exact Next.js routing implementation can be decided as the project
develops.

Do not introduce unnecessary routing complexity until the basic hostname
→ event → page flow is working.

------------------------------------------------------------------------

## Current Local Testing

The current proof of concept uses:

``` text
http://robotica.localhost:3000/
http://novaris.localhost:3000/
```

Both URLs must point to the same Next.js application.

The application should distinguish them only through the hostname.

Expected behavior:

``` text
robotica.localhost
    ↓
subdomain = robotica
    ↓
Robotica event
```

``` text
novaris.localhost
    ↓
subdomain = novaris
    ↓
Novaris event
```

If the subdomain does not map to an existing event, display an
appropriate "Event Not Found" response.

------------------------------------------------------------------------

## Current Backend Model

The current Django `EventViewSet` uses:

``` python
class EventViewSet(viewsets.ModelViewSet):
    permission_classes = [ReadOnlyOrEventStaff]
```

Published events are available for public reads.

The current queryset includes:

``` python
Event.objects.all().prefetch_related("speakers", "sponsors")
```

The API currently supports filtering by search and status.

A slug filter should be used/added for subdomain-based event lookup.

Example:

``` python
slug = self.request.query_params.get("slug")

if slug:
    qs = qs.filter(slug=slug)
```

Do not unnecessarily change existing authentication, authorization,
publishing, speaker, sponsor, or event-management behavior while
implementing the frontend hostname resolution.

------------------------------------------------------------------------

## SSR Testing

The application may temporarily use artificial backend delays to verify
that the page is genuinely waiting for server-side data.

For example, a temporary Django test delay may be introduced:

``` python
import time

time.sleep(5)
```

The Next.js page can measure the elapsed server-side fetch time:

``` typescript
const start = Date.now();

const response = await fetch(apiUrl, {
  cache: "no-store",
});

const data = await response.json();

const elapsed = Date.now() - start;
```

This is for testing only.

Do not leave artificial delays in production code.

------------------------------------------------------------------------

## Caching

During SSR latency testing, use:

``` typescript
cache: "no-store"
```

so that cached responses do not hide the actual backend request latency.

Once the basic system is proven, caching/revalidation should be
considered based on the event content update requirements.

Do not prematurely optimize caching before the event resolution flow is
stable.

------------------------------------------------------------------------

## Architecture Principles

### 1. One frontend application

Do not create a separate Next.js application for every event.

### 2. Database-driven event resolution

The subdomain should resolve to an event record.

### 3. Reusable components

Event websites should be rendered from reusable components and
configuration.

### 4. Server-side initial rendering

The initial event data should be loaded and rendered on the server.

### 5. No hardcoded event routing

Avoid event-specific conditionals in the frontend.

Bad:

``` typescript
if (subdomain === "robotica") {
  return <Robotica />;
}
```

Preferred:

``` typescript
const event = await getEventBySlug(subdomain);

return <EventWebsite event={event} />;
```

### 6. Keep infrastructure configuration separate

Do not hard-code production domains, production server IPs, or
deployment-specific URLs into application logic.

Use environment variables for API endpoints and deployment-specific
configuration.

### 7. Keep the first implementation simple

The immediate objective is to prove:

``` text
hostname
  ↓
subdomain
  ↓
backend event
  ↓
SSR
  ↓
rendered website
```

Additional CMS functionality, advanced routing, caching, and page
builders should be added incrementally.

------------------------------------------------------------------------

## Expected Future Architecture

The intended architecture is:

``` text
                     Browser
                        │
                        ▼
                Next.js Application
                        │
                 Read Host Header
                        │
                        ▼
                    Subdomain
                        │
                        ▼
                 Django REST API
                        │
                        ▼
                    PostgreSQL
                        │
                        ▼
                Event Configuration
                        │
                        ▼
              Reusable React Components
                        │
                        ▼
                  Server-rendered HTML
```

A new event should ultimately require configuration/data creation rather
than a new frontend application.

------------------------------------------------------------------------

## Development Priorities

Implement in this order:

1.  Verify local subdomain detection.
2.  Resolve the event using the subdomain.
3.  Fetch the event from Django.
4.  Render event information through reusable components.
5.  Add configurable event content.
6.  Add event-specific page routing.
7.  Add additional event sections such as speakers, sponsors, and
    schedules.
8.  Add appropriate caching/revalidation.
9.  Integrate the final deployment/DNS architecture when the application
    is ready.

Do not introduce production-domain assumptions while the project is
still being tested locally.

------------------------------------------------------------------------

## Important Non-Goals for the Current Test

Do not currently:

-   Create separate deployments for each event.
-   Create separate frontend projects for each event.
-   Hard-code event names into React routing.
-   Depend on `window.location` for SSR.
-   Create manual routing rules for every event.
-   Build a complete CMS before the hostname-to-event flow is proven.
-   Add production domain/server configuration to the local
    implementation.