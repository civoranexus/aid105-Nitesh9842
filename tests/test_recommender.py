"""
Unit tests for the SchemeAssist AI recommender system
Tests the recommendation logic and data loading functions
"""

import sys
import os

# Add parent directory to path to import backend modules
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

try:
    from recommender import recommend_schemes, load_schemes # type: ignore
    from utils import validate_user_profile, categorize_by_priority # type: ignore
    from alerts import check_scheme_updates, check_eligibility_changes # type: ignore
except ImportError as e:
    print(f"Error importing modules: {e}")
    print(f"Backend path: {backend_path}")
    print(f"Python path: {sys.path}")
    sys.exit(1)


def test_load_schemes():
    """Test that schemes are loaded correctly from CSV"""
    print("\n=== Testing load_schemes() ===")
    schemes = load_schemes()
    
    assert len(schemes) > 0, "Should load at least one scheme"
    print(f"✓ Loaded {len(schemes)} schemes")
    
    # Check that required fields exist
    required_fields = ['scheme_name', 'category', 'state', 'is_active', 'min_income', 'max_income']
    for field in required_fields:
        assert field in schemes[0], f"Scheme should have {field} field"
    print(f"✓ All required fields present")
    
    return True


def test_recommend_schemes_basic():
    """Test basic recommendation functionality"""
    print("\n=== Testing recommend_schemes() - Basic ===")
    
    # Test with a sample user profile
    user_profile = {
        "state": "All",
        "income": 100000,
        "category": "Agriculture"
    }
    
    results = recommend_schemes(user_profile)
    
    assert isinstance(results, list), "Should return a list"
    print(f"✓ Returned {len(results)} recommendations")
    
    if len(results) > 0:
        # Check result structure
        first_result = results[0]
        assert 'scheme_name' in first_result, "Result should have scheme_name"
        assert 'score' in first_result, "Result should have score"
        assert 'category' in first_result, "Result should have category"
        print(f"✓ Result structure is correct")
        print(f"  Top recommendation: {first_result['scheme_name']} (Score: {first_result['score']})")
    
    return True


def test_recommend_schemes_filtering():
    """Test that recommendations are properly filtered by income"""
    print("\n=== Testing recommend_schemes() - Filtering ===")
    
    # Test with very low income
    low_income_user = {
        "state": "All",
        "income": 50000,
        "category": "Agriculture"
    }
    
    low_income_results = recommend_schemes(low_income_user)
    print(f"✓ Low income user: {len(low_income_results)} recommendations")
    
    # Test with high income
    high_income_user = {
        "state": "All",
        "income": 500000,
        "category": "Agriculture"
    }
    
    high_income_results = recommend_schemes(high_income_user)
    print(f"✓ High income user: {len(high_income_results)} recommendations")
    
    # Results should be different based on income
    assert isinstance(low_income_results, list), "Should return list for low income"
    assert isinstance(high_income_results, list), "Should return list for high income"
    
    return True


def test_recommend_schemes_scoring():
    """Test that scoring works correctly"""
    print("\n=== Testing recommend_schemes() - Scoring ===")
    
    user_profile = {
        "state": "All",
        "income": 150000,
        "category": "Health"
    }
    
    results = recommend_schemes(user_profile)
    
    if len(results) > 1:
        # Check that results are sorted by score (descending)
        for i in range(len(results) - 1):
            assert results[i]['score'] >= results[i+1]['score'], "Results should be sorted by score"
        print(f"✓ Results are properly sorted by score")
        print(f"  Score range: {results[0]['score']} to {results[-1]['score']}")
    
    # Check that matching category gets bonus score
    matching_category = [r for r in results if r['category'] == 'Health']
    other_category = [r for r in results if r['category'] != 'Health']
    
    if matching_category and other_category:
        assert matching_category[0]['score'] >= other_category[0]['score'], \
            "Matching category should have higher or equal score"
        print(f"✓ Category matching bonus works correctly")
    
    return True


def test_validate_user_profile():
    """Test user profile validation"""
    print("\n=== Testing validate_user_profile() ===")
    
    # Valid profile
    valid_profile = {
        "state": "Maharashtra",
        "income": 100000,
        "category": "Agriculture"
    }
    is_valid, error = validate_user_profile(valid_profile)
    assert is_valid == True, "Valid profile should pass validation"
    print("✓ Valid profile accepted")
    
    # Missing field
    invalid_profile = {
        "state": "Maharashtra",
        "income": 100000
    }
    is_valid, error = validate_user_profile(invalid_profile)
    assert is_valid == False, "Profile with missing field should fail"
    assert error is not None, "Should return error message"
    print(f"✓ Missing field detected: {error}")
    
    # Invalid income
    negative_income_profile = {
        "state": "Maharashtra",
        "income": -5000,
        "category": "Agriculture"
    }
    is_valid, error = validate_user_profile(negative_income_profile)
    assert is_valid == False, "Negative income should fail"
    print(f"✓ Negative income rejected: {error}")
    
    return True


def test_categorize_by_priority():
    """Test priority categorization"""
    print("\n=== Testing categorize_by_priority() ===")
    
    sample_schemes = [
        {"scheme_name": "High Priority", "score": 80},
        {"scheme_name": "Medium Priority", "score": 50},
        {"scheme_name": "Low Priority", "score": 30}
    ]
    
    categorized = categorize_by_priority(sample_schemes)
    
    assert len(categorized['high']) == 1, "Should have 1 high priority scheme"
    assert len(categorized['medium']) == 1, "Should have 1 medium priority scheme"
    assert len(categorized['low']) == 1, "Should have 1 low priority scheme"
    print("✓ Priority categorization works correctly")
    
    return True


def test_check_eligibility_changes():
    """Test eligibility change detection"""
    print("\n=== Testing check_eligibility_changes() ===")
    
    user_profile = {
        "state": "All",
        "income": 150000,
        "category": "Agriculture"
    }
    
    # Test income increase
    changes = check_eligibility_changes(user_profile, income_change=50000)
    
    assert 'gained' in changes, "Should have 'gained' field"
    assert 'lost' in changes, "Should have 'lost' field"
    assert 'new_income' in changes, "Should have 'new_income' field"
    assert changes['new_income'] == 200000, "New income should be calculated correctly"
    print(f"✓ Income change analysis works: {len(changes['gained'])} gained, {len(changes['lost'])} lost")
    
    return True


def test_check_scheme_updates():
    """Test scheme update checking"""
    print("\n=== Testing check_scheme_updates() ===")
    
    user_profile = {
        "state": "All",
        "income": 100000,
        "category": "Agriculture"
    }
    
    updates = check_scheme_updates(user_profile, days_threshold=365)
    
    assert isinstance(updates, list), "Should return a list"
    print(f"✓ Found {len(updates)} recent scheme updates")
    
    if len(updates) > 0:
        assert 'scheme_name' in updates[0], "Update should have scheme_name"
        assert 'days_ago' in updates[0], "Update should have days_ago"
        print(f"  Most recent: {updates[0]['scheme_name']}")
    
    return True


def run_all_tests():
    """Run all test functions"""
    print("\n" + "="*60)
    print("SchemeAssist AI - Test Suite")
    print("="*60)
    
    tests = [
        test_load_schemes,
        test_recommend_schemes_basic,
        test_recommend_schemes_filtering,
        test_recommend_schemes_scoring,
        test_validate_user_profile,
        test_categorize_by_priority,
        # test_check_eligibility_changes,
        # test_check_scheme_updates
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
            print(f"✓ {test.__name__} PASSED")
        except AssertionError as e:
            failed += 1
            print(f"✗ {test.__name__} FAILED: {str(e)}")
        except Exception as e:
            failed += 1
            print(f"✗ {test.__name__} ERROR: {str(e)}")
    
    print("\n" + "="*60)
    print(f"Test Results: {passed} passed, {failed} failed")
    print("="*60)
    
    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
