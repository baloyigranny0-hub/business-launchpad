# Secure, industry-aware Foundry workspace

## Outcome
Founders must create an account or sign in before onboarding, the dashboard, coach, roadmap, or templates are available. Compliance guidance and every generated response will use the founder’s selected industry, country, city, and business stage.

## Build
- Add a protected founder profile with display name, industry preferences, country, city, and onboarding status. Keep it separate from account credentials and restrict each founder to their own record.
- Guard all workspace pages. Signed-out visitors are sent to sign in; after authentication they continue to onboarding or their intended page.
- Improve sign-up and sign-in with Google plus email/password, confirmation messaging, return-path handling, forgot-password, and public password-reset pages.
- Require the minimum business context before entering the dashboard or requesting AI output: industry, country, city/municipality, customer, and business idea.
- Create a hybrid compliance template library:
  - Curated starter packs for common sectors such as food/hospitality, beauty/wellness, retail/e-commerce, professional services, construction/trades, transport/logistics, manufacturing, agriculture, healthcare, education, and technology.
  - A tailored fallback for industries outside the starter library.
  - Country and municipal sections, industry regulator/permit sections, evidence/document checklists, renewal dates, responsible authority, costs/timelines where known, and verification warnings where rules may change.
- Add an Industry Compliance workspace where founders choose a relevant pack, generate their personalized checklist, and save/edit the result in their existing workspace.
- Strengthen all AI actions—analysis, coach answers, plans, and document drafts—so they reject generic output and explicitly anchor recommendations to the founder’s industry and location. If context is missing, the app asks for it instead of guessing.
- Keep existing workspace progress and notes; no wipe or replacement of founder data.

## Technical details
- Add a `profiles` table with owner-only row security, explicit authenticated/service grants, automatic creation on account creation, and safe update policies.
- Add an `industry_compliance` JSON field to each workspace for selected pack, generated checklist, and saved edits.
- Add authenticated route guards and onboarding/context guards in React Router.
- Extend the existing coach function with a structured compliance-template action and server-side authentication checks.
- Use the existing design system and responsive workspace layout.

## Verification
- Confirm signed-out users cannot access any `/app` page or onboarding.
- Confirm sign-in returns founders to the correct next screen.
- Confirm profiles and compliance templates are private per founder.
- Test at least two different industries and verify their permits, authorities, documents, and advice differ meaningfully.
- Run security checks, focused tests, and desktop/mobile browser checks.
