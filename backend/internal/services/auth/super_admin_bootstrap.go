package auth

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"arck-design/backend/internal/database"
	"arck-design/backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var ErrSuperAdminRequired = errors.New("super_admin obrigatório e não encontrado")

type SuperAdminBootstrapResult struct {
	Created bool
	Email   string
}

func EnsureSuperAdmin(ctx context.Context) (*SuperAdminBootstrapResult, error) {
	// Se já existe, nada a fazer.
	count, err := database.UsersCollection.CountDocuments(ctx, bson.M{"role": models.RoleSuperAdmin})
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return &SuperAdminBootstrapResult{Created: false}, nil
	}

	// Tentar por env primeiro (não-interativo).
	envEmail := strings.TrimSpace(os.Getenv("SUPER_ADMIN_EMAIL"))
	envName := strings.TrimSpace(os.Getenv("SUPER_ADMIN_NAME"))
	envPass := os.Getenv("SUPER_ADMIN_PASSWORD")
	if envEmail != "" && envName != "" && envPass != "" {
		if err := createSuperAdmin(ctx, envEmail, envName, envPass); err != nil {
			return nil, err
		}
		return &SuperAdminBootstrapResult{Created: true, Email: envEmail}, nil
	}

	// Se não tem env vars, abrir wizard no terminal.
	if !isInteractiveTerminal() {
		return nil, ErrSuperAdminRequired
	}

	reader := bufio.NewReader(os.Stdin)
	fmt.Println("")
	fmt.Println("============================================")
	fmt.Println("NuFit - Setup inicial (super_admin)")
	fmt.Println("Nenhum super_admin encontrado. Vamos criar um agora.")
	fmt.Println("Dica: você também pode usar SUPER_ADMIN_EMAIL/NAME/PASSWORD.")
	fmt.Println("============================================")
	fmt.Println("")

	ask := func(label string) (string, error) {
		fmt.Print(label)
		v, err := reader.ReadString('\n')
		if err != nil {
			return "", err
		}
		return strings.TrimSpace(v), nil
	}

	email, err := ask("Email do super_admin: ")
	if err != nil {
		return nil, err
	}
	name, err := ask("Nome do super_admin: ")
	if err != nil {
		return nil, err
	}
	pass, err := ask("Senha (mín. 6): ")
	if err != nil {
		return nil, err
	}
	pass2, err := ask("Confirmar senha: ")
	if err != nil {
		return nil, err
	}

	if email == "" || name == "" || pass == "" {
		return nil, errors.New("campos obrigatórios vazios")
	}
	if len(pass) < 6 {
		return nil, errors.New("senha muito curta")
	}
	if pass != pass2 {
		return nil, errors.New("senhas não conferem")
	}

	if err := createSuperAdmin(ctx, email, name, pass); err != nil {
		return nil, err
	}

	fmt.Println("Super admin criado com sucesso:", email)
	fmt.Println("")
	return &SuperAdminBootstrapResult{Created: true, Email: email}, nil
}

func createSuperAdmin(ctx context.Context, email, name, password string) error {
	// Garantir que não exista usuário com o mesmo email
	var existing models.User
	err := database.UsersCollection.FindOne(ctx, bson.M{"email": email}).Decode(&existing)
	if err == nil {
		return errors.New("já existe um usuário com este email")
	}

	hashed, err := hashPassword(password)
	if err != nil {
		return err
	}

	now := time.Now()
	u := models.User{
		ID:           primitive.NewObjectID(),
		Email:        email,
		Name:         name,
		PasswordHash: hashed,
		Role:         models.RoleSuperAdmin,
		Plan:         models.PlanBusiness,
		StorageUsed:  0,
		StorageLimit: 0,
		AdminMetadata: &models.AdminMetadata{
			Status:     "active",
			LoginCount: 0,
		},
		CreatedAt: now,
		UpdatedAt: now,
	}

	_, err = database.UsersCollection.InsertOne(ctx, &u)
	return err
}

func isInteractiveTerminal() bool {
	// Heurística simples: se stdin é um char device
	fi, err := os.Stdin.Stat()
	if err != nil {
		return false
	}
	return (fi.Mode() & os.ModeCharDevice) != 0
}

