async function readResponse(response) {
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error("Authentication service returned an invalid response.");
  }

  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.message || "Authentication request failed.");
  }
  return body.data;
}

async function requestAuth({
  baseUrl,
  path,
  options,
  fetcher,
}) {
  let response;
  try {
    response = await fetcher(`${baseUrl.replace(/\/$/, "")}${path}`, options);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Unable to reach the professional account service at ${baseUrl}. Check that the student service is running and allows requests from this site.`,
        { cause: error },
      );
    }
    throw error;
  }
  return readResponse(response);
}

export async function postProfessionalAuth({
  baseUrl,
  action,
  payload,
  fetcher = fetch,
}) {
  return requestAuth({
    baseUrl,
    path: `/api/auth/${action}`,
    options: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    fetcher,
  });
}

export async function getProfessionalAuthProfile({ baseUrl, token, fetcher = fetch }) {
  return requestAuth({
    baseUrl,
    path: "/api/auth/me",
    options: { headers: { Authorization: `Bearer ${token}` } },
    fetcher,
  });
}

export async function patchProfessionalAuthProfile({
  baseUrl,
  token,
  updates,
  fetcher = fetch,
}) {
  return requestAuth({
    baseUrl,
    path: "/api/auth/me/profile",
    options: {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    },
    fetcher,
  });
}
