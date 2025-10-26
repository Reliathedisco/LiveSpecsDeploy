# Auth0 Migration Guide

This project has been migrated from Clerk to Auth0. Follow these steps to complete the setup:

## 1. Auth0 Setup

1. Create an Auth0 account at [auth0.com](https://auth0.com)
2. Create a new application in Auth0 Dashboard:
   - Choose "Regular Web Application"
   - Note your Domain, Client ID, and Client Secret

## 2. Environment Variables

Create a `.env.local` file based on `.env.local.example`:

```bash
# Auth0 Configuration
AUTH0_SECRET='[use openssl rand -hex 32 to generate]'
AUTH0_BASE_URL='http://localhost:5000' # Change for production
AUTH0_ISSUER_BASE_URL='https://YOUR_DOMAIN.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
```

## 3. Auth0 Application Settings

In your Auth0 Dashboard, configure:

**Allowed Callback URLs:**
```
http://localhost:5000/api/auth/callback
https://yourdomain.com/api/auth/callback
```

**Allowed Logout URLs:**
```
http://localhost:5000/
https://yourdomain.com/
```

**Allowed Web Origins:**
```
http://localhost:5000
https://yourdomain.com
```

## 4. Database Migration

The Prisma schema has been updated to use Auth0. The database column remains `clerk_id` for backward compatibility, but the Prisma client uses `auth0Id`.

Run Prisma migrations:
```bash
cd livespecs
npx prisma generate
npx prisma migrate dev
```

## 5. Authentication Flow

- **Login**: Users are redirected to `/api/auth/login`
- **Logout**: Users are redirected to `/api/auth/logout`
- **Callback**: Handled by `/api/auth/callback`
- **User Profile**: Available at `/api/auth/me`

## 6. Protected Routes

Routes are protected using middleware. The following paths require authentication:
- `/dashboard/*`
- `/api/*` (except auth routes)
- `/docs/*`

## 7. API Route Pattern

All API routes now use the Auth0 wrapper:

```typescript
import { getAuth0User } from "@/lib/auth0"
import { withApiAuthRequired } from '@auth0/nextjs-auth0'
import { NextRequest, NextResponse } from "next/server"

export const GET = withApiAuthRequired(async function handler(request: NextRequest) {
  const user = await getAuth0User(request)
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Your logic here
  // Access user.sub (Auth0 ID), user.email, user.name, user.picture
})
```

## 8. Client-Side Usage

In React components:

```typescript
import { useUser } from "@auth0/nextjs-auth0/client"

export function MyComponent() {
  const { user, isLoading } = useUser()
  
  if (isLoading) return <div>Loading...</div>
  if (!user) return <div>Please log in</div>
  
  return <div>Hello {user.name}</div>
}
```

## 9. Remaining Clerk References

Some API routes may still need to be updated. Search for remaining Clerk imports:
```bash
grep -r "@clerk" livespecs/app/api/
```

Update them following the pattern in `/app/api/specs/create/route.ts`.

## 10. Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test authentication:
   - Visit `/sign-in` - should redirect to Auth0
   - After login, should redirect to `/dashboard`
   - API routes should require authentication

## Troubleshooting

- **"No Auth0 user found"**: Check that AUTH0_* environment variables are set
- **Redirect issues**: Verify callback URLs in Auth0 dashboard match your environment
- **Database errors**: The column is still named `clerk_id` in the database but accessed as `auth0Id` in code
