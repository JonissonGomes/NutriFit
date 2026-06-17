package storage

// UploadResult representa o resultado de um upload no R2.
type UploadResult struct {
	PublicID  string // chave do objeto no bucket (compatível com cloudinaryId legado)
	SecureURL string
	URL       string
	Format    string
	Bytes     int64
}
