namespace FinanceManager.API.DTOs.Dashboard;

public class DashboardResponse
{
    public decimal TotalBalance { get; set; }
    public decimal MonthlyIncome { get; set; }
    public decimal MonthlyExpense { get; set; }
    public decimal MonthlyBalance { get; set; }

    public List<MonthlyEvolutionResponse> MonthlyEvolution { get; set; } = [];
    public List<CategoryExpenseResponse> ExpensesByCategory { get; set; } = [];
    public List<RecentTransactionResponse> RecentTransactions { get; set; } = [];
}

public class MonthlyEvolutionResponse
{
    public string Month { get; set; } = string.Empty;
    public decimal Income { get; set; }
    public decimal Expense { get; set; }
}

public class CategoryExpenseResponse
{
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class RecentTransactionResponse
{
    public int Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Account { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public int Type { get; set; }
}