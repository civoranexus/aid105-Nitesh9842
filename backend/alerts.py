"""
Alert system for SchemeAssist AI
Provides notifications about scheme updates, eligibility changes, and deadlines
"""

from datetime import datetime, timedelta
from utils import calculate_days_since_update, load_csv_data


def check_scheme_updates(user_profile, days_threshold=30):
    """
    Check for recently updated schemes that match user profile
    
    Args:
        user_profile (dict): User profile with state, income, category
        days_threshold (int): Number of days to consider as "recent" update
        
    Returns:
        list: List of recently updated schemes
    """
    schemes = load_csv_data('schemes.csv')
    recent_updates = []
    
    for scheme in schemes:
        if scheme.get('is_active') != 'Yes':
            continue
        
        days_since_update = calculate_days_since_update(scheme.get('last_updated', ''))
        
        if days_since_update >= 0 and days_since_update <= days_threshold:
            # Check if scheme matches user profile
            if matches_user_profile(scheme, user_profile):
                recent_updates.append({
                    'scheme_name': scheme['scheme_name'],
                    'category': scheme['category'],
                    'last_updated': scheme['last_updated'],
                    'days_ago': days_since_update,
                    'alert_type': 'update'
                })
    
    return recent_updates


def check_expiring_schemes(days_ahead=90):
    """
    Check for schemes that might be expiring soon
    (This is a placeholder - in real implementation, schemes would have expiry dates)
    
    Args:
        days_ahead (int): Number of days to look ahead for expiring schemes
        
    Returns:
        list: List of schemes approaching expiry
    """
    # In a real system, this would check against actual expiry dates
    # For now, returning empty list as schemes.csv doesn't have expiry dates
    return []


def check_eligibility_changes(user_profile, income_change=0):
    """
    Check if income changes would affect scheme eligibility
    
    Args:
        user_profile (dict): Current user profile
        income_change (int): Potential income change amount
        
    Returns:
        dict: Schemes gained/lost due to income change
    """
    if income_change == 0:
        return {'gained': [], 'lost': []}
    
    current_income = user_profile['income']
    new_income = current_income + income_change
    
    schemes = load_csv_data('schemes.csv')
    
    currently_eligible = []
    will_be_eligible = []
    
    for scheme in schemes:
        if scheme.get('is_active') != 'Yes':
            continue
        
        if not matches_state(scheme, user_profile):
            continue
        
        min_income = int(scheme.get('min_income', 0))
        max_income = int(scheme.get('max_income', 999999))
        
        # Check current eligibility
        if min_income <= current_income <= max_income:
            currently_eligible.append(scheme['scheme_name'])
        
        # Check future eligibility
        if min_income <= new_income <= max_income:
            will_be_eligible.append(scheme['scheme_name'])
    
    gained = [s for s in will_be_eligible if s not in currently_eligible]
    lost = [s for s in currently_eligible if s not in will_be_eligible]
    
    return {
        'gained': gained,
        'lost': lost,
        'new_income': new_income
    }


def generate_alerts(user_profile):
    """
    Generate all relevant alerts for a user
    
    Args:
        user_profile (dict): User profile
        
    Returns:
        dict: All alerts categorized by type
    """
    alerts = {
        'recent_updates': check_scheme_updates(user_profile, days_threshold=30),
        'high_priority': get_high_priority_alerts(user_profile),
        'deadlines': [],  # Placeholder for deadline alerts
        'count': 0
    }
    
    # Calculate total alert count
    alerts['count'] = (
        len(alerts['recent_updates']) + 
        len(alerts['high_priority']) + 
        len(alerts['deadlines'])
    )
    
    return alerts


def get_high_priority_alerts(user_profile):
    """
    Get high priority alerts for time-sensitive or important schemes
    
    Args:
        user_profile (dict): User profile
        
    Returns:
        list: High priority alerts
    """
    schemes = load_csv_data('schemes.csv')
    high_priority = []
    
    # Define high priority categories
    priority_categories = ['Health', 'Insurance', 'Housing']
    
    for scheme in schemes:
        if scheme.get('is_active') != 'Yes':
            continue
        
        if scheme.get('category') in priority_categories:
            if matches_user_profile(scheme, user_profile):
                high_priority.append({
                    'scheme_name': scheme['scheme_name'],
                    'category': scheme['category'],
                    'priority': 'high',
                    'reason': f"Essential {scheme['category'].lower()} scheme",
                    'alert_type': 'priority'
                })
    
    return high_priority


def matches_user_profile(scheme, user_profile):
    """
    Check if a scheme matches the user's profile
    
    Args:
        scheme (dict): Scheme data
        user_profile (dict): User profile
        
    Returns:
        bool: True if scheme matches user profile
    """
    # Check state
    if not matches_state(scheme, user_profile):
        return False
    
    # Check income
    try:
        min_income = int(scheme.get('min_income', 0))
        max_income = int(scheme.get('max_income', 999999))
        income = int(user_profile['income'])
        
        if not (min_income <= income <= max_income):
            return False
    except (ValueError, KeyError):
        return False
    
    return True


def matches_state(scheme, user_profile):
    """
    Check if scheme state matches user state
    
    Args:
        scheme (dict): Scheme data
        user_profile (dict): User profile
        
    Returns:
        bool: True if states match
    """
    scheme_state = scheme.get('state', '')
    user_state = user_profile.get('state', '')
    
    return scheme_state == 'All' or scheme_state == user_state


def format_alert_message(alert):
    """
    Format an alert into a human-readable message
    
    Args:
        alert (dict): Alert data
        
    Returns:
        str: Formatted alert message
    """
    alert_type = alert.get('alert_type', 'info')
    
    if alert_type == 'update':
        return f"🔔 {alert['scheme_name']} was updated {alert['days_ago']} days ago"
    elif alert_type == 'priority':
        return f"⚠️ High Priority: {alert['scheme_name']} - {alert['reason']}"
    elif alert_type == 'deadline':
        return f"⏰ Deadline Alert: {alert['scheme_name']} - {alert.get('deadline_info', 'Action required')}"
    else:
        return f"ℹ️ {alert.get('scheme_name', 'Alert')}"
