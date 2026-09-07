namespace FinanceManager.API.Models;

public enum AccountType
{
    CheckingAccount = 1,
    SavingsAccount = 2,
    Wallet = 3,
    Investment = 4,
    Other = 5
}

public class Account
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public AccountType Type { get; set; }

    public decimal InitialBalance { get; set; }

    public bool Active { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}