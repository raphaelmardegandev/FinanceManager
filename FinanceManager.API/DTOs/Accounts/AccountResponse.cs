using FinanceManager.API.Models;

namespace FinanceManager.API.DTOs.Accounts;

public class AccountResponse
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public AccountType Type { get; set; }

    public decimal InitialBalance { get; set; }

    public bool Active { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}