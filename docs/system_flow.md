# System Flow Documentation

## Architecture Diagram
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│    Data     │
│  (HTML/JS)  │◀────│   (Flask)   │◀────│  (CSV/JSON) │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Request Flow

### 1. User Registration/Input
- User enters profile details via web form
- Data validated on frontend

### 2. API Request
- Frontend sends POST request to `/recommend`
- Backend receives user profile JSON

### 3. Recommendation Processing
- Load schemes from database
- Calculate eligibility scores
- Sort by relevance

### 4. Response
- Return ranked scheme list
- Display results to user

## Alert System Flow
```
Scheduler → Check Deadlines → Filter Applicable → Send Notifications
```

## Report Generation Flow
```
User Request → Fetch Profile → Get Recommendations → Generate Markdown → Download
```
