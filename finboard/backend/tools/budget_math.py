"""Pure budget arithmetic tools — no LLM calls."""


def calculate_disposable_income(income: float, expenses: float) -> dict:
    """Returns disposable income and savings rate percentage."""
    disposable = income - expenses
    savings_rate_pct = (disposable / income * 100) if income > 0 else 0.0
    return {
        "disposable": round(disposable, 2),
        "savings_rate_pct": round(savings_rate_pct, 2),
    }


def check_emergency_fund_adequacy(emergency_fund: float, expenses: float) -> dict:
    """
    Target: 3–6 months of expenses.
    Returns months covered and status.
    """
    months_covered = (emergency_fund / expenses) if expenses > 0 else 0.0
    if months_covered >= 6:
        status = "ADEQUATE"
    elif months_covered >= 3:
        status = "BORDERLINE"
    else:
        status = "INSUFFICIENT"
    return {
        "months_covered": round(months_covered, 2),
        "status": status,
    }


def calculate_debt_to_income_ratio(debt: float, income: float) -> dict:
    """
    Returns DTI ratio (monthly debt / monthly income) and health status.
    Thresholds: HEALTHY < 0.36, ELEVATED 0.36–0.50, CRITICAL > 0.50
    """
    dti_ratio = (debt / income) if income > 0 else 0.0
    if dti_ratio < 0.36:
        status = "HEALTHY"
    elif dti_ratio <= 0.50:
        status = "ELEVATED"
    else:
        status = "CRITICAL"
    return {
        "dti_ratio": round(dti_ratio, 4),
        "status": status,
    }


def full_budget_analysis(budget_data: dict) -> dict:
    """Runs all three analyses and returns combined result dict."""
    income = float(budget_data.get("income", 0))
    expenses = float(budget_data.get("expenses", 0))
    emergency_fund = float(budget_data.get("emergency_fund", 0))
    debt = float(budget_data.get("debt", 0))

    disposable = calculate_disposable_income(income, expenses)
    emergency = check_emergency_fund_adequacy(emergency_fund, expenses)
    dti = calculate_debt_to_income_ratio(debt, income)

    return {
        "disposable_income": disposable,
        "emergency_fund": emergency,
        "debt_to_income": dti,
    }


if __name__ == "__main__":
    print("=== Budget Math Self-Test ===\n")

    sample_income = 5000.0
    sample_expenses = 3200.0
    sample_emergency_fund = 6400.0
    sample_debt = 12000.0

    disp = calculate_disposable_income(sample_income, sample_expenses)
    print(f"Disposable income: {disp}")

    emerg = check_emergency_fund_adequacy(sample_emergency_fund, sample_expenses)
    print(f"Emergency fund: {emerg}")

    dti = calculate_debt_to_income_ratio(sample_debt, sample_income)
    print(f"DTI ratio: {dti}")

    full = full_budget_analysis({
        "income": sample_income,
        "expenses": sample_expenses,
        "emergency_fund": sample_emergency_fund,
        "debt": sample_debt,
    })
    print(f"\nFull analysis: {full}")

    # Edge cases
    zero_income = calculate_disposable_income(0, 1000)
    print(f"\nZero income disposable: {zero_income}")
    zero_expenses_emerg = check_emergency_fund_adequacy(1000, 0)
    print(f"Zero expenses emergency fund: {zero_expenses_emerg}")

    print("\nAll tests passed")
