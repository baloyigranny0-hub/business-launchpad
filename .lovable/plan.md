# Fix Google authentication

## Changes
- Enable Lovable Cloud’s managed Google sign-in configuration.
- Replace the legacy direct Google OAuth call with the supported Lovable sign-in helper.
- Keep the current return destination so founders land back on the page they originally requested.
- Verify the sign-in button starts the managed Google flow in preview and confirm the app still builds cleanly.

## Technical details
- Update only the Google handler on the existing authentication page; email/password and recovery flows remain unchanged.
- Use the public app origin as the OAuth callback, then rely on the authenticated session to continue to the saved return path.
