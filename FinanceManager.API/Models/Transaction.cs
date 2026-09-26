namespace FinanceManager.API.Models;

public enum TransactionType
{
    Income = 1,
    Expense = 2
}

public class Transaction
{
    public int Id { get; set; }

    public string Description { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public DateTime Date { get; set; }

    public TransactionType Type { get; set; }

    public int AccountId { get; set; }

    public int CategoryId { get; set; }

    public string? Notes { get; set; }

    public bool Active { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public Account Account { get; set; } = null!;

    public Category Category { get; set; } = null!;
}