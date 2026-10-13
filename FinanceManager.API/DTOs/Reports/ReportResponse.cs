namespace FinanceManager.API.DTOs.Reports;

public class ReportResponse
{
    public decimal TotalIncome { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal Balance { get; set; }
    public int TransactionCount { get; set; }

    public List<ReportTransactionResponse> Transactions { get; set; } = [];
}

public class ReportTransactionResponse
{
    public int Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public int Type { get; set; }
    public string Account { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Notes { get; set; }
}