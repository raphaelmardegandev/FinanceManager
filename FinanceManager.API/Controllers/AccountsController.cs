using FinanceManager.API.Data;
using FinanceManager.API.DTOs.Accounts;
using FinanceManager.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.API.Controllers;

[ApiController]
[Route("api/accounts")]
[Authorize]
public class AccountsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AccountsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AccountResponse>>> GetAll()
    {
        var accounts = await _context.Accounts
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new AccountResponse
            {
                Id = x.Id,
                Name = x.Name,
                Type = x.Type,
                InitialBalance = x.InitialBalance,
                Active = x.Active,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .ToListAsync();

        return Ok(accounts);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AccountResponse>> GetById(int id)
    {
        var account = await _context.Accounts
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new AccountResponse
            {
                Id = x.Id,
                Name = x.Name,
                Type = x.Type,
                InitialBalance = x.InitialBalance,
                Active = x.Active,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (account is null)
        {
            return NotFound();
        }

        return Ok(account);
    }

    [HttpPost]
    public async Task<ActionResult<AccountResponse>> Create(
        CreateAccountRequest request)
    {
        var account = new Account
        {
            Name = request.Name.Trim(),
            Type = request.Type,
            InitialBalance = request.InitialBalance,
            Active = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Accounts.Add(account);
        await _context.SaveChangesAsync();

        var response = new AccountResponse
        {
            Id = account.Id,
            Name = account.Name,
            Type = account.Type,
            InitialBalance = account.InitialBalance,
            Active = account.Active,
            CreatedAt = account.CreatedAt,
            UpdatedAt = account.UpdatedAt
        };

        return CreatedAtAction(
            nameof(GetById),
            new { id = account.Id },
            response);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<AccountResponse>> Update(
        int id,
        UpdateAccountRequest request)
    {
        var account = await _context.Accounts
            .FirstOrDefaultAsync(x => x.Id == id);

        if (account is null)
        {
            return NotFound();
        }

        account.Name = request.Name.Trim();
        account.Type = request.Type;
        account.InitialBalance = request.InitialBalance;
        account.Active = request.Active;
        account.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new AccountResponse
        {
            Id = account.Id,
            Name = account.Name,
            Type = account.Type,
            InitialBalance = account.InitialBalance,
            Active = account.Active,
            CreatedAt = account.CreatedAt,
            UpdatedAt = account.UpdatedAt
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var account = await _context.Accounts
            .FirstOrDefaultAsync(x => x.Id == id);

        if (account is null)
        {
            return NotFound();
        }

        account.Active = false;
        account.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }
}