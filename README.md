## Overview

This project uses the following tech stack:
- Vite
- Typescript
- React Router v7 (all imports from `react-router` instead of `react-router-dom`)
- React 19 (for frontend components)
- Tailwind v4 (for styling)
- Shadcn UI (for UI components library)
- Lucide Icons (for icons)
- Convex (for backend & database)
- Convex Auth (for authentication)
- Framer Motion (for animations)
- Three js (for 3d models)

All relevant files live in the 'src' directory.

Use bun for the package manager.

## Setup

This project is set up already and running on a cloud environment, as well as a convex development in the sandbox.

## Deployment on Vercel

This is a Vite SPA backed by Convex. The current generated Convex client/type files are committed under `src/convex/_generated/`, so Vercel can build the existing frontend without Convex account access. The repository includes `convex.json` and `vercel.json`; `convex.json` points the Convex CLI at `src/convex/`, while Vercel runs:

```bash
bun run build:frontend
```

The Vercel project only needs the public production backend URL:

```text
VITE_CONVEX_URL=https://<your-deployment>.convex.cloud
```

Do not add `CONVEX_DEPLOY_KEY` unless you later regain Convex access and want Vercel to deploy backend changes automatically. Because this build does not run `convex deploy`, changes to Convex functions, schema, or backend environment variables must be deployed separately by an account owner.

For a local frontend build (without deploying Convex), run:

```bash
bun install
bun run typecheck
bun run build
```

For a local Convex code-generation check, run:

```bash
bun run convex:codegen
bun run typecheck
```

In Vercel → Project Settings → Environment Variables, add `VITE_CONVEX_URL` for Production and Preview using the existing Convex deployment URL. Do not put server secrets such as `RESEND_API_KEY` or payment keys in `VITE_*` variables; configure those in the Convex deployment environment.

### Optional backend deployment (requires Convex access)

If a Convex project owner later provides a production deploy key, the Vercel build can be switched back to the backend-deploying command:

```bash
bunx convex deploy --cmd "bun run build:frontend" --cmd-url-env-var-name VITE_CONVEX_URL
```

That command requires `CONVEX_DEPLOY_KEY` in Vercel. Without that key, use the current frontend-only build command.

### Fixing `401 MissingAccessToken` on Vercel

The current repository build command is frontend-only and does not call Convex, so it does not require a deploy key. If Vercel still shows `401 Unauthorized: MissingAccessToken`, it is using an older cached project build command or an older commit. Confirm that the deployed commit contains this `vercel.json` setting:

```json
"buildCommand": "bun run build:frontend"
```

Then redeploy with **Redeploy → Use existing Build Cache: Off**. Also confirm that `VITE_CONVEX_URL` is configured in Vercel for the selected environment.

Only if you intentionally switch back to automatic Convex backend deployment should you create a key from a machine signed in to the correct Convex account:

```bash
bunx convex deployment token create lona-production
```

Then store it only in Vercel as `CONVEX_DEPLOY_KEY`. Never add it to GitHub, `.env` files, `vercel.json`, or a client-side `VITE_*` variable. Never paste the token into chat.

## Deployment on Netlify (simpler alternative to Vercel)

Netlify is a better fit for this project than Vercel because the repository build is
frontend-only and the site is a static SPA. The repo already includes a `netlify.toml`
that Netlify reads automatically — no dashboard build settings are required.

1. Push the repository (including `netlify.toml`, `public/`, and the committed
   `src/convex/_generated/` files) to GitHub.
2. In Netlify: **Add new site → Import an existing project → connect the GitHub repo**.
3. Netlify auto-detects Vite and reads `netlify.toml`:
   - Build command: `npm run build:frontend`
   - Publish directory: `dist`
4. Add the environment variable (Site configuration → Environment variables):
   ```text
   VITE_CONVEX_URL=https://<your-deployment>.convex.cloud
   ```
5. Deploy. SPA routes (`/shop`, `/account`, `/admin/...`) fall through to
   `index.html` via the redirects already defined in `netlify.toml`.

No `CONVEX_DEPLOY_KEY` is needed on Netlify. Backend changes (Convex functions,
schema, server env vars) still require someone with access to the Convex account.

## Environment Variables

The client requires `VITE_CONVEX_URL`, which should point to the already-deployed production Convex URL. `CONVEX_DEPLOYMENT` and `CONVEX_DEPLOY_KEY` are not needed for the current frontend-only Vercel build.

The convex server has a separate set of environment variables that are accessible by the convex backend.

Currently, these variables include auth-specific keys: JWKS, JWT_PRIVATE_KEY, and SITE_URL.


# Using Authentication (Important!)

You must follow these conventions when using authentication.

## Auth is already set up.

All convex authentication functions are already set up. The auth currently uses email OTP and anonymous users, but can support more.

The email OTP configuration is defined in `src/convex/auth/emailOtp.ts`. DO NOT MODIFY THIS FILE.

Also, DO NOT MODIFY THESE AUTH FILES: `src/convex/auth.config.ts` and `src/convex/auth.ts`.

## Using Convex Auth on the backend

On the `src/convex/users.ts` file, you can use the `getCurrentUser` function to get the current user's data.

## Using Convex Auth on the frontend

The `/auth` page is already set up to use auth. Navigate to `/auth` for all log in / sign up sequences.

You MUST use this hook to get user data. Never do this yourself without the hook:
```typescript
import { useAuth } from "@/hooks/use-auth";

const { isLoading, isAuthenticated, user, signIn, signOut } = useAuth();
```

## Protected Routes

The starter `/dashboard` route is protected with `RequireAuth`, which sends
signed-out users to `/auth?returnTo=<current route>`. Extend that page for the
product's authenticated experience, and reuse `RequireAuth` when adding another
protected route.

## Auth Page

The auth page is defined in `src/pages/Auth.tsx`. Send sign-in and sign-up actions
to `/auth`.

## Authorization

You can perform authorization checks on the frontend and backend.

On the frontend, you can use the `useAuth` hook to get the current user's data and authentication state.

You should also be protecting queries, mutations, and actions at the base level, checking for authorization securely.

## Adding a redirect after auth

The `/auth` route in `src/main.tsx` redirects to `/dashboard` by default. If the
product's main authenticated route is different, update `redirectAfterAuth` to
that route. A validated same-origin `returnTo` query parameter takes priority so
users can resume the protected page they originally requested. Never leave an
authenticated product redirecting back to the public landing page.

## Complete authenticated products

When the requested product implies accounts, a workspace, a dashboard, or other
signed-in functionality, the task is not complete with only a landing page and
auth form. Build the main authenticated experience, protect its route, and verify
that signing in reaches it.

# Frontend Conventions

You will be using the Vite frontend with React 19, Tailwind v4, and Shadcn UI.

Generally, pages should be in the `src/pages` folder, and components should be in the `src/components` folder.

Shadcn primitives are located in the `src/components/ui` folder and should be used by default.

## Page routing

Your page component should go under the `src/pages` folder.

When adding a page, update the react router configuration in `src/main.tsx` to include the new route you just added.

## Shad CN conventions

Follow these conventions when using Shad CN components, which you should use by default.
- Remember to use "cursor-pointer" to make the element clickable
- For title text, use the "tracking-tight font-bold" class to make the text more readable
- Always make apps MOBILE RESPONSIVE. This is important
- AVOID NESTED CARDS. Try and not to nest cards, borders, components, etc. Nested cards add clutter and make the app look messy.
- AVOID SHADOWS. Avoid adding any shadows to components. stick with a thin border without the shadow.
- Avoid skeletons; instead, use the loader2 component to show a spinning loading state when loading data.


## Landing Pages

You must always create good-looking designer-level styles to your application. 
- Make it well animated and fit a certain "theme", ie neo brutalist, retro, neumorphism, glass morphism, etc

Use known images and emojis from online.

If the user is logged in already, show the get started button to say "Dashboard" or "Profile" instead to take them there.

## Responsiveness and formatting

Make sure pages are wrapped in a container to prevent the width stretching out on wide screens. Always make sure they are centered aligned and not off-center.

Always make sure that your designs are mobile responsive. Verify the formatting to ensure it has correct max and min widths as well as mobile responsiveness.

- Always create sidebars for protected dashboard pages and navigate between pages
- Always create navbars for landing pages
- On these bars, the created logo should be clickable and redirect to the index page

## Animating with Framer Motion

You must add animations to components using Framer Motion. It is already installed and configured in the project.

To use it, import the `motion` component from `framer-motion` and use it to wrap the component you want to animate.


### Other Items to animate
- Fade in and Fade Out
- Slide in and Slide Out animations
- Rendering animations
- Button clicks and UI elements

Animate for all components, including on landing page and app pages.

## Three JS Graphics

Your app comes with three js by default. You can use it to create 3D graphics for landing pages, games, etc.


## Colors

You can override colors in: `src/index.css`

This uses the oklch color format for tailwind v4.

Always use these color variable names.

Make sure all ui components are set up to be mobile responsive and compatible with both light and dark mode.

Set theme using `dark` or `light` variables at the parent className.

## Styling and Theming

When changing the theme, always change the underlying theme of the shad cn components app-wide under `src/components/ui` and the colors in the index.css file.

Avoid hardcoding in colors unless necessary for a use case, and properly implement themes through the underlying shad cn ui components.

When styling, ensure buttons and clickable items have pointer-click on them (don't by default).

Always follow a set theme style and ensure it is tuned to the user's liking.

## Toasts

You should always use toasts to display results to the user, such as confirmations, results, errors, etc.

Use the shad cn Sonner component as the toaster. For example:

```
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
export function SonnerDemo() {
  return (
    <Button
      variant="outline"
      onClick={() =>
        toast("Event has been created", {
          description: "Sunday, December 03, 2023 at 9:00 AM",
          action: {
            label: "Undo",
            onClick: () => console.log("Undo"),
          },
        })
      }
    >
      Show Toast
    </Button>
  )
}
```

Remember to import { toast } from "sonner". Usage: `toast("Event has been created.")`

## Dialogs

Always ensure your larger dialogs have a scroll in its content to ensure that its content fits the screen size. Make sure that the content is not cut off from the screen.

Ideally, instead of using a new page, use a Dialog instead. 

# Using the Convex backend

You will be implementing the convex backend. Follow your knowledge of convex and the documentation to implement the backend.

## The Convex Schema

You must correctly follow the convex schema implementation.

The schema is defined in `src/convex/schema.ts`.

Do not include the `_id` and `_creationTime` fields in your queries (it is included by default for each table).
Do not index `_creationTime` as it is indexed for you. Never have duplicate indexes.


## Convex Actions: Using CRUD operations

When running anything that involves external connections, you must use a convex action with "use node" at the top of the file.

You cannot have queries or mutations in the same file as a "use node" action file. Thus, you must use pre-built queries and mutations in other files.

You can also use the pre-installed internal crud functions for the database:

```ts
// in convex/users.ts
import { crud } from "convex-helpers/server/crud";
import schema from "./schema.ts";

export const { create, read, update, destroy } = crud(schema, "users");

// in some file, in an action:
const user = await ctx.runQuery(internal.users.read, { id: userId });

await ctx.runMutation(internal.users.update, {
  id: userId,
  patch: {
    status: "inactive",
  },
});
```


## Common Convex Mistakes To Avoid

When using convex, make sure:
- Document IDs are referenced as `_id` field, not `id`.
- Document ID types are referenced as `Id<"TableName">`, not `string`.
- Document object types are referenced as `Doc<"TableName">`.
- Keep schemaValidation to false in the schema file.
- You must correctly type your code so that it passes the type checker.
- You must handle null / undefined cases of your convex queries for both frontend and backend, or else it will throw an error that your data could be null or undefined.
- Always use the `@/folder` path, with `@/convex/folder/file.ts` syntax for importing convex files.
- This includes importing generated files like `@/convex/_generated/server`, `@/convex/_generated/api`
- Remember to import functions like useQuery, useMutation, useAction, etc. from `convex/react`
- NEVER have return type validators.
