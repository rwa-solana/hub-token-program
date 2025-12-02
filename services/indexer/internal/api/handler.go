package api

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/hub-token/indexer/internal/indexer"
	"github.com/hub-token/indexer/internal/models"
)

type Handler struct {
	indexer *indexer.Indexer
}

func NewHandler(idx *indexer.Indexer) *Handler {
	return &Handler{indexer: idx}
}

type SuccessResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
}

type ErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
}

func (h *Handler) GetProperties(c *gin.Context) {
	var filter models.PropertyFilter

	if status := c.Query("status"); status != "" {
		filter.Status = status
	}

	if minValue := c.Query("minValue"); minValue != "" {
		if val, err := strconv.ParseInt(minValue, 10, 64); err == nil {
			filter.MinValue = &val
		}
	}

	if maxValue := c.Query("maxValue"); maxValue != "" {
		if val, err := strconv.ParseInt(maxValue, 10, 64); err == nil {
			filter.MaxValue = &val
		}
	}

	if propertyType := c.Query("propertyType"); propertyType != "" {
		filter.PropertyType = propertyType
	}

	properties, err := h.indexer.GetAllProperties(&filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Data:    properties,
	})
}

func (h *Handler) GetPropertyByMint(c *gin.Context) {
	mint := c.Param("mint")

	property, err := h.indexer.GetPropertyByMint(mint)
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Success: false,
			Error:   "Property not found",
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Data:    property,
	})
}

func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"service": "hub-indexer",
	})
}

func (h *Handler) TriggerIndexing(c *gin.Context) {
	if err := h.indexer.IndexProperties(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Data:    "Indexing triggered successfully",
	})
}
