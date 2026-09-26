using FinanceManager.API.Data;
using FinanceManager.API.DTOs.Transactions;
using FinanceManager.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.API.Controllers;

[ApiController]
[Route("api/transactions")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public TransactionsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TransactionResponse>>> GetAll()
    {
        var transactions = await _context.Transactions
            .AsNoTracking()
            .OrderByDescending(x => x.Date)
            .ThenByDescending(x => x.Id)
            .Select(x => new TransactionResponse
            {
                Id = x.Id,
                Description = x.Description,
                Amount = x.Amount,
                Date = x.Date,
                Type = x.Type,
                AccountId = x.AccountId,
                AccountName = x.Account.Name,
                CategoryId = x.CategoryId,
                CategoryName = x.Category.Name,
                Notes = x.Notes,
                Active = x.Active,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .ToListAsync();

        return Ok(transactions);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TransactionResponse>> GetById(int id)
    {
        var transaction = await _context.Transactions
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new TransactionResponse
            {
                Id = x.Id,
                Description = x.Description,
                Amount = x.Amount,
                Date = x.Date,
                Type = x.Type,
                AccountId = x.AccountId,
                AccountName = x.Account.Name,
                CategoryId = x.CategoryId,
                CategoryName = x.Category.Name,
                Notes = x.Notes,
                Active = x.Active,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (transaction is null)
        {
            return NotFound();
        }

        return Ok(transaction);
    }

    [HttpPost]
    public async Task<ActionResult<TransactionResponse>> Create(
        CreateTransactionRequest request)
    {
        var account = await _context.Accounts
            .FirstOrDefaultAsync(x => x.Id == request.AccountId);

        if (account is null)
        {
            return BadRequest("Conta não encontrada.");
        }

        if (!account.Active)
        {
            return BadRequest("A conta selecionada está inativa.");
        }

        var category = await _context.Categories
            .FirstOrDefaultAsync(x => x.Id == request.CategoryId);

        if (category is null)
        {
            return BadRequest("Categoria não encontrada.");
        }

        if (!category.Active)
        {
            return BadRequest("A categoria selecionada está inativa.");
        }

        if ((int)category.Type != (int)request.Type)
        {
            return BadRequest(
                "O tipo da categoria deve ser igual ao tipo da transação.");
        }

        var transaction = new Transaction
        {
            Description = request.Description,
            Amount = request.Amount,
            Date = request.Date,
            Type = request.Type,
            AccountId = request.AccountId,
            CategoryId = request.CategoryId,
            Notes = request.Notes,
            Active = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Transactions.Add(transaction);

        await _context.SaveChangesAsync();

        var response = new TransactionResponse
        {
            Id = transaction.Id,
            Description = transaction.Description,
            Amount = transaction.Amount,
            Date = transaction.Date,
            Type = transaction.Type,
            AccountId = transaction.AccountId,
            AccountName = account.Name,
            CategoryId = transaction.CategoryId,
            CategoryName = category.Name,
            Notes = transaction.Notes,
            Active = transaction.Active,
            CreatedAt = transaction.CreatedAt,
            UpdatedAt = transaction.UpdatedAt
        };

        return CreatedAtAction(
            nameof(GetById),
            new { id = transaction.Id },
            response);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TransactionResponse>> Update(
        int id,
        UpdateTransactionRequest request)
    {
        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(x => x.Id == id);

        if (transaction is null)
        {
            return NotFound();
        }

        var account = await _context.Accounts
            .FirstOrDefaultAsync(x => x.Id == request.AccountId);

        if (account is null)
        {
            return BadRequest("Conta não encontrada.");
        }

        var category = await _context.Categories
            .FirstOrDefaultAsync(x => x.Id == request.CategoryId);

        if (category is null)
        {
            return BadRequest("Categoria não encontrada.");
        }

        if ((int)category.Type != (int)request.Type)
        {
            return BadRequest(
                "O tipo da categoria deve ser igual ao tipo da transação.");
        }

        transaction.Description = request.Description;
        transaction.Amount = request.Amount;
        transaction.Date = request.Date;
        transaction.Type = request.Type;
        transaction.AccountId = request.AccountId;
        transaction.CategoryId = request.CategoryId;
        transaction.Notes = request.Notes;
        transaction.Active = request.Active;
        transaction.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var response = new TransactionResponse
        {
            Id = transaction.Id,
            Description = transaction.Description,
            Amount = transaction.Amount,
            Date = transaction.Date,
            Type = transaction.Type,
            AccountId = transaction.AccountId,
            AccountName = account.Name,
            CategoryId = transaction.CategoryId,
            CategoryName = category.Name,
            Notes = transaction.Notes,
            Active = transaction.Active,
            CreatedAt = transaction.CreatedAt,
            UpdatedAt = transaction.UpdatedAt
        };

        return Ok(response);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(x => x.Id == id);

        if (transaction is null)
        {
            return NotFound();
        }

        transaction.Active = false;
        transaction.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }
}