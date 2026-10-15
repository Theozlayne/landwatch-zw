# LandWatch ZW User Manual

Repository: https://github.com/Theozlayne/landwatch-zw

## 1. Purpose and scope

LandWatch ZW is an academic prototype for a ministry-style land and environmental reporting workflow. A citizen submits a report; authorised staff review, assign and investigate it; the citizen can follow the status of their own reports.

The project uses controlled demonstration data. It is not a legally binding government system, an official land registry, or a public emergency channel. Do not enter real sensitive personal information into a demonstration environment.

## 2. Required software

- Node.js 20 LTS or another compatible LTS release
- npm
- Firebase CLI only when deploying Firebase resources
- Android Studio/emulator or Expo Go for mobile testing, if testing Android

## 3. Install and run locally

From a fresh clone:

```powershell
npm install
Copy-Item .env.example .env.local
```

Edit `.env.local` with the client configuration from the Firebase Console. These are public web-app configuration values, not private service credentials:

```text
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET
```

Start the project:

```powershell
npm start
```

Then use the Expo CLI prompts to open the web version, Android emulator or a development device. For a web preview directly:

```powershell
npm run web
```

Run the available static type check with:

```powershell
npm run typecheck
```

The web export command is:

```powershell
npx expo export --platform web
```

It writes generated output to `dist/`, which is intentionally ignored by Git.

## 4. Firebase setup

The application expects a Firebase project with Email/password Authentication, Firestore Database and Storage enabled. Google Authentication is optional. Deploy `firestore.rules`, `firestore.indexes.json` and the callable Function when those connected features are needed.

An authorised Firebase project owner can deploy:

```powershell
firebase login
firebase use landwatchzw
firebase deploy --only firestore:rules,firestore:indexes,functions,hosting
```

The configured Hosting target is `landwatchzw`. The expected URL is `https://landwatchzw.web.app`, but availability must be confirmed after deployment.

## 5. Demonstration accounts

Do not commit passwords to this repository or share them in the README.

### Citizen

Create a normal Firebase Authentication email/password account through the Firebase Console or registration screen. Citizen accounts can create reports and view their own activity.

### Administrator and investigator

Staff roles are read from the Firestore `users` collection. An authorised project owner should create fictional Authentication users, then create role documents with `displayName`, `email` and one of the roles `admin` or `inspector`.

Only an administrator can invoke the deployed `createInspectorAccount` callable Function. The Function creates an inspector Authentication account and matching Firestore role document. It generates the initial password internally; the project does not expose or commit it. Configure the account’s sign-in/reset process through an approved demonstration procedure.

Never make public self-service administrator registration available.

## 6. Citizen workflow

1. Open the app and choose **Sign in** or **Create account**.
2. Authenticate with a demonstration citizen account.
3. From Home, select **Report**.
4. Choose a category and enter a meaningful description.
5. Capture a location using device permission or enter a place name.
6. Optionally select photographic evidence.
7. Review and submit the report, or save it as a draft.
8. The confirmation screen shows the generated LandWatch reference.
9. Use **Activity** to open the report and view its status.
10. Open report details to read an authorised clarification request when one exists.

AI evidence analysis, where configured, is advisory and does not decide whether an activity is illegal.

## 7. Administrator workflow

1. Sign in with a Firestore user document whose role is `admin`.
2. Review the Overview dashboard and report counts.
3. Open Reports to search and inspect submitted cases.
4. Review the description, approximate location and evidence.
5. Use status controls to move a case through the available review states.
6. Request clarification when more information is needed.
7. Assign a case to an eligible inspector from the staff directory.
8. Open Map and Analytics where connected data are available.
9. Use Settings for identity, system information and the administrator-only user directory.

## 8. Investigator workflow

1. Sign in with a Firestore user document whose role is `inspector`.
2. Open Reports to see cases assigned to the signed-in investigator.
3. Review the citizen-provided information.
4. Update the case status as the investigation progresses.
5. Enter an objective observation, severity and recommended action.
6. Optionally upload investigation evidence.
7. Submit findings for administrative review.

Investigators should record observations rather than legal conclusions. The application does not determine guilt or illegality.

## 9. Roles and access

- Citizen: own reports, own activity and citizen map/profile views.
- Administrator: report review, assignment, user directory, analytics and settings.
- Investigator/field officer: assigned cases and investigation findings.

Backend rules, not hidden buttons alone, are the access boundary.

## 10. Known limitations

- A connected Firebase project and correctly configured `.env.local` are required for real authentication and persistence.
- The repository does not contain privileged demonstration passwords or real user data.
- AI analysis is advisory and may be unavailable; manual review remains required.
- Reward points are displayed as a prototype placeholder and are not implemented as a verified reward mechanism.
- Notification sounds and mobile notification behavior depend on the client environment and permissions.
- Dashboard metrics and charts depend on available Firestore data and are not live government statistics.
- No claim is made that the prototype is production-certified, legally authorised, or fully secure for public enforcement.

## 11. Troubleshooting

### Reports unavailable

Check that Firebase credentials are present in `.env.local`, Firestore is enabled, the signed-in user has the correct role, and network access is available. Confirm rules and indexes are deployed.

### Authentication fails

Confirm the provider is enabled in Firebase Authentication and that the account exists. Do not paste tokens or passwords into the repository or chat.

### Evidence upload fails

Check the Cloudinary public cloud name and unsigned upload preset in `.env.local`, then confirm image permission and network access.

### Inspector creation fails

Confirm that the caller’s Firestore user document has role `admin`, Functions are deployed, and the requested email is not already registered.

### Android build or Expo startup fails

Run `npm install`, then `npm run typecheck`. Check Expo SDK and Node.js versions, clear only the local Metro cache with `npx expo start -c`, and retry. EAS builds require an authenticated Expo account and project access.

## 12. Documentation evidence

The supplied screenshots in `documentation/screenshots` document captured citizen, administrator and investigator paths. The screenshot index identifies states that still require live captures, such as invalid credentials, unauthorized access and unavailable AI service.
