using INTEX_W2026_Group_2_7.Configuration;
using INTEX_W2026_Group_2_7.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace INTEX_W2026_Group_2_7.Services;

public class LoggingIdentityEmailSender : IEmailSender<ApplicationUser>
{
    private readonly string? _frontendBaseUrl;
    private readonly ILogger<LoggingIdentityEmailSender> _logger;

    public LoggingIdentityEmailSender(
        ILogger<LoggingIdentityEmailSender> logger,
        IOptions<FrontendOptions> frontendOptions)
    {
        _logger = logger;
        _frontendBaseUrl = frontendOptions.Value.BaseUrl;
    }

    public Task SendConfirmationLinkAsync(ApplicationUser user, string email, string confirmationLink)
    {
        _logger.LogInformation(
            "Identity confirmation link generated for {Email}. Frontend base URL: {FrontendBaseUrl}. Link: {ConfirmationLink}",
            email,
            _frontendBaseUrl ?? "(not configured)",
            confirmationLink);

        return Task.CompletedTask;
    }

    public Task SendPasswordResetLinkAsync(ApplicationUser user, string email, string resetLink)
    {
        _logger.LogInformation(
            "Identity password reset link generated for {Email}. Frontend base URL: {FrontendBaseUrl}. Link: {ResetLink}",
            email,
            _frontendBaseUrl ?? "(not configured)",
            resetLink);

        return Task.CompletedTask;
    }

    public Task SendPasswordResetCodeAsync(ApplicationUser user, string email, string resetCode)
    {
        _logger.LogInformation(
            "Identity password reset code generated for {Email}. Frontend base URL: {FrontendBaseUrl}. Code: {ResetCode}",
            email,
            _frontendBaseUrl ?? "(not configured)",
            resetCode);

        return Task.CompletedTask;
    }
}
