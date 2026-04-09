using INTEX_W2026_Group_2_7.Models.SocialMedia;

namespace INTEX_W2026_Group_2_7.Services.SocialMedia;

public sealed class FileSystemSocialMediaAssetStorage : ISocialMediaAssetStorage
{
    private static readonly HashSet<string> AllowedExtensions =
    [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".bmp",
        ".tif",
        ".tiff",
        ".webp"
    ];

    private const long MaxFileSizeBytes = 10 * 1024 * 1024;
    private const string RelativeDirectory = "social-media-assets/temp";

    private readonly IWebHostEnvironment _environment;

    public FileSystemSocialMediaAssetStorage(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<SocialMediaUploadedAssetDto> SaveImageAsync(
        IFormFile file,
        Uri publicBaseUri,
        CancellationToken cancellationToken)
    {
        if (file.Length <= 0)
        {
            throw new InvalidOperationException("Uploaded image files cannot be empty.");
        }

        if (file.Length > MaxFileSizeBytes)
        {
            throw new InvalidOperationException("Uploaded image files must be 10 MB or smaller.");
        }

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension.ToLowerInvariant()))
        {
            throw new InvalidOperationException("Only common web image formats are allowed for temporary social uploads.");
        }

        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Only image uploads are supported for temporary social publishing assets.");
        }

        var assetId = Guid.NewGuid().ToString("N");
        var storageDirectory = EnsureStorageDirectory();
        var storageFileName = $"{assetId}{extension.ToLowerInvariant()}";
        var filePath = Path.Combine(storageDirectory, storageFileName);

        await using (var targetStream = File.Create(filePath))
        await using (var sourceStream = file.OpenReadStream())
        {
            await sourceStream.CopyToAsync(targetStream, cancellationToken);
        }

        var relativePath = $"/{RelativeDirectory}/{storageFileName}";
        var liveUrl = new Uri(publicBaseUri, relativePath).ToString();

        return new SocialMediaUploadedAssetDto(
            assetId,
            file.FileName,
            file.ContentType,
            file.Length,
            liveUrl);
    }

    public Task DeleteAssetsAsync(IEnumerable<string> assetIds, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var assetIdSet = assetIds
            .Where(assetId => !string.IsNullOrWhiteSpace(assetId))
            .Select(assetId => assetId.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (assetIdSet.Length == 0)
        {
            return Task.CompletedTask;
        }

        var storageDirectory = EnsureStorageDirectory();
        foreach (var assetId in assetIdSet)
        {
            foreach (var candidateFile in Directory.EnumerateFiles(storageDirectory, $"{assetId}.*", SearchOption.TopDirectoryOnly))
            {
                File.Delete(candidateFile);
            }
        }

        return Task.CompletedTask;
    }

    private string EnsureStorageDirectory()
    {
        var webRootPath = _environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRootPath))
        {
            webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
            _environment.WebRootPath = webRootPath;
        }

        var storageDirectory = Path.Combine(webRootPath, RelativeDirectory.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(storageDirectory);
        return storageDirectory;
    }
}
