using System.Net;
using System.Net.Mail;
using System.Text;
using INTEX_W2026_Group_2_7.Configuration;
using INTEX_W2026_Group_2_7.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace INTEX_W2026_Group_2_7.Services;

public sealed class SmtpIdentityEmailSender : IEmailSender<ApplicationUser>
{
    private readonly ILogger<SmtpIdentityEmailSender> _logger;
    private readonly IOptions<SmtpEmailOptions> _smtpOptions;

    public SmtpIdentityEmailSender(
        ILogger<SmtpIdentityEmailSender> logger,
        IOptions<SmtpEmailOptions> smtpOptions)
    {
        _logger = logger;
        _smtpOptions = smtpOptions;
    }

    public Task SendConfirmationLinkAsync(ApplicationUser user, string email, string confirmationLink)
    {
        return SendEmailAsync(
            email,
            "Confirm your account",
            $"""
             Please confirm your account by opening the link below:

             {confirmationLink}

             If you did not create this account, you can ignore this email.
             """);
    }

    public Task SendPasswordResetLinkAsync(ApplicationUser user, string email, string resetLink)
    {
        return SendEmailAsync(
            email,
            "Reset your password",
            $"""
             A password reset was requested for your account.

             Open the link below to choose a new password:

             {resetLink}

             If you did not request a password reset, you can ignore this email.
             """);
    }

    public Task SendPasswordResetCodeAsync(ApplicationUser user, string email, string resetCode)
    {
        var displayCode = TryDecodeIdentityCode(resetCode, out var decodedCode)
            ? decodedCode
            : resetCode;

        return SendEmailAsync(
            email,
            "Your password reset code",
            $"""
             A password reset was requested for your account.

             Your reset code is:
             {displayCode}

             If you did not request this code, you can ignore this email.
             """);
    }

    private static bool TryDecodeIdentityCode(string code, out string decodedCode)
    {
        try
        {
            decodedCode = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(code));
            return true;
        }
        catch (FormatException)
        {
            decodedCode = string.Empty;
            return false;
        }
    }

    private async Task SendEmailAsync(string recipientEmail, string subject, string body)
    {
        var options = GetValidatedOptions();

        using var message = new MailMessage
        {
            From = new MailAddress(options.SenderEmail!, options.SenderName ?? options.SenderEmail),
            Subject = subject,
            Body = body,
            IsBodyHtml = false
        };

        message.To.Add(recipientEmail);

        using var smtpClient = new SmtpClient(options.Host!, options.Port)
        {
            DeliveryMethod = SmtpDeliveryMethod.Network,
            EnableSsl = options.EnableSsl,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(options.Username!, options.Password!)
        };

        await smtpClient.SendMailAsync(message);

        _logger.LogInformation(
            "Identity email sent to {Email} with subject {Subject} via {Host}:{Port}.",
            recipientEmail,
            subject,
            options.Host,
            options.Port);
    }

    private SmtpEmailOptions GetValidatedOptions()
    {
        var options = _smtpOptions.Value;
        var missingSettings = new List<string>();

        if (string.IsNullOrWhiteSpace(options.Host))
        {
            missingSettings.Add($"{SmtpEmailOptions.SectionName}:Host");
        }

        if (options.Port <= 0)
        {
            missingSettings.Add($"{SmtpEmailOptions.SectionName}:Port");
        }

        if (string.IsNullOrWhiteSpace(options.Username))
        {
            missingSettings.Add($"{SmtpEmailOptions.SectionName}:Username");
        }

        if (string.IsNullOrWhiteSpace(options.Password))
        {
            missingSettings.Add($"{SmtpEmailOptions.SectionName}:Password");
        }

        if (string.IsNullOrWhiteSpace(options.SenderEmail))
        {
            missingSettings.Add($"{SmtpEmailOptions.SectionName}:SenderEmail");
        }

        if (missingSettings.Count == 0)
        {
            return options;
        }

        var message =
            $"SMTP email sending is not fully configured. Fill in these settings before using identity email flows: {string.Join(", ", missingSettings)}";

        _logger.LogError(message);
        throw new InvalidOperationException(message);
    }
}
