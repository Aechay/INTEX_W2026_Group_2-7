using INTEX_W2026_Group_2_7.Models.SocialMedia;

namespace INTEX_W2026_Group_2_7.Services.SocialMedia;

public interface ISocialMediaAssetStorage
{
    Task<SocialMediaUploadedAssetDto> SaveImageAsync(
        IFormFile file,
        Uri publicBaseUri,
        CancellationToken cancellationToken);

    Task DeleteAssetsAsync(IEnumerable<string> assetIds, CancellationToken cancellationToken);
}
