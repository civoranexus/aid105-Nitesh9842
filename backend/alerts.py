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
                    'scheme_id': scheme.get('scheme_id', ''),
                    'scheme_name': scheme['scheme_name'],
                    'category': scheme['category'],
                    'last_updated': scheme['last_updated'],
                    'days_ago': days_since_update,
                    'alert_type': 'update',
                    'priority': 'medium',
                    'benefits': scheme.get('benefits', ''),
                    'message': f"Updated {days_since_update} days ago"
                })
    
    # Sort by days_ago (most recent first)
    recent_updates.sort(key=lambda x: x['days_ago'])
    return recent_updates


def get_new_schemes(user_profile, days=60):
    """
    Get newly added schemes that match user profile
    
    Args:
        user_profile (dict): User profile
        days (int): Number of days to consider as "new"
        
    Returns:
        list: List of new schemes
    """
    schemes = load_csv_data('schemes.csv')
    new_schemes = []
    
    for scheme in schemes:
        if scheme.get('is_active') != 'Yes':
            continue
        
        days_since_update = calculate_days_since_update(scheme.get('last_updated', ''))
        
        # Consider schemes updated within the period as potentially new
        if days_since_update >= 0 and days_since_update <= days:
            if matches_user_profile(scheme, user_profile):
                new_schemes.append({
                    'scheme_id': scheme.get('scheme_id', ''),
                    'scheme_name': scheme['scheme_name'],
                    'category': scheme['category'],
                    'benefits': scheme.get('benefits', ''),
                    'target_group': scheme.get('target_group', ''),
                    'alert_type': 'new',
                    'priority': 'high' if scheme['category'] == user_profile.get('category') else 'medium',
                    'message': 'New scheme matching your profile'
                })
    
    return new_schemes[:10]  # Return top 10


def get_deadline_alerts(user_profile):
    """
    Get deadline alerts for schemes with application windows
    
    Args:
        user_profile (dict): User profile
        
    Returns:
        list: List of deadline alerts
    """
    schemes = load_csv_data('schemes.csv')
    deadline_alerts = []
    
    # Simulate deadline alerts for education/scholarship schemes
    education_keywords = ['Scholarship', 'Fellowship', 'INSPIRE', 'KVPY', 'NTSE', 'Merit']
    
    for scheme in schemes:
        if scheme.get('is_active') != 'Yes':
            continue
        
        if scheme['category'] == 'Education':
            # Check if it's a scholarship/fellowship scheme
            scheme_name = scheme['scheme_name']
            is_scholarship = any(kw.lower() in scheme_name.lower() for kw in education_keywords)
            
            if is_scholarship and matches_user_profile(scheme, user_profile):
                # Generate simulated deadline (for demo purposes)
                deadline_alerts.append({
                    'scheme_id': scheme.get('scheme_id', ''),
                    'scheme_name': scheme['scheme_name'],
                    'category': scheme['category'],
                    'alert_type': 'deadline',
                    'priority': 'high',
                    'deadline_info': 'Application window may be open',
                    'action_required': 'Check official website for exact dates',
                    'benefits': scheme.get('benefits', ''),
                    'message': 'Scholarship - Check application deadline'
                })
    
    return deadline_alerts[:5]  # Return top 5


def check_expiring_schemes(days_ahead=90):
    """
    Check for schemes that might be expiring soon
    
    Args:
        days_ahead (int): Number of days to look ahead for expiring schemes
        
    Returns:
        list: List of schemes approaching expiry
    """
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
        return {
            'gained': [],
            'lost': [],
            'current_income': user_profile['income'],
            'new_income': user_profile['income'],
            'total_current': 0,
            'total_new': 0
        }
    
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
        
        scheme_info = {
            'scheme_id': scheme.get('scheme_id', ''),
            'scheme_name': scheme['scheme_name'],
            'category': scheme['category'],
            'benefits': scheme.get('benefits', ''),
            'income_range': f"₹{min_income:,} - ₹{max_income:,}" if max_income < 999999 else f"₹{min_income:,}+"
        }
        
        # Check current eligibility
        if min_income <= current_income <= max_income:
            currently_eligible.append(scheme_info)
        
        # Check future eligibility
        if min_income <= new_income <= max_income:
            will_be_eligible.append(scheme_info)
    
    gained_names = [s['scheme_name'] for s in will_be_eligible]
    lost_names = [s['scheme_name'] for s in currently_eligible]
    
    gained = [s for s in will_be_eligible if s['scheme_name'] not in lost_names]
    lost = [s for s in currently_eligible if s['scheme_name'] not in gained_names]
    
    return {
        'gained': gained,
        'lost': lost,
        'current_income': current_income,
        'new_income': new_income,
        'total_current': len(currently_eligible),
        'total_new': len(will_be_eligible),
        'income_change': income_change,
        'impact_summary': generate_impact_summary(gained, lost, income_change)
    }


def generate_impact_summary(gained, lost, income_change):
    """Generate a summary of eligibility impact"""
    direction = "increase" if income_change > 0 else "decrease"
    
    if len(gained) > len(lost):
        return f"Income {direction} will give you access to {len(gained)} more schemes"
    elif len(lost) > len(gained):
        return f"Income {direction} may cause you to lose eligibility for {len(lost)} schemes"
    elif len(gained) == 0 and len(lost) == 0:
        return f"Income {direction} will not significantly affect your eligibility"
    else:
        return f"Income {direction} will change eligibility for some schemes"


def generate_alerts(user_profile):
    """
    Generate all relevant alerts for a user
    
    Args:
        user_profile (dict): User profile
        
    Returns:
        dict: All alerts categorized by type
    """
    recent_updates = check_scheme_updates(user_profile, days_threshold=30)
    high_priority = get_high_priority_alerts(user_profile)
    category_alerts = get_category_specific_alerts(user_profile)
    
    alerts = {
        'recent_updates': recent_updates,
        'high_priority': high_priority,
        'category_alerts': category_alerts,
        'deadlines': [],
        'count': 0
    }
    
    # Calculate total alert count
    alerts['count'] = (
        len(alerts['recent_updates']) + 
        len(alerts['high_priority']) + 
        len(alerts['category_alerts']) +
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
    priority_categories = ['Health', 'Insurance', 'Housing', 'Education']
    
    for scheme in schemes:
        if scheme.get('is_active') != 'Yes':
            continue
        
        if scheme.get('category') in priority_categories:
            if matches_user_profile(scheme, user_profile):
                priority_level = 'critical' if scheme['category'] in ['Health', 'Insurance'] else 'high'
                high_priority.append({
                    'scheme_id': scheme.get('scheme_id', ''),
                    'scheme_name': scheme['scheme_name'],
                    'category': scheme['category'],
                    'priority': priority_level,
                    'reason': get_priority_reason(scheme['category']),
                    'alert_type': 'priority',
                    'benefits': scheme.get('benefits', ''),
                    'target_group': scheme.get('target_group', ''),
                    'message': f"Essential {scheme['category'].lower()} scheme for you"
                })
    
    # Sort by priority
    priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
    high_priority.sort(key=lambda x: priority_order.get(x['priority'], 3))
    
    return high_priority[:10]


def get_priority_reason(category):
    """Get the reason for priority based on category"""
    reasons = {
        'Health': 'Healthcare coverage is essential for financial security',
        'Insurance': 'Insurance provides crucial protection against uncertainties',
        'Housing': 'Housing schemes can significantly reduce living costs',
        'Education': 'Education schemes can transform career opportunities'
    }
    return reasons.get(category, f"Essential {category.lower()} scheme")


def get_category_specific_alerts(user_profile):
    """
    Get alerts specific to user's preferred category
    
    Args:
        user_profile (dict): User profile
        
    Returns:
        list: Category specific alerts
    """
    schemes = load_csv_data('schemes.csv')
    category_alerts = []
    
    user_category = user_profile.get('category', '')
    
    for scheme in schemes:
        if scheme.get('is_active') != 'Yes':
            continue
        
        if scheme['category'] == user_category:
            if matches_user_profile(scheme, user_profile):
                category_alerts.append({
                    'scheme_id': scheme.get('scheme_id', ''),
                    'scheme_name': scheme['scheme_name'],
                    'category': scheme['category'],
                    'alert_type': 'category_match',
                    'priority': 'medium',
                    'benefits': scheme.get('benefits', ''),
                    'target_group': scheme.get('target_group', ''),
                    'message': f"Matches your interest in {user_category}"
                })
    
    return category_alerts[:15]


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
    
    # Check age if provided
    age = user_profile.get('age')
    if age:
        try:
            min_age = int(scheme.get('min_age', 0))
            max_age = int(scheme.get('max_age', 100))
            if not (min_age <= int(age) <= max_age):
                return False
        except (ValueError, TypeError):
            pass
    
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
    elif alert_type == 'new':
        return f"🆕 New Scheme: {alert['scheme_name']} - {alert.get('message', '')}"
    elif alert_type == 'category_match':
        return f"📌 {alert['scheme_name']} - {alert.get('message', '')}"
    else:
        return f"ℹ️ {alert.get('scheme_name', 'Alert')}"
    
    return category_alerts[:15]
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
