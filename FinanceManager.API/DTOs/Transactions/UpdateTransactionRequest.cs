using System.ComponentModel.DataAnnotations;
using FinanceManager.API.Models;

namespace FinanceManager.API.DTOs.Transactions;

public class UpdateTransactionRequest
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Description { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [Required]
    public DateTime Date { get; set; }

    [Required]
    public TransactionType Type { get; set; }

    [Required]
    public int AccountId { get; set; }

    [Required]
    public int CategoryId { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    public bool Active { get; set; }
}