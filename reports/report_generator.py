def generate_report(user, schemes):
    print("\n=== Recommendation Report ===")
    print(f"State: {user['state']}")
    print(f"Income: {user['income']}\n")

    for scheme in schemes:
        print(f"Scheme: {scheme['scheme_name']}")
        print(f"Score: {scheme['score']}")
        print(f"Last Updated: {scheme['last_updated']}\n")
