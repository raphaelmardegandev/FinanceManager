using FinanceManager.API.Data;
using FinanceManager.API.DTOs.Dashboard;
using FinanceManager.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace FinanceManager.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardResponse>> Get(
    int? year,
    int? month)
    {
        var today = DateTime.Today;

        var selectedYear = year ?? today.Year;
        var selectedMonth = month ?? today.Month;

        if (selectedMonth < 1 || selectedMonth > 12)
        {
            return BadRequest("Mês inválido.");
        }

        if (selectedYear < 2000 || selectedYear > 2100)
        {
            return BadRequest("Ano inválido.");
        }

        var startOfMonth = new DateTime(
            selectedYear,
            selectedMonth,
            1);

        var startOfNextMonth = startOfMonth.AddMonths(1);

        var startOfEvolution = startOfMonth.AddMonths(-5);

        var accounts = await _context.Accounts
            .AsNoTracking()
            .Where(x => x.Active)
            .ToListAsync();

        var transactions = await _context.Transactions
            .AsNoTracking()
            .Where(x => x.Active)
            .ToListAsync();

        var initialBalance = accounts.Sum(x => x.InitialBalance);

        var totalIncome = transactions
            .Where(x => x.Type == TransactionType.Income)
            .Sum(x => x.Amount);

        var totalExpense = transactions
            .Where(x => x.Type == TransactionType.Expense)
            .Sum(x => x.Amount);

        var totalBalance =
            initialBalance + totalIncome - totalExpense;

        var monthlyTransactions = transactions
            .Where(x =>
                x.Date >= startOfMonth &&
                x.Date < startOfNextMonth)
            .ToList();

        var monthlyIncome = monthlyTransactions
            .Where(x => x.Type == TransactionType.Income)
            .Sum(x => x.Amount);

        var monthlyExpense = monthlyTransactions
            .Where(x => x.Type == TransactionType.Expense)
            .Sum(x => x.Amount);

        var evolutionTransactions = transactions
            .Where(x => x.Date >= startOfEvolution)
            .ToList();

        var monthlyEvolution = Enumerable
            .Range(0, 6)
            .Select(index =>
            {
                var month = startOfEvolution.AddMonths(index);
                var nextMonth = month.AddMonths(1);

                var monthTransactions = evolutionTransactions
                    .Where(x =>
                        x.Date >= month &&
                        x.Date < nextMonth);

                return new MonthlyEvolutionResponse
                {
                    Month = month.ToString(
                        "MMM",
                        new CultureInfo("pt-BR")),

                    Income = monthTransactions
                        .Where(x => x.Type == TransactionType.Income)
                        .Sum(x => x.Amount),

                    Expense = monthTransactions
                        .Where(x => x.Type == TransactionType.Expense)
                        .Sum(x => x.Amount)
                };
            })
            .ToList();

        var expensesByCategory = monthlyTransactions
    .Where(x => x.Type == TransactionType.Expense)
    .GroupBy(x => x.CategoryId)
    .Select(group => new
    {
        CategoryId = group.Key,
        Amount = group.Sum(x => x.Amount)
    })
    .OrderByDescending(x => x.Amount)
    .ToList();

        var categoryIds = expensesByCategory
            .Select(x => x.CategoryId)
            .ToList();

        var categoryNames = await _context.Categories
            .AsNoTracking()
            .Where(x => categoryIds.Contains(x.Id))
            .ToDictionaryAsync(
                x => x.Id,
                x => x.Name);

        var expensesByCategoryResponse = expensesByCategory
            .Select(x => new CategoryExpenseResponse
            {
                Category = categoryNames.GetValueOrDefault(
                    x.CategoryId,
                    "Sem categoria"),

                Amount = x.Amount
            })
            .ToList();

        var recentTransactions = await _context.Transactions
            .AsNoTracking()
            .Where(x =>
                x.Active &&
                x.Date >= startOfMonth &&
                x.Date < startOfNextMonth)
            .OrderByDescending(x => x.Date)
            .ThenByDescending(x => x.Id)
            .Take(5)
            .Select(x => new RecentTransactionResponse
            {
                Id = x.Id,
                Description = x.Description,
                Category = x.Category.Name,
                Account = x.Account.Name,
                Amount = x.Amount,
                Date = x.Date,
                Type = (int)x.Type
            })
            .ToListAsync();

        var response = new DashboardResponse
        {
            TotalBalance = totalBalance,
            MonthlyIncome = monthlyIncome,
            MonthlyExpense = monthlyExpense,
            MonthlyBalance = monthlyIncome - monthlyExpense,
            MonthlyEvolution = monthlyEvolution,
            ExpensesByCategory = expensesByCategoryResponse,
            RecentTransactions = recentTransactions
        };

        return Ok(response);
    }
}