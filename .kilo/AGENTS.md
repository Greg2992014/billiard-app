 Billiard Score Tracker - AI Development Guidelines

 Core Objective
Assist in completing the features for the "Billiard Score Tracker" web application. The AI must propose code implementations before directly applying changes.

 Tech Stack
- Framework: Next.js 15.5.18 (App Router, TypeScript, Turbopack)
- Database: Turso (libSQL)
- Styling: Tailwind CSS
- Key Libraries: @libsql/client, nanoid

 Project Structure Overview
- `app/api/`: Next.js API routes.
- `app/game/[roomId]/page.tsx`: The main game page client component.
- `lib/db.ts`: Turso database client.
- `lib/gameLogic.ts`: Core game logic, currently for Snooker. Expand for Pool and Russian.

 AI Workflow & Rules of Engagement
1.  Propose First: For any new feature, significant change, or refactoring (e.g., the new game rules), first analyze the request and propose a solution plan.
2.  Do not alter code without confirmation from the user.
3.  Optimization Focus:
    - Performance: Reduce client-side re-renders, optimize database queries.
    - Maintainability: Suggest refactoring large components (>300 lines).
    - Rules: Prioritize completing the full game logic for Pool and Russian Billiards, and fix the Snooker logic.

 Key Tasks from the Roadmap
- [ ] Implement full scoring logic for Pool (accounting for numbered balls, 8-ball win/loss conditions).
- [ ] Implement full scoring logic for Russian Billiards (game up to 8 balls, progress display).
- [ ] Fix real-time turn timer.
- [ ] Improve history log display (show which ball was pocketed).
- [ ] Visual UI/UX overhaul (felt texture, better column separation).

 Coding Conventions
- Use TypeScript strictly; avoid using `any`.
- All API routes must have proper error handling and type validation.
- CSS classes from Tailwind are preferred.