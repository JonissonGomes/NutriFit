package rest

import (
	"arck-design/backend/internal/config"
	"arck-design/backend/internal/services/websocket"
	"arck-design/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	// Configurar modo do Gin baseado no ambiente
	env := config.AppConfig.Env
	if env == "development" || env == "dev" {
		gin.SetMode(gin.DebugMode)
		utils.Debug("Gin mode: DEBUG")
	} else {
		gin.SetMode(gin.ReleaseMode)
		utils.Info("Gin mode: RELEASE")
	}

	router := gin.Default()
	
	// Configurar limite de tamanho para multipart forms (100MB)
	router.MaxMultipartMemory = 100 << 20 // 100 MB

	// CORS middleware
	router.Use(corsMiddleware())

	// Health check
	router.GET("/health", healthCheck)

	// WebSocket endpoint (authentication via query param)
	router.GET("/ws", websocket.HandleWebSocket)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Auth routes
		auth := v1.Group("/auth")
		{
			auth.POST("/register", register)
			auth.POST("/login", login)
			auth.GET("/check-registration", checkRegistrationAvailable)
			// OAuth Google - Temporariamente desabilitado
			// auth.POST("/oauth/google", oauthGoogle)
			auth.POST("/refresh", refreshToken)
			auth.POST("/logout", logout)
			auth.GET("/me", authMiddleware(), getMe)
		}

		// Protected routes
		protected := v1.Group("")
		protected.Use(authMiddleware())
		{
			// Meal Plans
			mealPlans := protected.Group("/meal-plans")
			{
				mealPlans.GET("", listMealPlans)
				mealPlans.POST("", RequireRole("nutricionista"), createMealPlan)
				mealPlans.GET("/:id", getMealPlan)
				mealPlans.PUT("/:id", RequireRole("nutricionista"), updateMealPlan)
				mealPlans.DELETE("/:id", RequireRole("nutricionista"), deleteMealPlan)
				mealPlans.PUT("/:id/status", RequireRole("nutricionista"), updateMealPlanStatus)
				mealPlans.GET("/:id/stats", getMealPlanStats)
				mealPlans.POST("/ai-generate", RequireRole("nutricionista"), generateMealPlanWithAI)
				mealPlans.POST("/:id/ai-analyze", RequireRole("nutricionista"), analyzeMealPlanWithAI)
				mealPlans.GET("/:id/substitutions/:foodId", RequireRole("nutricionista"), getFoodSubstitutions)
			}

			// Images e Models3D eram recursos legados (portfólio/arquivos) e foram descontinuados no NuFit.

			// Messages
			messages := protected.Group("/messages")
			{
				messages.GET("/conversations", listConversations)
				messages.POST("/conversations", startConversation)
				messages.GET("/conversations/:id/messages", getMessages)
				messages.PUT("/conversations/:id/read", markAsRead)
				messages.GET("/conversations/:id", getConversation)
				messages.DELETE("/conversations/:id", deleteConversation)
				messages.POST("", sendMessage)
				messages.DELETE("/:id", deleteMessage)
				messages.GET("/unread-count", getUnreadCount)
			}

			// Services (Nutritionist)
			services := protected.Group("/services")
			{
				services.GET("", listServices)
				services.POST("", createService)
				services.GET("/stats", getServiceStats)
				services.GET("/:id", getService)
				services.PUT("/:id", updateService)
				services.DELETE("/:id", deleteService)
				services.PUT("/:id/toggle", toggleServiceActive)
			}

			// Events/Calendar
			events := protected.Group("/events")
			{
				events.GET("", listEvents)
				events.POST("", createEvent)
				events.GET("/upcoming", getUpcomingEvents)
				events.GET("/:id", getEvent)
				events.PUT("/:id", updateEvent)
				events.DELETE("/:id", deleteEvent)
				events.PUT("/:id/status", updateEventStatus)
			}

			// Profile (authenticated)
			profileGroup := protected.Group("/profile")
			{
				profileGroup.GET("/me", getMyProfile)
				profileGroup.POST("", createMyProfile)
				profileGroup.PUT("", updateMyProfile)
				profileGroup.POST("/avatar", uploadProfileAvatar)
				profileGroup.POST("/cover", uploadProfileCover)
				profileGroup.GET("/check-username", checkUsernameAvailable)
				profileGroup.PUT("/location", updateMyLocation)
				// Verificação
				profileGroup.GET("/verification/status", getVerificationStatus)
				profileGroup.POST("/verification/upload", uploadVerificationDocument)
			}

			// Favorites (Patient)
			favorites := protected.Group("/favorites")
			{
				favorites.GET("", listFavorites)
				favorites.POST("/:nutritionistId", addFavorite)
				favorites.DELETE("/:nutritionistId", removeFavorite)
				favorites.GET("/check/:nutritionistId", checkFavorite)
			}

			// Dashboard - Nutritionist
			nutritionistDash := protected.Group("/nutritionist/dashboard")
			{
				nutritionistDash.GET("/stats", getNutritionistDashboardStats)
				nutritionistDash.GET("/recent-meal-plans", getNutritionistRecentMealPlans)
				nutritionistDash.GET("/upcoming-events", getNutritionistUpcomingEvents)
			}

			// Dashboard - Patient
			patientDash := protected.Group("/patient/dashboard")
			{
				patientDash.GET("/stats", getPatientDashboardStats)
				patientDash.GET("/meal-plans", getPatientMealPlans)
				patientDash.GET("/appointments", getPatientAppointments)
			}

			// Patients (CRM)
			patients := protected.Group("/patients")
			{
				patients.GET("", listPatients)
				patients.POST("", createPatient)
				patients.GET("/:id", getPatient)
				patients.PUT("/:id", updatePatient)
				patients.DELETE("/:id", deletePatient)
				patients.POST("/import", importPatients)
			}

			// Anamnesis
			anamnesis := protected.Group("/anamnesis")
			{
				anamnesis.GET("/templates", RequireRole("nutricionista"), listAnamnesisTemplates)
				anamnesis.POST("/templates", RequireRole("nutricionista"), createAnamnesisTemplate)
				anamnesis.GET("/:patientId", getAnamnesis)
				anamnesis.POST("/:patientId/answers", submitAnamnesisAnswers)
				// AI summary da última anamnese registrada do paciente
				anamnesis.POST("/:patientId/ai-summary", RequireRole("nutricionista"), generateAnamnesisAISummary)
			}

			// Food Diary
			foodDiary := protected.Group("/food-diary")
			{
				foodDiary.GET("/:patientId", getFoodDiaryEntries)
				foodDiary.POST("", RequireRole("nutricionista"), createFoodDiaryEntry)
				foodDiary.POST("/:id/photo", uploadFoodDiaryPhoto)
				foodDiary.POST("/:id/ai-analyze", RequireRole("nutricionista"), analyzeFoodDiaryPhoto)
				foodDiary.PUT("/:id/comment", RequireRole("nutricionista"), addNutritionistComment)
			}

			// Goals
			goals := protected.Group("/goals")
			{
				goals.GET("/:patientId", getPatientGoals)
				goals.POST("", RequireRole("nutricionista"), createGoal)
				goals.PUT("/:id", RequireRole("nutricionista"), updateGoal)
				goals.DELETE("/:id", RequireRole("nutricionista"), deleteGoal)
				goals.POST("/:id/check-in", RequireRole("nutricionista"), addGoalCheckIn)
			}

			// Anthropometric
			anthropometric := protected.Group("/anthropometric")
			{
				anthropometric.GET("/:patientId", getAnthropometricRecords)
				anthropometric.POST("", RequireRole("nutricionista"), createAnthropometricRecord)
				anthropometric.PUT("/:id", RequireRole("nutricionista"), updateAnthropometricRecord)
				anthropometric.DELETE("/:id", RequireRole("nutricionista"), deleteAnthropometricRecord)
			}

			// Lab Exams
			labExams := protected.Group("/lab-exams")
			{
				labExams.GET("/:patientId", getLabExams)
				labExams.POST("", createLabExam)
				labExams.PUT("/:id", updateLabExam)
				labExams.DELETE("/:id", deleteLabExam)
				labExams.POST("/:id/upload", uploadLabExamFile)
				labExams.POST("/:id/ai-analyze", analyzeLabExamWithAI)
			}

			// Questionnaires
			questionnaires := protected.Group("/questionnaires")
			{
				questionnaires.GET("/:patientId", getQuestionnaires)
				questionnaires.POST("", createQuestionnaire)
				questionnaires.PUT("/:id", updateQuestionnaire)
				questionnaires.DELETE("/:id", deleteQuestionnaire)
				questionnaires.POST("/:id/answers", submitQuestionnaireAnswers)
			}

			// Shopping List
			shoppingList := protected.Group("/shopping-list")
			{
				shoppingList.GET("/:mealPlanId", RequireRole("nutricionista"), getShoppingList)
				shoppingList.PUT("/:id/item/:itemId", RequireRole("nutricionista"), toggleShoppingListItem)
			}

			// AI Assistant
			aiAssistant := protected.Group("/ai-assistant")
			{
				aiAssistant.POST("/chat", chatWithAIAssistant)
			}

			// Body3D
			body3d := protected.Group("/body3d")
			{
				body3d.POST("/analyze", analyzeBody3D)
			}

			// Settings
			settingsGroup := protected.Group("/settings")
			{
				settingsGroup.GET("", getSettings)
				settingsGroup.PUT("/notifications", updateNotifications)
				settingsGroup.PUT("/preferences", updatePreferences)
				settingsGroup.PUT("/privacy", updatePrivacy)
			}

			// Account
			account := protected.Group("/account")
			{
				account.GET("/profile", getProfile)
				account.PUT("/profile", updateProfile)
				account.PUT("/password", changePassword)
				account.DELETE("", deleteAccount)
			}

			// Notifications
			notifications := protected.Group("/notifications")
			{
				notifications.GET("", listNotifications)
				notifications.GET("/unread-count", getUnreadNotificationCount)
				notifications.PUT("/:id/read", markNotificationAsRead)
				notifications.PUT("/read-all", markAllNotificationsAsRead)
				notifications.DELETE("/:id", deleteNotification)
				notifications.GET("/preferences", getNotificationPreferences)
				notifications.PUT("/preferences", updateNotificationPreferences)
			}

			// Reviews (authenticated - create/update/delete)
			reviews := protected.Group("/reviews")
			{
				reviews.POST("", createReview)
				reviews.GET("/my", getMyReviews)
				reviews.PUT("/:id", updateReview)
				reviews.DELETE("/:id", deleteReview)
				reviews.POST("/:id/helpful", markReviewHelpful)
			}

			// Questions (perguntas ao especialista)
			questions := protected.Group("/questions")
			{
				questions.GET("", listQuestions)
				questions.POST("", createQuestion)
				questions.GET("/stats", getQuestionStats)
				questions.GET("/popular", getPopularQuestions)
				questions.GET("/:id", getQuestionByID)
				questions.PUT("/:id", updateQuestion)
				questions.DELETE("/:id", deleteQuestion)
				questions.PUT("/:id/close", closeQuestion)
				questions.POST("/:id/answers", addAnswer)
				questions.PUT("/:id/answers/:answerId/best", markBestAnswer)
				questions.POST("/:id/answers/:answerId/helpful", markAnswerHelpful)
			}

			// Blog (authenticated - create/update/delete)
			blogAuth := protected.Group("/blog")
			{
				blogAuth.POST("/posts", createBlogPost)
				blogAuth.PUT("/posts/:id", updateBlogPost)
				blogAuth.DELETE("/posts/:id", deleteBlogPost)
				blogAuth.POST("/posts/:id/like", likeBlogPost)
				blogAuth.DELETE("/posts/:id/like", unlikeBlogPost)
				blogAuth.GET("/posts/my", getMyBlogPosts)
				blogAuth.GET("/stats", getBlogStats)
			}

			// Analytics (authenticated)
			analyticsGroup := protected.Group("/analytics")
			{
			analyticsGroup.GET("/overview", getAnalyticsOverview)
			analyticsGroup.GET("/comparison", getAnalyticsComparison)
			analyticsGroup.GET("/meal-plans/:id", getMealPlanAnalytics)
			}

			// Badges (authenticated)
			badgesGroup := protected.Group("/badges")
			{
				badgesGroup.GET("/my", getMyBadges)
				badgesGroup.GET("/my/summary", getMyBadgeSummary)
				badgesGroup.POST("/check", checkAndAwardBadges)
				badgesGroup.PUT("/:id/display", updateBadgeDisplay)
			}

			// Admin routes (RBAC: apenas super_admin e admin)
			admin := protected.Group("/admin")
			admin.Use(RequireRole("super_admin", "admin"))
			{
				admin.GET("/overview", adminOverview)
				admin.GET("/nutritionists", listNutritionistsAdmin)
				admin.GET("/users", listUsersAdmin)
				admin.PUT("/users/:id/plan", updateUserPlanAdmin)
				admin.PUT("/users/:id/status", updateUserStatusAdmin)

				// Verificações
				verifications := admin.Group("/verifications")
				{
					verifications.GET("/pending", listPendingVerifications)
					verifications.GET("/:id", getVerificationDetails)
					verifications.POST("/:id/approve", approveVerification)
					verifications.POST("/:id/reject", rejectVerification)
				}

				// Badges admin
				adminBadges := admin.Group("/badges")
				{
					adminBadges.POST("/initialize", initializeBadges)
					adminBadges.POST("/award", awardBadgeToUser)
					adminBadges.DELETE("/:id", revokeBadgeFromUser)
				}
			}
		}

		// Public routes (no auth required)
		public := v1.Group("/public")
		{
			// Public nutritionist services
			public.GET("/nutritionists/:nutritionistId/services", getPublicNutritionistServices)

			// Public 3D Models (descontinuado)

			// Public nutritionist reviews
			public.GET("/nutritionists/:nutritionistId/reviews", getNutritionistReviews)
			public.GET("/nutritionists/:nutritionistId/rating", getNutritionistRatingStats)

			// Public badges
			public.GET("/badges", getAllBadges)
			public.GET("/badges/:id", getBadgeByID)
			public.GET("/users/:userId/badges", getUserBadgesPublic)

			// Public questions routes
			public.GET("/questions", listQuestions)
			public.GET("/questions/popular", getPopularQuestions)
			public.GET("/questions/:id", getQuestionByID)
			public.GET("/questions/nutritionist/:nutritionistId", getQuestionsByNutritionist)

			// Public blog routes
			public.GET("/blog/posts", listBlogPosts)
			public.GET("/blog/posts/featured", getFeaturedBlogPosts)
			public.GET("/blog/posts/popular", getPopularBlogPosts)
			public.GET("/blog/posts/recent", getRecentBlogPosts)
			public.GET("/blog/posts/related/:postId", getRelatedBlogPosts)
			public.GET("/blog/posts/by-slug/:slug", getBlogPostBySlug)
			public.GET("/blog/categories", getBlogCategories)
			public.GET("/blog/author/:authorId", getBlogPostsByAuthor)
		}

		// Explore routes (public)
		explore := v1.Group("/explore")
		{
			explore.GET("/nutritionists", searchProfiles)
			explore.GET("/nutritionists/nearby", getNearbyProfiles)
			explore.GET("/nutritionists/compare", compareNutritionists)
			explore.POST("/nutritionists/compare", compareNutritionists)
			explore.GET("/profile/:username", getPublicProfile)
		}

		// Geolocation routes (public)
		geo := v1.Group("/geo")
		{
			geo.GET("/nearby", searchNearby)
			geo.GET("/search", searchByLocation)
			geo.GET("/my-location", getLocationFromIP)
			geo.GET("/cities", getAvailableCities)
			geo.GET("/states", getAvailableStates)
			geo.GET("/distance", calculateDistance)
		}

		// Analytics tracking (public - for tracking anonymous visitors)
		v1.POST("/analytics/track", trackAnalyticsEvent)
	}

	return router
}

func healthCheck(c *gin.Context) {
	c.JSON(200, gin.H{
		"status": "ok",
		"service": "nufit-api",
	})
}

