using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;

namespace INTEX_W2026_Group_2_7.Auth;

public static class CustomTokenProviderNames
{
    public const string EightDigitPasswordReset = "EightDigitPasswordReset";
}

public sealed class EightDigitPasswordResetTokenProvider<TUser> : EmailTokenProvider<TUser>
    where TUser : class
{
    private const int PasswordResetCodeDigits = 8;

    public override async Task<string> GenerateAsync(string purpose, UserManager<TUser> manager, TUser user)
    {
        ArgumentNullException.ThrowIfNull(manager);
        ArgumentNullException.ThrowIfNull(user);

        var securityToken = await manager.CreateSecurityTokenAsync(user);
        var modifier = await GetUserModifierAsync(purpose, manager, user);
        var code = NumericRfc6238AuthenticationService.GenerateCode(securityToken, modifier, PasswordResetCodeDigits);

        return code.ToString($"D{PasswordResetCodeDigits}", CultureInfo.InvariantCulture);
    }

    public override async Task<bool> ValidateAsync(string purpose, string token, UserManager<TUser> manager, TUser user)
    {
        ArgumentNullException.ThrowIfNull(manager);
        ArgumentNullException.ThrowIfNull(user);

        if (token.Length != PasswordResetCodeDigits ||
            !int.TryParse(token, NumberStyles.None, CultureInfo.InvariantCulture, out var code))
        {
            return false;
        }

        var securityToken = await manager.CreateSecurityTokenAsync(user);
        var modifier = await GetUserModifierAsync(purpose, manager, user);

        return NumericRfc6238AuthenticationService.ValidateCode(
            securityToken,
            code,
            modifier,
            PasswordResetCodeDigits);
    }
}

internal static class NumericRfc6238AuthenticationService
{
    private static readonly TimeSpan Timestep = TimeSpan.FromMinutes(3);
    private static readonly Encoding TextEncoding = new UTF8Encoding(false, true);

    public static int GenerateCode(byte[] securityToken, string? modifier, int digits)
    {
        ArgumentNullException.ThrowIfNull(securityToken);

        var currentTimeStep = GetCurrentTimeStepNumber();
        var modifierBytes = modifier is not null ? TextEncoding.GetBytes(modifier) : null;

        return ComputeTotp(securityToken, currentTimeStep, modifierBytes, digits);
    }

    public static bool ValidateCode(byte[] securityToken, int code, string? modifier, int digits)
    {
        ArgumentNullException.ThrowIfNull(securityToken);

        var currentTimeStep = GetCurrentTimeStepNumber();
        var modifierBytes = modifier is not null ? TextEncoding.GetBytes(modifier) : null;

        for (var i = -2; i <= 2; i++)
        {
            if (ComputeTotp(securityToken, (ulong)((long)currentTimeStep + i), modifierBytes, digits) == code)
            {
                return true;
            }
        }

        return false;
    }

    private static int ComputeTotp(byte[] key, ulong timestepNumber, byte[]? modifierBytes, int digits)
    {
        Span<byte> timestepAsBytes = stackalloc byte[sizeof(long)];
        BitConverter.TryWriteBytes(timestepAsBytes, IPAddress.HostToNetworkOrder((long)timestepNumber));

        ReadOnlySpan<byte> message = timestepAsBytes;
        byte[]? combinedBytes = null;

        if (modifierBytes is not null)
        {
            combinedBytes = new byte[timestepAsBytes.Length + modifierBytes.Length];
            timestepAsBytes.CopyTo(combinedBytes);
            Buffer.BlockCopy(modifierBytes, 0, combinedBytes, timestepAsBytes.Length, modifierBytes.Length);
            message = combinedBytes;
        }

        Span<byte> hash = stackalloc byte[HMACSHA1.HashSizeInBytes];
        HMACSHA1.TryHashData(key, message, hash, out _);

        var offset = hash[^1] & 0xf;
        var binaryCode = (hash[offset] & 0x7f) << 24
                         | (hash[offset + 1] & 0xff) << 16
                         | (hash[offset + 2] & 0xff) << 8
                         | (hash[offset + 3] & 0xff);

        return binaryCode % GetModuloForDigits(digits);
    }

    private static ulong GetCurrentTimeStepNumber()
    {
        var delta = DateTimeOffset.UtcNow - DateTimeOffset.UnixEpoch;
        return (ulong)(delta.Ticks / Timestep.Ticks);
    }

    private static int GetModuloForDigits(int digits)
    {
        var modulo = 1;
        for (var i = 0; i < digits; i++)
        {
            modulo *= 10;
        }

        return modulo;
    }
}
