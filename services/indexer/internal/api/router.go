package api

import (
	"github.com/gin-gonic/gin"
	"github.com/hub-token/indexer/internal/indexer"
)

func SetupRouter(idx *indexer.Indexer) *gin.Engine {
	router := gin.Default()

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	handler := NewHandler(idx)

	// Health check
	router.GET("/health", handler.HealthCheck)

	// API routes
	api := router.Group("/api/v1")
	{
		api.GET("/properties", handler.GetProperties)
		api.GET("/properties/:mint", handler.GetPropertyByMint)
		api.POST("/index/trigger", handler.TriggerIndexing)
	}

	return router
}
