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
- **Plugins Management:**
  - Create and configure plugins with custom config files in JSON or CFG formats.
  - Dynamically deploy servers with selected plugins and user-overriden configurations.
- **Game Mode Presets:**
  - Pre-configured dynamic server presets for Competitive, Surf, Bhop, Retakes, and more.
  - Managed entirely via the **Presets Page** (`/dashboard/presets`), which talks to the C# Backend via the `ServerPreset` API.
  - Automatic injection of recommended plugins (MatchZy, SurfTimer, etc.) and specific CVARs (`sv_airaccelerate`, `CS2_GAMEALIAS`, etc.) based on the selected mode.

## How to Setup Custom Models, FastDL & Plugins
The CS2 Admin panel supports a structured approach for deploying plugins and serving external assets (like custom player models, skins, and maps).

### 1. Uploading Plugins & Custom Models
1. Navigate to **Plugins** (`/dashboard/plugins`).
2. Click **Add Plugin** to register a new plugin in the database.
3. Click the upload button to send a `.zip` file for that plugin.
4. **ZIP Structure:** Your ZIP can contain standard CounterStrikeSharp plugins OR custom assets. 
   - *Example:* If you want to add custom player skins, your zip should have `models/`, `materials/`, etc., in the root of the ZIP.
   - When the backend receives the ZIP, it parses it and places any `models/`, `materials/`, `sound/`, and `particles/` directly into the web server's **FastDL** directory.
5. The remaining files (like `addons/counterstrikesharp`) go into the plugin's isolated overlay structure.

### 2. Creating Database-Backed Presets
To make your servers truly dynamic (like FACEIT, Surf, or Bhop), you use the Presets system.
1. Navigate to **Presets** (`/dashboard/presets`).
2. Click **Add Preset**.
3. **Name:** e.g., `Surf (Tier 1-3)`.
4. **Plugins Bundled:** Check all plugins that should load on this server (e.g., `SurfTimer`, `CustomSkins`).
5. **Server Variables (CVARs):** Add game-specific configurations:
   - `sv_airaccelerate` = `1000`
   - `CS2_GAMEALIAS` = `casual`
6. Click **Save Preset**.

### 3. Deploying a Dynamic Server
1. Go to **Servers** (`/dashboard/servers`).
2. Click **Create Dynamic Server**.
3. In the dropdown "Game Mode Preset", select your newly created Preset.
4. The system automatically selects the linked plugins and injects the CVARs.
5. Click **Create Server**. The backend will instantly spin up a Docker container layered with your custom models, inject `sv_downloadurl` for FastDL, and apply all CVARs. Clients connecting to this server will download your custom models automatically!

## Plugin Configuration Example (MatchZy)

When adding a plugin through the web interface, the `Config Files (JSON Array)` field expects an array of configuration objects. Here is an example of how you would configure **MatchZy**:

```json
[
  {
    "key": "matchzy_main_cfg",
    "label": "MatchZy Main Config (CFG)",
    "relativePath": "cfg/MatchZy/config.cfg",
    "format": "cfg",
    "defaultContent": {
      "matchzy_chat_prefix": "[MatchZy]",
      "matchzy_admin_chat_prefix": "[MatchZy Admin]",
      "matchzy_minimum_ready_required": "1",
      "matchzy_demo_path": "matchzy_demos",
      "matchzy_stop_command_available": "true",
      "matchzy_use_casual_commands": "false",
      "matchzy_allow_force_ready": "true"
    }
  },
  {
    "key": "matchzy_admins_json",
    "label": "MatchZy Admins (JSON)",
    "relativePath": "addons/counterstrikesharp/plugins/MatchZy/admins.json",
    "format": "json",
    "defaultContent": {
      "76561198000000000": "",
      "76561198000000001": "vip"
    }
  }
]
```

## Setup and Installation

1. Rename (or create) the `.env.local` file in the root of the `cs2-admin` project with the following environment variables:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000 # Backend URL
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_secret_key_here
   STEAM_API_KEY=your_steam_api_key
   JWT_SECRET=a_super_secret_key_with_at_least_32_characters # Must match backend JwtSettings:SecretKey
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

- **Map Enhancements:** Implement the ability to select `game_mode` for each map (allowing multiple modes per map) and add a "favorite" functionality.
- **Componentization:** Extract modals/forms from main pages (e.g., `maps/page.tsx`) into reusable components to improve code readability.
- **Global State Management:** Add libraries like `Zustand` to globally manage the active lobby and system notifications.
- **Error Handling:** Implement a custom hook for requests that automatically triggers error toasts if the API fails (e.g., 500 server errors or 400 validation errors).
- **Protected Routes:** Use Next.js `proxy.ts` (formerly `middleware.ts`) to globally protect all routes under `/dashboard`, avoiding conditional checks on every page.

## Coding Standards

- **Clean Code & Comments:** Never add irrelevant, generic, or obvious comments to the code (e.g., `{/* Header */}`, `// Connect to SignalR`, `// Fetch data`). Comments should only be used to explain *why* complex or non-obvious logic was implemented, never *what* the code is doing. Make the code expressive enough to document itself.
