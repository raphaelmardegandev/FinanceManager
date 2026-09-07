using System.ComponentModel.DataAnnotations;
using FinanceManager.API.Models;

namespace FinanceManager.API.DTOs.Accounts;

public class CreateAccountRequest
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public AccountType Type { get; set; }

    public decimal InitialBalance { get; set; }
}