package com.lexsupermus.student.dto.auth;

public record ApiResponse<T>(boolean success, T data, String message) {
}
