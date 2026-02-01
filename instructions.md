# Supabase Authentication Setup for Next.js

## Folder Structure

src/
├── app/
│   └── (auth)/
│       ├── _components/
│       │   ├── LoginForm.tsx
│       │   └── SignUpForm.tsx
│       ├── login/
│       │   └── page.tsx
│       ├── signup/
│       │   └── page.tsx
│       ├── update-password/
│       |   └── page.tsx
|       └── utils.ts
└── lib/
    └── supabase/
        └── client.ts/

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 2. Configure Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from your Supabase Dashboard:
- Go to Project Settings → API
- Copy the Project URL and anon/public key

### 3. Configure Supabase Dashboard

#### Email Templates
1. Go to Authentication → Email Templates
2. Customize your email templates if needed (confirmation, password reset, etc.)

#### URL Configuration
1. Go to Authentication → URL Configuration
2. Add your site URL: `http://localhost:3000` (development)
3. Add redirect URLs:
   - `http://localhost:3000/update-password`
   - Add your production URLs when deploying

#### Email Settings
By default, Supabase requires email confirmation for new signups. You can disable this in:
- Authentication → Providers → Email → "Confirm email" toggle

### 4. Key Features Implemented

✅ **Sign Up** - Creates new user account with email confirmation
✅ **Sign In** - Authenticates existing users
✅ **Forgot Password** - Sends password reset email
✅ **Update Password** - Handles password reset after email link click
✅ **Form Validation** - Client-side validation for password strength and matching
✅ **Error Handling** - Displays Supabase error messages to users
✅ **Loading States** - Shows loading indicators during async operations

### 5. Why `src/lib/supabase/client.ts` is the Best Place for the Supabase Client

This follows Next.js and React best practices:

- **Centralized Configuration**: Single source of truth for Supabase instance
- **Environment Variables**: Handles env vars in one place with proper error checking
- **Reusability**: Can be imported anywhere in your app
- **Type Safety**: TypeScript can infer types from the single client instance
- **Follows Next.js Conventions**: The `lib/` folder is the standard location for third-party library configurations

### 6. How the Password Reset Flow Works

1. User clicks "Forgot your password?" on login page
2. User enters their email
3. `resetPassword()` is called, Supabase sends an email with a secure token link
4. User clicks the link in their email
5. They're redirected to `/update-password` with the token in the URL
6. User enters new password
7. `updatePassword()` is called to update their password
8. User is redirected to login

### 7. Usage

Navigate to:
- `/login` - For existing users to sign in
- `/signup` - For new users to create an account

### 8. Next Steps

After authentication, you'll want to:
- Create a protected dashboard route
- Add middleware to protect routes that require authentication
- Handle the user session across your app
- Add user profile functionality

### 9. TypeScript Configuration

Make sure your `tsconfig.json` has path aliases configured:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Components Overview

### LoginForm.tsx
- Handles user login
- Includes "forgot password" functionality
- Switches between login and password reset views
- Redirects to dashboard on successful login

### SignUpForm.tsx
- Handles new user registration
- Validates password matching and strength
- Shows success message prompting user to check email
- Email confirmation required before login (by default)

### update-password/page.tsx
- Handles password reset after email link click
- Validates new password
- Auto-redirects to login after successful update

## Security Notes

- Never commit `.env.local` to version control
- The anon key is safe to use client-side (it's public)
- Supabase handles all security with Row Level Security (RLS)
- Always validate user input on both client and server