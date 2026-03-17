package cloudinary

// Transformations for different image sizes
const (
	TransformationThumbnail = "w_400,h_400,c_fill,q_auto:best,f_auto"
	TransformationMedium    = "w_1200,h_1200,c_limit,q_auto:best,f_auto"
	TransformationCompressed = "q_auto:best,f_auto"
	TransformationOriginal  = "fl_lossy,q_auto:best,f_auto"
)

func GetThumbnailURL(publicID string) string {
	return GetImageURL(publicID, TransformationThumbnail)
}

func GetMediumURL(publicID string) string {
	return GetImageURL(publicID, TransformationMedium)
}

func GetCompressedURL(publicID string) string {
	return GetImageURL(publicID, TransformationCompressed)
}

func GetOriginalURL(publicID string) string {
	return GetImageURL(publicID, TransformationOriginal)
}



