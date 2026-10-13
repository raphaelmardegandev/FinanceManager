
using FinanceManager.API.Data;
using FinanceManager.API.DTOs.Reports;
using FinanceManager.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinanceManager.API.Services;

namespace FinanceManager.API.Controllers;


[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReportsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ReportResponse>> Get(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] TransactionType? type,
        [FromQuery] int? accountId,
        [FromQuery] int? categoryId)
    {
        if (startDate.HasValue &&
            endDate.HasValue &&
            startDate.Value.Date > endDate.Value.Date)
        {
            return BadRequest(
                "A data inicial não pode ser maior que a data final.");
        }

        if (type.HasValue &&
            !Enum.IsDefined(typeof(TransactionType), type.Value))
        {
            return BadRequest("Tipo de transação inválido.");
        }

        if (accountId.HasValue && accountId.Value <= 0)
        {
            return BadRequest("Conta inválida.");
        }

        if (categoryId.HasValue && categoryId.Value <= 0)
        {
            return BadRequest("Categoria inválida.");
        }

        var query = _context.Transactions
            .AsNoTracking()
            .Where(x => x.Active)
            .AsQueryable();

        if (startDate.HasValue)
        {
            var start = startDate.Value.Date;

            query = query.Where(x => x.Date >= start);
        }

        if (endDate.HasValue)
        {
            var endExclusive = endDate.Value.Date.AddDays(1);

            query = query.Where(x => x.Date < endExclusive);
        }

        if (type.HasValue)
        {
            query = query.Where(x => x.Type == type.Value);
        }

        if (accountId.HasValue)
        {
            query = query.Where(x => x.AccountId == accountId.Value);
        }

        if (categoryId.HasValue)
        {
            query = query.Where(x => x.CategoryId == categoryId.Value);
        }

        var transactions = await query
            .OrderByDescending(x => x.Date)
            .ThenByDescending(x => x.Id)
            .Select(x => new ReportTransactionResponse
            {
                Id = x.Id,
                Description = x.Description,
                Amount = x.Amount,
                Date = x.Date,
                Type = (int)x.Type,
                Account = x.Account.Name,
                Category = x.Category.Name,
                Notes = x.Notes
            })
            .ToListAsync();

        var totalIncome = transactions
            .Where(x => x.Type == (int)TransactionType.Income)
            .Sum(x => x.Amount);

        var totalExpense = transactions
            .Where(x => x.Type == (int)TransactionType.Expense)
            .Sum(x => x.Amount);

        var response = new ReportResponse
        {
            TotalIncome = totalIncome,
            TotalExpense = totalExpense,
            Balance = totalIncome - totalExpense,
            TransactionCount = transactions.Count,
            Transactions = transactions
        };

        return Ok(response);
    }

    [HttpGet("pdf")]
    public async Task<IActionResult> ExportPdf(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] TransactionType? type,
        [FromQuery] int? accountId,
        [FromQuery] int? categoryId)
    {
        var result = await Get(
            startDate,
            endDate,
            type,
            accountId,
            categoryId);

        if (result.Result is BadRequestObjectResult badRequest)
        {
            return badRequest;
        }

        if (result.Result is not OkObjectResult okResult ||
            okResult.Value is not ReportResponse report)
        {
            return StatusCode(500, "Erro ao gerar relatório.");
        }

        var pdfService = new ReportPdfService();

        var pdfBytes = pdfService.Generate(
            report,
            startDate,
            endDate);

        var fileName =
            $"finance-manager-relatorio-{DateTime.Now:yyyyMMdd-HHmmss}.pdf";

        return File(pdfBytes, "application/pdf", fileName);
    }
}

