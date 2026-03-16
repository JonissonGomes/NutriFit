package model3d

import (
	"context"
	"errors"
	"fmt"
	"io"
	"math"
	"mime/multipart"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"arck-design/backend/internal/database"
	"arck-design/backend/internal/models"
	"arck-design/backend/internal/services/cloudinary"
	"arck-design/backend/internal/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ============================================
// ERROS
// ============================================

var (
	ErrModelNotFound       = errors.New("arquivo 3D não encontrado")
	ErrInvalidFormat       = errors.New("formato de arquivo não suportado")
	ErrFileTooLarge        = errors.New("arquivo muito grande")
	ErrUnauthorized        = errors.New("não autorizado")
	ErrProcessingFailed    = errors.New("falha no processamento do arquivo")
	ErrConversionFailed    = errors.New("falha na conversão do arquivo")
)

// ============================================
// CONSTANTES
// ============================================

const (
	MaxFileSize = 100 * 1024 * 1024 // 100MB
)

// getTempDir retorna o diretório temporário para modelos 3D
func getTempDir() string {
	return filepath.Join(os.TempDir(), "arck-models")
}

// ============================================
// FUNÇÕES DE GERENCIAMENTO
// ============================================

// Upload faz upload de um arquivo 3D
func Upload(ctx context.Context, userID string, file *multipart.FileHeader, req models.UploadModelFileRequest) (*models.ModelFile, error) {
	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	// Verificar tamanho do arquivo
	if file.Size > MaxFileSize {
		return nil, ErrFileTooLarge
	}

	// Extrair extensão e validar formato
	ext := strings.ToLower(strings.TrimPrefix(filepath.Ext(file.Filename), "."))
	if !models.IsValidModelFormat(ext) {
		return nil, ErrInvalidFormat
	}

	// Abrir arquivo para upload
	src, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	// Criar diretório temporário se não existir
	tempDir := getTempDir()
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return nil, err
	}

	// Salvar temporariamente
	tempPath := filepath.Join(tempDir, fmt.Sprintf("%s_%s", primitive.NewObjectID().Hex(), file.Filename))
	dst, err := os.Create(tempPath)
	if err != nil {
		return nil, err
	}
	defer os.Remove(tempPath)
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return nil, err
	}

	// Upload para Cloudinary
	folder := fmt.Sprintf("arck-design/models/%s", userID)
	uploadResult, err := cloudinary.UploadRaw(ctx, tempPath, folder)
	if err != nil {
		return nil, fmt.Errorf("erro no upload para Cloudinary: %w", err)
	}

	// Criar registro no banco
	modelFile := &models.ModelFile{
		ID:             primitive.NewObjectID(),
		UserID:         userOID,
		OriginalName:   file.Filename,
		OriginalFormat: models.ModelFileFormat(ext),
		OriginalURL:    uploadResult.SecureURL,
		OriginalSize:   file.Size,
		Title:          req.Title,
		Description:    req.Description,
		Tags:           req.Tags,
		Category:       req.Category,
		Status:         models.ModelFileStatusPending,
		IsPublic:       req.IsPublic,
		Downloads:      0,
		Views:          0,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	// Associar a um projeto se fornecido
	if req.ProjectID != "" {
		projectOID, err := primitive.ObjectIDFromHex(req.ProjectID)
		if err == nil {
			modelFile.ProjectID = &projectOID
		}
	}

	// Se já estiver em formato web (GLB/GLTF), marcar como pronto
	if ext == "glb" || ext == "gltf" {
		modelFile.WebFormat = models.ModelFileFormat(ext)
		modelFile.WebURL = uploadResult.SecureURL
		modelFile.WebSize = file.Size
		modelFile.Status = models.ModelFileStatusReady
		now := time.Now()
		modelFile.ProcessedAt = &now
	}

	_, err = database.ModelFilesCollection.InsertOne(ctx, modelFile)
	if err != nil {
		return nil, err
	}

	// Se não estiver em formato web, tentar processar
	// Por enquanto, como a conversão não está implementada, apenas marcamos como pronto
	// se já estiver em formato web, ou como pendente se não estiver
	if modelFile.Status == models.ModelFileStatusPending {
		utils.Debug("[MODEL3D] Arquivo marcado como pendente - ID: %s, Formato: %s", modelFile.ID.Hex(), modelFile.OriginalFormat)
		
		// Log específico para DWG
		if modelFile.OriginalFormat == models.ModelFormatDWG {
			utils.Debug("[MODEL3D] [DWG] Arquivo DWG pendente de processamento - ID: %s, Nome: %s", modelFile.ID.Hex(), modelFile.OriginalName)
			utils.Debug("[MODEL3D] [DWG] URL original: %s", modelFile.OriginalURL)
			utils.Debug("[MODEL3D] [DWG] Tamanho: %d bytes", modelFile.OriginalSize)
		}
		
		// Se já estiver em formato web (GLB/GLTF), não precisa processar
		// Caso contrário, marcar como pronto sem conversão (conversão será implementada depois)
		// Por enquanto, vamos marcar como pronto mesmo sem conversão para não bloquear o usuário
		now := time.Now()
		update := bson.M{
			"$set": bson.M{
				"status":      models.ModelFileStatusReady,
				"processedAt": now,
				"updatedAt":   now,
				"processingError": "Conversão automática não disponível. Arquivo disponível no formato original.",
			},
		}
		_, err = database.ModelFilesCollection.UpdateOne(ctx, bson.M{"_id": modelFile.ID}, update)
		if err != nil {
			utils.Error("[MODEL3D] Erro ao atualizar status: %v", err)
		} else {
			utils.Debug("[MODEL3D] Status atualizado para 'ready' - ID: %s", modelFile.ID.Hex())
			if modelFile.OriginalFormat == models.ModelFormatDWG {
				utils.Debug("[MODEL3D] [DWG] Arquivo DWG marcado como pronto (sem conversão) - ID: %s", modelFile.ID.Hex())
			}
		}
		
		// TODO: Implementar conversão assíncrona quando assimp estiver disponível
		// go processModelFile(modelFile.ID.Hex())
	}

	return modelFile, nil
}

// GetByID busca um arquivo 3D por ID
func GetByID(ctx context.Context, modelID string, incrementViews bool) (*models.ModelFile, error) {
	modelOID, err := primitive.ObjectIDFromHex(modelID)
	if err != nil {
		return nil, err
	}

	if incrementViews {
		update := bson.M{"$inc": bson.M{"views": 1}}
		opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
		var modelFile models.ModelFile
		err = database.ModelFilesCollection.FindOneAndUpdate(ctx, bson.M{"_id": modelOID}, update, opts).Decode(&modelFile)
		if err != nil {
			if errors.Is(err, mongo.ErrNoDocuments) {
				return nil, ErrModelNotFound
			}
			return nil, err
		}
		return &modelFile, nil
	}

	var modelFile models.ModelFile
	err = database.ModelFilesCollection.FindOne(ctx, bson.M{"_id": modelOID}).Decode(&modelFile)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrModelNotFound
		}
		return nil, err
	}

	return &modelFile, nil
}

// List lista arquivos 3D com filtros
func List(ctx context.Context, filters models.ModelFileFilters) (*models.ModelFileListResponse, error) {
	filter := bson.M{}

	if filters.UserID != "" {
		if oid, err := primitive.ObjectIDFromHex(filters.UserID); err == nil {
			filter["userId"] = oid
		}
	}

	if filters.ProjectID != "" {
		if oid, err := primitive.ObjectIDFromHex(filters.ProjectID); err == nil {
			filter["projectId"] = oid
		}
	}

	if filters.Format != "" {
		filter["originalFormat"] = filters.Format
	}

	if filters.Status != "" {
		filter["status"] = filters.Status
	}

	if filters.Category != "" {
		filter["category"] = filters.Category
	}

	if filters.IsPublic != nil {
		filter["isPublic"] = *filters.IsPublic
	}

	if filters.Search != "" {
		filter["$or"] = []bson.M{
			{"title": bson.M{"$regex": filters.Search, "$options": "i"}},
			{"description": bson.M{"$regex": filters.Search, "$options": "i"}},
			{"tags": bson.M{"$regex": filters.Search, "$options": "i"}},
		}
	}

	// Contagem total
	total, err := database.ModelFilesCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, err
	}

	// Paginação
	page := filters.Page
	if page < 1 {
		page = 1
	}
	limit := filters.Limit
	if limit < 1 || limit > 100 {
		limit = 20
	}
	skip := (page - 1) * limit

	opts := options.Find().
		SetSort(bson.D{{Key: "createdAt", Value: -1}}).
		SetSkip(int64(skip)).
		SetLimit(int64(limit))

	cursor, err := database.ModelFilesCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var modelFiles []models.ModelFile
	if err := cursor.All(ctx, &modelFiles); err != nil {
		return nil, err
	}

	if modelFiles == nil {
		modelFiles = []models.ModelFile{}
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))

	return &models.ModelFileListResponse{
		Data:       modelFiles,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

// Update atualiza um arquivo 3D
func Update(ctx context.Context, modelID, userID string, req models.UpdateModelFileRequest) (*models.ModelFile, error) {
	modelOID, err := primitive.ObjectIDFromHex(modelID)
	if err != nil {
		return nil, err
	}

	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	// Verificar ownership
	var modelFile models.ModelFile
	err = database.ModelFilesCollection.FindOne(ctx, bson.M{"_id": modelOID}).Decode(&modelFile)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrModelNotFound
		}
		return nil, err
	}

	if modelFile.UserID != userOID {
		return nil, ErrUnauthorized
	}

	update := bson.M{
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	if req.Title != "" {
		update["$set"].(bson.M)["title"] = req.Title
	}
	if req.Description != "" {
		update["$set"].(bson.M)["description"] = req.Description
	}
	if req.Tags != nil {
		update["$set"].(bson.M)["tags"] = req.Tags
	}
	if req.Category != "" {
		update["$set"].(bson.M)["category"] = req.Category
	}
	if req.IsPublic != nil {
		update["$set"].(bson.M)["isPublic"] = *req.IsPublic
	}
	if req.DefaultCameraPosition != nil {
		update["$set"].(bson.M)["defaultCameraPosition"] = req.DefaultCameraPosition
	}
	if req.DefaultLighting != "" {
		update["$set"].(bson.M)["defaultLighting"] = req.DefaultLighting
	}
	if req.BackgroundColor != "" {
		update["$set"].(bson.M)["backgroundColor"] = req.BackgroundColor
	}

	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var updatedModel models.ModelFile
	err = database.ModelFilesCollection.FindOneAndUpdate(ctx, bson.M{"_id": modelOID}, update, opts).Decode(&updatedModel)
	if err != nil {
		return nil, err
	}

	return &updatedModel, nil
}

// Delete deleta um arquivo 3D
func Delete(ctx context.Context, modelID, userID string, isAdmin bool) error {
	modelOID, err := primitive.ObjectIDFromHex(modelID)
	if err != nil {
		return err
	}

	// Verificar ownership se não for admin
	if !isAdmin {
		userOID, err := primitive.ObjectIDFromHex(userID)
		if err != nil {
			return err
		}

		var modelFile models.ModelFile
		err = database.ModelFilesCollection.FindOne(ctx, bson.M{"_id": modelOID}).Decode(&modelFile)
		if err != nil {
			if errors.Is(err, mongo.ErrNoDocuments) {
				return ErrModelNotFound
			}
			return err
		}

		if modelFile.UserID != userOID {
			return ErrUnauthorized
		}

		// TODO: Deletar arquivos do Cloudinary
	}

	_, err = database.ModelFilesCollection.DeleteOne(ctx, bson.M{"_id": modelOID})
	return err
}

// IncrementDownloads incrementa o contador de downloads
func IncrementDownloads(ctx context.Context, modelID string) error {
	modelOID, err := primitive.ObjectIDFromHex(modelID)
	if err != nil {
		return err
	}

	_, err = database.ModelFilesCollection.UpdateOne(ctx,
		bson.M{"_id": modelOID},
		bson.M{"$inc": bson.M{"downloads": 1}},
	)
	return err
}

// GetByProject retorna os arquivos 3D de um projeto
func GetByProject(ctx context.Context, projectID string) ([]models.ModelFile, error) {
	projectOID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		return nil, err
	}

	cursor, err := database.ModelFilesCollection.Find(ctx, bson.M{"projectId": projectOID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var modelFiles []models.ModelFile
	if err := cursor.All(ctx, &modelFiles); err != nil {
		return nil, err
	}

	if modelFiles == nil {
		modelFiles = []models.ModelFile{}
	}

	return modelFiles, nil
}

// ============================================
// PROCESSAMENTO E CONVERSÃO
// ============================================

// processModelFile processa um arquivo 3D de forma assíncrona
func processModelFile(modelID string) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	// Atualizar status para processing
	modelOID, _ := primitive.ObjectIDFromHex(modelID)
	_, _ = database.ModelFilesCollection.UpdateOne(ctx,
		bson.M{"_id": modelOID},
		bson.M{"$set": bson.M{"status": models.ModelFileStatusProcessing}},
	)

	// Buscar o arquivo
	var modelFile models.ModelFile
	err := database.ModelFilesCollection.FindOne(ctx, bson.M{"_id": modelOID}).Decode(&modelFile)
	if err != nil {
		updateProcessingError(ctx, modelOID, "Arquivo não encontrado")
		return
	}

	// Tentar conversão para GLB
	glbURL, glbSize, err := convertToGLB(ctx, &modelFile)
	if err != nil {
		updateProcessingError(ctx, modelOID, err.Error())
		return
	}

	// Gerar previews
	previews, thumbnailURL := generatePreviews(ctx, &modelFile, glbURL)

	// Atualizar registro
	now := time.Now()
	update := bson.M{
		"$set": bson.M{
			"webFormat":    models.ModelFormatGLB,
			"webUrl":       glbURL,
			"webSize":      glbSize,
			"previews":     previews,
			"thumbnailUrl": thumbnailURL,
			"status":       models.ModelFileStatusReady,
			"processedAt":  now,
			"updatedAt":    now,
		},
	}

	_, _ = database.ModelFilesCollection.UpdateOne(ctx, bson.M{"_id": modelOID}, update)
}

// convertToGLB converte um modelo para GLB
func convertToGLB(ctx context.Context, modelFile *models.ModelFile) (string, int64, error) {
	utils.Debug("[MODEL3D] Iniciando conversão para GLB - ID: %s, Formato: %s", modelFile.ID.Hex(), modelFile.OriginalFormat)
	
	// Log específico para DWG
	if modelFile.OriginalFormat == models.ModelFormatDWG {
		utils.Debug("[MODEL3D] [DWG] Iniciando conversão DWG para GLB - ID: %s", modelFile.ID.Hex())
		utils.Debug("[MODEL3D] [DWG] Arquivo: %s, Tamanho: %d bytes", modelFile.OriginalName, modelFile.OriginalSize)
		utils.Debug("[MODEL3D] [DWG] URL original: %s", modelFile.OriginalURL)
	}
	
	// Verificar se assimp está disponível
	assimpPath, err := exec.LookPath("assimp")
	if err != nil {
		utils.Debug("[MODEL3D] Assimp não encontrado no PATH - usando fallback")
		if modelFile.OriginalFormat == models.ModelFormatDWG {
			utils.Debug("[MODEL3D] [DWG] Assimp não disponível - retornando arquivo original como fallback")
		}
		// Assimp não disponível - retornar o arquivo original como fallback
		// Isso permite que o usuário use o arquivo mesmo sem conversão
		return modelFile.OriginalURL, modelFile.OriginalSize, nil
	}
	
	utils.Debug("[MODEL3D] Assimp encontrado em: %s", assimpPath)
	if modelFile.OriginalFormat == models.ModelFormatDWG {
		utils.Debug("[MODEL3D] [DWG] Assimp disponível - prosseguindo com conversão")
	}

	// Criar diretório temporário
	tempDir := filepath.Join(getTempDir(), modelFile.ID.Hex())
	utils.Debug("[MODEL3D] Criando diretório temporário: %s", tempDir)
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		utils.Error("[MODEL3D] Erro ao criar diretório temporário: %v", err)
		return "", 0, err
	}
	defer os.RemoveAll(tempDir)
	
	if modelFile.OriginalFormat == models.ModelFormatDWG {
		utils.Debug("[MODEL3D] [DWG] Diretório temporário criado: %s", tempDir)
	}

	// TODO: Download do arquivo original
	utils.Debug("[MODEL3D] TODO: Implementar download do arquivo original")
	if modelFile.OriginalFormat == models.ModelFormatDWG {
		utils.Debug("[MODEL3D] [DWG] TODO: Download do arquivo DWG de: %s", modelFile.OriginalURL)
	}
	
	// TODO: Executar assimp para conversão
	utils.Debug("[MODEL3D] TODO: Executar assimp para conversão")
	if modelFile.OriginalFormat == models.ModelFormatDWG {
		utils.Debug("[MODEL3D] [DWG] TODO: Executar: assimp export %s %s.glb", modelFile.OriginalName, modelFile.ID.Hex())
	}
	
	// TODO: Upload do arquivo convertido
	utils.Debug("[MODEL3D] TODO: Upload do arquivo convertido")
	
	// Por enquanto, retornamos o arquivo original como fallback
	utils.Debug("[MODEL3D] Retornando arquivo original como fallback - ID: %s", modelFile.ID.Hex())
	if modelFile.OriginalFormat == models.ModelFormatDWG {
		utils.Debug("[MODEL3D] [DWG] Retornando DWG original (conversão não implementada) - ID: %s", modelFile.ID.Hex())
	}

	return modelFile.OriginalURL, modelFile.OriginalSize, nil
}

// generatePreviews gera previews do modelo 3D
func generatePreviews(ctx context.Context, modelFile *models.ModelFile, glbURL string) ([]models.ModelPreview, string) {
	// TODO: Implementar geração de previews usando headless renderer
	// Por enquanto, retornamos arrays vazios
	return []models.ModelPreview{}, ""
}

// updateProcessingError atualiza o status para falha
func updateProcessingError(ctx context.Context, modelOID primitive.ObjectID, errorMsg string) {
	_, _ = database.ModelFilesCollection.UpdateOne(ctx,
		bson.M{"_id": modelOID},
		bson.M{"$set": bson.M{
			"status":          models.ModelFileStatusFailed,
			"processingError": errorMsg,
			"updatedAt":       time.Now(),
		}},
	)
}

// ============================================
// ESTATÍSTICAS
// ============================================

// GetUserStats retorna estatísticas de arquivos 3D do usuário
func GetUserStats(ctx context.Context, userID string) (map[string]interface{}, error) {
	userOID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	stats := make(map[string]interface{})

	// Total de arquivos
	total, _ := database.ModelFilesCollection.CountDocuments(ctx, bson.M{"userId": userOID})
	stats["totalFiles"] = total

	// Por status
	ready, _ := database.ModelFilesCollection.CountDocuments(ctx, bson.M{"userId": userOID, "status": models.ModelFileStatusReady})
	pending, _ := database.ModelFilesCollection.CountDocuments(ctx, bson.M{"userId": userOID, "status": models.ModelFileStatusPending})
	processing, _ := database.ModelFilesCollection.CountDocuments(ctx, bson.M{"userId": userOID, "status": models.ModelFileStatusProcessing})
	failed, _ := database.ModelFilesCollection.CountDocuments(ctx, bson.M{"userId": userOID, "status": models.ModelFileStatusFailed})

	stats["ready"] = ready
	stats["pending"] = pending
	stats["processing"] = processing
	stats["failed"] = failed

	// Total de views e downloads
	pipeline := []bson.M{
		{"$match": bson.M{"userId": userOID}},
		{"$group": bson.M{
			"_id":       nil,
			"totalViews":     bson.M{"$sum": "$views"},
			"totalDownloads": bson.M{"$sum": "$downloads"},
			"totalSize":      bson.M{"$sum": "$originalSize"},
		}},
	}

	cursor, err := database.ModelFilesCollection.Aggregate(ctx, pipeline)
	if err == nil {
		var result []bson.M
		if err := cursor.All(ctx, &result); err == nil && len(result) > 0 {
			stats["totalViews"] = result[0]["totalViews"]
			stats["totalDownloads"] = result[0]["totalDownloads"]
			stats["totalSize"] = result[0]["totalSize"]
		}
	}

	return stats, nil
}

