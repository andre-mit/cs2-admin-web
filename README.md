# CS2 Admin - Frontend

This is the frontend project for the CS2 (Counter-Strike 2) administration panel. It is built with Next.js and consumes a C# RESTful API.

## Technologies Used

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Components:** [Shadcn UI](https://ui.shadcn.com/) (based on Radix UI and Lucide React)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) with **Steam** provider (`next-auth-steam`)
- **Data Fetching:** [SWR](https://swr.vercel.app/)
- **Package Manager:** [Bun](https://bun.sh/)

## Implemented Features

- **Dashboard:** General overview of the administrative panel.
- **Map Management (`/dashboard/maps`):**
  - Add, edit, and remove maps.
  - Direct upload of background images and badges to AWS S3 (via presigned URLs) or fallback via the backend.
  - Toggle between Community (Workshop) and Official maps.
- **Server and Lobby Management:**
  - Configured interfaces to display servers and lobby details.
- **Steam Authentication:**
  - Secure and exclusive login via Steam account.

## Setup and Installation

1. Rename (or create) the `.env.local` file in the root of the `cs2-admin` project with the following environment variables:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000 # Backend URL
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_secret_key_here
   STEAM_API_KEY=your_steam_api_key
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bun run dev
   ```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Next Steps (Suggested Improvements)

- **Componentization:** Extract modals/forms from main pages (e.g., `maps/page.tsx`) into reusable components to improve code readability.
- **Global State Management:** Add libraries like `Zustand` to globally manage the active lobby and system notifications.
- **Error Handling:** Implement a custom hook for requests that automatically triggers error toasts if the API fails (e.g., 500 server errors or 400 validation errors).
- **Protected Routes:** Use Next.js `middleware.ts` to globally protect all routes under `/dashboard`, avoiding conditional checks on every page.
