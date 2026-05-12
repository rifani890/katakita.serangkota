# Product Requirements Document (PRD) - Testing Phase
## Project: KataKita Dashboard Kota Serang

### 1. Overview
This document is prepared for testing the KataKita application, focusing primarily on **User Interface Responsiveness (UI/UX)** and **System Security** before deployment to production.

---

### 2. Testing Focus: Responsiveness
Objective: To ensure the dashboard is accessible and user-friendly across various devices (Mobile, Tablet, Desktop).

#### 2.1. Key Components
*   **Navigation Bar (Navbar)**:
    *   The logo and "KataKita Kota Serang" text must be wrapped in a link pointing to the root (`/`).
    *   Smooth scaling animation on hover for the logo/brand identity.
*   **StatCards (Metric Cards)**:
    *   Hover state in light mode must display a clear transparent background color matching the card's accent.
    *   Sentiment icons must use a consistent face set (Smile, Meh, Frown).
*   **Trend Chart**:
    *   The "Weekly/Monthly" dropdown must correctly update X-axis labels.
    *   Clicking on chart points (both Weekly and Monthly) must open the corresponding filtered news details.
*   **NewsList & Detail Table**:
    *   **Centered Pagination**: Pagination on both the main page and detail page must be perfectly **centered**.
    *   **Consistent Styling**: Page number buttons must be `rounded-xl` with a blue shadow when active.
    *   **Row Selector**: A "Show per Page" selector must be present on both pages with identical styling.
*   **Sentiment Badges**:
    *   POSITIVE, NEGATIVE, and NEUTRAL labels must be **pill-shaped (rounded-full)** with a uniform thin border.

---

### 3. Testing Focus: Security & Data Integrity
Objective: To protect data integrity and ensure filter accuracy.

#### 3.1. Filter Data Accuracy
*   **Timezone Consistency**: Date filters (Weekly/Monthly) must accurately use local time (WIB), ensuring news at the beginning/end of a period is not missed.
*   **Filter Syncing**: Ensure `timeKey` and `periodType` parameters are correctly sent to the API when switching chart filters.

#### 3.2. Authentication & Authorization
*   **Session Management**: Ensure JWT/Session tokens are protected with `httpOnly` and `secure` cookies.
*   **Admin Route Protection**: All `/admin` routes must be verified via server-side checks (NextAuth).

---

### 4. Test Cases
| ID | Category | Scenario | Expected Result |
|:---|:---|:---|:---|
| R-01 | Responsiveness | Open Detail Page on Mobile | Pagination is centered and aligned with the row selector. |
| R-02 | UI/UX | Hover on "Positive" StatCard | A clear transparent green background appears. |
| R-03 | UI/UX | View Sentiment Badge in News List | Appears as an oval badge (pill) with a subtle border. |
| D-01 | Integrity | Switch Chart to "Monthly" and click "Feb" point | Opens news details specifically for February without leaking data from other months. |
| S-01 | Security | Access `/admin` directly without logging in | Automatically redirects to the login page. |

---

### 5. Conclusion
This PRD update covers the standardization of UI pagination and fixes for the monthly filter logic that was previously problematic.
