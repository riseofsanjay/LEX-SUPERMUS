package com.lexsupermus.student.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:professional-auth;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "app.jwt.secret=auth-test-secret-key-with-at-least-32-bytes",
        "app.cors.allowed-origins=http://localhost:3000"
})
@AutoConfigureMockMvc
class ProfessionalAuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registrationPersistsAccountAndAllowsSubsequentLogin() throws Exception {
        String email = "student-" + UUID.randomUUID() + "@example.test";
        String password = "Correct-Horse-Battery-1";
        String request = objectMapper.writeValueAsString(Map.of(
                "email", email,
                "password", password,
                "role", "STUDENT",
                "fullName", "Taylor Student",
                "phone", "555-0101",
                "city", "Chennai",
                "profile", Map.of(
                        "lawSchool", "Example Law School",
                        "degree", "BA LL.B.",
                        "studyYear", "1st year",
                        "graduationYear", "2030",
                        "legalInterests", "Legal research")));

        MvcResult registration = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.role").value("STUDENT"))
                .andExpect(jsonPath("$.data.verificationStatus").value("NOT_REQUIRED"))
                .andExpect(jsonPath("$.data.profile.lawSchool").value("Example Law School"))
                .andReturn();

        JsonNode registrationBody = objectMapper.readTree(
                registration.getResponse().getContentAsString());
        String token = registrationBody.path("data").path("token").asText();
        assertThat(token).isNotBlank();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(email));

        mockMvc.perform(patch("/api/auth/me/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"schoolName\":\"Example High School\",\"ssc\":\"SSC result\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.profile.schoolName").value("Example High School"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", password,
                                "role", "STUDENT"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.profile.schoolName").value("Example High School"));
    }

    @Test
    void duplicateEmailAndIncorrectPasswordAreRejected() throws Exception {
        String email = "advocate-" + UUID.randomUUID() + "@example.test";
        String registration = objectMapper.writeValueAsString(Map.of(
                "email", email,
                "password", "Correct-Horse-Battery-2",
                "role", "ADVOCATE",
                "fullName", "Taylor Advocate",
                "phone", "555-0102",
                "city", "Chennai",
                "profile", Map.of(
                        "stateBarCouncil", "Bar Council of Delhi",
                        "enrolmentNumber", "DEMO-123",
                        "yearsExperience", "4",
                        "practiceAreas", "Civil litigation")));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registration))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.verificationStatus").value("PENDING"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registration))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "wrong-password",
                                "role", "ADVOCATE"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "Correct-Horse-Battery-2",
                                "role", "ADVOCATE"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus").value("PENDING"));
    }
}
