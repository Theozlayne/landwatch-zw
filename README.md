# LandWatch ZW

LandWatch ZW is an academic civic-reporting prototype for receiving citizen reports about land and environmental activity, recording approximate locations and evidence, and routing reports through authorised administrative and investigator workflows.

This repository contains an Expo/React Native application that also supports web through Expo, Firebase Authentication and Firestore rules, and one Firebase callable function for administrator-created inspector accounts. It uses controlled demonstration data. It is not a government service, a legal reporting channel, or a replacement for official land authorities.

## Implemented areas

- Citizen email/password registration, sign-in and Google sign-in where enabled in Firebase.
- Citizen report creation with category, description, location and optional image evidence.
- Citizen drafts, activity history, report details and status updates.
- Administrator report queue, review/status actions, assignment, staff/user directory and operational analytics screens.
- Investigator/field-officer access to assigned reports, status updates and investigation findings.
- Firebase security rules for citizen-owned reports and staff access.
- Advisory AI evidence analysis when the configured service is available. AI output is an indicator for human review; it does not determine illegality.
- Expo Android configuration with the Zimbabwe coat of arms and package identifier `zw.landwatch.citizen`.

Some displayed metrics, reward points, notification behavior and analytics are prototype presentation elements or depend on backend data. They must not be treated as verified operational measures without a connected and populated Firebase project.

## Requirements

- Node.js 20 LTS or a compatible current LTS release.
- npm.
- Expo CLI through the project dependencies.
- A Firebase project with Authentication, Firestore and Storage configured for local development.
- Optional: Firebase CLI for rules, Functions and Hosting deployment.
- Optional: EAS CLI for Android builds.

## Local setup

```powershell
git clone https://github.com/Theozlayne/landwatch-zw.git
cd landwatch-zw
npm install
Copy-Item .env.example .env.local
# Edit .env.local with the Firebase web-app values.
npm run typecheck
npm start
```

Use the Expo terminal to open the web preview, Android emulator or Expo Go development session. The local interface can load without a correctly configured backend, but authentication and report persistence require the Firebase values and services described in [docs/USER_MANUAL.md](docs/USER_MANUAL.md).

## Useful commands

```powershell
npm start
npm run web
npm run android
npm run typecheck
npx expo export --platform web
```

The repository does not include privileged credentials, Firebase service-account files or demonstration passwords. Create demonstration accounts through Firebase Authentication and assign staff roles only through the documented administrator setup procedure.

## Firebase and deployment

The Firebase project alias in `.firebaserc` is `landwatchzw`, and the Hosting target is `landwatchzw`. The configured Hosting URL is expected to be `https://landwatchzw.web.app`; confirm that URL after a deployment rather than treating configuration as proof that Hosting is currently live.

Rules and Functions can be deployed by an authorised project owner:

```powershell
firebase login
firebase use landwatchzw
firebase deploy --only firestore:rules,firestore:indexes,functions,hosting
```

Do not commit `.env.local`, Firebase tokens, service-account JSON files or real user records.

## Documentation

The run and role workflow instructions are in [docs/USER_MANUAL.md](docs/USER_MANUAL.md). Supplied workflow screenshots are in [documentation/screenshots](documentation/screenshots).

## Academic limitations

This is a prototype. It does not establish official government authority, guarantee production security, provide a complete notification service, implement a reward mechanism, or prove that AI can identify illegal conduct. Firebase configuration, authorised accounts and populated test data are required for a meaningful connected demonstration.
