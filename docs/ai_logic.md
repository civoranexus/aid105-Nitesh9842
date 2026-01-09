# AI/ML Logic Documentation

## Eligibility Scoring Algorithm

### Current Implementation (Rule-Based)
```
Score = 0
IF user.age >= scheme.min_age THEN score += 1
IF user.income <= scheme.max_income THEN score += 1
IF user.category IN scheme.categories THEN score += 1
IF user.state == scheme.state OR scheme.state == "All" THEN score += 1
```

### Scoring Interpretation
- **4/4**: Highly eligible - Strong match
- **3/4**: Eligible - Good match
- **2/4**: Possibly eligible - Partial match
- **1/4 or below**: Not recommended

## Future ML Enhancements
1. **Collaborative Filtering**: Recommend based on similar user profiles
2. **NLP Processing**: Extract eligibility from scheme documents
3. **Predictive Analytics**: Predict approval probability
4. **Personalization**: Learn from user feedback

## Data Flow
```
User Input → Preprocessing → Eligibility Check → Scoring → Ranking → Output
```
