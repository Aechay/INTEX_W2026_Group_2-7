namespace INTEX_W2026_Group_2_7.Configuration;

public sealed class SmtpEmailOptions
{
    public const string SectionName = "SmtpEmail";

    public string? Host { get; set; }

    public int Port { get; set; } = 587;

    public bool EnableSsl { get; set; } = true;

    public string? Username { get; set; }

    public string? Password { get; set; }

    public string? SenderEmail { get; set; }

    public string? SenderName { get; set; }
}
