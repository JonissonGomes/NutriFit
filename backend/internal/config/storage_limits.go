package config

import "nufit/backend/internal/models"

// StorageLimitForPlan retorna a cota total de armazenamento (bytes) do plano.
func StorageLimitForPlan(plan models.PlanType) int64 {
	if AppConfig == nil {
		return 5 * 1024 * 1024 * 1024
	}
	switch plan {
	case models.PlanStarter:
		if AppConfig.StorageLimitStarter > 0 {
			return AppConfig.StorageLimitStarter
		}
	case models.PlanProfessional:
		if AppConfig.StorageLimitProfessional > 0 {
			return AppConfig.StorageLimitProfessional
		}
	case models.PlanBusiness:
		if AppConfig.StorageLimitBusiness > 0 {
			return AppConfig.StorageLimitBusiness
		}
	}
	if AppConfig.StorageLimitFree > 0 {
		return AppConfig.StorageLimitFree
	}
	return 5 * 1024 * 1024 * 1024
}

// ApplyUploadLimits atualiza limites por arquivo usados pelos validadores de upload.
func ApplyUploadLimits() {
	if AppConfig == nil {
		return
	}
	// Valores já carregados em bytes em AppConfig; pacote image lê via GetMaxImageBytes etc.
}

func GetMaxImageBytes() int64 {
	if AppConfig != nil && AppConfig.UploadMaxImageBytes > 0 {
		return AppConfig.UploadMaxImageBytes
	}
	return 10 * 1024 * 1024
}

func GetMaxDocumentBytes() int64 {
	if AppConfig != nil && AppConfig.UploadMaxDocumentBytes > 0 {
		return AppConfig.UploadMaxDocumentBytes
	}
	return 20 * 1024 * 1024
}

func GetMaxModelBytes() int64 {
	if AppConfig != nil && AppConfig.UploadMaxModelBytes > 0 {
		return AppConfig.UploadMaxModelBytes
	}
	return 100 * 1024 * 1024
}

func MBToBytes(mb int64) int64 {
	if mb <= 0 {
		return 0
	}
	return mb * 1024 * 1024
}
