using FinanceManager.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<User> Users => Set<User>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(x => x.Description)
                .HasMaxLength(500);

            entity.Property(x => x.Type)
                .IsRequired();

            entity.Property(x => x.Active)
                .IsRequired();

            entity.Property(x => x.CreatedAt)
                .IsRequired();

            entity.HasData(
                new Category
                {
                    Id = 1,
                    Name = "Salário",
                    Description = "Receita mensal",
                    Type = CategoryType.Income,
                    Active = true,
                    CreatedAt = new DateTime(2026, 1, 1)
                },
                new Category
                {
                    Id = 2,
                    Name = "Alimentação",
                    Description = "Despesas com alimentação",
                    Type = CategoryType.Expense,
                    Active = true,
                    CreatedAt = new DateTime(2026, 1, 1)
                }
            );
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(x => x.Id);
        
            entity.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(150);
        
            entity.Property(x => x.Email)
                .IsRequired()
                .HasMaxLength(150);
        
            entity.Property(x => x.PasswordHash)
                .IsRequired();
        
            entity.Property(x => x.Active)
                .IsRequired();
        
            entity.Property(x => x.CreatedAt)
                .IsRequired();
        
            entity.HasIndex(x => x.Email)
                .IsUnique();
        });
        
        base.OnModelCreating(modelBuilder);
    }
}