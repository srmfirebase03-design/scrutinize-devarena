# Scrutinize DevArena - Project Documentation

## Project Overview
**Scrutinize DevArena** is a hackathon management system designed to automate and streamline the evaluation process of hackathon submissions. Built with the T3 stack principles (Next.js, Prisma, NextAuth), it facilitates the synchronization of submission files from Google Drive, maps them to registered teams, and provides interfaces for both Administrators and Evaluators to manage and score projects.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** NextAuth.js
- **Styling:** Tailwind CSS
- **External Integrations:** Google Drive API (for fetching submission files)

## Core Architectural Concepts

### 1. Authentication & Roles
The system uses `NextAuth.js` (likely Credentials provider) to manage access.
- **ADMIN:** Has global access. Can trigger data syncs, view all teams, monitor attendance, and see the final leaderboard/shortlist.
- **EVALUATOR:** Assigned specific folders (e.g., "PS1&PS2"). Their view is restricted to teams within their assigned folder/track. They are responsible for scoring and shortlisting teams.

### 2. Data Synchronization (The "Sync" Flow)
This is the heart of the setup process.
- **Source of Truth:** `public/data/hackathon.csv` contains the master list of registered teams.
- **Submission Source:** A specific Google Drive folder contains submissions (PPTs/Videos).
- **Process:**
  - The API route `/api/sync` is triggered by an Admin.
  - It uses `src/lib/googleDrive.ts` to list files from the Drive.
  - It uses `src/lib/teamSync.ts` to parse file names (expected format: `PSNumber_TeamName`) and fuzzy match them against the CSV data.
  - Matched records are upserted into the `Team` table in the database.

### 3. Evaluation Workflow
Evaluators have a specific workflow they must follow:
- **Assignment:** Evaluators are linked to a specific `folderName` (e.g., "PS1").
- **Queue:** On their dashboard (`src/app/dashboard/evaluator/page.tsx`), they see a queue of "PENDING" teams from their folder.
- **Scoring:**
  - They view the submission (embedded Drive link).
  - They assign a score (0-10) and optional comments.
  - **Starring:** Evaluators must "Star" (shortlist) exceptional teams.
- **Constraint:** An evaluator must star exactly **15 teams** to "Finalize" their batch.

### 4. Admin Supervision
Admins have a bird's-eye view:
- **Dashboard:** `src/app/dashboard/admin/page.tsx`
- **Capabilities:**
  - View status of all teams (PENDING, APPROVED, REJECTED).
  - Monitor evaluator progress.
  - View the global "Shortlist" (teams starred by evaluators).
  - Manage "Attendance" (likely checking if teams are present).

## Key Directory & File Structure

### `/src/lib/` - Core Logic
- **`googleDrive.ts`**: Wrapper for Google Drive API. Handles listing files and generating embed URLs for the frontend.
- **`teamSync.ts`**: Contains the complex logic to match a filename string to a CSV row. This bridges the gap between the Drive file and the database record.
- **`prisma.ts`**: Instantiates the global Prisma client.
- **`email.ts`**: (Likely) Logic for sending notifications, if implemented.

### `/src/app/api/` - Backend Routes
- **`/api/sync/`**: Endpoint to trigger the Drive-to-DB synchronization.
- **`/api/evaluate/`**: Endpoint where evaluations are submitted. Handles the atomic transaction of creating an `Evaluation` record and updating the `Team` status.
- **`/api/admin/shortlist/`**: Fetches the ranked list of shortlisted teams for admins.

### `/prisma/` - Database
- **`schema.prisma`**: The single source of truth for the data model.
  - **Models**: `User` (Admin/Evaluator), `Team` (Hackathon participants), `Evaluation` (Link between User and Team with score).

### `/public/data/`
- **`hackathon.csv`**: The static seed data for teams. This allows the system to function without a heavy user registration backend for participants.

## Database Schema (Inferred)
- **Team**: Stores team name, members, assigned folder/track, drive link, and current status (PENDING/EVALUATED).
- **Evaluation**: Stores the score, comment, and "starred" status given by an evaluator to a team.
- **User**: Stores credentials and role (ADMIN/EVALUATOR) and potentially their assigned folder.
