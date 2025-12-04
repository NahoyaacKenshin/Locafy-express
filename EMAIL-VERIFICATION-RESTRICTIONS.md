# Email Verification Restrictions

## Current Implementation

### ✅ What Unverified Users CAN Do (No Auth Required)
- ✅ Browse businesses (public endpoints)
- ✅ View business details
- ✅ Search businesses
- ✅ View discussions (read-only)
- ✅ View favorite counts

### ❌ What Unverified Users CANNOT Do
- ❌ Create discussions
- ❌ Update/delete discussions
- ❌ Add/remove favorites
- ❌ View own favorites
- ❌ Check favorite status

---

## Implementation Details

### Email Verification Middleware
Created `EmailVerificationMiddleware` that:
- Checks if user is authenticated
- Verifies user's email is verified
- Blocks access if email not verified
- Returns clear error message

### Protected Endpoints

#### Discussion Endpoints (Require Email Verification)
- `POST /api/discussions` - Create discussion
- `GET /api/discussions/user/my-discussions` - View own discussions
- `PUT /api/discussions/:id` - Update discussion
- `DELETE /api/discussions/:id` - Delete discussion

#### Favorite Endpoints (Require Email Verification)
- `GET /api/favorites` - View own favorites
- `GET /api/favorites/check/:businessId` - Check favorite status
- `POST /api/favorites` - Add favorite
- `POST /api/favorites/toggle` - Toggle favorite
- `DELETE /api/favorites/:businessId` - Remove favorite

---

## Current Login Behavior

### Credentials Login
- **Requires email verification** to login
- Unverified users cannot get access tokens
- **Result:** Unverified users cannot authenticate via credentials

### OAuth Login
- **Auto-verifies email** on first login
- Users are automatically verified
- **Result:** OAuth users are always verified

---

## User Flow Scenarios

### Scenario 1: Unverified User (Credentials)
```
1. User signs up → Email not verified
2. User tries to login → Blocked (403 - "Please verify your email first")
3. User cannot get access token
4. User can still browse businesses (public endpoints) ✅
5. User cannot create discussions/favorites (no token) ✅
```

### Scenario 2: Unverified User (OAuth - Edge Case)
```
1. User signs up via OAuth → Usually auto-verified
2. If somehow not verified → Middleware blocks discussions/favorites
3. User can browse businesses ✅
4. User cannot create discussions/favorites (403) ✅
```

### Scenario 3: Verified User
```
1. User verifies email
2. User logs in → Gets access token
3. User can browse businesses ✅
4. User can create discussions ✅
5. User can manage favorites ✅
```

---

## Error Messages

### Unverified User Tries to Create Discussion
```json
{
  "code": 403,
  "status": "error",
  "message": "Email verification required. Please verify your email to participate in discussions and favorites."
}
```

### Unverified User Tries to Add Favorite
```json
{
  "code": 403,
  "status": "error",
  "message": "Email verification required. Please verify your email to participate in discussions and favorites."
}
```

---

## Security Considerations

### Why This Approach?

1. **Public Browsing Allowed** - No authentication needed
   - Users can explore before committing
   - Better user experience
   - Encourages sign-ups

2. **Community Participation Restricted** - Requires verification
   - Prevents spam accounts
   - Ensures real users
   - Maintains community quality

3. **Login Already Protected** - Credentials login requires verification
   - First line of defense
   - Middleware is backup protection
   - Handles edge cases

---

## Testing Scenarios

### Test 1: Unverified User Browses
```http
GET /api/businesses
```
**Expected:** ✅ 200 OK (public endpoint)

### Test 2: Unverified User Tries Discussion
```http
POST /api/discussions
Authorization: Bearer <unverified-token>
```
**Expected:** ❌ 403 Forbidden (if somehow has token)

### Test 3: Verified User Creates Discussion
```http
POST /api/discussions
Authorization: Bearer <verified-token>
```
**Expected:** ✅ 201 Created

---

## Summary

✅ **Unverified users CAN:**
- Browse all public business endpoints
- View discussions (read-only)
- View favorite counts

❌ **Unverified users CANNOT:**
- Create discussions
- Manage favorites
- Participate in community features

**Note:** Since credentials login requires email verification, unverified users typically cannot authenticate. The middleware provides additional protection for edge cases (OAuth, future login changes, etc.).

---

## Future Considerations

If you want to allow unverified users to login but restrict actions:
1. Modify login service to allow unverified login
2. Middleware already in place to restrict actions
3. Users can browse but not participate until verified

Current implementation: Login blocks unverified users, so they can only browse (which is what you want).

